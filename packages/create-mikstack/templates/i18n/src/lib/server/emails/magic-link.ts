import { html, body, section, text, button, render } from "@mikstack/email";
import { msg } from "@mikstack/svelte-lingui";
import { createServerI18n } from "$lib/i18n";

export function magicLinkEmail(url: string, locale = "en") {
  const i18n = createServerI18n(locale);
  const _ = (d: { id: string; message: string }) => i18n._(d);

  const email = html(
    body(
      [
        section(
          [
            text(_(msg`Sign in to {{projectName}}`), {
              fontSize: 24,
              fontWeight: "bold",
              color: "#111827",
              marginBottom: 40,
              marginTop: 40,
            }),
            button(_(msg`Sign in`), {
              href: url,
              backgroundColor: "#111827",
              color: "#ffffff",
              fontSize: 14,
              fontWeight: "bold",
              padding: [12, 34],
              borderRadius: 6,
              marginBottom: 16,
            }),
            text(_(msg`Or, copy and paste this temporary login URL:`), {
              fontSize: 14,
              lineHeight: 1.7,
              color: "#111827",
              marginTop: 24,
              marginBottom: 14,
            }),
            text(url, {
              fontSize: 13,
              color: "#111827",
              backgroundColor: "#f4f4f4",
              borderRadius: 6,
              padding: [16, 24],
              border: "1px solid #eee",
            }),
            text(_(msg`If you didn't try to sign in, you can safely ignore this email.`), {
              fontSize: 14,
              lineHeight: 1.7,
              color: "#ababab",
              marginTop: 14,
              marginBottom: 38,
            }),
          ],
          { padding: [0, 24] },
        ),
      ],
      { maxWidth: 480, backgroundColor: "#ffffff" },
    ),
    { lang: locale },
  );

  return {
    subject: _(msg`Sign in to {{projectName}}`),
    html: render(email),
    text: render(email, { plainText: true }),
  };
}
