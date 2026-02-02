import { defineNotification } from "@mikstack/notifications";
import { magicLinkEmail } from "../emails/magic-link";

export const notifications = {
  "magic-link": defineNotification({
    key: "magic-link",
    critical: true, // Auth emails bypass user preferences
    channels: {
      email: (data: { url: string }) => magicLinkEmail(data.url),
    },
  }),
} as const;
