import { describe, it, expect } from 'vitest';
import { linguiPo } from '../index';
import { generateMessageId } from '../../runtime/utils';

function transform(poContent: string): string | undefined {
	const plugin = linguiPo();
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const result = (plugin as any).transform(poContent, 'test.po');
	return result?.code;
}

describe('linguiPo vite plugin', () => {
	it('transforms a simple .po file into a JS module', () => {
		const code = transform(`
msgid ""
msgstr ""
"Content-Type: text/plain; charset=UTF-8"

msgid "Hello world"
msgstr "Hei maailma"
		`);

		expect(code).toBeDefined();
		const id = generateMessageId('Hello world');
		expect(code).toContain('export const messages');
		expect(code).toContain(id);
	});

	it('compiles messages into the lingui compiled format', () => {
		const code = transform(`
msgid ""
msgstr ""

msgid "Hello {name}"
msgstr "Hei {name}"
		`)!;

		// compileMessage turns "Hei {name}" into ["Hei ", ["name"]]
		expect(code).toContain('Hei ');
		expect(code).toContain('name');
	});

	it('handles context (msgctxt)', () => {
		const code = transform(`
msgid ""
msgstr ""

msgctxt "button"
msgid "Open"
msgstr "Avaa"

msgid "Open"
msgstr "Avata"
		`)!;

		const withCtx = generateMessageId('Open', 'button');
		const withoutCtx = generateMessageId('Open');
		expect(code).toContain(withCtx);
		expect(code).toContain(withoutCtx);
		expect(withCtx).not.toBe(withoutCtx);
	});

	it('skips untranslated entries', () => {
		const code = transform(`
msgid ""
msgstr ""

msgid "Translated"
msgstr "Käännetty"

msgid "Not translated"
msgstr ""
		`)!;

		const translatedId = generateMessageId('Translated');
		const untranslatedId = generateMessageId('Not translated');
		expect(code).toContain(translatedId);
		expect(code).not.toContain(untranslatedId);
	});

	it('ignores non-.po files', () => {
		const plugin = linguiPo();
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result = (plugin as any).transform('some content', 'test.ts');
		expect(result).toBeUndefined();
	});

	it('returns valid JS module syntax', () => {
		const code = transform(`
msgid ""
msgstr ""

msgid "Hello"
msgstr "Hei"
		`)!;

		expect(code).toMatch(/^export const messages = \{.*\};$/);
	});
});
