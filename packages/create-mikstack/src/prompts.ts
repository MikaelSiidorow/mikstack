import * as p from "@clack/prompts";

import type { MikstackConfig } from "./config.ts";
import type { PackageManager } from "./config.ts";

import { defaults } from "./config.ts";

function isCancel(value: unknown): value is symbol {
  return p.isCancel(value);
}

function onCancel(): never {
  p.cancel("Operation cancelled.");
  process.exit(0);
}

export async function runPrompts(
  projectName: string | undefined,
  packageManager: PackageManager,
): Promise<MikstackConfig> {
  p.intro("create-mikstack");

  if (!projectName) {
    const name = await p.text({
      message: "Project name:",
      placeholder: "my-app",
      validate(value) {
        if (!value || !value.trim()) return "Project name is required.";
        if (!/^[a-z0-9][a-z0-9._-]*$/.test(value)) {
          return "Invalid package name. Use lowercase, numbers, hyphens, dots, and underscores.";
        }
      },
    });
    if (isCancel(name)) onCancel();
    projectName = name;
  }

  const targetDir = projectName;

  const mode = await p.select({
    message: "Setup mode:",
    options: [
      { value: "recommended", label: "Recommended (full stack)" },
      { value: "customize", label: "Customize" },
    ] as const,
  });
  if (isCancel(mode)) onCancel();

  if (mode === "recommended") {
    p.outro(`Scaffolding ${projectName} with recommended defaults...`);
    return {
      projectName,
      targetDir,
      packageManager,
      ...defaults,
    };
  }

  const uiMode = await p.select({
    message: "UI components (@mikstack/ui):",
    options: [
      { value: "dependency", label: "Dependency (import from package)" },
      { value: "vendor", label: "Vendor (copy into project)" },
    ] as const,
  });
  if (isCancel(uiMode)) onCancel();

  const i18n = await p.confirm({
    message: "Include i18n? (@mikstack/svelte-lingui)",
    initialValue: true,
  });
  if (isCancel(i18n)) onCancel();

  const testing = await p.confirm({
    message: "Include testing setup? (Vitest + testcontainers)",
    initialValue: true,
  });
  if (isCancel(testing)) onCancel();

  const githubActions = await p.confirm({
    message: "Include GitHub Actions CI?",
    initialValue: true,
  });
  if (isCancel(githubActions)) onCancel();

  const adapter = await p.select({
    message: "SvelteKit adapter:",
    options: [
      { value: "node", label: "Node" },
      { value: "vercel", label: "Vercel" },
      { value: "cloudflare", label: "Cloudflare" },
    ] as const,
  });
  if (isCancel(adapter)) onCancel();

  p.outro(`Scaffolding ${projectName}...`);

  return {
    projectName,
    targetDir,
    packageManager,
    mode,
    uiMode,
    i18n,
    testing,
    githubActions,
    adapter,
  };
}
