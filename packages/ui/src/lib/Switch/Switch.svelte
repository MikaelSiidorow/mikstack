<script lang="ts">
  import type { HTMLInputAttributes } from 'svelte/elements';

  interface Props extends Omit<HTMLInputAttributes, 'type'> {
    label?: string;
  }

  let { label, id, ...rest }: Props = $props();

  const inputId = $derived(id ?? (label ? `switch-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined));
</script>

<label class="switch-wrapper" for={inputId}>
  <input type="checkbox" role="switch" id={inputId} {...rest} />
  <span class="track">
    <span class="thumb"></span>
  </span>
  {#if label}
    <span class="switch-label">{label}</span>
  {/if}
</label>

<style>
  .switch-wrapper {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    cursor: pointer;
  }

  input {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  .track {
    position: relative;
    width: 2.75rem;
    height: 1.5rem;
    background-color: var(--surface-3);
    border-radius: 9999px;
    transition: background-color 0.15s;
  }

  .thumb {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 1.25rem;
    height: 1.25rem;
    background-color: white;
    border-radius: 9999px;
    transition: transform 0.15s;
  }

  input:checked + .track {
    background-color: var(--accent);
  }

  input:checked + .track .thumb {
    transform: translateX(1.25rem);
  }

  input:focus-visible + .track {
    outline: 2px solid var(--focus);
    outline-offset: 2px;
  }

  input:disabled + .track {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .switch-label {
    font-size: var(--text-sm);
    color: var(--text-1);
    user-select: none;
  }
</style>
