import { useState } from "react";
import type { FormEvent } from "react";
import { LoaderCircle, LockKeyhole, ShieldCheck } from "lucide-react";
import { previewAdminEmail, supabase } from "../lib/supabase";

export function AdminLogin() {
  const [email, setEmail] = useState(previewAdminEmail);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    setMessage("");
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    setLoading(false);

    if (error) setMessage("Kirjautuminen epäonnistui. Tarkista tunnukset.");
  }

  return (
    <main className="login-shell">
      <form className="login-card" onSubmit={signIn}>
        <div className="brand"><span className="brand-mark">28</span><span><strong>PAINT28</strong><small>Preview admin</small></span></div>
        <ShieldCheck style={{ width: 42, height: 42, color: "#00f0ff", marginTop: 28 }} aria-hidden="true" />
        <h1>Hannan ohjauspaneeli</h1>
        <p>Esittelyvaiheessa käytetään erillistä testikäyttäjää. Hannan henkilökohtainen tili aktivoidaan vasta asiakkaan hyväksynnän jälkeen.</p>

        <label>
          Sähköposti
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required autoComplete="username" />
        </label>
        <label>
          Salasana
          <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" required minLength={12} autoComplete="current-password" />
        </label>

        {message ? <p className="form-message error" role="alert">{message}</p> : null}
        <button className="button primary" type="submit" disabled={loading}>
          {loading ? <LoaderCircle className="spin" aria-hidden="true" /> : <LockKeyhole aria-hidden="true" />}
          {loading ? "Kirjaudutaan…" : "Kirjaudu adminiin"}
        </button>
        <p className="login-note">Preview-tili poistetaan tai deaktivoidaan ennen tuotantoaktivointia.</p>
      </form>
    </main>
  );
}
