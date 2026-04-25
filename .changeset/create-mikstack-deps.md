---
"create-mikstack": patch
---

Bump template dependencies to latest versions:

- `@lingui/*` 5 → 6 — updates `lingui.config.ts` to use `defineConfig` + `formatter()` from `@lingui/format-po` (replaces the deprecated `format: "po"` string)
- `@rocicorp/zero` 0.25 → 1.3 (matches `zero-svelte`'s peer dep through workspace overrides if needed)
- `@mikstack/{email,form,notifications,svelte-lingui}` → 0.3+ (latest)
- `eslint` 9 → 10, `@eslint/js` 9 → 10, `@eslint/compat` 1 → 2
- `@types/nodemailer` 7 → 8 (matches `nodemailer` 8)
- `drizzle-zero` 0.17 → 0.18, `vite-plugin-devtools-json` 0 → 1, plus minor/patch bumps across the rest
