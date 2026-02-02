export { createNotifications } from "./factory.ts";
export { defineNotification } from "./define.ts";
export { emailChannel } from "./channels/email.ts";
export { inAppChannel } from "./channels/in-app.ts";
export type {
  NotificationsConfig,
  NotificationsInstance,
  NotificationDefinition,
  ChannelPlugin,
  ChannelHandler,
  ChannelSendParams,
  ChannelSendResult,
  SendParams,
  InAppContent,
  EmailContent,
  DefaultPreferences,
  PreferenceUpdate,
} from "./types.ts";
