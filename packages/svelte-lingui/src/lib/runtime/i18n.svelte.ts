import type { I18n } from '@lingui/core';
import { getI18n } from './context.svelte.js';
import { generateMessageId } from './utils.js';
import type { MessageDescriptor } from './msg.js';

type PluralForms = {
	zero?: string;
	one?: string;
	two?: string;
	few?: string;
	many?: string;
	other: string;
	'=0'?: string;
	'=1'?: string;
	'=2'?: string;
};

type SelectForms = {
	[key: string]: string;
	other: string;
};

type TaggedTranslate = {
	(strings: TemplateStringsArray, ...values: unknown[]): string;
	(descriptor: MessageDescriptor): string;
	(descriptor: { message: string; context?: string }): string;
};

type PluralFn = (count: number, forms: PluralForms) => string;
type SelectFn = (value: string, forms: SelectForms) => string;

function buildPluralMessage(forms: PluralForms): string {
	const parts: string[] = [];
	for (const [key, val] of Object.entries(forms)) {
		if (val !== undefined) {
			parts.push(`${key} {${val}}`);
		}
	}
	return `{0, plural, ${parts.join(' ')}}`;
}

function buildSelectMessage(forms: SelectForms): string {
	const parts: string[] = [];
	for (const [key, val] of Object.entries(forms)) {
		if (val !== undefined) {
			parts.push(`${key} {${val}}`);
		}
	}
	return `{0, select, ${parts.join(' ')}}`;
}

/**
 * Main translation hook. Call during component initialization.
 *
 * Returns `{ t, plural, select, i18n }` bound to the current i18n context.
 * Reading from `ctx.locale` establishes Svelte reactivity so translations
 * update when the locale changes.
 */
export function useLingui(): {
	readonly t: TaggedTranslate;
	readonly plural: PluralFn;
	readonly select: SelectFn;
	readonly i18n: I18n;
} {
	const ctx = getI18n();

	const t: TaggedTranslate = (
		stringsOrDescriptor:
			| TemplateStringsArray
			| MessageDescriptor
			| { message: string; context?: string },
		...values: unknown[]
	): string => {
		// Touch locale to establish reactivity
		void ctx.locale;

		if ('raw' in stringsOrDescriptor) {
			// Tagged template literal: t`Hello ${name}`
			const strings = stringsOrDescriptor as TemplateStringsArray;
			let message = strings[0];
			const icuValues: Record<string, unknown> = {};
			for (let i = 0; i < values.length; i++) {
				message += `{${i}}` + strings[i + 1];
				icuValues[String(i)] = values[i];
			}
			const id = generateMessageId(message);
			return ctx.i18n._(id, icuValues, { message });
		}

		// Descriptor form: t(msgDescriptor) or t({ message, context })
		const desc = stringsOrDescriptor as MessageDescriptor | { message: string; context?: string };
		const id = 'id' in desc && desc.id ? desc.id : generateMessageId(desc.message, desc.context);
		const descValues =
			'values' in desc ? (desc.values as Record<string, unknown> | undefined) : undefined;
		return ctx.i18n._(id, descValues, { message: desc.message });
	};

	const plural: PluralFn = (count: number, forms: PluralForms): string => {
		void ctx.locale;
		const message = buildPluralMessage(forms);
		const id = generateMessageId(message);
		return ctx.i18n._(id, { '0': count }, { message });
	};

	const select: SelectFn = (value: string, forms: SelectForms): string => {
		void ctx.locale;
		const message = buildSelectMessage(forms);
		const id = generateMessageId(message);
		return ctx.i18n._(id, { '0': value }, { message });
	};

	return {
		get t() {
			return t;
		},
		get plural() {
			return plural;
		},
		get select() {
			return select;
		},
		get i18n() {
			return ctx.i18n;
		}
	};
}
