import { describe, it, expect } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import TranslateTestPage from './TranslateTestPage.svelte';

describe('useLingui', () => {
	it('translates a simple tagged template', async () => {
		render(TranslateTestPage);
		await expect.element(page.getByTestId('simple')).toHaveTextContent('Hello');
	});

	it('translates a predefined msg descriptor', async () => {
		render(TranslateTestPage);
		await expect.element(page.getByTestId('predefined')).toHaveTextContent('Welcome back');
	});

	it('translates with interpolation', async () => {
		render(TranslateTestPage);
		await expect.element(page.getByTestId('interpolated')).toHaveTextContent('Hello World');
	});

	it('translates a descriptor object', async () => {
		render(TranslateTestPage);
		await expect.element(page.getByTestId('descriptor')).toHaveTextContent('Goodbye');
	});

	it('handles plural with one', async () => {
		render(TranslateTestPage);
		await expect.element(page.getByTestId('plural')).toHaveTextContent('1 item');
	});

	it('handles plural with other', async () => {
		render(TranslateTestPage);
		await expect.element(page.getByTestId('plural-many')).toHaveTextContent('5 items');
	});

	it('handles select', async () => {
		render(TranslateTestPage);
		await expect.element(page.getByTestId('select')).toHaveTextContent('He');
	});
});
