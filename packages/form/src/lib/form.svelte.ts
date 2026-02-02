import type { StandardSchemaV1 } from '@standard-schema/spec';

type InputType =
	| 'text'
	| 'email'
	| 'password'
	| 'number'
	| 'tel'
	| 'url'
	| 'search'
	| 'date'
	| 'datetime-local'
	| 'time'
	| 'hidden'
	| 'file'
	| 'checkbox'
	| 'radio'
	| 'select'
	| 'select multiple';

interface FieldIssue {
	message: string;
}

interface FieldIssueWithPath extends FieldIssue {
	path: string;
}

interface InputElementProps {
	name: string;
	id: string;
	type?: string;
	value?: unknown;
	checked?: boolean;
	multiple?: boolean;
	'aria-invalid'?: boolean;
	'aria-describedby'?: string;
	oninput?: (e: Event) => void;
	onchange?: (e: Event) => void;
	onblur?: () => void;
}

interface Field {
	as: (type: InputType, radioValue?: string) => InputElementProps;
	value: () => unknown;
	set: (val: unknown) => void;
	name: () => string;
	issues: () => FieldIssue[];
}

type FieldsContainer<Input> = {
	value: () => Input;
	set: (vals: Partial<Input>) => void;
	allIssues: () => FieldIssueWithPath[];
} & {
	[K in keyof Input]: Field;
};

interface FormOptions<S extends StandardSchemaV1> {
	schema: S;
	initialValues: StandardSchemaV1.InferInput<S>;
	onSubmit: (data: StandardSchemaV1.InferOutput<S>) => Promise<unknown> | unknown;
}

interface Form<S extends StandardSchemaV1> {
	id: string;
	onsubmit: (e: SubmitEvent) => void;
	readonly fields: FieldsContainer<StandardSchemaV1.InferInput<S>>;
	readonly pending: boolean;
	readonly result: StandardSchemaV1.InferOutput<S> | undefined;
	error: string;
	validate: (opts?: { includeUntouched?: boolean }) => Promise<boolean>;
	reset: () => void;
}

let formCounter = 0;

export function createForm<S extends StandardSchemaV1>(options: FormOptions<S>): Form<S> {
	type Input = StandardSchemaV1.InferInput<S>;
	type Output = StandardSchemaV1.InferOutput<S>;

	const { schema, initialValues, onSubmit } = options;
	const formId = `form-${++formCounter}`;

	let values = $state<Record<string, unknown>>({ ...(initialValues as Record<string, unknown>) });
	let touched = $state<Record<string, boolean>>({});
	let fieldIssues = $state<Record<string, FieldIssue[]>>({});
	let pending = $state(false);
	let result = $state<Output | undefined>(undefined);
	let error = $state('');
	let hasSubmitted = $state(false);

	function getPathKey(pathEntry: PropertyKey | StandardSchemaV1.PathSegment): string {
		if (typeof pathEntry === 'object' && pathEntry !== null && 'key' in pathEntry) {
			return String(pathEntry.key);
		}
		return String(pathEntry);
	}

	function mapIssuesToFields(issues: ReadonlyArray<StandardSchemaV1.Issue>) {
		const mapped: Record<string, FieldIssue[]> = {};
		for (const issue of issues) {
			const path = issue.path?.[0];
			const key = path !== undefined ? getPathKey(path) : '__form__';
			if (!mapped[key]) mapped[key] = [];
			mapped[key].push({ message: issue.message });
		}
		fieldIssues = mapped;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars -- will be used when includeUntouched is implemented
	async function validate(opts?: { includeUntouched?: boolean }): Promise<boolean> {
		const r = await schema['~standard'].validate(values);
		if (r.issues) {
			mapIssuesToFields(r.issues);
			return false;
		}
		fieldIssues = {};
		return true;
	}

	function resetForm() {
		values = { ...(initialValues as Record<string, unknown>) };
		touched = {};
		fieldIssues = {};
		pending = false;
		result = undefined;
		error = '';
		hasSubmitted = false;
	}

	function createField(fieldName: string): Field {
		return {
			as(type: InputType, radioValue?: string): InputElementProps {
				const fieldId = `${formId}-${fieldName}`;
				const errId = `${fieldId}-error`;
				const hasIssues =
					(touched[fieldName] || hasSubmitted) && (fieldIssues[fieldName]?.length ?? 0) > 0;

				function handleInput(e: Event) {
					const target = e.target as HTMLInputElement;
					if (type === 'checkbox' && !radioValue) {
						values[fieldName] = target.checked;
					} else if (type === 'number') {
						values[fieldName] = target.valueAsNumber;
					} else if (type === 'file') {
						values[fieldName] = target.files?.[0];
					} else {
						values[fieldName] = target.value;
					}
				}

				function handleChange(e: Event) {
					const target = e.target as HTMLSelectElement;
					if (type === 'select multiple') {
						const selected: string[] = [];
						for (const opt of target.selectedOptions) {
							selected.push(opt.value);
						}
						values[fieldName] = selected;
					} else {
						values[fieldName] = target.value;
					}
				}

				function handleBlur() {
					touched[fieldName] = true;
				}

				const base: InputElementProps = {
					name: fieldName,
					id: fieldId,
					'aria-invalid': hasIssues || undefined,
					'aria-describedby': hasIssues ? errId : undefined,
					onblur: handleBlur
				};

				if (type === 'checkbox') {
					return {
						...base,
						type: 'checkbox',
						checked: !!values[fieldName],
						oninput: handleInput
					};
				}

				if (type === 'radio') {
					return {
						...base,
						type: 'radio',
						value: radioValue,
						checked: values[fieldName] === radioValue,
						oninput: handleInput
					};
				}

				if (type === 'select' || type === 'select multiple') {
					const props: InputElementProps = {
						...base,
						value: values[fieldName] as string,
						onchange: handleChange
					};
					if (type === 'select multiple') {
						props.multiple = true;
					}
					return props;
				}

				return {
					...base,
					type,
					value: values[fieldName] ?? '',
					oninput: handleInput
				};
			},

			value() {
				return values[fieldName];
			},

			set(val: unknown) {
				values[fieldName] = val;
			},

			name() {
				return fieldName;
			},

			issues() {
				if (!touched[fieldName] && !hasSubmitted) return [];
				return fieldIssues[fieldName] ?? [];
			}
		};
	}

	// eslint-disable-next-line svelte/prefer-svelte-reactivity -- internal cache, not reactive state
	const fieldCache = new Map<string, Field>();

	const fieldsHandler: ProxyHandler<object> = {
		get(_target, prop) {
			if (prop === 'value') {
				return () => ({ ...values }) as Input;
			}
			if (prop === 'set') {
				return (vals: Partial<Input>) => {
					Object.assign(values, vals);
				};
			}
			if (prop === 'allIssues') {
				return (): FieldIssueWithPath[] => {
					const all: FieldIssueWithPath[] = [];
					for (const [path, issues] of Object.entries(fieldIssues)) {
						if (path === '__form__') continue;
						for (const issue of issues) {
							all.push({ ...issue, path });
						}
					}
					return all;
				};
			}
			if (typeof prop === 'string') {
				let field = fieldCache.get(prop);
				if (!field) {
					field = createField(prop);
					fieldCache.set(prop, field);
				}
				return field;
			}
		}
	};

	const fields = new Proxy({}, fieldsHandler) as FieldsContainer<Input>;

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		hasSubmitted = true;

		const r = await schema['~standard'].validate(values);
		if (r.issues) {
			mapIssuesToFields(r.issues);
			// Focus first invalid field
			if (typeof document !== 'undefined') {
				const firstIssueKey = Object.keys(fieldIssues)[0];
				if (firstIssueKey && firstIssueKey !== '__form__') {
					const el = document.getElementById(`${formId}-${firstIssueKey}`);
					el?.focus();
				}
			}
			return;
		}

		fieldIssues = {};
		error = '';
		pending = true;

		try {
			result = (await onSubmit(r.value as Output)) as Output;
		} catch (err) {
			error = err instanceof Error ? err.message : String(err);
		} finally {
			pending = false;
		}
	}

	const form: Form<S> = {
		id: formId,
		onsubmit: handleSubmit,
		get fields() {
			return fields;
		},
		get pending() {
			return pending;
		},
		get result() {
			return result;
		},
		get error() {
			return error;
		},
		set error(val: string) {
			error = val;
		},
		validate,
		reset: resetForm
	};

	// Make everything except id and onsubmit non-enumerable for clean {...form} spreading
	const descriptors: Record<string, PropertyDescriptor> = {};
	for (const key of ['fields', 'pending', 'result', 'error', 'validate', 'reset'] as const) {
		const desc = Object.getOwnPropertyDescriptor(form, key)!;
		descriptors[key] = { ...desc, enumerable: false };
	}
	Object.defineProperties(form, descriptors);

	return form;
}

export type {
	Form,
	FormOptions,
	Field,
	FieldsContainer,
	FieldIssue,
	FieldIssueWithPath,
	InputType,
	InputElementProps,
	StandardSchemaV1
};
