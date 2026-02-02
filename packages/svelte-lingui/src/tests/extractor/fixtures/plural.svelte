<script>
	import { useLingui } from '@mikstack/svelte-lingui';
	const { plural } = useLingui();
</script>

<p>{plural(count, { one: '# item', other: '# items' })}</p>
<p>{plural(count, { '=0': 'No items', one: '# item', other: '# items' })}</p>
