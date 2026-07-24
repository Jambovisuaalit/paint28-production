import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => ({
  base: mode === "vercel" ? "/" : "/paint28-production/",
  plugins: [react()],
  build: {
    sourcemap: true,
    target: "es2020",
  },
}));
