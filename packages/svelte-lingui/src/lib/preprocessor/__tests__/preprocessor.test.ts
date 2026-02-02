import { describe, it, expect } from 'vitest';
import { linguiPreprocess } from '../index';

function preprocess(content: string): string | undefined {
	const preprocessor = linguiPreprocess();
	const result = preprocessor.markup!({ content, filename: 'Test.svelte' });
	if (result && 'code' in result) {
		return result.code;
	}
	return undefined;
}

describe('linguiPreprocess', () => {
	describe('basic text', () => {
		it('transforms text-only children into message prop', () => {
			const result = preprocess(
				`<script>import { T } from '@mikstack/svelte-lingui';</script>\n<T>Hello world</T>`
			);
			expect(result).toBeDefined();
			expect(result).toContain('message={"Hello world"}');
			expect(result).not.toContain('components=');
			expect(result).not.toContain('values=');
			expect(result).toContain('<T message=');
			expect(result).toContain('/>');
		});

		it('trims leading/trailing whitespace from multiline children', () => {
			const result = preprocess(
				`<script>import { T } from '@mikstack/svelte-lingui';</script>\n<T>\n\tHello world\n</T>`
			);
			expect(result).toBeDefined();
			expect(result).toContain('message={"Hello world"}');
		});
	});

	describe('elements (rich text)', () => {
		it('transforms an element child into snippet + components prop', () => {
			const result = preprocess(
				`<script>import { T } from '@mikstack/svelte-lingui';</script>\n<T>Click <a href="/docs">here</a> to continue</T>`
			);
			expect(result).toBeDefined();
			expect(result).toContain('{#snippet __slt_0(__children)}');
			expect(result).toContain('<a href="/docs">{__children}</a>');
			expect(result).toContain('{/snippet}');
			expect(result).toContain('message={"Click <a>here</a> to continue"}');
			expect(result).toContain('components={{ a: __slt_0 }}');
		});

		it('handles multiple different elements', () => {
			const result = preprocess(
				`<script>import { T } from '@mikstack/svelte-lingui';</script>\n<T><strong>Bold</strong> and <em>italic</em></T>`
			);
			expect(result).toBeDefined();
			expect(result).toContain('message={"<strong>Bold</strong> and <em>italic</em>"}');
			expect(result).toContain('{#snippet __slt_0(__children)}');
			expect(result).toContain('<strong>{__children}</strong>');
			expect(result).toContain('{#snippet __slt_1(__children)}');
			expect(result).toContain('<em>{__children}</em>');
			expect(result).toContain('components={{ strong: __slt_0, em: __slt_1 }}');
		});

		it('handles duplicate tag names with numeric suffix', () => {
			const result = preprocess(
				`<script>import { T } from '@mikstack/svelte-lingui';</script>\n<T>Click <a href="/a">here</a> or <a href="/b">there</a></T>`
			);
			expect(result).toBeDefined();
			expect(result).toContain('message={"Click <a0>here</a0> or <a1>there</a1>"}');
			expect(result).toContain('components={{ a0: __slt_0, a1: __slt_1 }}');
		});

		it('preserves element attributes in snippet', () => {
			const result = preprocess(
				`<script>import { T } from '@mikstack/svelte-lingui';</script>\n<T>Click <a href="/docs" class="link" target="_blank">here</a></T>`
			);
			expect(result).toBeDefined();
			expect(result).toContain('<a href="/docs" class="link" target="_blank">{__children}</a>');
		});

		it('preserves Svelte-specific attributes in snippet', () => {
			const result = preprocess(
				`<script>import { T } from '@mikstack/svelte-lingui'; let handleClick = () => {};</script>\n<T>Click <button onclick={handleClick}>here</button></T>`
			);
			expect(result).toBeDefined();
			expect(result).toContain('onclick={handleClick}');
			expect(result).toContain('{__children}');
		});
	});

	describe('expressions (ICU values)', () => {
		it('transforms simple identifier expressions into values', () => {
			const result = preprocess(
				`<script>import { T } from '@mikstack/svelte-lingui'; let name = 'World';</script>\n<T>Hello {name}</T>`
			);
			expect(result).toBeDefined();
			expect(result).toContain('message={"Hello {name}"}');
			expect(result).toContain('values={{ name }}');
		});

		it('transforms complex expressions with numbered placeholders', () => {
			const result = preprocess(
				`<script lang="ts">import { T } from '@mikstack/svelte-lingui'; let items: string[] = [];</script>\n<T>Count: {items.length}</T>`
			);
			expect(result).toBeDefined();
			expect(result).toContain('message={"Count: {arg0}"}');
			expect(result).toContain('values={{ arg0: items.length }}');
		});
	});

	describe('mixed content', () => {
		it('handles elements and expressions together', () => {
			const result = preprocess(
				`<script>import { T } from '@mikstack/svelte-lingui'; let name = 'World';</script>\n<T>Hello {name}, click <a href="/">here</a>!</T>`
			);
			expect(result).toBeDefined();
			expect(result).toContain('message={"Hello {name}, click <a>here</a>!"}');
			expect(result).toContain('values={{ name }}');
			expect(result).toContain('components={{ a: __slt_0 }}');
		});
	});

	describe('existing props', () => {
		it('preserves context prop on T', () => {
			const result = preprocess(
				`<script>import { T } from '@mikstack/svelte-lingui';</script>\n<T context="menu">Open file</T>`
			);
			expect(result).toBeDefined();
			expect(result).toContain('context="menu"');
			expect(result).toContain('message={"Open file"}');
		});

		it('preserves id prop on T', () => {
			const result = preprocess(
				`<script>import { T } from '@mikstack/svelte-lingui';</script>\n<T id="custom.id">Hello</T>`
			);
			expect(result).toBeDefined();
			expect(result).toContain('id="custom.id"');
			expect(result).toContain('message={"Hello"}');
		});
	});

	describe('skip cases', () => {
		it('does not transform T with existing message prop', () => {
			const input = `<script>import { T } from '@mikstack/svelte-lingui';</script>\n<T message="Hello" />`;
			const result = preprocess(input);
			expect(result).toBeUndefined();
		});

		it('does not transform T with only whitespace children', () => {
			const input = `<script>import { T } from '@mikstack/svelte-lingui';</script>\n<T>   </T>`;
			const result = preprocess(input);
			expect(result).toBeUndefined();
		});

		it('does not transform T with unsupported children like {#if}', () => {
			const input = `<script>import { T } from '@mikstack/svelte-lingui'; let show = true;</script>\n<T>{#if show}Hello{/if}</T>`;
			const result = preprocess(input);
			expect(result).toBeUndefined();
		});

		it('does not transform T with dynamic content inside elements', () => {
			const input = `<script>import { T } from '@mikstack/svelte-lingui'; let text = 'hi';</script>\n<T>Click <a href="/">{text}</a></T>`;
			const result = preprocess(input);
			expect(result).toBeUndefined();
		});

		it('does not modify files without <T', () => {
			const input = `<p>Hello world</p>`;
			const result = preprocess(input);
			expect(result).toBeUndefined();
		});
	});

	describe('multiple T blocks', () => {
		it('transforms multiple T components in one file', () => {
			const result = preprocess(
				`<script>import { T } from '@mikstack/svelte-lingui';</script>\n<T>Hello <a href="/a">one</a></T>\n<T>Goodbye <b>two</b></T>`
			);
			expect(result).toBeDefined();
			expect(result).toContain('message={"Hello <a>one</a>"}');
			expect(result).toContain('message={"Goodbye <b>two</b>"}');
			// Snippet names should be unique
			expect(result).toContain('__slt_0');
			expect(result).toContain('__slt_1');
		});
	});

	describe('whitespace normalization', () => {
		it('collapses multiline whitespace in messages', () => {
			const result = preprocess(
				`<script>import { T } from '@mikstack/svelte-lingui';</script>\n<T>\n\tHello\n\t<a href="/">world</a>\n</T>`
			);
			expect(result).toBeDefined();
			expect(result).toContain('message={"Hello <a>world</a>"}');
		});
	});

	describe('source maps', () => {
		it('returns a source map when transforming', () => {
			const preprocessor = linguiPreprocess();
			const result = preprocessor.markup!({
				content: `<script>import { T } from '@mikstack/svelte-lingui';</script>\n<T>Hello</T>`,
				filename: 'Test.svelte'
			});
			expect(result).toBeDefined();
			expect(result).toHaveProperty('map');
		});
	});
});
