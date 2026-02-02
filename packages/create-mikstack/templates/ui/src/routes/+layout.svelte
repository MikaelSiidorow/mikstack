<script lang="ts">
  import type { Snippet } from "svelte";
  import "../app.css";
  // {{#if:i18n}}
  import { initI18n } from "$lib/i18n";

  let { children, data }: { children: Snippet; data: { locale: string } } = $props();
  $effect(() => {
    initI18n(data.locale);
  });
  // {{/if:i18n}}
  // {{#if:!i18n}}
  let { children }: { children: Snippet } = $props();
  // {{/if:!i18n}}
</script>

{@render children()}
