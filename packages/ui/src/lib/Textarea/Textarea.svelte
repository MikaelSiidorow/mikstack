<script lang="ts">
  import type { HTMLTextareaAttributes } from 'svelte/elements';

  let { ...rest }: HTMLTextareaAttributes = $props();
</script>

<textarea {...rest}></textarea>

<style>
  textarea {
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    background-color: var(--surface-1);
    font-size: var(--text-base);
    width: 100%;
    min-height: 5rem;
    resize: vertical;

    &:focus-visible {
      outline: 2px solid var(--focus);
      outline-offset: 2px;
    }

    &[aria-invalid] {
      border-color: var(--danger);
    }
  }
</style>
