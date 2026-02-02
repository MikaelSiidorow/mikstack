# create-mikstack

Scaffold an opinionated SvelteKit project.

```bash
bun create mikstack@latest
pnpm create mikstack@latest
npm create mikstack@latest
```

## What you get

**Always included:**

- SvelteKit with TypeScript
- PostgreSQL + Drizzle ORM (with Docker Compose)
- better-auth with magic link (dev mode logs links to console)
- ESLint (type-aware, flat config) + Prettier
- `.env.example` with all keys stubbed

**Configurable:**

| Feature           | Default      | Options                              |
| ----------------- | ------------ | ------------------------------------ |
| UI                | Tailwind CSS | Tailwind / vanilla CSS (+ Stylelint) |
| Testing           | on           | Vitest + testcontainers              |
| GitHub Actions CI | on           | lint, format, typecheck, build       |
| SvelteKit adapter | node         | node / vercel / cloudflare           |

## Usage

### Interactive

```bash
bun create mikstack@latest my-app
```

Prompts you to choose between recommended defaults or customize each option.

### Non-interactive

```bash
bun create mikstack@latest my-app --yes
```

Scaffolds with all recommended defaults. Also activates when `CI=true`.

## Package manager detection

Automatically detected from `npm_config_user_agent`. Affects:

- `package.json` scripts
- `README.md` commands
- GitHub Actions CI workflow (separate template per PM)
