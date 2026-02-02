import { parse } from 'svelte/compiler';
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

// Svelte AST node types (from svelte/compiler)
type SvelteAST = {
	fragment: SvelteFragment;
	instance?: SvelteScript;
	module?: SvelteScript;
};

type SvelteScript = {
	type: string;
	content: TSESTree.Program;
	start: number;
};

type SvelteFragment = {
	type: string;
	nodes: SvelteNode[];
};

type SvelteNode = {
	type: string;
	start: number;
	end: number;
	expression?: TSESTree.Node;
	nodes?: SvelteNode[];
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	[key: string]: any;
};

function countLines(code: string, upTo: number): number {
	let count = 0;
	for (let i = 0; i < upTo && i < code.length; i++) {
		if (code[i] === '\n') count++;
	}
	return count;
}

function walkExpressions(
	fragment: SvelteFragment,
	bindings: TrackedBindings,
	filename: string,
	code: string,
	onMessageExtracted: (msg: ExtractedMessage) => void
): void {
	function visitNode(node: SvelteNode): void {
		if (node.type === 'ExpressionTag' && node.expression) {
			walkExpression(node.expression, bindings, filename, code, onMessageExtracted);
		}

		// Recurse into child nodes
		if (node.nodes) {
			for (const child of node.nodes) {
				visitNode(child);
			}
		}
		// Handle elements with fragment children (RegularElement, Component, etc.)
		if (node.fragment && typeof node.fragment === 'object' && 'nodes' in node.fragment) {
			for (const child of (node.fragment as SvelteFragment).nodes) {
				visitNode(child);
			}
		}

		// Also handle blocks, attributes, and attribute values
		for (const key of [
			'body',
			'consequent',
			'alternate',
			'fallback',
			'children',
			'attributes',
			'value'
		]) {
			const sub = node[key];
			if (sub && typeof sub === 'object' && Array.isArray(sub)) {
				for (const child of sub) {
					if (child && typeof child === 'object' && 'type' in child) {
						visitNode(child as SvelteNode);
					}
				}
			} else if (sub && typeof sub === 'object' && 'type' in sub) {
				visitNode(sub as SvelteNode);
			}
		}
	}

	for (const node of fragment.nodes) {
		visitNode(node);
	}
}

function walkExpression(
	expr: TSESTree.Node,
	bindings: TrackedBindings,
	filename: string,
	code: string,
	onMessageExtracted: (msg: ExtractedMessage) => void
): void {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	walk(expr as any, {
		enter(node) {
			const n = node as unknown as TSESTree.Node;

			// t`message`
			if (
				n.type === 'TaggedTemplateExpression' &&
				n.tag.type === 'Identifier' &&
				n.tag.name === 't' &&
				bindings.t
			) {
				const message = extractTemplateMessage(n.quasi);
				const line = n.loc ? n.loc.start.line : countLines(code, n.range?.[0] ?? 0) + 1;
				onMessageExtracted({
					id: generateMessageId(message),
					message,
					origin: [filename, line, n.loc?.start.column ?? 0]
				});
				return;
			}

			// msg`message`
			if (
				n.type === 'TaggedTemplateExpression' &&
				n.tag.type === 'Identifier' &&
				n.tag.name === 'msg' &&
				bindings.msg
			) {
				const message = extractTemplateMessage(n.quasi);
				const line = n.loc ? n.loc.start.line : countLines(code, n.range?.[0] ?? 0) + 1;
				onMessageExtracted({
					id: generateMessageId(message),
					message,
					origin: [filename, line, n.loc?.start.column ?? 0]
				});
				return;
			}

			// t({ message, context })
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
					const line = n.loc ? n.loc.start.line : countLines(code, n.range?.[0] ?? 0) + 1;
					onMessageExtracted({
						id: generateMessageId(desc.message, desc.context),
						message: desc.message,
						...(desc.context !== undefined && { context: desc.context }),
						origin: [filename, line, n.loc?.start.column ?? 0]
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
					const line = n.loc ? n.loc.start.line : countLines(code, n.range?.[0] ?? 0) + 1;
					onMessageExtracted({
						id: generateMessageId(icu),
						message: icu,
						origin: [filename, line, n.loc?.start.column ?? 0]
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
					const line = n.loc ? n.loc.start.line : countLines(code, n.range?.[0] ?? 0) + 1;
					onMessageExtracted({
						id: generateMessageId(icu),
						message: icu,
						origin: [filename, line, n.loc?.start.column ?? 0]
					});
				}
				return;
			}
		}
	});
}

function walkScript(
	script: SvelteScript,
	bindings: TrackedBindings,
	filename: string,
	code: string,
	onMessageExtracted: (msg: ExtractedMessage) => void
): void {
	const lineOffset = countLines(code, script.start);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	walk(script.content as any, {
		enter(node) {
			const n = node as unknown as TSESTree.Node;

			if (n.type === 'ImportDeclaration' && isLinguiImport(n)) {
				trackImportBindings(n, bindings);
				return;
			}

			if (n.type === 'VariableDeclarator') {
				trackUseLinguiDestructuring(n, bindings);
				return;
			}

			// t`message`
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

			// msg`message`
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

			// t({ message, context })
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

			// msg({ message, context })
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

export function extractFromSvelte(
	filename: string,
	code: string,
	onMessageExtracted: (msg: ExtractedMessage) => void
): void {
	const ast = parse(code, { modern: true }) as unknown as SvelteAST;

	const bindings: TrackedBindings = createEmptyBindings();

	// Walk script blocks first to discover imports and bindings
	if (ast.instance) {
		walkScript(ast.instance, bindings, filename, code, onMessageExtracted);
	}
	if (ast.module) {
		walkScript(ast.module, bindings, filename, code, onMessageExtracted);
	}

	// Walk template expressions
	if (ast.fragment) {
		walkExpressions(ast.fragment, bindings, filename, code, onMessageExtracted);
	}
}
