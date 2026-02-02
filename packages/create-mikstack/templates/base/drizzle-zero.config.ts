import { drizzleZeroConfig } from "drizzle-zero";
import * as schema from "./src/lib/server/db/schema";

export default drizzleZeroConfig(schema, {
  tables: {
    user: true,
    note: true,
    inAppNotification: true,
    // Exclude auth-internal and server-only tables from client sync
    session: false,
    account: false,
    verification: false,
    notificationDelivery: false,
    notificationPreference: false,
  },
  casing: "snake_case",
});
