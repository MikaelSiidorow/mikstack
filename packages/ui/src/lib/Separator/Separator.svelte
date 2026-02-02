<script lang="ts">
  interface Props {
    orientation?: 'horizontal' | 'vertical';
  }

  let { orientation = 'horizontal' }: Props = $props();
</script>

<hr data-orientation={orientation} aria-orientation={orientation} />

<style>
  hr {
    border: none;
    background-color: var(--border);

    &[data-orientation='horizontal'] {
      height: 1px;
      width: 100%;
    }

    &[data-orientation='vertical'] {
      width: 1px;
      height: 100%;
    }
  }
</style>
