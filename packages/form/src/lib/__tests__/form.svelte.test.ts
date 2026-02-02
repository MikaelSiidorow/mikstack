import { describe, it, expect, vi } from 'vitest';
import { createForm } from '../form.svelte.js';
import * as v from 'valibot';

function makeSchema() {
	return v.object({
		email: v.pipe(v.string(), v.nonEmpty('Email is required'), v.email('Invalid email')),
		password: v.pipe(v.string(), v.minLength(8, 'Password must be at least 8 characters'))
	});
}

function makeForm(overrides?: { onSubmit?: (data: unknown) => Promise<unknown> | unknown }) {
	return createForm({
		schema: makeSchema(),
		initialValues: { email: '', password: '' },
		onSubmit: overrides?.onSubmit ?? (async () => {})
	});
}

function submitEvent(): SubmitEvent {
	return { preventDefault: vi.fn() } as unknown as SubmitEvent;
}

describe('createForm', () => {
	describe('enumerable properties', () => {
		it('should have id and onsubmit as enumerable', () => {
			const form = makeForm();
			const keys = Object.keys(form);
			expect(keys).toContain('id');
			expect(keys).toContain('onsubmit');
			expect(keys).toHaveLength(2);
		});

		it('should have non-enumerable fields, pending, result, error, validate, reset', () => {
			const form = makeForm();
			expect(form.fields).toBeDefined();
			expect(form.pending).toBe(false);
			expect(form.result).toBeUndefined();
			expect(form.error).toBe('');
			expect(form.validate).toBeTypeOf('function');
			expect(form.reset).toBeTypeOf('function');
		});
	});

	describe('field .as()', () => {
		it('should return text input attrs', () => {
			const form = makeForm();
			const attrs = form.fields.email.as('email');
			expect(attrs.name).toBe('email');
			expect(attrs.id).toMatch(/^form-\d+-email$/);
			expect(attrs.type).toBe('email');
			expect(attrs.value).toBe('');
			expect(attrs.oninput).toBeTypeOf('function');
			expect(attrs.onblur).toBeTypeOf('function');
		});

		it('should return checkbox attrs with checked', () => {
			const form = createForm({
				schema: v.object({ agree: v.boolean() }),
				initialValues: { agree: false },
				onSubmit: async () => {}
			});
			const attrs = form.fields.agree.as('checkbox');
			expect(attrs.type).toBe('checkbox');
			expect(attrs.checked).toBe(false);
			expect(attrs.value).toBeUndefined();
		});

		it('should return radio attrs with checked and value', () => {
			const form = createForm({
				schema: v.object({ color: v.string() }),
				initialValues: { color: 'red' },
				onSubmit: async () => {}
			});
			const attrs = form.fields.color.as('radio', 'red');
			expect(attrs.type).toBe('radio');
			expect(attrs.checked).toBe(true);
			expect(attrs.value).toBe('red');

			const attrs2 = form.fields.color.as('radio', 'blue');
			expect(attrs2.checked).toBe(false);
			expect(attrs2.value).toBe('blue');
		});

		it('should return select attrs', () => {
			const form = createForm({
				schema: v.object({ country: v.string() }),
				initialValues: { country: 'fi' },
				onSubmit: async () => {}
			});
			const attrs = form.fields.country.as('select');
			expect(attrs.value).toBe('fi');
			expect(attrs.type).toBeUndefined();
			expect(attrs.multiple).toBeUndefined();
			expect(attrs.onchange).toBeTypeOf('function');
		});

		it('should return select multiple attrs', () => {
			const form = createForm({
				schema: v.object({ tags: v.array(v.string()) }),
				initialValues: { tags: [] },
				onSubmit: async () => {}
			});
			const attrs = form.fields.tags.as('select multiple');
			expect(attrs.multiple).toBe(true);
		});

		it('should return password attrs', () => {
			const form = makeForm();
			const attrs = form.fields.password.as('password');
			expect(attrs.type).toBe('password');
			expect(attrs.value).toBe('');
		});
	});

	describe('field value get/set', () => {
		it('should get initial value', () => {
			const form = makeForm();
			expect(form.fields.email.value()).toBe('');
		});

		it('should set value programmatically', () => {
			const form = makeForm();
			form.fields.email.set('test@example.com');
			expect(form.fields.email.value()).toBe('test@example.com');
		});
	});

	describe('field name', () => {
		it('should return the field name', () => {
			const form = makeForm();
			expect(form.fields.email.name()).toBe('email');
			expect(form.fields.password.name()).toBe('password');
		});
	});

	describe('touch tracking and issues', () => {
		it('should not show issues before touch or submit', async () => {
			const form = makeForm();
			await form.validate();
			// Fields not touched, so issues() returns empty
			expect(form.fields.email.issues()).toEqual([]);
		});

		it('should show issues after field is touched and validate called', async () => {
			const form = makeForm();
			// Simulate blur to touch the field
			const attrs = form.fields.email.as('email');
			attrs.onblur?.();

			const valid = await form.validate();
			expect(valid).toBe(false);
			expect(form.fields.email.issues().length).toBeGreaterThan(0);
			expect(form.fields.email.issues()[0].message).toBeTruthy();
		});

		it('should show all field issues after submit attempt', async () => {
			const form = makeForm();
			await form.onsubmit(submitEvent());

			// After submit, hasSubmitted is true, so all issues visible
			expect(form.fields.email.issues().length).toBeGreaterThan(0);
			expect(form.fields.password.issues().length).toBeGreaterThan(0);
		});
	});

	describe('validate()', () => {
		it('should return true for valid data', async () => {
			const form = makeForm();
			form.fields.email.set('test@example.com');
			form.fields.password.set('password123');
			const valid = await form.validate();
			expect(valid).toBe(true);
		});

		it('should return false for invalid data', async () => {
			const form = makeForm();
			const valid = await form.validate();
			expect(valid).toBe(false);
		});
	});

	describe('submit', () => {
		it('should call onSubmit with valid data', async () => {
			const onSubmit = vi.fn().mockResolvedValue(undefined);
			const form = makeForm({ onSubmit });

			form.fields.email.set('test@example.com');
			form.fields.password.set('password123');

			await form.onsubmit(submitEvent());
			expect(onSubmit).toHaveBeenCalledWith({
				email: 'test@example.com',
				password: 'password123'
			});
		});

		it('should not call onSubmit with invalid data', async () => {
			const onSubmit = vi.fn();
			const form = makeForm({ onSubmit });

			await form.onsubmit(submitEvent());
			expect(onSubmit).not.toHaveBeenCalled();
		});

		it('should preventDefault on submit', async () => {
			const form = makeForm();
			const event = submitEvent();
			await form.onsubmit(event);
			expect(event.preventDefault).toHaveBeenCalled();
		});
	});

	describe('pending state', () => {
		it('should be true during onSubmit execution', async () => {
			let resolveFn: () => void;
			const pending: boolean[] = [];
			const promise = new Promise<void>((resolve) => {
				resolveFn = resolve;
			});

			const form = createForm({
				schema: makeSchema(),
				initialValues: { email: 'test@example.com', password: 'password123' },
				async onSubmit() {
					pending.push(form.pending);
					await promise;
					pending.push(form.pending);
				}
			});

			const submitPromise = form.onsubmit(submitEvent());
			// Wait a tick for the submit to start
			await new Promise((r) => setTimeout(r, 0));
			pending.push(form.pending);

			resolveFn!();
			await submitPromise;
			pending.push(form.pending);

			// During onSubmit: true, after resolution still in finally: true, after submit completes: false
			expect(pending[0]).toBe(true); // inside onSubmit
			expect(pending[pending.length - 1]).toBe(false); // after completion
		});
	});

	describe('error capture', () => {
		it('should capture thrown Error message', async () => {
			const form = createForm({
				schema: makeSchema(),
				initialValues: { email: 'test@example.com', password: 'password123' },
				async onSubmit() {
					throw new Error('Auth failed');
				}
			});

			await form.onsubmit(submitEvent());
			expect(form.error).toBe('Auth failed');
		});

		it('should capture non-Error throws as string', async () => {
			const form = createForm({
				schema: makeSchema(),
				initialValues: { email: 'test@example.com', password: 'password123' },
				async onSubmit() {
					throw 'something went wrong';
				}
			});

			await form.onsubmit(submitEvent());
			expect(form.error).toBe('something went wrong');
		});

		it('should clear error on successful submit', async () => {
			let shouldFail = true;
			const form = createForm({
				schema: makeSchema(),
				initialValues: { email: 'test@example.com', password: 'password123' },
				async onSubmit() {
					if (shouldFail) throw new Error('fail');
				}
			});

			await form.onsubmit(submitEvent());
			expect(form.error).toBe('fail');

			shouldFail = false;
			await form.onsubmit(submitEvent());
			expect(form.error).toBe('');
		});
	});

	describe('result', () => {
		it('should store onSubmit return value', async () => {
			const form = createForm({
				schema: makeSchema(),
				initialValues: { email: 'test@example.com', password: 'password123' },
				async onSubmit() {
					return { token: 'abc123' };
				}
			});

			await form.onsubmit(submitEvent());
			expect(form.result).toEqual({ token: 'abc123' });
		});

		it('should be undefined initially', () => {
			const form = makeForm();
			expect(form.result).toBeUndefined();
		});
	});

	describe('reset', () => {
		it('should restore initial state', async () => {
			const form = makeForm();

			form.fields.email.set('test@example.com');
			form.fields.password.set('password123');

			await form.onsubmit(submitEvent());

			form.reset();

			expect(form.fields.email.value()).toBe('');
			expect(form.fields.password.value()).toBe('');
			expect(form.pending).toBe(false);
			expect(form.result).toBeUndefined();
			expect(form.error).toBe('');
			expect(form.fields.email.issues()).toEqual([]);
		});
	});

	describe('fields container', () => {
		it('should get all values', () => {
			const form = makeForm();
			form.fields.email.set('test@example.com');
			const vals = form.fields.value();
			expect(vals).toEqual({ email: 'test@example.com', password: '' });
		});

		it('should set multiple values', () => {
			const form = makeForm();
			form.fields.set({ email: 'a@b.com', password: '12345678' });
			expect(form.fields.email.value()).toBe('a@b.com');
			expect(form.fields.password.value()).toBe('12345678');
		});

		it('should return allIssues with paths', async () => {
			const form = makeForm();
			await form.onsubmit(submitEvent());

			const all = form.fields.allIssues();
			expect(all.length).toBeGreaterThan(0);
			expect(all[0].path).toBeTruthy();
			expect(all[0].message).toBeTruthy();
		});
	});

	describe('nested field access', () => {
		it('should handle dot-notation nested fields via proxy', () => {
			const form = createForm({
				schema: v.object({ address: v.object({ city: v.string() }) }),
				initialValues: { address: { city: '' } },
				onSubmit: async () => {}
			});

			// The proxy creates fields for any property access
			const field = form.fields.address;
			expect(field.name()).toBe('address');
		});
	});

	describe('error setter', () => {
		it('should allow setting error manually', () => {
			const form = makeForm();
			form.error = 'Custom error';
			expect(form.error).toBe('Custom error');
		});
	});
});
