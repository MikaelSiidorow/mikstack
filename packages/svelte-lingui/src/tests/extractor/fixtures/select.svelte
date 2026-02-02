<script>
	import { useLingui } from '@mikstack/svelte-lingui';
	const { select } = useLingui();
</script>

<p>{select(gender, { male: 'He', female: 'She', other: 'They' })}</p>
