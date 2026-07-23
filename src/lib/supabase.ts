import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error("Supabase environment variables are missing.");
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export const edgeFunctionName =
  (import.meta.env.VITE_EDGE_FUNCTION_NAME as string | undefined) ?? "submit-quote";

export const previewAdminEmail =
  (import.meta.env.VITE_PREVIEW_ADMIN_EMAIL as string | undefined)?.toLowerCase() ??
  "preview-admin@paint28.test";
