<script>
	import { useLingui, msg } from '@mikstack/svelte-lingui';
	const { t } = useLingui();

	const predefined = msg`Welcome back`;
</script>

<h1>{t`Hello world`}</h1>
<p>{t`Goodbye ${name}`}</p>
<p>{t({ message: 'Thanks', context: 'button' })}</p>
