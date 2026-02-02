import type { NotificationDefinition, NotificationChannels } from "./types.ts";

export function defineNotification<TKey extends string, TData>(def: {
  key: TKey;
  description?: string;
  critical?: boolean;
  channels: NotificationChannels<TData>;
}): NotificationDefinition<TKey, TData> {
  return def;
}
