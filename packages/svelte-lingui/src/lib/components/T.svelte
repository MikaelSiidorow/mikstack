<script lang="ts" module>
	import type { Snippet } from 'svelte';

	export type TProps = {
		id?: string;
		message: string;
		context?: string;
		values?: Record<string, unknown>;
		components?: Record<string, Snippet<[string]>>;
	};

	type Part = { type: 'text'; value: string } | { type: 'tag'; index: string; children: string };

	export function parseParts(input: string): Part[] {
		const parts: Part[] = [];
		const re = /<(\w+)>(.*?)<\/\1>/g;
		let lastIndex = 0;
		let match: RegExpExecArray | null;

		while ((match = re.exec(input)) !== null) {
			if (match.index > lastIndex) {
				parts.push({ type: 'text', value: input.slice(lastIndex, match.index) });
			}
			parts.push({ type: 'tag', index: match[1], children: match[2] });
			lastIndex = re.lastIndex;
		}

		if (lastIndex < input.length) {
			parts.push({ type: 'text', value: input.slice(lastIndex) });
		}

		return parts;
	}
</script>

<script lang="ts">
	import { getI18n } from '../runtime/context.svelte.js';
	import { generateMessageId } from '../runtime/utils.js';

	let { id, message, context, values, components }: TProps = $props();

	const ctx = getI18n();

	const translated = $derived.by(() => {
		void ctx.locale;
		const msgId = id ?? generateMessageId(message, context);
		return ctx.i18n._(msgId, values, { message });
	});

	const parts = $derived(parseParts(translated));
</script>

{#each parts as part, i (i)}
	{#if part.type === 'text'}
		{part.value}
	{:else if components?.[part.index]}
		{@render components[part.index](part.children)}
	{:else}
		{part.children}
	{/if}
{/each}
