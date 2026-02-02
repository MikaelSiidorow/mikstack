<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';

  interface Props extends HTMLAttributes<HTMLElement> {
    children: Snippet;
    header?: Snippet;
    footer?: Snippet;
  }

  let { children, header, footer, ...rest }: Props = $props();
</script>

<article {...rest}>
  {#if header}
    <div class="card-header">
      {@render header()}
    </div>
  {/if}
  <div class="card-body">
    {@render children()}
  </div>
  {#if footer}
    <div class="card-footer">
      {@render footer()}
    </div>
  {/if}
</article>

<style>
  article {
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    background-color: var(--surface-1);
    overflow: hidden;
  }

  .card-header {
    padding: var(--space-4) var(--space-4) 0;
  }

  .card-body {
    padding: var(--space-4);
  }

  .card-footer {
    padding: 0 var(--space-4) var(--space-4);
  }
</style>
