import { describe, it, expect } from 'vitest';
import { extractFromSvelte } from '../svelte';
import type { ExtractedMessage } from '../patterns';

function extract(code: string, filename = 'Test.svelte'): ExtractedMessage[] {
	const messages: ExtractedMessage[] = [];
	extractFromSvelte(filename, code, (msg) => messages.push(msg));
	return messages;
}

describe('extractFromSvelte', () => {
	it('extracts from script block', () => {
		const messages = extract(`
<script>
	import { useLingui } from '@mikstack/svelte-lingui';
	const { t } = useLingui();
	const greeting = t\`Hello\`;
</script>
		`);

		expect(messages).toHaveLength(1);
		expect(messages[0].message).toBe('Hello');
	});

	it('extracts from template expressions', () => {
		const messages = extract(`
<script>
	import { useLingui } from '@mikstack/svelte-lingui';
	const { t } = useLingui();
</script>

<p>{t\`Hello world\`}</p>
		`);

		expect(messages).toHaveLength(1);
		expect(messages[0].message).toBe('Hello world');
	});

	it('extracts msg from script', () => {
		const messages = extract(`
<script>
	import { msg } from '@mikstack/svelte-lingui';
	const greeting = msg\`Hello\`;
</script>
		`);

		expect(messages).toHaveLength(1);
		expect(messages[0].message).toBe('Hello');
	});

	it('extracts plural from template', () => {
		const messages = extract(`
<script>
	import { useLingui } from '@mikstack/svelte-lingui';
	const { plural } = useLingui();
</script>

<p>{plural(count, { one: '# item', other: '# items' })}</p>
		`);

		expect(messages).toHaveLength(1);
		expect(messages[0].message).toBe('{0, plural, one {# item} other {# items}}');
	});

	it('extracts select from template', () => {
		const messages = extract(`
<script>
	import { useLingui } from '@mikstack/svelte-lingui';
	const { select } = useLingui();
</script>

<p>{select(gender, { male: 'He', female: 'She', other: 'They' })}</p>
		`);

		expect(messages).toHaveLength(1);
		expect(messages[0].message).toBe('{0, select, male {He} female {She} other {They}}');
	});

	it('extracts from both script and template', () => {
		const messages = extract(`
<script>
	import { useLingui, msg } from '@mikstack/svelte-lingui';
	const { t } = useLingui();
	const predefined = msg\`Welcome\`;
</script>

<p>{t\`Hello\`}</p>
<p>{t(predefined)}</p>
		`);

		// msg`Welcome` from script + t`Hello` from template
		// t(predefined) uses a variable reference, not extractable as a new message
		expect(messages).toHaveLength(2);
		expect(messages[0].message).toBe('Welcome');
		expect(messages[1].message).toBe('Hello');
	});

	it('extracts descriptor call in template', () => {
		const messages = extract(`
<script>
	import { useLingui } from '@mikstack/svelte-lingui';
	const { t } = useLingui();
</script>

<p>{t({ message: 'Hello', context: 'greeting' })}</p>
		`);

		expect(messages).toHaveLength(1);
		expect(messages[0].message).toBe('Hello');
		expect(messages[0].context).toBe('greeting');
	});
});
