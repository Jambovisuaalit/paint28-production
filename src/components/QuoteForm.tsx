import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Camera, CheckCircle2, ImagePlus, LoaderCircle, Send, X } from "lucide-react";
import { edgeFunctionName, supabase } from "../lib/supabase";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_FILES = 3;
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/heic"];
const FINNISH_PLATE_PATTERN = /^[A-ZÅÄÖ]{2,3}-\d{1,3}$/;
const FINNISH_PHONE_PATTERN = /^(?:\+358|00358|0)\d{5,12}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY?.trim() ?? "";
const TURNSTILE_SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

type FormState = "idle" | "submitting" | "success" | "error";
type FieldName = "licensePlate" | "phone" | "email" | "photos";
type FieldErrors = Partial<Record<FieldName, string>>;

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

function validateLicensePlate(value: string): string {
  const normalized = normalizePlate(value);
  if (!normalized) return "Anna rekisterinumero.";
  if (!FINNISH_PLATE_PATTERN.test(normalized)) {
    return "Kirjoita suomalainen rekisteritunnus, esimerkiksi ABC-123.";
  }
  return "";
}

function validatePhone(value: string): string {
  const normalized = normalizePhone(value);
  if (!normalized) return "Anna puhelinnumero.";
  if (!FINNISH_PHONE_PATTERN.test(normalized)) {
    return "Kirjoita suomalainen puhelinnumero, esimerkiksi 040 123 4567.";
  }
  return "";
}

function validateEmail(value: string): string {
  const normalized = value.trim();
  if (!normalized) return "Anna sähköpostiosoite.";
  if (normalized.length > 320) return "Sähköpostiosoite on liian pitkä.";
  if (!EMAIL_PATTERN.test(normalized)) {
    return "Kirjoita kelvollinen sähköpostiosoite, esimerkiksi nimi@yritys.fi.";
  }
  return "";
}

function validatePhotos(nextFiles: readonly File[]): string {
  if (nextFiles.length < 1) return "Lisää 1–3 kuvaa vauriosta.";
  if (nextFiles.length > MAX_FILES) return "Voit lisätä enintään kolme kuvaa.";
  if (nextFiles.some((file) => file.size <= 0)) {
    return "Valittu kuva on tyhjä. Valitse toinen tiedosto.";
  }
  if (nextFiles.some((file) => !ALLOWED_MIME_TYPES.includes(file.type))) {
    return "Sallittu kuvamuoto on JPG, PNG tai HEIC.";
  }
  if (nextFiles.some((file) => file.size > MAX_FILE_SIZE)) {
    return "Yksittäinen kuva saa olla enintään 10 Mt.";
  }
  return "";
}

export function QuoteForm() {
  const [files, setFiles] = useState<File[]>([]);
  const [state, setState] = useState<FormState>("idle");
  const [message, setMessage] = useState("");
  const [reference, setReference] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const licensePlateRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
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

  function clearFormError() {
    setState((current) => current === "error" ? "idle" : current);
    setMessage("");
  }

  function setFieldError(field: FieldName, error: string) {
    setFieldErrors((current) => {
      const next = { ...current };
      if (error) next[field] = error;
      else delete next[field];
      return next;
    });
  }

  function focusFirstFieldError(errors: FieldErrors) {
    window.requestAnimationFrame(() => {
      if (errors.licensePlate) licensePlateRef.current?.focus();
      else if (errors.phone) phoneRef.current?.focus();
      else if (errors.email) emailRef.current?.focus();
      else if (errors.photos) inputRef.current?.focus();
    });
  }

  function handleFiles(nextFiles: FileList | null) {
    if (!nextFiles) return;

    const selected = Array.from(nextFiles);
    const combined = [...files, ...selected];
    const photoError = validatePhotos(combined);

    if (photoError) {
      setFieldError("photos", photoError);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setFiles(combined);
    setFieldError("photos", "");
    clearFormError();
  }

  function removeFile(index: number) {
    const nextFiles = files.filter((_, itemIndex) => itemIndex !== index);
    setFiles(nextFiles);
    setFieldError("photos", validatePhotos(nextFiles));
    if (inputRef.current) inputRef.current.value = "";
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state === "submitting") return;

    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const licensePlate = normalizePlate(formText(form, "licensePlate"));
    const phone = normalizePhone(formText(form, "phone"));
    const email = formText(form, "email").trim().toLowerCase();

    const nextErrors: FieldErrors = {};
    const licensePlateError = validateLicensePlate(licensePlate);
    const phoneError = validatePhone(phone);
    const emailError = validateEmail(email);
    const photoError = validatePhotos(files);

    if (licensePlateError) nextErrors.licensePlate = licensePlateError;
    if (phoneError) nextErrors.phone = phoneError;
    if (emailError) nextErrors.email = emailError;
    if (photoError) nextErrors.photos = photoError;

    setFieldErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      fail("Tarkista merkityt kentät ennen lähettämistä.");
      focusFirstFieldError(nextErrors);
      return;
    }

    if (form.get("privacyConsentCheckbox") !== "on") {
      fail("Tietosuostumus vaaditaan tarjouspyynnön lähettämiseen.");
      return;
    }

    if (!formElement.reportValidity()) return;

    if (TURNSTILE_SITE_KEY && !turnstileToken) {
      fail("Vahvista roskapostisuojaus ennen lähettämistä.");
      return;
    }

    form.set("licensePlate", licensePlate);
    form.set("phone", phone);
    form.set("email", email);
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
      setFieldErrors({});
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
            setFieldErrors({});
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
            ref={licensePlateRef}
            name="licensePlate"
            required
            maxLength={7}
            autoCapitalize="characters"
            autoComplete="off"
            inputMode="text"
            pattern="[A-Za-zÅÄÖåäö]{2,3}-?[0-9]{1,3}"
            title="Kirjoita suomalainen rekisteritunnus, esimerkiksi ABC-123."
            aria-invalid={Boolean(fieldErrors.licensePlate)}
            aria-describedby={fieldErrors.licensePlate ? "license-plate-error" : undefined}
            onChange={(event) => {
              if (fieldErrors.licensePlate) {
                setFieldError("licensePlate", validateLicensePlate(event.currentTarget.value));
              }
            }}
            onBlur={(event) => {
              const normalized = normalizePlate(event.currentTarget.value);
              event.currentTarget.value = normalized;
              setFieldError("licensePlate", validateLicensePlate(normalized));
            }}
          />
          {fieldErrors.licensePlate ? (
            <span id="license-plate-error" className="field-error" role="alert">
              {fieldErrors.licensePlate}
            </span>
          ) : null}
        </label>
        <label>
          Puhelin
          <input
            ref={phoneRef}
            name="phone"
            type="tel"
            required
            minLength={5}
            maxLength={40}
            autoComplete="tel"
            inputMode="tel"
            aria-invalid={Boolean(fieldErrors.phone)}
            aria-describedby={fieldErrors.phone ? "phone-error" : undefined}
            onChange={(event) => {
              if (fieldErrors.phone) {
                setFieldError("phone", validatePhone(event.currentTarget.value));
              }
            }}
            onBlur={(event) => {
              const normalized = normalizePhone(event.currentTarget.value);
              event.currentTarget.value = normalized;
              setFieldError("phone", validatePhone(normalized));
            }}
          />
          {fieldErrors.phone ? (
            <span id="phone-error" className="field-error" role="alert">
              {fieldErrors.phone}
            </span>
          ) : null}
        </label>
        <label>
          Sähköposti
          <input
            ref={emailRef}
            name="email"
            type="email"
            required
            maxLength={320}
            autoComplete="email"
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? "email-error" : undefined}
            onChange={(event) => {
              if (fieldErrors.email) {
                setFieldError("email", validateEmail(event.currentTarget.value));
              }
            }}
            onBlur={(event) => setFieldError("email", validateEmail(event.currentTarget.value))}
          />
          {fieldErrors.email ? (
            <span id="email-error" className="field-error" role="alert">
              {fieldErrors.email}
            </span>
          ) : null}
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

      <div className={`upload-box${fieldErrors.photos ? " invalid" : ""}`}>
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
            aria-invalid={Boolean(fieldErrors.photos)}
            aria-describedby={fieldErrors.photos ? "photo-error" : undefined}
            onChange={(event) => handleFiles(event.target.files)}
          />
        </label>
      </div>
      {fieldErrors.photos ? (
        <p id="photo-error" className="field-error photo-error" role="alert">
          {fieldErrors.photos}
        </p>
      ) : null}

      {previews.length > 0 ? (
        <div className="preview-grid" aria-label="Valitut kuvat">
          {previews.map(({ file, url }, index) => (
            <figure key={`${file.name}-${file.lastModified}`}>
              <img src={url} alt={`Valittu vauriokuva ${index + 1}`} />
              <button
                type="button"
                aria-label={`Poista kuva ${index + 1}`}
                onClick={() => removeFile(index)}
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
