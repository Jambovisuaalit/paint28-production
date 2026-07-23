import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import {
  ArrowLeft,
  Archive,
  ImageIcon,
  LoaderCircle,
  LogOut,
  Mail,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { ImageLightbox } from "./ImageLightbox";
import type { QuoteImage, QuoteRequest, QuoteStatus } from "./types";

const DAMAGE_PHOTOS_BUCKET = "damage-photos";
const STATUS_OPTIONS: QuoteStatus[] = [
  "Uusi",
  "Käsittelyssä",
  "Tarjous lähetetty",
  "Sovittu pajalle",
  "Valmis",
  "Arkistoitu",
];
const FILTERS = ["Kaikki", "Uusi", "Käsittelyssä", "Sovittu pajalle", "Arkistoitu"] as const;
type FilterKey = (typeof FILTERS)[number];
type Toast = { type: "success" | "error"; message: string } | null;

function normalize(value: string) {
  return value.toLocaleLowerCase("fi-FI").replace(/[\s-]+/g, "");
}

function relativeTime(value: string) {
  const diffSeconds = Math.round((new Date(value).getTime() - Date.now()) / 1000);
  const formatter = new Intl.RelativeTimeFormat("fi", { numeric: "auto" });
  if (Math.abs(diffSeconds) < 60) return formatter.format(diffSeconds, "second");
  const minutes = Math.round(diffSeconds / 60);
  if (Math.abs(minutes) < 60) return formatter.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return formatter.format(hours, "hour");
  return formatter.format(Math.round(hours / 24), "day");
}

function statusClass(status: QuoteStatus) {
  if (status === "Uusi") return "status-new";
  if (["Käsittelyssä", "Tarjous lähetetty"].includes(status)) return "status-progress";
  if (["Sovittu pajalle", "Hyväksytty", "Valmis"].includes(status)) return "status-booked";
  return "";
}

export function AdminDashboard({ user }: { user: User }) {
  const [leads, setLeads] = useState<QuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>("Kaikki");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<{ images: QuoteImage[]; index: number } | null>(null);
  const [toast, setToast] = useState<Toast>(null);
  const [realtimeState, setRealtimeState] = useState("Yhdistetään");
  const refreshTimer = useRef<number | null>(null);

  const showToast = useCallback((next: NonNullable<Toast>) => {
    setToast(next);
    window.setTimeout(() => setToast(null), 3200);
  }, []);

  const loadLeads = useCallback(async (quiet = false) => {
    if (quiet) setRefreshing(true);
    else setLoading(true);

    const { data, error } = await supabase
      .from("quote_requests")
      .select("id,created_at,updated_at,status,customer_name,email,phone,license_plate,damage_description,preferred_contact_method,internal_notes,source,quote_images(id,storage_path,original_filename,mime_type,file_size,sort_order)")
      .order("created_at", { ascending: false });

    if (error) {
      showToast({ type: "error", message: "Tarjouspyyntöjen lataus epäonnistui." });
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const raw = (data ?? []) as unknown as QuoteRequest[];
    const paths = raw.flatMap((lead) => lead.quote_images ?? []).map((image) => image.storage_path);
    const signed = new Map<string, string>();

    if (paths.length > 0) {
      const { data: signedData, error: signedError } = await supabase.storage
        .from(DAMAGE_PHOTOS_BUCKET)
        .createSignedUrls(paths, 10 * 60);

      if (!signedError) {
        for (const item of signedData ?? []) {
          if (item.path && item.signedUrl) signed.set(item.path, item.signedUrl);
        }
      }
    }

    setLeads(raw.map((lead) => ({
      ...lead,
      quote_images: [...(lead.quote_images ?? [])]
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((image) => ({ ...image, signed_url: signed.get(image.storage_path) })),
    })));
    setLoading(false);
    setRefreshing(false);
  }, [showToast]);

  useEffect(() => {
    void loadLeads();
    const channel = supabase
      .channel("paint28-preview-admin")
      .on("postgres_changes", { event: "*", schema: "public", table: "quote_requests" }, (payload) => {
        if (payload.eventType === "INSERT") showToast({ type: "success", message: "Uusi tarjouspyyntö saapui." });
        if (refreshTimer.current) window.clearTimeout(refreshTimer.current);
        refreshTimer.current = window.setTimeout(() => void loadLeads(true), 250);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "quote_images" }, () => {
        if (refreshTimer.current) window.clearTimeout(refreshTimer.current);
        refreshTimer.current = window.setTimeout(() => void loadLeads(true), 250);
      })
      .subscribe((status) => {
        setRealtimeState(status === "SUBSCRIBED" ? "Live" : status === "CHANNEL_ERROR" ? "Offline" : "Yhdistetään");
      });

    return () => {
      if (refreshTimer.current) window.clearTimeout(refreshTimer.current);
      void supabase.removeChannel(channel);
    };
  }, [loadLeads, showToast]);

  const filtered = useMemo(() => {
    const needle = normalize(query);
    return leads.filter((lead) => {
      if (filter !== "Kaikki" && lead.status !== filter) return false;
      if (!needle) return true;
      return normalize(lead.license_plate).includes(needle) || normalize(lead.customer_name).includes(needle);
    });
  }, [filter, leads, query]);

  async function updateStatus(id: string, status: QuoteStatus) {
    const previous = leads.find((lead) => lead.id === id)?.status;
    setUpdatingId(id);
    setLeads((items) => items.map((lead) => lead.id === id ? { ...lead, status } : lead));
    const { error } = await supabase.from("quote_requests").update({ status }).eq("id", id);
    if (error) {
      setLeads((items) => items.map((lead) => lead.id === id && previous ? { ...lead, status: previous } : lead));
      showToast({ type: "error", message: "Tilan päivitys epäonnistui." });
    } else {
      showToast({ type: "success", message: `Tila päivitetty: ${status}` });
    }
    setUpdatingId(null);
  }

  async function signOut() {
    await supabase.auth.signOut();
    window.location.replace("/admin");
  }

  const newCount = leads.filter((lead) => lead.status === "Uusi").length;

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div className="page-width admin-header-inner">
          <div className="brand compact"><span className="brand-mark">28</span><span><strong>PAINT28 ADMIN</strong><small>{user.email}</small></span></div>
          <div className="admin-actions">
            <span className="live-badge">{realtimeState}</span>
            <a className="icon-button" href="/" aria-label="Sivustolle"><ArrowLeft /></a>
            <button className="icon-button" type="button" onClick={signOut} aria-label="Kirjaudu ulos"><LogOut /></button>
          </div>
        </div>
        <div className="spectrum-line" />
      </header>

      <div className="page-width admin-main">
        <div className="admin-title-row">
          <div><p className="admin-eyebrow">Hannan työjono</p><h1>Tarjouspyynnöt</h1></div>
          <button className="button secondary" type="button" onClick={() => void loadLeads(true)} disabled={refreshing}>
            <RefreshCw className={refreshing ? "spin" : ""} /> Päivitä
          </button>
        </div>

        <section className="admin-stats" aria-label="Tarjouspyyntötilastot">
          <article className="stat-card"><span>Kaikki liidit</span><strong>{leads.length}</strong></article>
          <article className="stat-card"><span>Uudet</span><strong>{newCount}</strong></article>
          <div className="search-card"><label htmlFor="lead-search">Pikahaku</label><div className="search-wrap"><Search /><input id="lead-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rekisterinumero tai asiakkaan nimi" /></div></div>
        </section>

        <nav className="filters" aria-label="Suodata tarjouspyyntöjä">
          {FILTERS.map((item) => (
            <button key={item} type="button" className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>
              {item} {item === "Kaikki" ? leads.length : leads.filter((lead) => lead.status === item).length}
            </button>
          ))}
        </nav>

        <section className="lead-list" aria-live="polite">
          {loading ? (
            <div className="loading-state"><div><LoaderCircle className="spin" /><p>Ladataan tarjouspyyntöjä…</p></div></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state"><div><ShieldCheck style={{ width: 40, height: 40, color: "#00f0ff" }} /><p>Ei tarjouspyyntöjä valitulla haulla.</p></div></div>
          ) : filtered.map((lead) => (
            <article key={lead.id} className="lead-card">
              <header className="lead-card-head">
                <div><span className="plate"><i>FIN</i><span>{lead.license_plate}</span></span><span className={`status-badge ${statusClass(lead.status)}`}>{lead.status}</span></div>
                <div className="lead-date"><strong>{relativeTime(lead.created_at)}</strong><br />{new Intl.DateTimeFormat("fi-FI", { dateStyle: "medium", timeStyle: "short" }).format(new Date(lead.created_at))}</div>
              </header>
              <div className="lead-card-body">
                <div className="lead-contact">
                  <h2><UserRound /> {lead.customer_name}</h2>
                  <div className="lead-links"><a href={`tel:${lead.phone}`}><Phone /> {lead.phone}</a><a href={`mailto:${lead.email}`}><Mail /> {lead.email}</a></div>
                  <div className="damage-copy"><small>Vauriokuvaus</small><p>{lead.damage_description}</p></div>
                </div>
                <div>
                  <div className="image-toolbar"><strong><ImageIcon /> Vauriokuvat</strong><span>{lead.quote_images.length} kuvaa</span></div>
                  {lead.quote_images.length > 0 ? (
                    <div className="image-grid">
                      {lead.quote_images.map((image, index) => image.signed_url ? (
                        <button key={image.id} type="button" onClick={() => setLightbox({ images: lead.quote_images, index })} aria-label={`Avaa vauriokuva ${index + 1}`}><img src={image.signed_url} alt={image.original_filename ?? `Vauriokuva ${index + 1}`} /></button>
                      ) : null)}
                    </div>
                  ) : <p style={{ color: "#71717a" }}>Ei kuvia.</p>}
                  <div className="lead-controls">
                    <select aria-label={`Muuta tarjouspyynnön ${lead.license_plate} tilaa`} value={lead.status} onChange={(event) => void updateStatus(lead.id, event.target.value as QuoteStatus)} disabled={updatingId === lead.id}>
                      {STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                    <button className="button secondary" type="button" onClick={() => void updateStatus(lead.id, "Arkistoitu")} disabled={updatingId === lead.id}><Archive /> Arkistoi</button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>

      {toast ? <div className={`toast ${toast.type}`} role="status">{toast.message}</div> : null}
      {lightbox ? <ImageLightbox images={lightbox.images} initialIndex={lightbox.index} onClose={() => setLightbox(null)} /> : null}
    </main>
  );
}
