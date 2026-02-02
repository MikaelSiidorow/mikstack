import { parse } from 'svelte/compiler';
import MagicString from 'magic-string';
import type { AST } from 'svelte/compiler';
import type { PreprocessorGroup } from 'svelte/compiler';

type SvelteNode = AST.Fragment['nodes'][number];
type ElementLike = AST.Component | AST.RegularElement;

const SUPPORTED_CHILD_TYPES = new Set(['Text', 'RegularElement', 'ExpressionTag']);

/**
 * Svelte preprocessor that transforms `<T>` children into explicit message + components props.
 *
 * Transforms:
 * ```svelte
 * <T>Click <a href="/docs">here</a> to continue</T>
 * ```
 * Into:
 * ```svelte
 * {#snippet __slt_0(children)}<a href="/docs">{children}</a>{/snippet}
 * <T message={"Click <a>here</a> to continue"} components={{ a: __slt_0 }} />
 * ```
 */
export function linguiPreprocess(): PreprocessorGroup {
	return {
		name: 'svelte-lingui',
		markup({ content, filename }) {
			if (!content.includes('<T')) return;

			let ast: AST.Root;
			try {
				ast = parse(content, { modern: true, filename });
			} catch {
				return;
			}

			const s = new MagicString(content);
			let snippetCounter = 0;

			walkFragment(ast.fragment, (node) => {
				if (node.type === 'Component' && node.name === 'T') {
					transformT(node, s, content, () => snippetCounter++);
				}
			});

			if (!s.hasChanged()) return;

			return {
				code: s.toString(),
				map: s.generateMap({ source: filename })
			};
		}
	};
}

/** Recursively walk a fragment tree, calling `visit` on each node. */
function walkFragment(fragment: AST.Fragment, visit: (node: SvelteNode) => void): void {
	for (const node of fragment.nodes) {
		visit(node);
		walkNode(node, visit);
	}
}

/** Walk child nodes based on node type. */
function walkNode(node: SvelteNode, visit: (node: SvelteNode) => void): void {
	// Nodes with a fragment property (elements, components, etc.)
	if ('fragment' in node && node.fragment) {
		walkFragment(node.fragment, visit);
	}

	// Block nodes with body/consequent/alternate/fallback/pending/then/catch
	for (const key of [
		'body',
		'consequent',
		'alternate',
		'fallback',
		'pending',
		'then',
		'catch'
	] as const) {
		const block = (node as unknown as Record<string, unknown>)[key];
		if (block && typeof block === 'object' && 'nodes' in (block as object)) {
			walkFragment(block as AST.Fragment, visit);
		}
	}
}

/** Get the plain text from a list of child nodes (only Text nodes). Returns null if non-text found. */
function getStaticText(nodes: SvelteNode[]): string | null {
	let text = '';
	for (const node of nodes) {
		if (node.type === 'Text') {
			text += node.data;
		} else {
			return null;
		}
	}
	return text;
}

/** Escape a string for use inside a JS string literal within a Svelte expression `{"..."}`. */
function escapeJsString(str: string): string {
	return str
		.replace(/\\/g, '\\\\')
		.replace(/"/g, '\\"')
		.replace(/\n/g, '\\n')
		.replace(/\r/g, '\\r');
}

/** Transform a `<T>children</T>` into `<T message="..." components={{ ... }} />`. */
function transformT(
	node: AST.Component,
	s: MagicString,
	content: string,
	nextId: () => number
): void {
	const fragment = node.fragment;
	if (!fragment.nodes.length) return;

	// Don't transform if <T> already has a `message` prop
	const attrs = node.attributes;
	if (attrs.some((a) => a.type === 'Attribute' && a.name === 'message')) return;

	// Skip if all children are just whitespace
	if (fragment.nodes.every((n) => n.type === 'Text' && !n.data.trim())) return;

	// Verify all children are supported types
	for (const child of fragment.nodes) {
		if (!SUPPORTED_CHILD_TYPES.has(child.type)) return;
	}

	// Pre-count tag names for deduplication
	const tagCounts = new Map<string, number>();
	for (const child of fragment.nodes) {
		if (child.type === 'RegularElement') {
			tagCounts.set(child.name, (tagCounts.get(child.name) ?? 0) + 1);
		}
	}

	const tagIndices = new Map<string, number>();
	const messageParts: string[] = [];
	const snippetDefs: string[] = [];
	const componentEntries: string[] = [];
	const valueEntries: string[] = [];
	let exprArgCounter = 0;

	for (const child of fragment.nodes) {
		if (child.type === 'Text') {
			messageParts.push(child.data);
		} else if (child.type === 'RegularElement') {
			const tagName = child.name;
			const total = tagCounts.get(tagName) ?? 1;
			const idx = tagIndices.get(tagName) ?? 0;
			tagIndices.set(tagName, idx + 1);

			// Use plain tag name if unique, otherwise append index
			const key = total > 1 ? `${tagName}${idx}` : tagName;

			const innerNodes = child.fragment.nodes;
			const innerText = getStaticText(innerNodes);

			if (innerText === null) {
				// Dynamic content inside element — not supported in macro form
				return;
			}

			messageParts.push(`<${key}>${innerText}</${key}>`);

			// Build snippet: reconstruct the element with original attributes, but {__children} as content
			const openTag = getOpenTag(child, content);
			const closeTag = `</${tagName}>`;

			const snippetName = `__slt_${nextId()}`;
			snippetDefs.push(
				`{#snippet ${snippetName}(__children)}${openTag}{__children}${closeTag}{/snippet}`
			);
			componentEntries.push(`${key}: ${snippetName}`);
		} else if (child.type === 'ExpressionTag') {
			const expr = child.expression as unknown as { start: number; end: number };
			const exprSource = content.slice(expr.start, expr.end);

			if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(exprSource)) {
				// Simple identifier — use as-is
				messageParts.push(`{${exprSource}}`);
				valueEntries.push(exprSource);
			} else {
				// Complex expression — use a numbered placeholder
				const name = `arg${exprArgCounter++}`;
				messageParts.push(`{${name}}`);
				valueEntries.push(`${name}: ${exprSource}`);
			}
		}
	}

	const message = messageParts.join('');
	// Collapse whitespace from template formatting (newlines + indentation → single space)
	const normalizedMessage = message.trim().replace(/\s*\n\s*/g, ' ');
	if (!normalizedMessage) return;

	// Build existing props source (context, id, etc.)
	const existingProps = attrs.map((a) => content.slice(a.start, a.end)).join(' ');

	// Build new props
	const props: string[] = [];
	if (existingProps) props.push(existingProps);
	props.push(`message={"${escapeJsString(normalizedMessage)}"}`);

	if (valueEntries.length > 0) {
		props.push(`values={{ ${valueEntries.join(', ')} }}`);
	}

	if (componentEntries.length > 0) {
		props.push(`components={{ ${componentEntries.join(', ')} }}`);
	}

	// Build replacement: snippets + self-closing <T>
	const snippetCode = snippetDefs.length > 0 ? snippetDefs.join('\n') + '\n' : '';
	const replacement = `${snippetCode}<T ${props.join(' ')} />`;

	s.overwrite(node.start, node.end, replacement);
}

/**
 * Extract the opening tag source of an element (e.g. `<a href="/docs">`).
 * Uses child positions to find where the opening tag ends.
 */
function getOpenTag(element: ElementLike, content: string): string {
	const innerNodes = element.fragment.nodes;

	if (innerNodes.length > 0) {
		// Opening tag is from element start to first child start
		return content.slice(element.start, innerNodes[0].start);
	}

	// Empty element — find the closing > of the opening tag
	const elemSource = content.slice(element.start, element.end);
	const closeTagIdx = elemSource.lastIndexOf('</');

	if (closeTagIdx !== -1) {
		// Has a closing tag like <span></span>
		return elemSource.slice(0, closeTagIdx);
	}

	// Self-closing or void — return as-is (unusual for wrapping elements)
	return elemSource;
}
