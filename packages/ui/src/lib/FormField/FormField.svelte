<script lang="ts">
  import type { Snippet } from 'svelte';

  interface LabelAttrs {
    for: string;
  }

  interface ErrorAttrs {
    id: string;
    role: 'alert';
    'aria-live': 'polite';
  }

  interface Props {
    for: string;
    label: Snippet<[LabelAttrs]>;
    children: Snippet;
    error?: Snippet<[ErrorAttrs]>;
  }

  let { for: htmlFor, label, children, error }: Props = $props();
</script>

<div class="field">
  <div class="field-label">
    {@render label({ for: htmlFor })}
  </div>
  {@render children()}
  {#if error}
    <div class="field-error">
      {@render error({ id: `${htmlFor}-error`, role: 'alert', 'aria-live': 'polite' })}
    </div>
  {/if}
</div>

<style>
  .field {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .field-label {
    font-size: var(--text-sm);
    font-weight: 500;
    color: var(--text-1);
  }

  .field-error {
    font-size: var(--text-sm);
    color: var(--danger);
  }
</style>
