<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    variant?: 'info' | 'success' | 'warning' | 'danger';
    children: Snippet;
    title?: Snippet;
  }

  let { variant = 'info', children, title }: Props = $props();
</script>

<div role="alert" data-variant={variant}>
  {#if title}
    <strong class="alert-title">{@render title()}</strong>
  {/if}
  <div class="alert-body">
    {@render children()}
  </div>
</div>

<style>
  [role='alert'] {
    padding: var(--space-3) var(--space-4);
    border-radius: var(--radius-md);
    border: 1px solid;
    font-size: var(--text-sm);
    display: flex;
    flex-direction: column;
    gap: var(--space-1);

    &[data-variant='info'] {
      background-color: oklch(from var(--accent) l c h / 10%);
      border-color: oklch(from var(--accent) l c h / 30%);
      color: var(--text-1);
    }

    &[data-variant='success'] {
      background-color: oklch(55% 0.15 145deg / 10%);
      border-color: oklch(55% 0.15 145deg / 30%);
      color: var(--text-1);
    }

    &[data-variant='warning'] {
      background-color: oklch(75% 0.15 85deg / 10%);
      border-color: oklch(75% 0.15 85deg / 30%);
      color: var(--text-1);
    }

    &[data-variant='danger'] {
      background-color: oklch(from var(--danger) l c h / 10%);
      border-color: oklch(from var(--danger) l c h / 30%);
      color: var(--text-1);
    }
  }

  .alert-title {
    font-weight: 600;
  }
</style>
