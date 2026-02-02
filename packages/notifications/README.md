# @mikstack/notifications

Code-first notification infrastructure for mikstack projects. Factory function, plugin-based channels, Drizzle table mapping, type-safe notification definitions.

## Install

```sh
bun add @mikstack/notifications
```

Peer dependency: `drizzle-orm` (>=0.38.0)

## Quick Start

### 1. Define your schema (copy to your `schema.ts`)

```ts
export const notificationDelivery = pgTable("notification_delivery", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => user.id),
  type: text("type").notNull(),
  channel: text("channel").notNull(),
  status: text("status", { enum: ["pending", "sent", "delivered", "failed"] }).notNull().default("pending"),
  content: jsonb("content"),
  error: text("error"),
  retryOf: text("retry_of"),
  retriesLeft: integer("retries_left").notNull().default(0),
  recipientEmail: text("recipient_email"),
  externalId: text("external_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const inAppNotification = pgTable("in_app_notification", { ... });
export const notificationPreference = pgTable("notification_preference", { ... });
```

### 2. Define notifications

```ts
import { defineNotification } from "@mikstack/notifications";

export const notifications = {
  "magic-link": defineNotification({
    key: "magic-link",
    critical: true,
    channels: {
      email: (data: { url: string }) => magicLinkEmail(data.url),
    },
  }),
  "welcome": defineNotification({
    key: "welcome",
    channels: {
      "in-app": (data: { userName: string }) => ({
        title: `Welcome, ${data.userName}!`,
        body: "Get started by creating your first note.",
      }),
    },
  }),
} as const;
```

### 3. Create instance

```ts
import { createNotifications, emailChannel, inAppChannel } from "@mikstack/notifications";

const notif = createNotifications({
  database: { db, schema, provider: "pg" },
  channels: [
    emailChannel({
      sendEmail: async ({ to, subject, html, text }) => { /* your SMTP logic */ },
    }),
    inAppChannel(),
  ],
  notifications,
});
```

### 4. Send notifications

```ts
await notif.send({
  type: "welcome",
  userId: user.id,
  data: { userName: user.name },
});
```

## API

| Method | Purpose |
|---|---|
| `notif.send({ type, userId, data })` | Send notification across channels |
| `notif.list({ userId, limit?, unreadOnly? })` | List in-app notifications |
| `notif.markRead({ userId, notificationIds? })` | Mark as read |
| `notif.getPreferences(userId)` | Get user preferences |
| `notif.updatePreferences(userId, prefs)` | Update preferences |

## Client SDK

```ts
import { createNotificationClient } from "@mikstack/notifications/client";

const client = createNotificationClient({ baseUrl: "/api/notifications" });
await client.markRead(["notif-id-1"]);
await client.markAllRead();
const prefs = await client.getPreferences();
await client.updatePreferences({ "welcome": { "in-app": false } });
```

## Features

- **Type-safe**: `send()` autocompletes notification types and infers data shapes
- **Email retries**: Exponential backoff (default 3 attempts), each attempt tracked as its own delivery row
- **Preference hierarchy**: Per-type + per-channel > per-type + wildcard > wildcard + per-channel > defaults
- **Critical notifications**: `critical: true` bypasses user preferences (e.g., auth emails)
- **In-app via Zero**: `inAppNotification` table syncs to clients via Zero
- **Schema ownership**: Tables are copy-pasted into your project (like better-auth), fully customizable
