<script lang="ts">
  import type { HTMLInputAttributes } from 'svelte/elements';

  let { ...rest }: HTMLInputAttributes = $props();
</script>

<input {...rest} />

<style>
  input {
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    background-color: var(--surface-1);
    font-size: var(--text-base);
    width: 100%;

    &:focus-visible {
      outline: 2px solid var(--focus);
      outline-offset: 2px;
    }

    &[aria-invalid] {
      border-color: var(--danger);
    }
  }
</style>
