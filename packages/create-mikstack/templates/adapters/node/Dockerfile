FROM node:22-slim AS base
WORKDIR /app
# {{#if:pmIsPnpm}}
RUN corepack enable
# {{/if:pmIsPnpm}}
# {{#if:pmIsBun}}
RUN npm i -g bun
# {{/if:pmIsBun}}

FROM base AS deps
COPY package.json {{lockfile}} ./
# {{#if:pmIsNpm}}
RUN npm ci
# {{/if:pmIsNpm}}
# {{#if:pmIsPnpm}}
RUN pnpm install --frozen-lockfile
# {{/if:pmIsPnpm}}
# {{#if:pmIsBun}}
RUN bun install --frozen-lockfile
# {{/if:pmIsBun}}

FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# {{#if:pmIsNpm}}
RUN npm run build
RUN npm prune --omit=dev
# {{/if:pmIsNpm}}
# {{#if:pmIsPnpm}}
RUN pnpm run build
RUN pnpm prune --prod
# {{/if:pmIsPnpm}}
# {{#if:pmIsBun}}
RUN bun run build
RUN bun install --production
# {{/if:pmIsBun}}

FROM base
WORKDIR /app
COPY --from=build /app/build ./build
COPY --from=build /app/node_modules ./node_modules
COPY package.json .
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "build"]
