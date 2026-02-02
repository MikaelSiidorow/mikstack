<script lang="ts">
	import { useLingui, msg } from '../index';

	const { t, plural, select } = useLingui();

	const predefined = msg`Welcome back`;
</script>

<p data-testid="simple">{t`Hello`}</p>
<p data-testid="predefined">{t(predefined)}</p>
<p data-testid="interpolated">{t`Hello ${'World'}`}</p>
<p data-testid="descriptor">{t({ message: 'Goodbye' })}</p>
<p data-testid="plural">{plural(1, { one: '# item', other: '# items' })}</p>
<p data-testid="plural-many">{plural(5, { one: '# item', other: '# items' })}</p>
<p data-testid="select">{select('male', { male: 'He', female: 'She', other: 'They' })}</p>
