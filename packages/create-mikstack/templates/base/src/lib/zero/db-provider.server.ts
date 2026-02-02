import { zeroDrizzle } from "@rocicorp/zero/server/adapters/drizzle";
import { schema } from "./schema";
import { db } from "$lib/server/db";

export const dbProvider = zeroDrizzle(schema, db);

declare module "@rocicorp/zero" {
  interface DefaultTypes {
    dbProvider: typeof dbProvider;
  }
}
