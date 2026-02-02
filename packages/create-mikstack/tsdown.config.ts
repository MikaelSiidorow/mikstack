import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  format: "esm",
  target: "node22",
  outputOptions: {
    banner: "#!/usr/bin/env node",
  },
  clean: true,
});
