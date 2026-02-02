import { describe, it, expect } from 'vitest';
import { msg } from '../msg';
import { generateMessageId } from '../utils';

describe('msg', () => {
	describe('tagged template form', () => {
		it('creates a descriptor from a simple template', () => {
			const descriptor = msg`Hello`;
			expect(descriptor).toEqual({
				id: generateMessageId('Hello'),
				message: 'Hello'
			});
		});

		it('creates a descriptor with interpolations', () => {
			const name = 'World';
			const descriptor = msg`Hello ${name}`;
			expect(descriptor).toEqual({
				id: generateMessageId('Hello {0}'),
				message: 'Hello {0}'
			});
		});

		it('handles multiple interpolations', () => {
			const a = 'a';
			const b = 'b';
			const descriptor = msg`${a} and ${b}`;
			expect(descriptor).toEqual({
				id: generateMessageId('{0} and {1}'),
				message: '{0} and {1}'
			});
		});
	});

	describe('descriptor form', () => {
		it('creates a descriptor from an object', () => {
			const descriptor = msg({ message: 'Hello' });
			expect(descriptor).toEqual({
				id: generateMessageId('Hello'),
				message: 'Hello'
			});
		});

		it('includes context when provided', () => {
			const descriptor = msg({ message: 'Open', context: 'button' });
			expect(descriptor).toEqual({
				id: generateMessageId('Open', 'button'),
				message: 'Open',
				context: 'button'
			});
		});

		it('generates different IDs for different contexts', () => {
			const a = msg({ message: 'Open', context: 'button' });
			const b = msg({ message: 'Open', context: 'menu' });
			expect(a.id).not.toBe(b.id);
		});
	});
});
