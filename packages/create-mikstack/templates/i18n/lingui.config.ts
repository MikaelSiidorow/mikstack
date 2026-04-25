import { defineConfig } from "@lingui/cli";
import { formatter } from "@lingui/format-po";
import { extractor } from "@mikstack/svelte-lingui/extractor";

export default defineConfig({
  locales: ["en", "fi"],
  sourceLocale: "en",
  catalogs: [
    {
      path: "src/locales/{locale}",
      include: ["src"],
    },
  ],
  extractors: [extractor],
  format: formatter({ lineNumbers: false }),
});
