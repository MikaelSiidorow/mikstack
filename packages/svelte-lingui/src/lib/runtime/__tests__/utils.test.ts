import { describe, it, expect } from 'vitest';
import { generateMessageId } from '../utils';

describe('generateMessageId', () => {
	it('generates a 6-character base64 ID', () => {
		const id = generateMessageId('Hello');
		expect(id).toHaveLength(6);
		expect(id).toMatch(/^[A-Za-z0-9+/]{6}$/);
	});

	it('produces consistent output for the same input', () => {
		const a = generateMessageId('Hello');
		const b = generateMessageId('Hello');
		expect(a).toBe(b);
	});

	it('produces different IDs for different messages', () => {
		const a = generateMessageId('Hello');
		const b = generateMessageId('Goodbye');
		expect(a).not.toBe(b);
	});

	it('differentiates messages by context', () => {
		const a = generateMessageId('Open', 'button');
		const b = generateMessageId('Open', 'menu');
		const c = generateMessageId('Open');
		expect(a).not.toBe(b);
		expect(a).not.toBe(c);
	});

	it('does not collide when context separator appears in message', () => {
		const withContext = generateMessageId('Hello', 'ctx');
		const concatenated = generateMessageId('Hello\x1Fctx');
		expect(withContext).not.toBe(concatenated);
	});
});
