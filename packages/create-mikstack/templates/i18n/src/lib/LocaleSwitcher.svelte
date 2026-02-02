<script lang="ts">
  import { locales, getLocale, setLocale } from "$lib/i18n";

  let currentLocale = $state(getLocale());

  function switchLocale(locale: string) {
    setLocale(locale);
    document.cookie = `locale=${locale};path=/;max-age=31536000;samesite=lax`;
    currentLocale = locale;
  }
</script>

<div class="locale-switcher">
  {#each locales as locale (locale)}
    <button
      class:active={locale === currentLocale}
      disabled={locale === currentLocale}
      onclick={() => switchLocale(locale)}
    >
      {locale.toUpperCase()}
    </button>
  {/each}
</div>

<style>
  .locale-switcher {
    display: flex;
    gap: var(--space-1);
  }

  button {
    padding: var(--space-1) var(--space-2);
    font-size: var(--text-xs);
    font-weight: 500;
    border: 1px solid transparent;
    border-radius: var(--radius-sm);
    background: none;
    color: var(--text-2);
    cursor: pointer;
  }

  button:hover:not(:disabled) {
    background-color: var(--surface-2);
  }

  button.active {
    color: var(--text-1);
    font-weight: 700;
    cursor: default;
  }
</style>
