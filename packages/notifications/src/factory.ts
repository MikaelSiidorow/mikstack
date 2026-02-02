import { eq, desc, and } from "drizzle-orm";
import type {
  NotificationsConfig,
  NotificationsInstance,
  NotificationDefinitions,
  SendParams,
  ResolvedTableNames,
  ChannelHandler,
  DefaultPreferences,
  InAppNotificationRow,
  PreferenceUpdate,
} from "./types.ts";
import { deliver } from "./delivery.ts";
import { getPreferences, updatePreferences, resolveChannelEnabled } from "./preferences.ts";
import { getTable, col } from "./internal/table.ts";
import { NotificationError } from "./internal/errors.ts";

const DEFAULT_TABLE_NAMES: ResolvedTableNames = {
  notificationDelivery: "notificationDelivery",
  inAppNotification: "inAppNotification",
  notificationPreference: "notificationPreference",
};

const DEFAULT_PREFERENCES: DefaultPreferences = {
  enabledChannels: ["email", "in-app"],
};

export function createNotifications<TDefs extends NotificationDefinitions>(
  config: NotificationsConfig<TDefs>,
): NotificationsInstance<TDefs> {
  const { database, channels, notifications } = config;
  const { db, schema } = database;
  const defaults = config.defaultPreferences ?? DEFAULT_PREFERENCES;

  const tableNames: ResolvedTableNames = {
    ...DEFAULT_TABLE_NAMES,
    ...database.tableNames,
  };

  // Initialize channel handlers lazily
  const handlers = new Map<string, ChannelHandler>();
  const channelRetries = new Map<string, number>();

  function getHandler(channelName: string): ChannelHandler {
    let handler = handlers.get(channelName);
    if (!handler) {
      const plugin = channels.find((c) => c.name === channelName);
      if (!plugin) {
        throw new NotificationError(
          `Channel "${channelName}" is not registered. ` +
            `Available channels: ${channels.map((c) => c.name).join(", ")}`,
        );
      }
      handler = plugin.init({ db, schema, tableNames });
      handlers.set(channelName, handler);
      channelRetries.set(channelName, plugin.retries);
    }
    return handler;
  }

  const instance: NotificationsInstance<TDefs> = {
    async send(params: SendParams<TDefs>): Promise<void> {
      const def = notifications[params.type];
      if (!def) {
        throw new NotificationError(`Notification type "${params.type}" is not defined.`);
      }

      // Resolve user preferences (unless critical or no userId)
      let userPrefs: Awaited<ReturnType<typeof getPreferences>> = [];
      if (!def.critical && params.userId) {
        userPrefs = await getPreferences({ db, schema, tableNames, defaults }, params.userId);
      }

      const data = "data" in params ? params.data : {};
      const errors: Error[] = [];

      // For each channel defined on this notification
      for (const [channelName, contentFn] of Object.entries(def.channels)) {
        if (!contentFn) continue;

        // Check preferences (critical bypasses)
        if (
          !def.critical &&
          !resolveChannelEnabled(userPrefs, defaults, params.type, channelName)
        ) {
          continue;
        }

        const handler = getHandler(channelName);
        const retries = channelRetries.get(channelName) ?? 0;
        const content = (contentFn as (data: unknown) => unknown)(data);

        try {
          await deliver(
            { db, schema, tableNames },
            {
              userId: params.userId ?? null,
              type: params.type,
              channel: channelName,
              content: content as any,
              recipientEmail: params.recipientEmail,
              retries,
              handler,
            },
          );
        } catch (err) {
          errors.push(err instanceof Error ? err : new Error(String(err)));
        }
      }

      if (errors.length > 0) {
        throw new NotificationError(
          `Failed to deliver notification "${params.type}" on ${errors.length} channel(s)`,
          { cause: errors.length === 1 ? errors[0] : errors },
        );
      }
    },

    async list({ userId, limit = 50, unreadOnly = false }) {
      const table = getTable(schema, tableNames.inAppNotification, "inAppNotification");

      const conditions = [eq(col(table, "userId"), userId)];
      if (unreadOnly) {
        conditions.push(eq(col(table, "read"), false));
      }

      let query = db.select().from(table).$dynamic();

      if (conditions.length === 1) {
        query = query.where(conditions[0]);
      } else {
        query = query.where(and(...conditions));
      }

      return query.orderBy(desc(col(table, "createdAt"))).limit(limit) as unknown as Promise<
        InAppNotificationRow[]
      >;
    },

    async markRead({ userId, notificationIds }) {
      const table = getTable(schema, tableNames.inAppNotification, "inAppNotification");

      if (notificationIds && notificationIds.length > 0) {
        for (const id of notificationIds) {
          await db
            .update(table)
            .set({ read: true })
            .where(and(eq(col(table, "id"), id), eq(col(table, "userId"), userId)));
        }
      } else {
        await db
          .update(table)
          .set({ read: true })
          .where(and(eq(col(table, "userId"), userId), eq(col(table, "read"), false)));
      }
    },

    async getPreferences(userId: string) {
      return getPreferences({ db, schema, tableNames, defaults }, userId);
    },

    async updatePreferences(userId: string, prefs: PreferenceUpdate[]) {
      return updatePreferences({ db, schema, tableNames, defaults }, userId, prefs);
    },

    async handler(request: Request, userId: string | null) {
      if (!userId) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }

      const url = new URL(request.url);
      const path = url.pathname.replace(/.*\/notifications/, "").replace(/\/$/, "");

      if (path === "/mark-read" && request.method === "POST") {
        const body = (await request.json()) as {
          all?: boolean;
          notificationIds?: string[];
        };
        if (body.all) {
          await instance.markRead({ userId });
        } else if (Array.isArray(body.notificationIds)) {
          await instance.markRead({ userId, notificationIds: body.notificationIds });
        } else {
          return Response.json(
            { error: "Provide notificationIds array or { all: true }" },
            { status: 400 },
          );
        }
        return Response.json({ ok: true });
      }

      if (path === "/preferences" && request.method === "GET") {
        const preferences = await instance.getPreferences(userId);
        return Response.json({ preferences });
      }

      if (path === "/preferences" && request.method === "PUT") {
        const body = (await request.json()) as {
          preferences?: PreferenceUpdate[];
        };
        if (!Array.isArray(body.preferences)) {
          return Response.json({ error: "Provide a preferences array" }, { status: 400 });
        }
        await instance.updatePreferences(userId, body.preferences);
        return Response.json({ ok: true });
      }

      return Response.json({ error: "Not found" }, { status: 404 });
    },

    $Infer: {} as NotificationsInstance<TDefs>["$Infer"],
  };

  return instance;
}
