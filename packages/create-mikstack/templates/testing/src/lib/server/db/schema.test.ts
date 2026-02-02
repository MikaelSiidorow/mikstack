import { pushSchema } from "drizzle-kit/api";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTestDatabase, stopTestDatabase, type TestDatabase } from "./test-utils";
import * as schema from "./schema";

describe("database schema", () => {
  let testDb: TestDatabase;

  beforeAll(async () => {
    testDb = await createTestDatabase();
  }, 60_000);

  afterAll(async () => {
    if (testDb) await stopTestDatabase(testDb);
  });

  it("pushes schema without data loss", async () => {
    const result = await pushSchema(schema, testDb.db as unknown as Parameters<typeof pushSchema>[1]);
    expect(result.warnings).toEqual([]);
    expect(result.hasDataLoss).toBe(false);
    await result.apply();

    const tables = await testDb.client`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    const tableNames = tables.map((row) => row.table_name as string);

    expect(tableNames).toContain("user");
    expect(tableNames).toContain("session");
    expect(tableNames).toContain("account");
    expect(tableNames).toContain("verification");
    expect(tableNames).toContain("note");
    expect(tableNames).toContain("notification_delivery");
    expect(tableNames).toContain("in_app_notification");
    expect(tableNames).toContain("notification_preference");
  });
});
