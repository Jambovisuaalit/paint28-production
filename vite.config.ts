import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/paint28-production/",
  plugins: [react()],
  build: {
    sourcemap: true,
    target: "es2020",
  },
});
