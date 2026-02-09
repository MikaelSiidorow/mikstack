import { boolean, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

// better-auth tables (managed by better-auth, do not insert/update directly)
export const user = pgTable("user", {
  id: text().primaryKey(),
  name: text().notNull(),
  email: text().notNull().unique(),
  emailVerified: boolean().notNull().default(false),
  image: text(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text().primaryKey(),
  expiresAt: timestamp().notNull(),
  token: text().notNull().unique(),
  ipAddress: text(),
  userAgent: text(),
  userId: text()
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});

export const account = pgTable("account", {
  id: text().primaryKey(),
  accountId: text().notNull(),
  providerId: text().notNull(),
  userId: text()
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text(),
  refreshToken: text(),
  idToken: text(),
  accessTokenExpiresAt: timestamp(),
  refreshTokenExpiresAt: timestamp(),
  scope: text(),
  password: text(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text().primaryKey(),
  identifier: text().notNull(),
  value: text().notNull(),
  expiresAt: timestamp().notNull(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});

// Notification tables (managed by @mikstack/notifications)
export const notificationDelivery = pgTable("notification_delivery", {
  id: text()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text().references(() => user.id, { onDelete: "set null" }),
  type: text().notNull(),
  channel: text().notNull(),
  status: text({ enum: ["pending", "sent", "delivered", "failed"] })
    .notNull()
    .default("pending"),
  content: jsonb(),
  error: text(),
  retryOf: text(),
  retriesLeft: integer().notNull().default(0),
  recipientEmail: text(),
  externalId: text(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});

export const inAppNotification = pgTable("in_app_notification", {
  id: text()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text()
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  type: text().notNull(),
  title: text().notNull(),
  body: text(),
  url: text(),
  icon: text(),
  read: boolean().notNull().default(false),
  createdAt: timestamp().notNull().defaultNow(),
});

export const notificationPreference = pgTable("notification_preference", {
  id: text()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text()
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  notificationType: text().notNull(),
  channel: text().notNull(),
  enabled: boolean().notNull(),
  updatedAt: timestamp().notNull().defaultNow(),
});

// Storage tables (managed by @mikstack/storage)
export const fileMetadata = pgTable("file_metadata", {
  id: text()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  key: text().notNull(),
  bucket: text().notNull(),
  filename: text().notNull(),
  mimeType: text().notNull(),
  size: integer().notNull(),
  uploadedBy: text().references(() => user.id, { onDelete: "set null" }),
  createdAt: timestamp().notNull().defaultNow(),
});

// Application tables

export const note = pgTable("note", {
  id: text().primaryKey(),
  title: text().notNull(),
  content: text().notNull().default(""),
  userId: text()
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp().notNull(),
  updatedAt: timestamp().notNull(),
});

export const noteAttachment = pgTable("note_attachment", {
  id: text()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  noteId: text()
    .notNull()
    .references(() => note.id, { onDelete: "cascade" }),
  fileId: text()
    .notNull()
    .references(() => fileMetadata.id, { onDelete: "cascade" }),
  createdAt: timestamp().notNull().defaultNow(),
});
