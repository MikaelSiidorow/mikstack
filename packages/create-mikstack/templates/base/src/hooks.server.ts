import { redirect, type Handle } from "@sveltejs/kit";
import { auth } from "$lib/server/auth";
import { svelteKitHandler } from "better-auth/svelte-kit";
import { building } from "$app/environment";

export const handle: Handle = async ({ event, resolve }) => {
  // {{#if:i18n}}
  event.locals.locale = event.cookies.get("locale") ?? "en";
  // {{/if:i18n}}

  const session = await auth.api.getSession({
    headers: event.request.headers,
  });

  event.locals.user = session?.user ?? null;
  event.locals.session = session?.session ?? null;

  if (event.route.id?.startsWith("/(app)") && !event.locals.user) {
    redirect(302, "/sign-in");
  }

  return svelteKitHandler({ event, resolve, auth, building });
};
