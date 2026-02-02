import { parse } from '@typescript-eslint/typescript-estree';
import { walk } from 'estree-walker';
import type { TSESTree } from '@typescript-eslint/typescript-estree';
import { generateMessageId } from '@lingui/message-utils/generateMessageId';
import {
	type ExtractedMessage,
	type TrackedBindings,
	createEmptyBindings,
	isLinguiImport,
	trackImportBindings,
	trackUseLinguiDestructuring,
	extractTemplateMessage,
	extractDescriptor,
	buildPluralIcu,
	buildSelectIcu
} from './patterns.js';

export function extractFromTypeScript(
	filename: string,
	code: string,
	onMessageExtracted: (msg: ExtractedMessage) => void,
	lineOffset = 0
): void {
	const ast = parse(code, {
		loc: true,
		range: true,
		jsx: filename.endsWith('.tsx')
	});

	const bindings: TrackedBindings = createEmptyBindings();

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	walk(ast as any, {
		enter(node) {
			const n = node as unknown as TSESTree.Node;

			// Track imports
			if (n.type === 'ImportDeclaration' && isLinguiImport(n)) {
				trackImportBindings(n, bindings);
				return;
			}

			// Track const { t } = useLingui()
			if (n.type === 'VariableDeclarator') {
				trackUseLinguiDestructuring(n, bindings);
				return;
			}

			// t`message` — tagged template
			if (
				n.type === 'TaggedTemplateExpression' &&
				n.tag.type === 'Identifier' &&
				n.tag.name === 't' &&
				bindings.t
			) {
				const message = extractTemplateMessage(n.quasi);
				onMessageExtracted({
					id: generateMessageId(message),
					message,
					origin: [filename, (n.loc?.start.line ?? 0) + lineOffset, n.loc?.start.column ?? 0]
				});
				return;
			}

			// msg`message` — tagged template
			if (
				n.type === 'TaggedTemplateExpression' &&
				n.tag.type === 'Identifier' &&
				n.tag.name === 'msg' &&
				bindings.msg
			) {
				const message = extractTemplateMessage(n.quasi);
				onMessageExtracted({
					id: generateMessageId(message),
					message,
					origin: [filename, (n.loc?.start.line ?? 0) + lineOffset, n.loc?.start.column ?? 0]
				});
				return;
			}

			// t({ message: '...', context: '...' }) — descriptor call
			if (
				n.type === 'CallExpression' &&
				n.callee.type === 'Identifier' &&
				n.callee.name === 't' &&
				bindings.t &&
				n.arguments.length === 1 &&
				n.arguments[0].type === 'ObjectExpression'
			) {
				const desc = extractDescriptor(n.arguments[0]);
				if (desc) {
					onMessageExtracted({
						id: generateMessageId(desc.message, desc.context),
						message: desc.message,
						...(desc.context !== undefined && { context: desc.context }),
						origin: [filename, (n.loc?.start.line ?? 0) + lineOffset, n.loc?.start.column ?? 0]
					});
				}
				return;
			}

			// msg({ message: '...', context: '...' }) — descriptor call
			if (
				n.type === 'CallExpression' &&
				n.callee.type === 'Identifier' &&
				n.callee.name === 'msg' &&
				bindings.msg &&
				n.arguments.length === 1 &&
				n.arguments[0].type === 'ObjectExpression'
			) {
				const desc = extractDescriptor(n.arguments[0]);
				if (desc) {
					onMessageExtracted({
						id: generateMessageId(desc.message, desc.context),
						message: desc.message,
						...(desc.context !== undefined && { context: desc.context }),
						origin: [filename, (n.loc?.start.line ?? 0) + lineOffset, n.loc?.start.column ?? 0]
					});
				}
				return;
			}

			// plural(count, { ... })
			if (
				n.type === 'CallExpression' &&
				n.callee.type === 'Identifier' &&
				n.callee.name === 'plural' &&
				bindings.plural
			) {
				const icu = buildPluralIcu(n);
				if (icu) {
					onMessageExtracted({
						id: generateMessageId(icu),
						message: icu,
						origin: [filename, (n.loc?.start.line ?? 0) + lineOffset, n.loc?.start.column ?? 0]
					});
				}
				return;
			}

			// select(value, { ... })
			if (
				n.type === 'CallExpression' &&
				n.callee.type === 'Identifier' &&
				n.callee.name === 'select' &&
				bindings.select
			) {
				const icu = buildSelectIcu(n);
				if (icu) {
					onMessageExtracted({
						id: generateMessageId(icu),
						message: icu,
						origin: [filename, (n.loc?.start.line ?? 0) + lineOffset, n.loc?.start.column ?? 0]
					});
				}
				return;
			}
		}
	});
}
