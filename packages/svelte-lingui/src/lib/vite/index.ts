import { po } from 'gettext-parser';
import { compileMessage } from '@lingui/message-utils/compileMessage';
import { generateMessageId } from '../runtime/utils.js';
import type { Plugin } from 'vite';

export type LinguiPoOptions = {
	/** File extensions to handle. Defaults to `['.po']`. */
	include?: string[];
};

/**
 * Vite plugin that transforms `.po` file imports into compiled message catalogs.
 *
 * Eliminates the `lingui compile` step — import `.po` files directly:
 *
 * ```ts
 * import { messages } from './locales/en.po';
 * i18n.loadAndActivate({ locale: 'en', messages });
 * ```
 *
 * Dynamic imports work too (Vite auto-splits into per-locale chunks):
 *
 * ```ts
 * const { messages } = await import(`./locales/${locale}.po`);
 * ```
 */
export function linguiPo(options?: LinguiPoOptions): Plugin {
	const extensions = options?.include ?? ['.po'];

	return {
		name: 'svelte-lingui-po',

		transform(code, id) {
			if (!extensions.some((ext) => id.endsWith(ext))) return;

			const parsed = po.parse(code) as {
				translations: Record<string, Record<string, { msgstr: string[] }>>;
			};
			const compiled: Record<string, unknown> = {};

			for (const [context, entries] of Object.entries(parsed.translations)) {
				for (const [msgid, entry] of Object.entries(entries)) {
					// Skip the PO header entry (empty msgid)
					if (!msgid) continue;

					const msgstr = entry.msgstr[0];
					// Skip untranslated entries — runtime falls back to source message
					if (!msgstr) continue;

					const id = generateMessageId(msgid, context || undefined);
					compiled[id] = compileMessage(msgstr);
				}
			}

			return {
				code: `export const messages = ${JSON.stringify(compiled)};`,
				map: null
			};
		}
	};
}
