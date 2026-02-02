<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    variant?: 'default' | 'secondary' | 'success' | 'danger';
    children: Snippet;
  }

  let { variant = 'default', children }: Props = $props();
</script>

<span data-variant={variant}>
  {@render children()}
</span>

<style>
  span {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    padding: var(--space-1) var(--space-2);
    border-radius: 9999px;
    font-size: var(--text-xs);
    font-weight: 500;
    line-height: 1;
    white-space: nowrap;

    &[data-variant='default'] {
      background-color: var(--accent);
      color: white;
    }

    &[data-variant='secondary'] {
      background-color: var(--surface-3);
      color: var(--text-1);
    }

    &[data-variant='success'] {
      background-color: oklch(55% 0.15 145deg);
      color: white;
    }

    &[data-variant='danger'] {
      background-color: var(--danger);
      color: white;
    }
  }
</style>
