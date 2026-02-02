<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    open?: boolean;
    onclose?: () => void;
    children: Snippet;
  }

  let { open = $bindable(false), onclose, children }: Props = $props();

  let dialogEl: HTMLDialogElement | undefined = $state();

  $effect(() => {
    if (!dialogEl) return;
    if (open && !dialogEl.open) {
      dialogEl.showModal();
    } else if (!open && dialogEl.open) {
      dialogEl.close();
    }
  });

  function handleClose() {
    open = false;
    onclose?.();
  }

  function handleClick(e: MouseEvent) {
    if (e.target === dialogEl) {
      handleClose();
    }
  }
</script>

<dialog bind:this={dialogEl} onclose={handleClose} onclick={handleClick}>
  <div class="dialog-content">
    {@render children()}
  </div>
</dialog>

<style>
  dialog {
    border: none;
    border-radius: var(--radius-lg);
    padding: 0;
    max-width: min(32rem, calc(100vw - var(--space-6)));
    max-height: min(85vh, calc(100vh - var(--space-6)));
    background-color: var(--surface-1);
    color: var(--text-1);
    box-shadow:
      0 10px 15px -3px rgb(0 0 0 / 10%),
      0 4px 6px -4px rgb(0 0 0 / 10%);

    &::backdrop {
      background-color: rgb(0 0 0 / 50%);
    }

    &[open] {
      display: flex;
    }
  }

  .dialog-content {
    padding: var(--space-5);
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    overflow-y: auto;
  }
</style>
