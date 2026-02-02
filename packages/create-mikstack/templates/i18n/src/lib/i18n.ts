import { setupI18n, type I18n } from "@lingui/core";
import { setI18n } from "@mikstack/svelte-lingui";
import { messages as enMessages } from "../locales/en.po";
import { messages as fiMessages } from "../locales/fi.po";

const allMessages: Record<string, typeof enMessages> = {
  en: enMessages,
  fi: fiMessages,
};

const i18n = setupI18n();

export function initI18n(locale = "en"): void {
  i18n.loadAndActivate({ locale, messages: allMessages[locale] ?? allMessages["en"]! });
  setI18n(i18n);
}

export function setLocale(locale: string): void {
  const messages = allMessages[locale];
  if (messages) {
    i18n.loadAndActivate({ locale, messages });
  }
}

export function getLocale(): string {
  return i18n.locale;
}

export const locales = Object.keys(allMessages);

/**
 * Create a standalone i18n instance for server-side use (e.g. emails).
 * Each call returns a fresh instance — safe for concurrent requests.
 */
export function createServerI18n(locale = "en"): I18n {
  const serverI18n = setupI18n();
  serverI18n.loadAndActivate({
    locale,
    messages: allMessages[locale] ?? allMessages["en"]!,
  });
  return serverI18n;
}
