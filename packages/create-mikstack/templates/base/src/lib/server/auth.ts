import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { magicLink } from "better-auth/plugins";
import { sveltekitCookies } from "better-auth/svelte-kit";
import { getRequestEvent } from "$app/server";
import { building } from "$app/environment";
import { env } from "$lib/server/env";
import { db } from "./db";
import * as schema from "./db/schema";
import { notif } from "./notifications";

let _auth: Auth | undefined;

function createAuth() {
  return betterAuth({
    baseURL: env.BETTER_AUTH_URL,
    database: drizzleAdapter(db, {
      provider: "pg",
      schema,
    }),
    plugins: [
      magicLink({
        sendMagicLink: async ({ email, url }) => {
          await notif.send({
            type: "magic-link",
            recipientEmail: email,
            // {{#if:i18n}}
            data: { url, locale: getRequestEvent().cookies.get("locale") },
            // {{/if:i18n}}
            // {{#if:!i18n}}
            data: { url },
            // {{/if:!i18n}}
          });
        },
      }),
      sveltekitCookies(getRequestEvent),
    ],
  });
}

type Auth = ReturnType<typeof createAuth>;

export const auth: Auth = new Proxy({} as Auth, {
  get(_, prop) {
    if (building) {
      throw new Error("Cannot access auth during build");
    }
    if (!_auth) {
      _auth = createAuth();
    }
    return (_auth as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export type Session = Auth["$Infer"]["Session"]["session"];
export type User = Auth["$Infer"]["Session"]["user"];
