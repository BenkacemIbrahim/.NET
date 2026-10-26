import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiTarget = env.VITE_API_URL;
  if (!apiTarget) {
    throw new Error(
      "Missing VITE_API_URL. Create src/slotly-web/.env.local with scripts/initialize-environment.ps1.",
    );
  }
  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        "/api": { target: apiTarget, changeOrigin: true },
        "/hubs": { target: apiTarget, changeOrigin: true, ws: true },
        "/health": { target: apiTarget, changeOrigin: true },
      },
    },
    test: {
      exclude: ["e2e/**", "node_modules/**"],
      environment: "jsdom",
      pool: "threads",
      globals: true,
      setupFiles: "./src/test/setup.ts",
      css: true,
    },
  };
});
