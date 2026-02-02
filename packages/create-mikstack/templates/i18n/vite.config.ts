import devtoolsJson from "vite-plugin-devtools-json";
import { sveltekit } from "@sveltejs/kit/vite";
import { linguiPo } from "@mikstack/svelte-lingui/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [devtoolsJson(), linguiPo(), sveltekit()],
});
