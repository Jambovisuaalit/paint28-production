import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const BUCKET = "damage-photos";
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_TOTAL_SIZE = 3 * MAX_FILE_SIZE;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/heic"]);
const FINNISH_PLATE_PATTERN = /^[A-ZÅÄÖ]{2,3}-\d{1,3}$/;
const FINNISH_PHONE_PATTERN = /^(?:\+358|00358|0)\d{5,12}$/;
const SERVER_FIELDS = [
  "id", "status", "internalNotes", "internal_notes",
  "storagePath", "storage_path", "createdAt", "created_at",
] as const;
const DEFAULT_ORIGINS = [
  "http://localhost:5173",
  "https://jambovisuaalit.github.io",
  "https://paint28-vite-app-production-ready-info-32533854s-projects.vercel.app",
  "https://paint28.fi",
  "https://www.paint28.fi",
];

function normalizeOrigin(value: string): string {
  return value.trim().replace(/\/+$/, "");
}

function originValues(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map(normalizeOrigin)
    .filter((origin) => origin.startsWith("https://") || origin.startsWith("http://"));
}

function origins(): Set<string> {
  return new Set([
    ...DEFAULT_ORIGINS,
    ...originValues(Deno.env.get("ALLOWED_ORIGINS")),
    ...originValues(Deno.env.get("PREVIEW_ORIGIN")),
  ]);
}

function isAllowedOrigin(origin: string | null): boolean {
  return !origin || origins().has(normalizeOrigin(origin));
}

function cors(origin: string | null): HeadersInit {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };

  if (origin && isAllowedOrigin(origin)) {
    headers["Access-Control-Allow-Origin"] = normalizeOrigin(origin);
  }

  return headers;
}

function reply(body: Record<string, unknown>, status: number, origin: string | null): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...cors(origin),
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function text(form: FormData, key: string): string {
  const value = form.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function normalizePlate(value: string): string {
  const normalized = value
    .trim()
    .toLocaleUpperCase("fi-FI")
    .replace(/\s+/g, "");

  return normalized.replace(/^([A-ZÅÄÖ]{2,3})(\d{1,3})$/, "$1-$2");
}

function normalizePhone(value: string): string {
  return value.trim().replace(/[\s()-]/g, "");
}

function fileExtension(mime: string): "jpg" | "png" | "heic" {
  if (mime === "image/png") return "png";
  if (mime === "image/heic") return "heic";
  return "jpg";
}

function cleanFilename(value: string): string {
  return value.replace(/[\u0000-\u001F\u007F]/g, "").slice(0, 255);
}

async function fingerprint(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  const secret = Deno.env.get("TURNSTILE_SECRET_KEY");
  if (!secret) return true;
  if (!token) return false;

  const payload = new URLSearchParams({ secret, response: token });
  if (ip) payload.set("remoteip", ip);
  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: payload,
  });
  if (!response.ok) return false;
  return ((await response.json()) as { success?: boolean }).success === true;
}

Deno.serve(async (request) => {
  const origin = request.headers.get("origin");

  if (!isAllowedOrigin(origin)) {
    return reply({ error: "Origin not allowed" }, 403, origin);
  }

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors(origin) });
  }
  if (request.method !== "POST") return reply({ error: "Method not allowed" }, 405, origin);

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("multipart/form-data")) {
    return reply({ error: "Virheellinen sisältötyyppi." }, 415, origin);
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > MAX_TOTAL_SIZE + 1_000_000) {
    return reply({ error: "Lähetys on liian suuri." }, 413, origin);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return reply({ error: "Palvelu ei ole käytettävissä." }, 503, origin);
  }

  try {
    const form = await request.formData();
    for (const field of SERVER_FIELDS) form.delete(field);
    if (text(form, "website")) return reply({ success: true }, 200, origin);

    const customerName = text(form, "customerName");
    const email = text(form, "email").toLowerCase();
    const phone = normalizePhone(text(form, "phone"));
    const licensePlate = normalizePlate(text(form, "licensePlate"));
    const damageDescription = text(form, "damageDescription");
    const preferredContactMethod = text(form, "preferredContactMethod") || "phone";
    const privacyConsent = text(form, "privacyConsent") === "true";
    const turnstileToken = text(form, "turnstileToken");

    if (customerName.length < 2 || customerName.length > 120) return reply({ error: "Tarkista nimi." }, 400, origin);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 320) return reply({ error: "Tarkista sähköpostiosoite." }, 400, origin);
    if (!FINNISH_PHONE_PATTERN.test(phone)) return reply({ error: "Kirjoita suomalainen puhelinnumero." }, 400, origin);
    if (!FINNISH_PLATE_PATTERN.test(licensePlate)) return reply({ error: "Kirjoita suomalainen rekisteritunnus, esimerkiksi ABC-123." }, 400, origin);
    if (damageDescription.length < 5 || damageDescription.length > 5000) return reply({ error: "Kuvaile vaurio hieman tarkemmin." }, 400, origin);
    if (!["phone", "email"].includes(preferredContactMethod)) return reply({ error: "Virheellinen yhteydenottotapa." }, 400, origin);
    if (!privacyConsent) return reply({ error: "Tietosuostumus vaaditaan." }, 400, origin);

    const files = form
      .getAll("images")
      .filter((value): value is File => value instanceof File && value.size > 0);
    if (files.length < 1 || files.length > 3) {
      return reply({ error: "Lisää 1–3 kuvaa vauriosta." }, 400, origin);
    }

    let totalSize = 0;
    for (const file of files) {
      totalSize += file.size;
      if (!ALLOWED_TYPES.has(file.type)) {
        return reply({ error: "Sallittuja kuvamuotoja ovat JPG, PNG ja HEIC." }, 400, origin);
      }
      if (file.size > MAX_FILE_SIZE) {
        return reply({ error: "Yksittäinen kuva saa olla enintään 10 Mt." }, 400, origin);
      }
    }
    if (totalSize > MAX_TOTAL_SIZE) {
      return reply({ error: "Kuvien yhteiskoko saa olla enintään 30 Mt." }, 400, origin);
    }

    const ip = request.headers.get("cf-connecting-ip")
      ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      ?? "unknown";
    const userAgent = request.headers.get("user-agent") ?? "unknown";
    const rateFingerprint = await fingerprint(
      `${Deno.env.get("RATE_LIMIT_SALT") ?? "paint28-public-form"}|${ip}|${userAgent}`,
    );

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: allowed, error: rateError } = await admin.rpc(
      "consume_quote_submission_rate_limit",
      {
        p_fingerprint: rateFingerprint,
        p_max_requests: 5,
        p_window_minutes: 15,
      },
    );
    if (rateError) return reply({ error: "Palvelu ei ole käytettävissä." }, 503, origin);
    if (allowed !== true) {
      return reply({ error: "Liian monta lähetystä. Yritä myöhemmin uudelleen." }, 429, origin);
    }
    if (!(await verifyTurnstile(turnstileToken, ip))) {
      return reply({ error: "Roskapostisuojaus epäonnistui. Päivitä sivu ja yritä uudelleen." }, 400, origin);
    }

    const { data: quote, error: quoteError } = await admin
      .from("quote_requests")
      .insert({
        status: "Uusi",
        internal_notes: null,
        source: "website",
        customer_name: customerName,
        email,
        phone,
        license_plate: licensePlate,
        damage_description: damageDescription,
        preferred_contact_method: preferredContactMethod,
        privacy_consent: true,
      })
      .select("id")
      .single();

    if (quoteError || !quote) {
      console.error("quote insert failed", quoteError);
      return reply({ error: "Tarjouspyynnön tallennus epäonnistui." }, 500, origin);
    }

    const uploadedPaths: string[] = [];
    try {
      const imageRows = [];
      for (const [index, file] of files.entries()) {
        const storagePath = `${quote.id}/${crypto.randomUUID()}.${fileExtension(file.type)}`;
        const { error: uploadError } = await admin.storage.from(BUCKET).upload(storagePath, file, {
          contentType: file.type,
          cacheControl: "3600",
          upsert: false,
        });
        if (uploadError) throw uploadError;

        uploadedPaths.push(storagePath);
        imageRows.push({
          quote_request_id: quote.id,
          storage_path: storagePath,
          original_filename: cleanFilename(file.name),
          mime_type: file.type,
          file_size: file.size,
          sort_order: index,
        });
      }

      const { error: metadataError } = await admin.from("quote_images").insert(imageRows);
      if (metadataError) throw metadataError;
    } catch (error) {
      console.error("image persistence failed", error);
      if (uploadedPaths.length) await admin.storage.from(BUCKET).remove(uploadedPaths);
      await admin.from("quote_requests").delete().eq("id", quote.id);
      return reply({ error: "Kuvien tallennus epäonnistui." }, 500, origin);
    }

    return reply(
      { success: true, message: "Tarjouspyyntö vastaanotettu.", reference: quote.id },
      201,
      origin,
    );
  } catch (error) {
    console.error(error);
    return reply({ error: "Odottamaton virhe. Yritä uudelleen." }, 500, origin);
  }
});
