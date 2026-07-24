/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string;
  readonly VITE_EDGE_FUNCTION_NAME?: string;
  readonly VITE_PREVIEW_ADMIN_EMAIL?: string;
  readonly VITE_TURNSTILE_SITE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  turnstile?: {
    render(
      container: HTMLElement,
      options: {
        sitekey: string;
        theme?: "dark" | "light" | "auto";
        callback(token: string): void;
        "expired-callback"?(): void;
        "error-callback"?(): void;
      },
    ): string;
    reset(widgetId?: string): void;
    remove(widgetId: string): void;
  };
}
