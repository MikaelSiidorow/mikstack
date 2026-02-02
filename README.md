# mikstack

Opinionated tooling for building full-stack SvelteKit applications.

## Packages

| Package | Description |
|---|---|
| [`create-mikstack`](./packages/create-mikstack) | CLI scaffolder for SvelteKit projects with Postgres, Drizzle, Zero, better-auth |
| [`@mikstack/svelte-lingui`](./packages/svelte-lingui) | Svelte 5 wrapper for [@lingui/core](https://lingui.dev) with message extraction and rich-text |
| [`@mikstack/notifications`](./packages/notifications) | Code-first notification infrastructure with channels, retries, and preferences |
| [`@mikstack/form`](./packages/form) | Svelte 5 form validation using Standard Schema |
| [`@mikstack/ui`](./packages/ui) | CSS-first Svelte 5 component library |
| [`@mikstack/email`](./packages/email) | Zero-dependency email rendering |

## Quick start

```bash
bun create mikstack@latest
```

## Development

```bash
bun install          # install all dependencies
bun run build        # build all packages
bun run check        # type check all packages
bun run lint         # lint all packages
bun run test         # test all packages
```

Monorepo managed with [Bun workspaces](https://bun.sh/docs/install/workspaces). Releases via [Changesets](https://github.com/changesets/changesets).
