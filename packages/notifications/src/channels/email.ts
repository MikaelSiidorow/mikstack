import type {
  ChannelPlugin,
  ChannelHandler,
  ChannelSendParams,
  ChannelSendResult,
  EmailContent,
} from "../types.ts";

export interface EmailChannelConfig {
  sendEmail: (params: {
    to: string;
    subject: string;
    html: string;
    text: string;
  }) => Promise<void | { externalId?: string }>;
  retries?: number;
}

export function emailChannel(config: EmailChannelConfig): ChannelPlugin<"email"> {
  return {
    name: "email",
    retries: config.retries ?? 3,
    init(): ChannelHandler {
      return {
        async send(params: ChannelSendParams): Promise<ChannelSendResult> {
          const content = params.content as EmailContent;
          if (!params.recipientEmail) {
            throw new Error(
              "recipientEmail is required for email channel. " +
                "Pass it in send() or ensure it's set on the user.",
            );
          }
          const result = await config.sendEmail({
            to: params.recipientEmail,
            subject: content.subject,
            html: content.html,
            text: content.text,
          });
          return { externalId: result?.externalId };
        },
      };
    },
  };
}
