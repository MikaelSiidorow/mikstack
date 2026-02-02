import { describe, it, expect } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import TBasicTestPage from './TBasicTestPage.svelte';
import TValuesTestPage from './TValuesTestPage.svelte';
import TRichTextTestPage from './TRichTextTestPage.svelte';

describe('T component', () => {
	it('renders a basic message', async () => {
		render(TBasicTestPage);
		await expect.element(page.getByTestId('basic')).toHaveTextContent('Hello world');
	});

	it('renders with interpolated values', async () => {
		render(TValuesTestPage);
		await expect.element(page.getByTestId('with-values')).toHaveTextContent('Hello Alice');
	});

	it('renders rich text with component snippets', async () => {
		render(TRichTextTestPage);
		const el = page.getByTestId('rich');
		await expect.element(el).toHaveTextContent('Click here to continue');
	});
});
