import { setContext, getContext } from 'svelte';
import type { I18n } from '@lingui/core';

const I18N_KEY = Symbol('svelte-lingui');

export type I18nContext = {
	i18n: I18n;
	locale: string;
};

/**
 * Set the i18n instance for the current component tree.
 * Call this in your root layout component.
 *
 * Subscribes to the i18n 'change' event so that when
 * `i18n.activate()` is called, all consumers re-render.
 */
export function setI18n(i18n: I18n): void {
	const ctx: I18nContext = $state({ i18n, locale: i18n.locale });

	i18n.on('change', () => {
		ctx.locale = i18n.locale;
	});

	setContext(I18N_KEY, ctx);
}

/**
 * Get the i18n context. Must be called during component initialization.
 * Throws if `setI18n()` was not called in an ancestor.
 */
export function getI18n(): I18nContext {
	const ctx = getContext<I18nContext | undefined>(I18N_KEY);
	if (!ctx) {
		throw new Error(
			'svelte-lingui: i18n context not found. Did you forget to call setI18n() in a parent component?'
		);
	}
	return ctx;
}
