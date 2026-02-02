<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLButtonAttributes } from 'svelte/elements';

  interface Props extends HTMLButtonAttributes {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    children: Snippet;
  }

  let { variant = 'primary', children, ...rest }: Props = $props();
</script>

<button data-variant={variant} {...rest}>
  {@render children()}
</button>

<style>
  button {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-4);
    border: 1px solid transparent;
    border-radius: var(--radius-md);
    font-size: var(--text-sm);
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.15s, border-color 0.15s;

    &:focus-visible {
      outline: 2px solid var(--focus);
      outline-offset: 2px;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    &[data-variant='primary'] {
      background-color: var(--accent);
      color: white;

      &:hover:not(:disabled) {
        background-color: oklch(from var(--accent) calc(l - 0.05) c h);
      }
    }

    &[data-variant='secondary'] {
      background-color: var(--surface-2);
      border-color: var(--border);
      color: var(--text-1);

      &:hover:not(:disabled) {
        background-color: var(--surface-3);
      }
    }

    &[data-variant='ghost'] {
      background-color: transparent;
      color: var(--text-1);

      &:hover:not(:disabled) {
        background-color: var(--surface-2);
      }
    }

    &[data-variant='danger'] {
      background-color: var(--danger);
      color: white;

      &:hover:not(:disabled) {
        background-color: oklch(from var(--danger) calc(l - 0.05) c h);
      }
    }
  }
</style>
