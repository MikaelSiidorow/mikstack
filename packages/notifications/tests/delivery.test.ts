import { describe, test, expect, mock } from "bun:test";
import { deliver } from "../src/delivery.ts";
import type { DatabaseInstance, SchemaInstance } from "../src/types.ts";

// Mock table with column-like objects
function createMockTable() {
  const col = (name: string) => ({ name, mapFromDriverValue: (v: any) => v });
  return {
    id: col("id"),
    userId: col("user_id"),
    type: col("type"),
    channel: col("channel"),
    status: col("status"),
    content: col("content"),
    error: col("error"),
    retryOf: col("retry_of"),
    retriesLeft: col("retries_left"),
    recipientEmail: col("recipient_email"),
    externalId: col("external_id"),
    createdAt: col("created_at"),
    updatedAt: col("updated_at"),
  };
}

function createMockDb() {
  const insertedRows: any[] = [];

  const whereObj = {
    where: mock((_cond: any) => Promise.resolve()),
  };

  const setObj = {
    set: mock((_values: any) => whereObj),
  };

  const db = {
    select: mock(() => ({ from: mock(() => ({ where: mock(() => []) })) })),
    insert: mock((_table: any) => ({
      values: mock((values: any) => {
        insertedRows.push(values);
        return Promise.resolve();
      }),
    })),
    update: mock((_table: any) => setObj),
  };

  return { db: db as unknown as DatabaseInstance, insertedRows, setObj, whereObj };
}

const tableNames = {
  notificationDelivery: "notificationDelivery",
  inAppNotification: "inAppNotification",
  notificationPreference: "notificationPreference",
};

describe("deliver", () => {
  test("succeeds on first attempt", async () => {
    const mockTable = createMockTable();
    const schema = { notificationDelivery: mockTable } as unknown as SchemaInstance;
    const { db, insertedRows } = createMockDb();

    const sendFn = mock(async () => ({ externalId: "ext-123" }));

    await deliver(
      { db, schema, tableNames },
      {
        userId: "user-1",
        type: "welcome",
        channel: "email",
        content: { subject: "Hi", html: "<p>Hi</p>", text: "Hi" },
        retries: 0,
        handler: { send: sendFn },
      },
    );

    // Should have inserted one delivery row
    expect(insertedRows).toHaveLength(1);
    expect(insertedRows[0].status).toBe("pending");
    expect(insertedRows[0].retriesLeft).toBe(0);
    expect(insertedRows[0].retryOf).toBeNull();

    // Handler should have been called once
    expect(sendFn).toHaveBeenCalledTimes(1);

    // Should have updated status to sent
    expect(db.update).toHaveBeenCalled();
  });

  test("retries on failure and succeeds", async () => {
    const mockTable = createMockTable();
    const schema = { notificationDelivery: mockTable } as unknown as SchemaInstance;
    const { db, insertedRows } = createMockDb();

    let callCount = 0;
    const sendFn = mock(async () => {
      callCount++;
      if (callCount === 1) throw new Error("Temporary failure");
      return {};
    });

    await deliver(
      { db, schema, tableNames },
      {
        userId: "user-1",
        type: "welcome",
        channel: "email",
        content: { subject: "Hi", html: "<p>Hi</p>", text: "Hi" },
        retries: 1,
        handler: { send: sendFn },
        backoffDelays: [0],
      },
    );

    // Should have inserted two delivery rows (initial + retry)
    expect(insertedRows).toHaveLength(2);
    expect(insertedRows[0].retriesLeft).toBe(1);
    expect(insertedRows[0].retryOf).toBeNull();
    expect(insertedRows[1].retriesLeft).toBe(0);
    // Second row should reference the first
    expect(insertedRows[1].retryOf).toBe(insertedRows[0].id);

    expect(sendFn).toHaveBeenCalledTimes(2);
  });

  test("throws DeliveryError after all retries exhausted", async () => {
    const mockTable = createMockTable();
    const schema = { notificationDelivery: mockTable } as unknown as SchemaInstance;
    const { db, insertedRows } = createMockDb();

    const sendFn = mock(async () => {
      throw new Error("Persistent failure");
    });

    try {
      await deliver(
        { db, schema, tableNames },
        {
          userId: "user-1",
          type: "welcome",
          channel: "email",
          content: { subject: "Hi", html: "<p>Hi</p>", text: "Hi" },
          retries: 0,
          handler: { send: sendFn },
        },
      );
      expect.unreachable("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(Error);
      expect((err as Error).message).toContain("Delivery failed after 1 attempt(s)");
    }

    expect(insertedRows).toHaveLength(1);
    expect(sendFn).toHaveBeenCalledTimes(1);
  });

  test("creates correct retryOf chain with multiple retries", async () => {
    const mockTable = createMockTable();
    const schema = { notificationDelivery: mockTable } as unknown as SchemaInstance;
    const { db, insertedRows } = createMockDb();

    const sendFn = mock(async () => {
      throw new Error("Always fails");
    });

    try {
      await deliver(
        { db, schema, tableNames },
        {
          userId: "user-1",
          type: "welcome",
          channel: "email",
          content: { subject: "Hi", html: "<p>Hi</p>", text: "Hi" },
          retries: 2,
          handler: { send: sendFn },
          backoffDelays: [0],
        },
      );
      expect.unreachable("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(Error);
      expect((err as Error).message).toContain("Delivery failed after 3 attempt(s)");
    }

    expect(insertedRows).toHaveLength(3);
    // First attempt: no retryOf
    expect(insertedRows[0].retryOf).toBeNull();
    expect(insertedRows[0].retriesLeft).toBe(2);
    // Second attempt: retryOf points to first
    expect(insertedRows[1].retryOf).toBe(insertedRows[0].id);
    expect(insertedRows[1].retriesLeft).toBe(1);
    // Third attempt: retryOf points to second
    expect(insertedRows[2].retryOf).toBe(insertedRows[1].id);
    expect(insertedRows[2].retriesLeft).toBe(0);
  });
});
