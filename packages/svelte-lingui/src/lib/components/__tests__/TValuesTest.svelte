<script lang="ts">
	import T from '../T.svelte';
</script>

<p data-testid="with-values"><T message={'Hello {userName}'} values={{ userName: 'Alice' }} /></p>
