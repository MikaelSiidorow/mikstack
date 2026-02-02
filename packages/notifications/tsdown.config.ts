import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts", "src/client.ts"],
  format: "esm",
  target: "node22",
  dts: true,
  clean: true,
  hash: false,
});
