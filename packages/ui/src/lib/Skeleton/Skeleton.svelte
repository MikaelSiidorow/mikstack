<script lang="ts">
  interface Props {
    width?: string;
    height?: string;
    circle?: boolean;
  }

  let { width, height = '1rem', circle = false }: Props = $props();
</script>

<div
  class="skeleton"
  class:circle
  style:width={circle ? height : width}
  style:height
  aria-hidden="true"
></div>

<style>
  .skeleton {
    background-color: var(--surface-3);
    border-radius: var(--radius-md);
    animation: pulse 2s ease-in-out infinite;
  }

  .circle {
    border-radius: 9999px;
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }

    50% {
      opacity: 0.5;
    }
  }
</style>
