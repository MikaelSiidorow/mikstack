import { extractor } from "@mikstack/svelte-lingui/extractor";
import type { LinguiConfig } from "@lingui/conf";

const config: LinguiConfig = {
  locales: ["en", "fi"],
  sourceLocale: "en",
  catalogs: [
    {
      path: "src/locales/{locale}",
      include: ["src"],
    },
  ],
  extractors: [extractor],
  format: "po",
  formatOptions: {
    lineNumbers: false,
  },
};

export default config;
