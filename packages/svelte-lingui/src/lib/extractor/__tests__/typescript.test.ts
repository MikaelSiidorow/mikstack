import { describe, it, expect } from 'vitest';
import { extractFromTypeScript } from '../typescript';
import type { ExtractedMessage } from '../patterns';

function extract(code: string, filename = 'test.ts'): ExtractedMessage[] {
	const messages: ExtractedMessage[] = [];
	extractFromTypeScript(filename, code, (msg) => messages.push(msg));
	return messages;
}

describe('extractFromTypeScript', () => {
	it('extracts tagged template t``', () => {
		const messages = extract(`
			import { useLingui } from '@mikstack/svelte-lingui';
			const { t } = useLingui();
			const greeting = t\`Hello world\`;
		`);

		expect(messages).toHaveLength(1);
		expect(messages[0].message).toBe('Hello world');
	});

	it('extracts tagged template with interpolations', () => {
		const messages = extract(`
			import { useLingui } from '@mikstack/svelte-lingui';
			const { t } = useLingui();
			const name = 'World';
			const greeting = t\`Hello \${name}\`;
		`);

		expect(messages).toHaveLength(1);
		expect(messages[0].message).toBe('Hello {0}');
	});

	it('extracts msg tagged template', () => {
		const messages = extract(`
			import { msg } from '@mikstack/svelte-lingui';
			const greeting = msg\`Hello world\`;
		`);

		expect(messages).toHaveLength(1);
		expect(messages[0].message).toBe('Hello world');
	});

	it('extracts t descriptor call', () => {
		const messages = extract(`
			import { useLingui } from '@mikstack/svelte-lingui';
			const { t } = useLingui();
			const greeting = t({ message: 'Hello', context: 'greeting' });
		`);

		expect(messages).toHaveLength(1);
		expect(messages[0].message).toBe('Hello');
		expect(messages[0].context).toBe('greeting');
	});

	it('extracts msg descriptor call', () => {
		const messages = extract(`
			import { msg } from '@mikstack/svelte-lingui';
			const greeting = msg({ message: 'Hello', context: 'ctx' });
		`);

		expect(messages).toHaveLength(1);
		expect(messages[0].message).toBe('Hello');
		expect(messages[0].context).toBe('ctx');
	});

	it('extracts plural', () => {
		const messages = extract(`
			import { useLingui } from '@mikstack/svelte-lingui';
			const { plural } = useLingui();
			const text = plural(count, { one: '# item', other: '# items' });
		`);

		expect(messages).toHaveLength(1);
		expect(messages[0].message).toBe('{0, plural, one {# item} other {# items}}');
	});

	it('extracts select', () => {
		const messages = extract(`
			import { useLingui } from '@mikstack/svelte-lingui';
			const { select } = useLingui();
			const text = select(gender, { male: 'He', female: 'She', other: 'They' });
		`);

		expect(messages).toHaveLength(1);
		expect(messages[0].message).toBe('{0, select, male {He} female {She} other {They}}');
	});

	it('ignores non-lingui calls', () => {
		const messages = extract(`
			const t = (x) => x;
			const greeting = t\`Hello\`;
		`);

		expect(messages).toHaveLength(0);
	});

	it('extracts multiple messages from the same file', () => {
		const messages = extract(`
			import { useLingui, msg } from '@mikstack/svelte-lingui';
			const { t } = useLingui();
			const a = t\`Hello\`;
			const b = msg\`Goodbye\`;
			const c = t({ message: 'Thanks' });
		`);

		expect(messages).toHaveLength(3);
		expect(messages[0].message).toBe('Hello');
		expect(messages[1].message).toBe('Goodbye');
		expect(messages[2].message).toBe('Thanks');
	});
});
