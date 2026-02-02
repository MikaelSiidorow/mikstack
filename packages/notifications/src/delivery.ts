import { eq } from "drizzle-orm";
import type {
  DatabaseInstance,
  SchemaInstance,
  ResolvedTableNames,
  ChannelHandler,
  ChannelSendParams,
} from "./types.ts";
import { getTable, col } from "./internal/table.ts";
import { DeliveryError } from "./internal/errors.ts";

interface DeliveryContext {
  db: DatabaseInstance;
  schema: SchemaInstance;
  tableNames: ResolvedTableNames;
}

interface DeliveryParams {
  userId: string | null;
  type: string;
  channel: string;
  content: ChannelSendParams["content"];
  recipientEmail?: string;
  retries: number;
  handler: ChannelHandler;
  backoffDelays?: number[];
}

const DEFAULT_BACKOFF_DELAYS = [1000, 5000, 15000, 30000, 60000];

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function deliver(ctx: DeliveryContext, params: DeliveryParams): Promise<void> {
  const table = getTable(ctx.schema, ctx.tableNames.notificationDelivery, "notificationDelivery");
  const maxAttempts = params.retries + 1;
  let previousDeliveryId: string | null = null;
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const deliveryId = crypto.randomUUID();
    const retriesLeft = maxAttempts - attempt - 1;

    // Insert delivery record as pending
    await ctx.db.insert(table).values({
      id: deliveryId,
      userId: params.userId,
      type: params.type,
      channel: params.channel,
      status: "pending",
      content: params.content,
      retryOf: previousDeliveryId,
      retriesLeft,
      recipientEmail: params.recipientEmail ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    try {
      const result = await params.handler.send({
        userId: params.userId,
        type: params.type,
        content: params.content,
        recipientEmail: params.recipientEmail,
      });

      // Success — update to sent
      await ctx.db
        .update(table)
        .set({
          status: "sent",
          externalId: result.externalId ?? null,
          updatedAt: new Date(),
        })
        .where(eq(col(table, "id"), deliveryId));

      return; // Done
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));

      // Update to failed with error message
      await ctx.db
        .update(table)
        .set({
          status: "failed",
          error: lastError.message,
          updatedAt: new Date(),
        })
        .where(eq(col(table, "id"), deliveryId));

      previousDeliveryId = deliveryId;

      // Wait before next retry (if there is one)
      if (attempt < maxAttempts - 1) {
        const delays = params.backoffDelays ?? DEFAULT_BACKOFF_DELAYS;
        const backoffMs = delays[Math.min(attempt, delays.length - 1)]!;
        await delay(backoffMs);
      }
    }
  }

  // All attempts exhausted
  throw new DeliveryError(
    previousDeliveryId!,
    `Delivery failed after ${maxAttempts} attempt(s) on channel "${params.channel}": ${lastError?.message}`,
    { cause: lastError },
  );
}
