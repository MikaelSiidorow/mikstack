import type { TSESTree } from '@typescript-eslint/typescript-estree';

const LINGUI_IMPORT_SOURCES = ['@mikstack/svelte-lingui', '$lib/index.ts', '$lib'];

export type ExtractedMessage = {
	id: string;
	message: string;
	context?: string;
	origin: [filename: string, line: number, column: number];
};

export type TrackedBindings = {
	t: boolean;
	msg: boolean;
	plural: boolean;
	select: boolean;
	useLingui: boolean;
};

export function createEmptyBindings(): TrackedBindings {
	return { t: false, msg: false, plural: false, select: false, useLingui: false };
}

export function isLinguiImport(node: TSESTree.ImportDeclaration): boolean {
	return LINGUI_IMPORT_SOURCES.includes(node.source.value);
}

export function trackImportBindings(
	node: TSESTree.ImportDeclaration,
	bindings: TrackedBindings
): void {
	for (const spec of node.specifiers) {
		if (spec.type === 'ImportSpecifier') {
			const imported =
				spec.imported.type === 'Identifier' ? spec.imported.name : spec.imported.value;
			if (imported in bindings) {
				bindings[imported as keyof TrackedBindings] = true;
			}
		}
	}
}

export function trackUseLinguiDestructuring(
	node: TSESTree.VariableDeclarator,
	bindings: TrackedBindings
): void {
	if (
		node.init?.type === 'CallExpression' &&
		node.init.callee.type === 'Identifier' &&
		node.init.callee.name === 'useLingui' &&
		bindings.useLingui &&
		node.id.type === 'ObjectPattern'
	) {
		for (const prop of node.id.properties) {
			if (
				prop.type === 'Property' &&
				prop.key.type === 'Identifier' &&
				prop.key.name === 't' &&
				prop.value.type === 'Identifier'
			) {
				bindings.t = true;
			}
			if (
				prop.type === 'Property' &&
				prop.key.type === 'Identifier' &&
				prop.key.name === 'plural' &&
				prop.value.type === 'Identifier'
			) {
				bindings.plural = true;
			}
			if (
				prop.type === 'Property' &&
				prop.key.type === 'Identifier' &&
				prop.key.name === 'select' &&
				prop.value.type === 'Identifier'
			) {
				bindings.select = true;
			}
		}
	}
}

export function extractTemplateMessage(node: TSESTree.TemplateLiteral): string {
	let message = node.quasis[0].value.cooked ?? node.quasis[0].value.raw;
	for (let i = 0; i < node.expressions.length; i++) {
		message += `{${i}}`;
		message += node.quasis[i + 1].value.cooked ?? node.quasis[i + 1].value.raw;
	}
	return message;
}

export function extractDescriptor(
	node: TSESTree.ObjectExpression
): { message: string; context?: string } | null {
	let message: string | undefined;
	let context: string | undefined;

	for (const prop of node.properties) {
		if (prop.type !== 'Property' || prop.key.type !== 'Identifier') continue;
		if (prop.key.name === 'message' && prop.value.type === 'Literal') {
			message = String(prop.value.value);
		}
		if (prop.key.name === 'context' && prop.value.type === 'Literal') {
			context = String(prop.value.value);
		}
	}

	if (!message) return null;
	return context !== undefined ? { message, context } : { message };
}

export function buildPluralIcu(node: TSESTree.CallExpression): string | null {
	if (node.arguments.length < 2) return null;
	const formsArg = node.arguments[1];
	if (formsArg.type !== 'ObjectExpression') return null;

	const parts: string[] = [];
	for (const prop of formsArg.properties) {
		if (prop.type !== 'Property') continue;
		let key: string;
		if (prop.key.type === 'Identifier') {
			key = prop.key.name;
		} else if (prop.key.type === 'Literal') {
			key = String(prop.key.value);
		} else {
			continue;
		}
		if (prop.value.type === 'Literal') {
			parts.push(`${key} {${prop.value.value}}`);
		} else if (prop.value.type === 'TemplateLiteral' && prop.value.expressions.length === 0) {
			const val = prop.value.quasis[0].value.cooked ?? prop.value.quasis[0].value.raw;
			parts.push(`${key} {${val}}`);
		}
	}

	return parts.length > 0 ? `{0, plural, ${parts.join(' ')}}` : null;
}

export function buildSelectIcu(node: TSESTree.CallExpression): string | null {
	if (node.arguments.length < 2) return null;
	const formsArg = node.arguments[1];
	if (formsArg.type !== 'ObjectExpression') return null;

	const parts: string[] = [];
	for (const prop of formsArg.properties) {
		if (prop.type !== 'Property') continue;
		let key: string;
		if (prop.key.type === 'Identifier') {
			key = prop.key.name;
		} else if (prop.key.type === 'Literal') {
			key = String(prop.key.value);
		} else {
			continue;
		}
		if (prop.value.type === 'Literal') {
			parts.push(`${key} {${prop.value.value}}`);
		} else if (prop.value.type === 'TemplateLiteral' && prop.value.expressions.length === 0) {
			const val = prop.value.quasis[0].value.cooked ?? prop.value.quasis[0].value.raw;
			parts.push(`${key} {${val}}`);
		}
	}

	return parts.length > 0 ? `{0, select, ${parts.join(' ')}}` : null;
}
