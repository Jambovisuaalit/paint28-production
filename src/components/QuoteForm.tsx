import { useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Camera, CheckCircle2, ImagePlus, LoaderCircle, Send, X } from "lucide-react";
import { edgeFunctionName, supabase } from "../lib/supabase";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/heic"];

type FormState = "idle" | "submitting" | "success" | "error";

export function QuoteForm() {
  const [files, setFiles] = useState<File[]>([]);
  const [state, setState] = useState<FormState>("idle");
  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const previews = useMemo(
    () => files.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [files],
  );

  function handleFiles(nextFiles: FileList | null) {
    if (!nextFiles) return;

    const selected = Array.from(nextFiles);
    const combined = [...files, ...selected].slice(0, 3);
    const invalid = combined.find(
      (file) => !ALLOWED_MIME_TYPES.includes(file.type) || file.size > MAX_FILE_SIZE,
    );

    if (invalid) {
      setState("error");
      setMessage("Sallittu kuvamuoto on JPG, PNG tai HEIC. Enimmäiskoko on 10 Mt / kuva.");
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

    if (files.length < 1 || files.length > 3) {
      setState("error");
      setMessage("Lisää 1–3 kuvaa vauriosta.");
      return;
    }

    const form = new FormData(event.currentTarget);
    form.set("privacyConsent", "true");
    form.delete("images");
    for (const file of files) form.append("images", file);

    setState("submitting");
    setMessage("");

    const { data, error } = await supabase.functions.invoke(edgeFunctionName, {
      body: form,
    });

    if (error || !data?.success) {
      setState("error");
      setMessage(data?.error ?? "Tarjouspyynnön lähetys epäonnistui. Yritä uudelleen.");
      return;
    }

    setState("success");
    setMessage("Tarjouspyyntö vastaanotettu. Otamme yhteyttä mahdollisimman pian.");
    setFiles([]);
    event.currentTarget.reset();
  }

  if (state === "success") {
    return (
      <div className="success-panel" role="status">
        <CheckCircle2 aria-hidden="true" />
        <h3>Tarjouspyyntö vastaanotettu</h3>
        <p>{message}</p>
        <button type="button" className="button secondary" onClick={() => setState("idle")}>
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
          <input name="licensePlate" required maxLength={20} autoCapitalize="characters" />
        </label>
        <label>
          Puhelin
          <input name="phone" type="tel" required minLength={5} maxLength={40} autoComplete="tel" />
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
        <label className="button secondary upload-button">
          <ImagePlus aria-hidden="true" /> Valitse kuvat
          <input
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
        <input type="checkbox" required />
        <span>Hyväksyn, että antamiani tietoja käytetään tarjouspyynnön käsittelyyn.</span>
      </label>

      {message ? <p className="form-message error" role="alert">{message}</p> : null}

      <button type="submit" className="button primary submit-button" disabled={state === "submitting"}>
        {state === "submitting" ? <LoaderCircle className="spin" aria-hidden="true" /> : <Send aria-hidden="true" />}
        {state === "submitting" ? "Lähetetään…" : "Lähetä tarjouspyyntö"}
      </button>
      <p className="form-helper">Lopullinen hinta ja työn laajuus vahvistetaan tarvittaessa auton tarkastuksen jälkeen.</p>
    </form>
  );
}
