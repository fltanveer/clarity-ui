import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import pkg from "./package.json" with { type: "json" };

/* No @types/node here: only the one env read this file needs. */
declare const process: { env: Record<string, string | undefined> };

/* Footer build stamp: version bumps on every push; the commit is Vercel's (blank locally). */
const commit = (process.env.VERCEL_GIT_COMMIT_SHA ?? "").slice(0, 7);

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString().slice(0, 10)),
    __BUILD_COMMIT__: JSON.stringify(commit),
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: false,
  },
});
