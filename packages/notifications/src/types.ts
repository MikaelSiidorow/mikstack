import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";

// ── Channel Types ──

export interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

export interface InAppContent {
  title: string;
  body?: string;
  url?: string;
  icon?: string;
}

export interface ChannelSendParams {
  userId: string | null;
  type: string;
  content: EmailContent | InAppContent;
  recipientEmail?: string;
}

export interface ChannelSendResult {
  externalId?: string;
}

export interface ChannelHandler {
  send(params: ChannelSendParams): Promise<ChannelSendResult>;
}

export interface ChannelPlugin<TName extends string = string> {
  name: TName;
  retries: number;
  init(ctx: ChannelInitContext): ChannelHandler;
}

export interface ChannelInitContext {
  db: DatabaseInstance;
  schema: SchemaInstance;
  tableNames: ResolvedTableNames;
}

// ── Notification Definition Types ──

type ChannelContentFn<TData, TContent> = (data: TData) => TContent;

export interface NotificationChannels<TData> {
  email?: ChannelContentFn<TData, EmailContent>;
  "in-app"?: ChannelContentFn<TData, InAppContent>;
}

export interface NotificationDefinition<TKey extends string = string, TData = unknown> {
  key: TKey;
  description?: string;
  critical?: boolean;
  channels: NotificationChannels<TData>;
}

export type NotificationDefinitions = Record<string, NotificationDefinition<string, never>>;

// ── Send Params (infers data shape from definition) ──

export type SendParams<TDefs extends NotificationDefinitions> = {
  [K in keyof TDefs & string]: TDefs[K] extends NotificationDefinition<string, infer TData>
    ? TData extends Record<string, never>
      ? { type: K; userId?: string; recipientEmail?: string }
      : { type: K; userId?: string; data: TData; recipientEmail?: string }
    : never;
}[keyof TDefs & string];

// ── Database Types ──

// Structural type for any Drizzle PostgreSQL database instance.
// We Pick only the methods we use so the type doesn't carry TFullSchema,
// which is invariant and prevents concrete db instances from being assignable.
export type DatabaseInstance = Pick<PgDatabase<PgQueryResultHKT>, "select" | "insert" | "update">;

// Schema is a record of Drizzle table objects — uses `unknown` values so concrete
// table types are assignable (they lack the index signature PgTableWithColumns<TableConfig> requires).
// getTable() handles narrowing to the specific table type.
export type SchemaInstance = Record<string, unknown>;

export interface TableNames {
  notificationDelivery?: string;
  inAppNotification?: string;
  notificationPreference?: string;
}

export interface ResolvedTableNames {
  notificationDelivery: string;
  inAppNotification: string;
  notificationPreference: string;
}

// ── Config ──

export interface DefaultPreferences {
  enabledChannels: string[];
}

export interface DatabaseConfig {
  db: DatabaseInstance;
  schema: SchemaInstance;
  provider: "pg";
  tableNames?: TableNames;
}

export interface NotificationsConfig<
  TDefs extends NotificationDefinitions = NotificationDefinitions,
> {
  database: DatabaseConfig;
  channels: ChannelPlugin[];
  notifications: TDefs;
  defaultPreferences?: DefaultPreferences;
}

// ── Instance ──

export interface NotificationsInstance<
  TDefs extends NotificationDefinitions = NotificationDefinitions,
> {
  send(params: SendParams<TDefs>): Promise<void>;
  list(params: {
    userId: string;
    limit?: number;
    unreadOnly?: boolean;
  }): Promise<InAppNotificationRow[]>;
  markRead(params: { userId: string; notificationIds?: string[] }): Promise<void>;
  getPreferences(userId: string): Promise<PreferenceRow[]>;
  updatePreferences(userId: string, prefs: PreferenceUpdate[]): Promise<void>;
  handler(request: Request, userId: string | null): Promise<Response>;
  $Infer: {
    NotificationTypes: keyof TDefs & string;
  };
}

// ── Row types (returned from queries) ──

export interface InAppNotificationRow {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string | null;
  url: string | null;
  icon: string | null;
  read: boolean;
  createdAt: Date;
}

export interface PreferenceRow {
  id: string;
  userId: string;
  notificationType: string;
  channel: string;
  enabled: boolean;
  updatedAt: Date;
}

export interface PreferenceUpdate {
  notificationType: string;
  channel: string;
  enabled: boolean;
}

export interface DeliveryRow {
  id: string;
  userId: string | null;
  type: string;
  channel: string;
  status: "pending" | "sent" | "delivered" | "failed";
  content: unknown;
  error: string | null;
  retryOf: string | null;
  retriesLeft: number;
  recipientEmail: string | null;
  externalId: string | null;
  createdAt: Date;
  updatedAt: Date;
}
