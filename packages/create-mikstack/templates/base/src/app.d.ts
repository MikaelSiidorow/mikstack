import type { Session, User } from "$lib/server/auth";

declare global {
  namespace App {
    interface Locals {
      user: User | null;
      session: Session | null;
      // {{#if:i18n}}
      locale: string;
      // {{/if:i18n}}
    }
  }
}

export {};
