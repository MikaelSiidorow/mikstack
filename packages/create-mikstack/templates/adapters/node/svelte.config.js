// {{#if:i18n}}
import { linguiPreprocess } from "@mikstack/svelte-lingui/preprocessor";
// {{/if:i18n}}
import adapter from "@sveltejs/adapter-node";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // {{#if:i18n}}
  preprocess: [linguiPreprocess()],
  // {{/if:i18n}}
  kit: {
    adapter: adapter(),
    experimental: {
      remoteFunctions: true,
    },
  },
};

export default config;
