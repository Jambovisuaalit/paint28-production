import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { LoaderCircle, ShieldX } from "lucide-react";
import { previewAdminEmail, supabase } from "../lib/supabase";
import { AdminDashboard } from "./AdminDashboard";
import { AdminLogin } from "./AdminLogin";

const allowedEmails = new Set([previewAdminEmail, "hanna@paint28.fi"]);
type GuardState = "loading" | "signed-out" | "authorized" | "denied";

export default function AdminApp() {
  const [session, setSession] = useState<Session | null>(null);
  const [guardState, setGuardState] = useState<GuardState>("loading");

  useEffect(() => {
    let active = true;

    async function verify(nextSession: Session | null) {
      if (!active) return;
      setSession(nextSession);

      if (!nextSession) {
        setGuardState("signed-out");
        return;
      }

      const email = nextSession.user.email?.toLowerCase() ?? "";
      if (!allowedEmails.has(email)) {
        setGuardState("denied");
        return;
      }

      const { data, error } = await supabase
        .from("admin_users")
        .select("user_id,role,active")
        .eq("user_id", nextSession.user.id)
        .eq("role", "admin")
        .eq("active", true)
        .maybeSingle();

      if (!active) return;
      setGuardState(!error && data ? "authorized" : "denied");
    }

    void supabase.auth.getSession().then(({ data }) => verify(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void verify(nextSession);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  if (guardState === "loading") {
    return <main className="loading-state"><div><LoaderCircle className="spin" aria-hidden="true" /><p>Tarkistetaan käyttöoikeuksia…</p></div></main>;
  }

  if (guardState === "signed-out") return <AdminLogin />;

  if (guardState === "denied" || !session) {
    return (
      <main className="login-shell">
        <div className="login-card">
          <ShieldX style={{ width: 44, height: 44, color: "#00f0ff" }} aria-hidden="true" />
          <h1>Ei käyttöoikeutta</h1>
          <div className="spectrum-line login-spectrum" aria-hidden="true" />
          <p>Istunto ei vastaa aktiivista Paint28-admin-käyttäjää.</p>
          <button className="button secondary" type="button" onClick={async () => { await supabase.auth.signOut(); window.location.replace("/admin"); }}>Palaa kirjautumiseen</button>
        </div>
      </main>
    );
  }

  return <AdminDashboard user={session.user} />;
}
