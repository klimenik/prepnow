import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// When building for GitHub Pages the app is served from /prepnow/.
// In dev it stays at /.
export default defineConfig(({ command }) => ({
  base: command === "build" ? "/prepnow/" : "/",
  plugins: [react()],
}));
