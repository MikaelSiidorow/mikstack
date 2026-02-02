import type { PackageManager } from "./config.ts";

export function detectPackageManager(): PackageManager {
  const ua = process.env.npm_config_user_agent;
  if (!ua) return "npm";

  if (ua.startsWith("pnpm/")) return "pnpm";
  if (ua.startsWith("bun/")) return "bun";
  return "npm";
}

export function pmInstall(pm: PackageManager): string {
  return pm === "npm" ? "npm install" : `${pm} install`;
}

export function pmRun(pm: PackageManager): string {
  return pm === "npm" ? "npm run" : `${pm} run`;
}

export function pmExec(pm: PackageManager): string {
  if (pm === "npm") return "npx";
  if (pm === "pnpm") return "pnpm exec";
  return "bunx";
}

export function pmLockfile(pm: PackageManager): string {
  if (pm === "npm") return "package-lock.json";
  if (pm === "pnpm") return "pnpm-lock.yaml";
  return "bun.lock";
}
