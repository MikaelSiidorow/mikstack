import { extractFromTypeScript } from './typescript.js';
import { extractFromSvelte } from './svelte.js';
import type { ExtractedMessage } from './patterns.js';

export type { ExtractedMessage } from './patterns.js';

export const extractor = {
	match(filename: string): boolean {
		return /\.(svelte|ts|js|tsx|jsx)$/.test(filename);
	},

	extract(
		filename: string,
		code: string,
		onMessageExtracted: (msg: ExtractedMessage) => void
	): void {
		if (filename.endsWith('.svelte')) {
			extractFromSvelte(filename, code, onMessageExtracted);
		} else {
			extractFromTypeScript(filename, code, onMessageExtracted);
		}
	}
};
