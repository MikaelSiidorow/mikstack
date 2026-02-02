<script lang="ts">
	import T from '../T.svelte';
</script>

{#snippet bold(text: string)}
	<strong>{text}</strong>
{/snippet}

{#snippet italic(text: string)}
	<em>{text}</em>
{/snippet}

<p data-testid="rich">
	<T message="Click <bold>here</bold> to continue" components={{ bold }} />
</p>
<p data-testid="multi-tags">
	<T message="<bold>Bold</bold> and <italic>italic</italic>" components={{ bold, italic }} />
</p>
