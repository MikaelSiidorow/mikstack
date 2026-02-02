import { createNotifications, emailChannel, inAppChannel } from "@mikstack/notifications";
import { building } from "$app/environment";
import { db } from "./db";
import * as schema from "./db/schema";
import { sendEmail } from "./emails/send";
import { notifications } from "./notifications/definitions";

type Notif = ReturnType<typeof createNotif>;

function createNotif() {
  return createNotifications({
    database: { db, schema, provider: "pg" },
    channels: [
      emailChannel({
        sendEmail: async ({ to, subject, html, text }) => {
          await sendEmail(to, { subject, html, text });
        },
      }),
      inAppChannel(),
    ],
    notifications,
    defaultPreferences: { enabledChannels: ["email", "in-app"] },
  });
}

let _notif: Notif | undefined;

export const notif: Notif = new Proxy({} as Notif, {
  get(_, prop) {
    if (building) {
      throw new Error("Cannot access notif during build");
    }
    if (!_notif) {
      _notif = createNotif();
    }
    return (_notif as unknown as Record<string | symbol, unknown>)[prop];
  },
});
