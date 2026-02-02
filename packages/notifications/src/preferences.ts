import { eq, and } from "drizzle-orm";
import type {
  DatabaseInstance,
  SchemaInstance,
  ResolvedTableNames,
  DefaultPreferences,
  PreferenceRow,
  PreferenceUpdate,
} from "./types.ts";
import { getTable, col } from "./internal/table.ts";

interface PreferenceContext {
  db: DatabaseInstance;
  schema: SchemaInstance;
  tableNames: ResolvedTableNames;
  defaults: DefaultPreferences;
}

export async function getPreferences(
  ctx: PreferenceContext,
  userId: string,
): Promise<PreferenceRow[]> {
  const table = getTable(
    ctx.schema,
    ctx.tableNames.notificationPreference,
    "notificationPreference",
  );
  return ctx.db
    .select()
    .from(table)
    .where(eq(col(table, "userId"), userId)) as unknown as Promise<PreferenceRow[]>;
}

export async function updatePreferences(
  ctx: PreferenceContext,
  userId: string,
  prefs: PreferenceUpdate[],
): Promise<void> {
  const table = getTable(
    ctx.schema,
    ctx.tableNames.notificationPreference,
    "notificationPreference",
  );

  for (const pref of prefs) {
    const existing = (await ctx.db
      .select({ id: col(table, "id") })
      .from(table)
      .where(
        and(
          eq(col(table, "userId"), userId),
          eq(col(table, "notificationType"), pref.notificationType),
          eq(col(table, "channel"), pref.channel),
        ),
      )
      .limit(1)) as unknown as { id: string }[];

    if (existing.length > 0) {
      await ctx.db
        .update(table)
        .set({ enabled: pref.enabled, updatedAt: new Date() })
        .where(eq(col(table, "id"), existing[0]!.id));
    } else {
      await ctx.db.insert(table).values({
        id: crypto.randomUUID(),
        userId,
        notificationType: pref.notificationType,
        channel: pref.channel,
        enabled: pref.enabled,
        updatedAt: new Date(),
      });
    }
  }
}

/**
 * Resolve whether a channel is enabled for a given notification type and user.
 *
 * Hierarchy (most specific wins):
 * 1. Per-user + per-type + per-channel
 * 2. Per-user + per-type + all-channels ("*")
 * 3. Per-user + all-types ("*") + per-channel
 * 4. System defaults from config
 */
export function resolveChannelEnabled(
  preferences: PreferenceRow[],
  defaults: DefaultPreferences,
  notificationType: string,
  channel: string,
): boolean {
  // 1. Exact match: type + channel
  const exact = preferences.find(
    (p) => p.notificationType === notificationType && p.channel === channel,
  );
  if (exact) return exact.enabled;

  // 2. Type + all channels
  const typeWild = preferences.find(
    (p) => p.notificationType === notificationType && p.channel === "*",
  );
  if (typeWild) return typeWild.enabled;

  // 3. All types + channel
  const channelWild = preferences.find((p) => p.notificationType === "*" && p.channel === channel);
  if (channelWild) return channelWild.enabled;

  // 4. System defaults
  return defaults.enabledChannels.includes(channel);
}
