# {{projectName}}

SvelteKit app with Drizzle ORM, Zero (real-time sync), and better-auth.

## Stack

- **Framework**: SvelteKit with TypeScript
- **Database**: PostgreSQL via Drizzle ORM
- **Real-time**: Zero (@rocicorp/zero) for client-side sync
- **Auth**: better-auth with magic link
- **UI**: @mikstack/ui components (Button, Input, FormField, Textarea, Separator)
- **Styling**: Design tokens in `src/app.css` — oklch colors, spacing/radius variables, dark mode via `prefers-color-scheme`
<!-- {{#if:i18n}} -->
- **i18n**: @mikstack/svelte-lingui (Lingui-based)
<!-- {{/if:i18n}} -->
<!-- {{#if:testing}} -->
- **Testing**: Vitest + @testcontainers/postgresql for integration tests
<!-- {{/if:testing}} -->

## Key Patterns

### Zero Queries & Mutations

Queries: `src/lib/zero/queries.ts` — define with `defineQueries`
Mutators: `src/lib/zero/mutators.ts` — define with `defineMutators`
Client usage: `get_z()` from `$lib/z.svelte` returns the Zero instance

```typescript
const z = get_z();
const query = z.q(queries.myQuery());
const data = $derived(query.data);
await z.mutate(mutators.myMutation(args));
```

Mutators verify ownership before update/delete by including `userId` in the query:

```typescript
const entity = await tx.run(
  zql.note.where("id", args.id).where("userId", ctx.userID).one(),
);
if (!entity) return;
```

### Auth

Server: `src/lib/server/auth.ts` (better-auth config)
Client: `src/lib/auth-client.ts` (magic link + client helpers)
Session is available in `locals.user` and `locals.session` via `src/hooks.server.ts`.
Routes under `(app)/` require authentication — unauthenticated requests redirect to `/sign-in`.

### Forms

**Zero mutations:** Use `createForm` from `@mikstack/form` for client-side forms with Valibot validation.

**Server submissions:** Use SvelteKit remote functions (`*.remote.ts` files) with the `form()` helper and Valibot validation.
For docs, call the Svelte MCP tool: `list-sections`, then `get-documentation` for the "Remote functions" section.

```svelte
<script lang="ts">
  import { createForm } from "@mikstack/form";
  import * as v from "valibot";

  const form = createForm({
    schema: v.object({
      title: v.pipe(v.string(), v.minLength(1, "Required")),
      content: v.string(),
    }),
    initialValues: { title: "", content: "" },
    async onSubmit(data) {
      await z.mutate(mutators.note.create({ id: crypto.randomUUID(), ...data }));
      form.reset();
    },
  });
</script>

<form id={form.id} onsubmit={form.onsubmit}>
  <input {...form.fields.title.as("text")} />
  <button type="submit" disabled={form.pending}>Create</button>
</form>
```

Key APIs: `form.fields.<name>.as(type)` for input props, `.issues()` for errors,
`form.pending` / `form.error` / `form.result` for submit state, `form.reset()` to clear.

### Notifications (@mikstack/notifications)

Config: `src/lib/server/notifications.ts` (lazy-initialized via Proxy)
Definitions: `src/lib/server/notifications/definitions.ts`
API routes: `src/routes/api/notifications/` (mark-read, preferences)

Send a notification:

```typescript
import { notif } from "$lib/server/notifications";
await notif.send({ type: "welcome", userId: user.id, data: { userName: user.name } });
```

Define new notification types in `definitions.ts` using `defineNotification()`.
In-app notifications sync to the client via Zero (`inAppNotification` table).
Email delivery tracking and retries are handled automatically.

### Database

Schema: `src/lib/server/db/schema.ts` (uses `casing: "snake_case"` — no explicit column names needed)
Connection: `src/lib/server/db/index.ts` (lazy-initialized via Proxy)

<!-- {{#if:testing}} -->
### Testing

Test utils: `src/lib/server/db/test-utils.ts` — `createTestDatabase()` spins up a PostgreSQL container via @testcontainers/postgresql.

```typescript
import { createTestDatabase, stopTestDatabase, type TestDatabase } from "$lib/server/db/test-utils";

let testDb: TestDatabase;
beforeAll(async () => { testDb = await createTestDatabase(); });
afterAll(async () => { await stopTestDatabase(testDb); });
```

<!-- {{/if:testing}} -->
<!-- {{#if:i18n}} -->
### i18n

Setup: `src/lib/i18n.ts` — initialized in root layout
Config: `lingui.config.ts`
Catalogs: `src/locales/{locale}.po`

Use `useLingui()` for translations in Svelte components:

```svelte
<script lang="ts">
  import { useLingui } from "@mikstack/svelte-lingui";
  const { t } = useLingui();
</script>

<h1>{t`Hello world`}</h1>
```

Use `<T>` component for rich text with embedded elements:

```svelte
<T>Read the <a href="/docs">documentation</a></T>
```

The extractor and Svelte preprocessor handle the transformation automatically.

Run `{{pmRun}} i18n:extract` to extract messages into `.po` catalogs.
<!-- {{/if:i18n}} -->

### Deployment

- `Dockerfile` — multi-stage build for the Node adapter
- `docker-compose.yml` — local dev (PostgreSQL + zero-cache)
- `docker-compose.prod.yml` — production (PostgreSQL + zero-cache + app)

## Commands

- `{{pmRun}} dev` — start dev server
- `{{pmRun}} build` — production build
- `{{pmRun}} db:push` — push schema to database
- `{{pmRun}} db:seed` — seed database
- `{{pmRun}} zero:generate` — generate Zero schema from Drizzle
- `{{pmRun}} lint` — run ESLint
- `{{pmRun}} format` — format with Prettier
<!-- {{#if:i18n}} -->
- `{{pmRun}} i18n:extract` — extract messages to .po catalogs
<!-- {{/if:i18n}} -->
<!-- {{#if:testing}} -->
- `{{pmRun}} test` — run tests (requires Docker for testcontainers)
<!-- {{/if:testing}} -->
