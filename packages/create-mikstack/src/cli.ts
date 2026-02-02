import * as p from "@clack/prompts";
import { spawn } from "node:child_process";
import path from "node:path";
import { parseArgs, stripVTControlCharacters } from "node:util";

import type { MikstackConfig } from "./config.ts";

import { defaults } from "./config.ts";
import { detectPackageManager, pmRun } from "./pm.ts";
import { runPrompts } from "./prompts.ts";
import { scaffold } from "./scaffold.ts";

export async function cli(): Promise<void> {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      yes: { type: "boolean", short: "y", default: false },
      help: { type: "boolean", short: "h", default: false },
    },
  });

  if (values.help) {
    printHelp();
    return;
  }

  const packageManager = detectPackageManager();
  const projectName = positionals[0];
  const nonInteractive = values.yes || process.env.CI === "true";

  let config: MikstackConfig;

  if (nonInteractive) {
    const targetDir = projectName || "my-mikstack-app";
    config = {
      projectName: path.basename(targetDir),
      targetDir,
      packageManager,
      ...defaults,
    };
    p.intro("create-mikstack");
    p.log.info(`Scaffolding ${config.projectName} with recommended defaults (non-interactive)...`);
  } else {
    config = await runPrompts(projectName, packageManager);
  }

  const cwd = path.resolve(process.cwd(), config.targetDir);

  function run(cmd: string, args: string[], onLine?: (line: string) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      const child = spawn(cmd, args, { cwd, stdio: ["ignore", "pipe", "pipe"] });
      const cols = process.stdout.columns || 80;
      const handleData = (data: Buffer) => {
        if (!onLine) return;
        const line = data.toString().trim().split("\n").pop();
        if (!line) return;
        // Strip ANSI/VT codes so length measurement is accurate
        const clean = stripVTControlCharacters(line);
        // Leave room for spinner prefix (3) + animated dots (3) + safety (1)
        const maxLen = cols - 7;
        onLine(clean.length > maxLen ? clean.slice(0, maxLen - 1) + "\u2026" : clean);
      };
      child.stdout.on("data", handleData);
      child.stderr.on("data", handleData);
      child.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`${cmd} ${args.join(" ")} exited with code ${code}`));
      });
    });
  }

  await p.tasks([
    {
      title: "Scaffolding project",
      task: async (message) => {
        message("Running sv create...");
        scaffold(config, message);
        return "Project scaffolded";
      },
    },
    {
      title: "Installing dependencies",
      task: async (message) => {
        await run(packageManager, ["install"], message);
        return "Dependencies installed";
      },
    },
    {
      title: "Formatting project",
      task: async (message) => {
        try {
          await run(packageManager, ["run", "format"], message);
        } catch {
          // Non-critical
        }
        return "Project formatted";
      },
    },
    {
      title: "Initializing git repository",
      task: async (message) => {
        message("git init");
        await run("git", ["init"]);
        message("git add .");
        await run("git", ["add", "."]);
        message("git commit");
        await run("git", ["commit", "-m", "the future is now"]);
        return "Git repository initialized";
      },
    },
  ]);

  const pmrun = pmRun(config.packageManager);
  p.note([`cd ${config.targetDir}`, `${pmrun} db:push`, `${pmrun} dev`].join("\n"), "Next steps");
}

function printHelp(): void {
  console.log(`
  create-mikstack — scaffold an opinionated SvelteKit project

  Usage:
    create-mikstack [project-name] [options]

  Options:
    -y, --yes    Use recommended defaults (non-interactive)
    -h, --help   Show this help message
`);
}
