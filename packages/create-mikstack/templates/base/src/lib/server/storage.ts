import { createStorage } from "@mikstack/storage";
import { building } from "$app/environment";
import { db } from "./db";
import * as schema from "./db/schema";
import { env } from "./env";

type Storage = ReturnType<typeof initStorage>;

function initStorage() {
  return createStorage({
    s3: {
      endpoint: env.S3_ENDPOINT,
      bucket: env.S3_BUCKET,
      accessKey: env.S3_ACCESS_KEY,
      secretKey: env.S3_SECRET_KEY,
      region: env.S3_REGION,
      publicUrl: env.S3_PUBLIC_URL,
    },
    database: { db, schema, provider: "pg" },
  });
}

let _storage: Storage | undefined;

export const storage: Storage = new Proxy({} as Storage, {
  get(_, prop) {
    if (building) {
      throw new Error("Cannot access storage during build");
    }
    if (!_storage) {
      _storage = initStorage();
    }
    return (_storage as unknown as Record<string | symbol, unknown>)[prop];
  },
});
