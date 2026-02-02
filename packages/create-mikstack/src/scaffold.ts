import crypto from "node:crypto";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import type { MikstackConfig, PackageManager } from "./config.ts";

import { pmExec, pmInstall, pmLockfile, pmRun } from "./pm.ts";
import { renderTemplate, type TemplateContext } from "./template-engine.ts";

const TEMPLATES_DIR = path.resolve(import.meta.dirname, "..", "templates");

export function scaffold(config: MikstackConfig, onStatus?: (msg: string) => void): void {
  const target = path.resolve(process.cwd(), config.targetDir);

  if (fs.existsSync(target)) {
    const entries = fs.readdirSync(target);
    if (entries.length > 0) {
      throw new Error(
        `Target directory "${config.targetDir}" is not empty. Please choose a different name or remove the directory.`,
      );
    }
  }

  // 1. Run sv create for the SvelteKit foundation
  const svBin = new URL("../bin.mjs", import.meta.resolve("sv")).pathname;
  execSync(
    `node ${svBin} create ${target} --template minimal --types ts --add devtools-json --no-install`,
    {
      stdio: "pipe",
    },
  );

  // Remove sv create's defaults (we provide our own via templates)
  fs.rmSync(path.join(target, "src", "routes"), { recursive: true, force: true });
  fs.rmSync(path.join(target, "agents.md"), { force: true });
  fs.rmSync(path.join(target, ".npmrc"), { force: true });
  fs.rmSync(path.join(target, "src", "lib", "index.ts"), { force: true });

  // Remove adapter-auto from package.json (adapter overlays provide the real one)
  const pkgPath = path.join(target, "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
  delete pkg.devDependencies?.["@sveltejs/adapter-auto"];
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

  onStatus?.("Applying templates...");

  // 2. Apply overlays (each copies files then merges any package.json.partial)
  const overlay = (dir: string) => {
    copyDir(dir, target);
    mergePartials(target);
  };

  overlay(path.join(TEMPLATES_DIR, "base"));

  if (config.testing) {
    overlay(path.join(TEMPLATES_DIR, "testing"));
  }

  overlay(path.join(TEMPLATES_DIR, "ui"));

  if (config.i18n) {
    overlay(path.join(TEMPLATES_DIR, "i18n"));
  }

  if (config.uiMode === "vendor") {
    overlay(path.join(TEMPLATES_DIR, "ui-vendor"));
  } else {
    overlay(path.join(TEMPLATES_DIR, "ui-dependency"));
  }

  if (config.githubActions) {
    overlay(path.join(TEMPLATES_DIR, `github-actions-${config.packageManager}`));
  }

  overlay(path.join(TEMPLATES_DIR, `supply-chain-${config.packageManager}`));
  overlay(path.join(TEMPLATES_DIR, "adapters", config.adapter));

  // 7. Render template markers
  onStatus?.("Rendering configuration...");
  const context = buildContext(config);
  renderDir(target, context);

  // 8. Append .gitignore additions from overlays
  appendGitignoreFiles(target);

  // 9. Append lockfile ignores to .gitignore
  appendLockfileIgnores(target, config.packageManager);

  // 10. Symlink CLAUDE.md → AGENTS.md
  fs.symlinkSync("AGENTS.md", path.join(target, "CLAUDE.md"));

  // 11. Copy .env.example → .env (needed for svelte-kit sync)
  const envExample = path.join(target, ".env.example");
  const envFile = path.join(target, ".env");
  if (fs.existsSync(envExample) && !fs.existsSync(envFile)) {
    fs.copyFileSync(envExample, envFile);
    // Replace placeholder secret with a random one
    const envContent = fs.readFileSync(envFile, "utf-8");
    fs.writeFileSync(
      envFile,
      envContent.replace(
        'BETTER_AUTH_SECRET="change-me-generate-a-real-secret"',
        `BETTER_AUTH_SECRET="${crypto.randomBytes(32).toString("base64url")}"`,
      ),
    );
  }
}

function copyDir(src: string, dest: string): void {
  if (!fs.existsSync(src)) return;

  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      copyDir(srcPath, destPath);
    } else {
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function mergePartials(dir: string): void {
  const pkgPath = path.join(dir, "package.json");
  if (!fs.existsSync(pkgPath)) return;

  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
  const partials = findFiles(dir, "package.json.partial");

  for (const partialPath of partials) {
    const partial = JSON.parse(fs.readFileSync(partialPath, "utf-8"));
    deepMerge(pkg, partial);
    fs.unlinkSync(partialPath);
  }

  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
}

function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): void {
  for (const key of Object.keys(source)) {
    const targetVal = target[key];
    const sourceVal = source[key];

    if (
      targetVal &&
      sourceVal &&
      typeof targetVal === "object" &&
      typeof sourceVal === "object" &&
      !Array.isArray(targetVal) &&
      !Array.isArray(sourceVal)
    ) {
      deepMerge(targetVal as Record<string, unknown>, sourceVal as Record<string, unknown>);
    } else {
      target[key] = sourceVal;
    }
  }
}

function findFiles(dir: string, filename: string): string[] {
  const results: string[] = [];

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findFiles(fullPath, filename));
    } else if (entry.name === filename) {
      results.push(fullPath);
    }
  }

  return results;
}

function buildContext(config: MikstackConfig): TemplateContext {
  return {
    projectName: config.projectName,
    pmInstall: pmInstall(config.packageManager),
    pmRun: pmRun(config.packageManager),
    pmExec: pmExec(config.packageManager),
    pm: config.packageManager,
    lockfile: pmLockfile(config.packageManager),
    adapter: config.adapter,
    seedRunner:
      config.packageManager === "bun" ? "bun" : "node --experimental-strip-types --env-file=.env",
    i18n: config.i18n,
    testing: config.testing,
    githubActions: config.githubActions,
    uiVendor: config.uiMode === "vendor",
    uiPrefix: config.uiMode === "vendor" ? "$lib/components/ui" : "@mikstack/ui",
    pmIsNpm: config.packageManager === "npm",
    pmIsPnpm: config.packageManager === "pnpm",
    pmIsBun: config.packageManager === "bun",
    needsEnvLoad: config.packageManager !== "bun",
  };
}

function appendGitignoreFiles(dir: string): void {
  const gitignorePath = path.join(dir, ".gitignore");
  if (!fs.existsSync(gitignorePath)) return;

  const appendFiles = findFiles(dir, ".gitignore.append");
  if (appendFiles.length === 0) return;

  let content = fs.readFileSync(gitignorePath, "utf-8");

  for (const appendFile of appendFiles) {
    const appendContent = fs.readFileSync(appendFile, "utf-8").trim();
    if (appendContent) {
      content = content.trimEnd() + "\n\n" + appendContent + "\n";
    }
    fs.unlinkSync(appendFile);
  }

  fs.writeFileSync(gitignorePath, content);
}

const ALL_LOCKFILES: Record<string, PackageManager> = {
  "package-lock.json": "npm",
  "pnpm-lock.yaml": "pnpm",
  "bun.lock": "bun",
};

function appendLockfileIgnores(dir: string, pm: PackageManager): void {
  const gitignorePath = path.join(dir, ".gitignore");
  const lines = Object.entries(ALL_LOCKFILES)
    .filter(([, lockPm]) => lockPm !== pm)
    .map(([file]) => file);

  if (lines.length > 0) {
    const content = fs.readFileSync(gitignorePath, "utf-8");
    fs.writeFileSync(
      gitignorePath,
      content.trimEnd() + "\n\n# Other package manager lockfiles\n" + lines.join("\n") + "\n",
    );
  }
}

const BINARY_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".ico",
  ".webp",
  ".avif",
  ".woff",
  ".woff2",
  ".ttf",
  ".eot",
  ".zip",
  ".tar",
  ".gz",
]);

function renderDir(dir: string, context: TemplateContext): void {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === ".git") continue;
      renderDir(fullPath, context);
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (BINARY_EXTENSIONS.has(ext)) continue;

      const content = fs.readFileSync(fullPath, "utf-8");
      const rendered = renderTemplate(content, context);
      if (rendered !== content) {
        fs.writeFileSync(fullPath, rendered);
      }
    }
  }
}
