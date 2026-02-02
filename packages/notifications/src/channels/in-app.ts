import type {
  ChannelPlugin,
  ChannelHandler,
  ChannelInitContext,
  ChannelSendParams,
  ChannelSendResult,
  InAppContent,
} from "../types.ts";
import { getTable } from "../internal/table.ts";

export function inAppChannel(): ChannelPlugin<"in-app"> {
  return {
    name: "in-app",
    retries: 0, // Local DB insert, no retries needed
    init(ctx: ChannelInitContext): ChannelHandler {
      const table = getTable(ctx.schema, ctx.tableNames.inAppNotification, "inAppNotification");

      return {
        async send(params: ChannelSendParams): Promise<ChannelSendResult> {
          if (!params.userId) {
            return {};
          }

          const content = params.content as InAppContent;
          const id = crypto.randomUUID();

          await ctx.db.insert(table).values({
            id,
            userId: params.userId,
            type: params.type,
            title: content.title,
            body: content.body ?? null,
            url: content.url ?? null,
            icon: content.icon ?? null,
            read: false,
            createdAt: new Date(),
          });

          return { externalId: id };
        },
      };
    },
  };
}
