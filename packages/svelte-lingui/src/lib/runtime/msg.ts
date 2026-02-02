import { generateMessageId } from './utils.js';

export type MessageDescriptor = {
	id: string;
	message: string;
	context?: string;
};

/**
 * Marks a message for extraction without translating it.
 *
 * Tagged template form:
 *   msg`Hello ${name}` → { id, message: "Hello {0}" }
 *
 * Descriptor form:
 *   msg({ message: "Hello", context: "greeting" }) → { id, message, context }
 */
export function msg(
	stringsOrDescriptor: TemplateStringsArray | { message: string; context?: string },
	...values: unknown[]
): MessageDescriptor {
	if ('raw' in stringsOrDescriptor) {
		// Tagged template literal
		const strings = stringsOrDescriptor as TemplateStringsArray;
		let message = strings[0];
		for (let i = 0; i < values.length; i++) {
			message += `{${i}}` + strings[i + 1];
		}
		return {
			id: generateMessageId(message),
			message
		};
	}

	// Descriptor form
	const descriptor = stringsOrDescriptor as { message: string; context?: string };
	return {
		id: generateMessageId(descriptor.message, descriptor.context),
		message: descriptor.message,
		...(descriptor.context !== undefined && { context: descriptor.context })
	};
}
