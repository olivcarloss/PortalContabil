import { execSync } from "node:child_process";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

function commitHash(): string {
  try {
    return execSync("git rev-parse --short HEAD").toString().trim();
  } catch {
    return "dev";
  }
}

function commitDate(): string {
  try {
    return execSync("git log -1 --format=%cd --date=short").toString().trim();
  } catch {
    return "";
  }
}

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  define: {
    __APP_VERSION__: JSON.stringify(commitHash()),
    __APP_BUILD_DATE__: JSON.stringify(commitDate()),
  },
});
