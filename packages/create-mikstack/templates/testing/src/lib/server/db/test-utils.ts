import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import type { DrizzleDB } from "./index";

export type TestDatabase = {
  container: StartedPostgreSqlContainer;
  client: ReturnType<typeof postgres>;
  db: DrizzleDB;
};

export async function createTestDatabase(): Promise<TestDatabase> {
  const container = await new PostgreSqlContainer("postgres:17-alpine").start();
  const connectionUri = container.getConnectionUri();
  const client = postgres(connectionUri);
  const db = drizzle(client, { schema, casing: "snake_case" });

  return { container, client, db };
}

export async function stopTestDatabase(testDb: TestDatabase): Promise<void> {
  await testDb.client.end();
  await testDb.container.stop();
}
