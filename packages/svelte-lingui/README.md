# @mikstack/svelte-lingui

Svelte 5 wrapper for [@lingui/core](https://lingui.dev) with runtime translation functions, a message extractor, and a rich-text component.

## Installation

```sh
bun add @mikstack/svelte-lingui @lingui/core
```

You also need `@lingui/cli` and `@lingui/message-utils` for the build toolchain:

```sh
bun add -d @lingui/cli @lingui/message-utils
```

## Setup

### 1. Configure Lingui

Create `lingui.config.ts` in your project root:

```ts
import { extractor } from '@mikstack/svelte-lingui/extractor';

export default {
	locales: ['en', 'fi', 'sv'],
	sourceLocale: 'en',
	catalogs: [
		{
			path: 'src/locales/{locale}',
			include: ['src']
		}
	],
	extractors: [extractor]
};
```

### 2. Initialize i18n

In your root layout (`+layout.svelte`):

```svelte
<script lang="ts">
	import { setupI18n } from '@lingui/core';
	import { compileMessage } from '@lingui/message-utils/compileMessage';
	import { setI18n } from '@mikstack/svelte-lingui';
	import { messages } from './locales/en';

	const i18n = setupI18n();
	i18n.setMessagesCompiler(compileMessage);
	i18n.loadAndActivate({ locale: 'en', messages });

	setI18n(i18n);
</script>

{@render children()}
```

## Usage

### Basic translations

```svelte
<script>
	import { useLingui } from '@mikstack/svelte-lingui';

	const { t } = useLingui();
</script>

<h1>{t`Hello world`}</h1>
```

### Interpolated values

```svelte
<script>
	import { useLingui } from '@mikstack/svelte-lingui';

	const { t } = useLingui();
	let userName = 'Alice';
	let count = 42;
</script>

<p>{t`Hello ${userName}`}</p><p>{t`You have ${count} notifications`}</p>
```

### Predefined messages with `msg`

Use `msg` to define translatable messages outside of components (e.g. in constants, stores, or server code). These are extracted but not translated until passed to `t()`:

```svelte
<script>
	import { useLingui, msg } from '@mikstack/svelte-lingui';

	const { t } = useLingui();
	const greeting = msg`Welcome back`;
	const farewell = msg({ message: 'Goodbye', context: 'formal' });
</script>

<p>{t(greeting)}</p><p>{t(farewell)}</p>
```

### Descriptor form with context

```svelte
<script>
	import { useLingui } from '@mikstack/svelte-lingui';

	const { t } = useLingui();
</script>

<!-- Context disambiguates identical source strings -->
<button>{t({ message: 'Open', context: 'button' })}</button>
<span>{t({ message: 'Open', context: 'status' })}</span>
```

### Plurals

```svelte
<script>
	import { useLingui } from '@mikstack/svelte-lingui';

	const { plural } = useLingui();
	let count = 5;
</script>

<p>
	{plural(count, {
		one: '# item',
		other: '# items'
	})}
</p>

<!-- With exact matches -->
<p>
	{plural(count, {
		'=0': 'No items',
		one: '# item',
		other: '# items'
	})}
</p>
```

### Select

```svelte
<script>
	import { useLingui } from '@mikstack/svelte-lingui';

	const { select } = useLingui();
	let gender = 'female';
</script>

<p>
	{select(gender, {
		male: 'He liked your post',
		female: 'She liked your post',
		other: 'They liked your post'
	})}
</p>
```

### Rich text with the `T` component

Use `T` for messages that contain markup. Pass Svelte 5 snippets as `components`:

```svelte
<script>
  import { T } from '@mikstack/svelte-lingui';
</script>

{#snippet bold(text: string)}
  <strong>{text}</strong>
{/snippet}

{#snippet link(text: string)}
  <a href="/terms">{text}</a>
{/snippet}

<p>
  <T
    message={"Click <0>here</0> to accept the <1>terms</1>"}
    components={{ '0': link, '1': bold }}
  />
</p>
```

**Note:** When passing ICU message strings with `{placeholders}` as Svelte attributes, wrap them in `{"..."}` to prevent Svelte from interpreting the curly braces as expressions:

```svelte
<!-- Correct -->
<T message={'Hello {userName}'} values={{ userName }} />

<!-- Wrong - Svelte will try to evaluate {userName} as an expression -->
<T message="Hello {userName}" values={{ userName }} />
```

### Switching locale

```svelte
<script>
	import { useLingui } from '@mikstack/svelte-lingui';
	import { messages as fiFI } from './locales/fi';

	const { i18n } = useLingui();

	function switchToFinnish() {
		i18n.loadAndActivate({ locale: 'fi', messages: fiFI });
	}
</script>

<button onclick={switchToFinnish}>Suomeksi</button>
```

All translations reactively update when the locale changes.

## Translation workflow

### Add scripts to `package.json`

```json
{
	"scripts": {
		"extract": "lingui extract",
		"compile": "lingui compile --typescript"
	}
}
```

### Extract messages

Scans `.svelte`, `.ts`, and `.js` files for `t`, `msg`, `plural`, and `select` calls and writes `.po` catalogs:

```sh
bun run extract
```

This creates/updates files like `src/locales/en.po`, `src/locales/fi.po`, etc. Send these to translators or edit them directly.

### Compile catalogs

Compiles `.po` files into TypeScript modules that `@lingui/core` can load:

```sh
bun run compile
```

This generates `src/locales/en.ts`, `src/locales/fi.ts`, etc. These are the files you import in your layout:

```ts
import { messages } from './locales/en';
```

### Typical development cycle

```sh
# 1. Write code with t`...`, msg`...`, plural(...), select(...)
# 2. Extract new/changed messages
bun run extract

# 3. Translate the .po files (or send to translators)
# 4. Compile translations to importable modules
bun run compile

# 5. Run your app — translations are loaded at startup
```

> **Note:** You need the compile step because `@lingui/core` expects precompiled message catalogs. The `compileMessage` runtime compiler shown in the setup example handles uncompiled messages as a fallback (e.g. for the source locale), but compiled catalogs are more efficient and recommended for production.

## API Reference

### Runtime

| Export                                 | Description                                                                       |
| -------------------------------------- | --------------------------------------------------------------------------------- |
| `useLingui()`                          | Returns `{ t, plural, select, i18n }` bound to the component's i18n context       |
| `msg`                                  | Marks messages for extraction without translating (tagged template or descriptor) |
| `setI18n(i18n)`                        | Sets the i18n instance for the component tree (call in root layout)               |
| `getI18n()`                            | Gets the i18n context (called internally by `useLingui`)                          |
| `generateMessageId(message, context?)` | Generates a lingui-compatible message ID                                          |

### Components

| Export | Description                                                                        |
| ------ | ---------------------------------------------------------------------------------- |
| `T`    | Rich text component. Props: `message`, `id?`, `context?`, `values?`, `components?` |

### Extractor

| Export      | Description                                                |
| ----------- | ---------------------------------------------------------- |
| `extractor` | Lingui CLI extractor for `.svelte`, `.ts`, and `.js` files |

Import from `@mikstack/svelte-lingui/extractor`.

## Development

```sh
bun run check    # Type check
bun run test     # Run all tests
bun run build    # Build + publint + attw
bun run lint     # Prettier + ESLint
```
