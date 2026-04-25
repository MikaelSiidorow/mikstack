# create-mikstack

## 0.3.2

### Patch Changes

- Bump template dependencies to latest versions: ([#6](https://github.com/MikaelSiidorow/mikstack/pull/6))
  - `@lingui/*` 5 → 6 — updates `lingui.config.ts` to use `defineConfig` + `formatter()` from `@lingui/format-po` (replaces the deprecated `format: "po"` string)
  - `@rocicorp/zero` 0.25 → 1.3 (matches `zero-svelte`'s peer dep through workspace overrides if needed)
  - `@mikstack/{email,form,notifications,svelte-lingui}` → 0.3+ (latest)
  - `eslint` 9 → 10, `@eslint/js` 9 → 10, `@eslint/compat` 1 → 2
  - `@types/nodemailer` 7 → 8 (matches `nodemailer` 8)
  - `drizzle-zero` 0.17 → 0.18, `vite-plugin-devtools-json` 0 → 1, plus minor/patch bumps across the rest

## 0.3.1

### Patch Changes

- Harden generated app scaffolds by limiting synced user fields, requiring authenticated notification API access, escaping dev email previews, validating note mutation UUIDs, and running the Node adapter image as a non-root user. ([#3](https://github.com/MikaelSiidorow/mikstack/pull/3))

## 0.3.0

### Minor Changes

- Initial release of the mikstack monorepo. ([`9233139`](https://github.com/MikaelSiidorow/mikstack/commit/92331390e632c07c243d920ead79c5aaa35de8ef))

  **create-mikstack** — CLI scaffolder for opinionated SvelteKit projects with Drizzle, Zero, better-auth, and more. Supports multiple package managers, adapter selection (Node/Vercel/Cloudflare), optional i18n, testing (Vitest + testcontainers), and GitHub Actions CI templates.

  **@mikstack/email** — Functional email building library with composable components (`html`, `body`, `section`, `row`, `column`, `text`, `button`, `image`, `link`, `divider`, `raw`) and an HTML renderer.

  **@mikstack/form** — Svelte 5 form validation library powered by Standard Schema, providing reactive form state management compatible with any schema validator (Valibot, Zod, ArkType, etc.).

  **@mikstack/notifications** — Code-first notification infrastructure with a factory pattern, pluggable channels (email with retries, in-app), delivery tracking, preference resolution, and a browser client SDK.

  **@mikstack/svelte-lingui** — Svelte 5 wrapper for @lingui/core with AST-based message extraction, a Vite plugin, a preprocessor for compile-time transforms, and runtime i18n components (`T`, `useLingui`, `msg`).

  **@mikstack/ui** — Headless Svelte 5 component library with 12 unstyled, customizable primitives: Accordion, Alert, Badge, Button, Card, Dialog, FormField, Input, Separator, Skeleton, Switch, and Textarea.
