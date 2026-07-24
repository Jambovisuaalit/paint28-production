import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Camera, CheckCircle2, ImagePlus, LoaderCircle, Send, X } from "lucide-react";
import { edgeFunctionName, supabase } from "../lib/supabase";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_FILES = 3;
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/heic"];
const FINNISH_PLATE_PATTERN = /^[A-ZÅÄÖ]{2,3}-\d{1,3}$/;
const FINNISH_PHONE_PATTERN = /^(?:\+358|00358|0)\d{5,12}$/;
const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY?.trim() ?? "";
const TURNSTILE_SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

type FormState = "idle" | "submitting" | "success" | "error";

function normalizePlate(value: string) {
  const normalized = value
    .trim()
    .toLocaleUpperCase("fi-FI")
    .replace(/\s+/g, "");

  return normalized.replace(/^([A-ZÅÄÖ]{2,3})(\d{1,3})$/, "$1-$2");
}

function normalizePhone(value: string) {
  return value.trim().replace(/[\s()-]/g, "");
}

function formText(form: FormData, key: string) {
  const value = form.get(key);
  return typeof value === "string" ? value : "";
}

export function QuoteForm() {
  const [files, setFiles] = useState<File[]>([]);
  const [state, setState] = useState<FormState>("idle");
  const [message, setMessage] = useState("");
  const [reference, setReference] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const turnstileContainerRef = useRef<HTMLDivElement>(null);
  const turnstileWidgetRef = useRef<string | null>(null);

  const previews = useMemo(
    () => files.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [files],
  );

  useEffect(() => {
    return () => {
      for (const preview of previews) URL.revokeObjectURL(preview.url);
    };
  }, [previews]);

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY || !turnstileContainerRef.current) return;

    let active = true;
    let script: HTMLScriptElement | null = document.querySelector(
      "script[data-paint28-turnstile]",
    );

    function renderWidget() {
      if (
        !active ||
        !TURNSTILE_SITE_KEY ||
        !turnstileContainerRef.current ||
        !window.turnstile ||
        turnstileWidgetRef.current
      ) {
        return;
      }

      turnstileWidgetRef.current = window.turnstile.render(
        turnstileContainerRef.current,
        {
          sitekey: TURNSTILE_SITE_KEY,
          theme: "dark",
          callback: (token) => {
            setTurnstileToken(token);
            setState((current) => current === "error" ? "idle" : current);
            setMessage("");
          },
          "expired-callback": () => setTurnstileToken(""),
          "error-callback": () => {
            setTurnstileToken("");
            setState("error");
            setMessage("Roskapostisuojausta ei voitu ladata. Päivitä sivu ja yritä uudelleen.");
          },
        },
      );
    }

    if (window.turnstile) {
      renderWidget();
    } else {
      if (!script) {
        script = document.createElement("script");
        script.src = TURNSTILE_SCRIPT_URL;
        script.async = true;
        script.defer = true;
        script.dataset.paint28Turnstile = "true";
        document.head.append(script);
      }
      script.addEventListener("load", renderWidget);
    }

    return () => {
      active = false;
      script?.removeEventListener("load", renderWidget);
      if (turnstileWidgetRef.current && window.turnstile) {
        window.turnstile.remove(turnstileWidgetRef.current);
        turnstileWidgetRef.current = null;
      }
    };
  }, []);

  function fail(nextMessage: string) {
    setState("error");
    setMessage(nextMessage);
  }

  function handleFiles(nextFiles: FileList | null) {
    if (!nextFiles) return;

    const selected = Array.from(nextFiles);
    if (files.length + selected.length > MAX_FILES) {
      fail("Voit lisätä enintään kolme kuvaa.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    const combined = [...files, ...selected];
    const invalid = combined.find(
      (file) => !ALLOWED_MIME_TYPES.includes(file.type) || file.size > MAX_FILE_SIZE,
    );

    if (invalid) {
      fail("Sallittu kuvamuoto on JPG, PNG tai HEIC. Enimmäiskoko on 10 Mt / kuva.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setFiles(combined);
    setState("idle");
    setMessage("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state === "submitting") return;

    const formElement = event.currentTarget;
    const form = new FormData(formElement);

    if (files.length < 1 || files.length > MAX_FILES) {
      fail("Lisää 1–3 kuvaa vauriosta.");
      return;
    }

    if (form.get("privacyConsentCheckbox") !== "on") {
      fail("Tietosuostumus vaaditaan tarjouspyynnön lähettämiseen.");
      return;
    }

    if (!formElement.reportValidity()) return;

    const licensePlate = normalizePlate(formText(form, "licensePlate"));
    const phone = normalizePhone(formText(form, "phone"));

    if (!FINNISH_PLATE_PATTERN.test(licensePlate)) {
      fail("Kirjoita suomalainen rekisteritunnus, esimerkiksi ABC-123.");
      return;
    }

    if (!FINNISH_PHONE_PATTERN.test(phone)) {
      fail("Kirjoita suomalainen puhelinnumero.");
      return;
    }

    if (TURNSTILE_SITE_KEY && !turnstileToken) {
      fail("Vahvista roskapostisuojaus ennen lähettämistä.");
      return;
    }

    form.set("licensePlate", licensePlate);
    form.set("phone", phone);
    form.delete("privacyConsentCheckbox");
    form.set("privacyConsent", "true");
    form.set("turnstileToken", turnstileToken);
    form.delete("images");
    for (const file of files) form.append("images", file);

    setState("submitting");
    setMessage("");
    setReference("");

    try {
      const { data, error } = await supabase.functions.invoke(edgeFunctionName, {
        body: form,
      });

      if (error || !data?.success) {
        fail(data?.error ?? "Tarjouspyynnön lähetys epäonnistui. Yritä uudelleen.");
        return;
      }

      setState("success");
      setMessage("Tarjouspyyntö vastaanotettu. Otamme yhteyttä mahdollisimman pian.");
      setReference(typeof data.reference === "string" ? data.reference : "");
      setFiles([]);
      formElement.reset();
      setTurnstileToken("");
      if (turnstileWidgetRef.current && window.turnstile) {
        window.turnstile.reset(turnstileWidgetRef.current);
      }
    } catch {
      fail("Tarjouspyynnön lähetys epäonnistui. Tarkista verkkoyhteys ja yritä uudelleen.");
    }
  }

  if (state === "success") {
    return (
      <div className="success-panel" role="status">
        <CheckCircle2 aria-hidden="true" />
        <h3>Tarjouspyyntö vastaanotettu</h3>
        <p>{message}</p>
        {reference ? <p className="form-helper">Viite: {reference}</p> : null}
        <button
          type="button"
          className="button secondary"
          onClick={() => {
            setState("idle");
            setMessage("");
            setReference("");
          }}
        >
          Lähetä toinen pyyntö
        </button>
      </div>
    );
  }

  return (
    <form className="quote-form" onSubmit={submit} noValidate>
      <input name="website" className="honeypot" tabIndex={-1} autoComplete="off" aria-hidden="true" />

      <div className="field-grid">
        <label>
          Nimi
          <input name="customerName" required minLength={2} maxLength={120} autoComplete="name" />
        </label>
        <label>
          Rekisterinumero
          <input
            name="licensePlate"
            required
            maxLength={7}
            autoCapitalize="characters"
            autoComplete="off"
            inputMode="text"
            pattern="[A-Za-zÅÄÖåäö]{2,3}-?[0-9]{1,3}"
            title="Kirjoita suomalainen rekisteritunnus, esimerkiksi ABC-123."
          />
        </label>
        <label>
          Puhelin
          <input name="phone" type="tel" required minLength={5} maxLength={40} autoComplete="tel" inputMode="tel" />
        </label>
        <label>
          Sähköposti
          <input name="email" type="email" required maxLength={320} autoComplete="email" />
        </label>
      </div>

      <label>
        Vauriokuvaus
        <textarea
          name="damageDescription"
          required
          minLength={5}
          maxLength={5000}
          rows={5}
          placeholder="Missä vaurio on ja miten se syntyi?"
        />
      </label>

      <fieldset>
        <legend>Toivottu yhteydenottotapa</legend>
        <div className="radio-row">
          <label><input type="radio" name="preferredContactMethod" value="phone" defaultChecked /> Puhelin</label>
          <label><input type="radio" name="preferredContactMethod" value="email" /> Sähköposti</label>
        </div>
      </fieldset>

      <div className="upload-box">
        <Camera aria-hidden="true" />
        <div>
          <strong>Lisää 1–3 kuvaa vauriosta</strong>
          <p>JPG, PNG tai HEIC · enintään 10 Mt / kuva</p>
        </div>
        <label className="button secondary upload-button" htmlFor="damage-images">
          <ImagePlus aria-hidden="true" /> Valitse kuvat
          <input
            id="damage-images"
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/heic"
            multiple
            capture="environment"
            onChange={(event) => handleFiles(event.target.files)}
          />
        </label>
      </div>

      {previews.length > 0 ? (
        <div className="preview-grid" aria-label="Valitut kuvat">
          {previews.map(({ file, url }, index) => (
            <figure key={`${file.name}-${file.lastModified}`}>
              <img src={url} alt={`Valittu vauriokuva ${index + 1}`} />
              <button
                type="button"
                aria-label={`Poista kuva ${index + 1}`}
                onClick={() => setFiles((items) => items.filter((_, itemIndex) => itemIndex !== index))}
              >
                <X aria-hidden="true" />
              </button>
            </figure>
          ))}
        </div>
      ) : null}

      <label className="consent-row">
        <input type="checkbox" name="privacyConsentCheckbox" required />
        <span>Hyväksyn, että antamiani tietoja käytetään tarjouspyynnön käsittelyyn.</span>
      </label>

      {TURNSTILE_SITE_KEY ? (
        <div aria-label="Roskapostisuojaus">
          <div ref={turnstileContainerRef} />
          <p className="form-helper">Roskapostisuojaus on vahvistettava ennen lähettämistä.</p>
        </div>
      ) : null}

      {message ? <p className="form-message error" role="alert">{message}</p> : null}

      <button type="submit" className="button primary submit-button" disabled={state === "submitting"}>
        {state === "submitting" ? <LoaderCircle className="spin" aria-hidden="true" /> : <Send aria-hidden="true" />}
        {state === "submitting" ? "Lähetetään…" : "Lähetä tarjouspyyntö"}
      </button>
      <p className="form-helper">Lopullinen hinta ja työn laajuus vahvistetaan tarvittaessa auton tarkastuksen jälkeen.</p>
    </form>
  );
}
