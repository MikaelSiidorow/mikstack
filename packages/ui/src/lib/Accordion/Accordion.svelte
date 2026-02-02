<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    summary: Snippet;
    children: Snippet;
    open?: boolean;
  }

  let { summary, children, open = false }: Props = $props();
</script>

<details {open}>
  <summary>
    {@render summary()}
    <svg class="chevron" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  </summary>
  <div class="content">
    {@render children()}
  </div>
</details>

<style>
  details {
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    background-color: var(--surface-1);
  }

  summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-3) var(--space-4);
    cursor: pointer;
    font-weight: 500;
    list-style: none;
    user-select: none;

    &::-webkit-details-marker {
      display: none;
    }

    &:hover {
      background-color: var(--surface-2);
    }

    &:focus-visible {
      outline: 2px solid var(--focus);
      outline-offset: -2px;
      border-radius: var(--radius-md);
    }
  }

  .chevron {
    transition: transform 0.2s;
    flex-shrink: 0;
  }

  details[open] > summary .chevron {
    transform: rotate(180deg);
  }

  .content {
    padding: 0 var(--space-4) var(--space-4);
    color: var(--text-2);
    font-size: var(--text-sm);
  }
</style>
