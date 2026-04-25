<script lang="ts">
  import type { Snippet } from "svelte";
  import "../app.css";
  // {{#if:i18n}}
  import { getLocale, initI18n, setLocale } from "$lib/i18n";

  let { children, data }: { children: Snippet; data: { locale: string } } = $props();
  function getInitialLocale(): string {
    return data.locale;
  }

  initI18n(getInitialLocale());
  $effect(() => {
    if (getLocale() !== data.locale) {
      setLocale(data.locale);
    }
  });
  // {{/if:i18n}}
  // {{#if:!i18n}}
  let { children }: { children: Snippet } = $props();
  // {{/if:!i18n}}
</script>

{@render children()}
