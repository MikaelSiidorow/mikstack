export type PackageManager = "npm" | "pnpm" | "bun";

export type SetupMode = "recommended" | "customize";

export type UIMode = "vendor" | "dependency";

export type Adapter = "node" | "vercel" | "cloudflare";

export interface MikstackConfig {
  projectName: string;
  targetDir: string;
  packageManager: PackageManager;
  mode: SetupMode;
  uiMode: UIMode;
  i18n: boolean;
  testing: boolean;
  githubActions: boolean;
  adapter: Adapter;
}

export const defaults: Omit<MikstackConfig, "projectName" | "targetDir" | "packageManager"> = {
  mode: "recommended",
  uiMode: "dependency",
  i18n: true,
  testing: true,
  githubActions: true,
  adapter: "node",
};
