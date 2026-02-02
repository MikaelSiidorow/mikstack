# {{projectName}}

Built with [mikstack](https://github.com/mikaelsiidorow/mikstack).

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) (for local Postgres)
- Node.js 22+

## Getting Started

```bash
{{pmRun}} db:start
{{pmRun}} db:push
{{pmRun}} db:seed
{{pmRun}} dev
```

## Scripts

- `{{pmRun}} dev` — Start dev server
- `{{pmRun}} build` — Build for production
- `{{pmRun}} preview` — Preview production build
- `{{pmRun}} check` — Run svelte-check
- `{{pmRun}} lint` — Lint with ESLint
- `{{pmRun}} format` — Format with Prettier
- `{{pmRun}} db:start` — Start Postgres (Docker)
- `{{pmRun}} db:generate` — Generate Drizzle migrations
- `{{pmRun}} db:migrate` — Run Drizzle migrations
- `{{pmRun}} db:push` — Push schema to database
- `{{pmRun}} db:studio` — Open Drizzle Studio
- `{{pmRun}} db:seed` — Seed the database
