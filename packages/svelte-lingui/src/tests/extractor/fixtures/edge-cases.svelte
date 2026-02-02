<script>
	import { useLingui, msg } from '@mikstack/svelte-lingui';
	const { t } = useLingui();

	// Descriptor with context
	const withContext = msg({ message: 'Open', context: 'menu' });

	// Empty string edge case
	const empty = t``;
</script>

{t`Simple`}
{t(withContext)}
