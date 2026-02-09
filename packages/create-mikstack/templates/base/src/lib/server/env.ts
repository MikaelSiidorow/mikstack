import { env as privateEnv } from "$env/dynamic/private";
import * as v from "valibot";

const envSchema = v.object({
  DATABASE_URL: v.pipe(v.string(), v.minLength(1, "DATABASE_URL is required")),
  BETTER_AUTH_SECRET: v.pipe(v.string(), v.minLength(1, "BETTER_AUTH_SECRET is required")),
  BETTER_AUTH_URL: v.optional(v.string(), "http://localhost:5173"),
  S3_ENDPOINT: v.pipe(v.string(), v.minLength(1, "S3_ENDPOINT is required")),
  S3_BUCKET: v.pipe(v.string(), v.minLength(1, "S3_BUCKET is required")),
  S3_ACCESS_KEY: v.pipe(v.string(), v.minLength(1, "S3_ACCESS_KEY is required")),
  S3_SECRET_KEY: v.pipe(v.string(), v.minLength(1, "S3_SECRET_KEY is required")),
  S3_REGION: v.optional(v.string(), "us-east-1"),
  S3_PUBLIC_URL: v.optional(v.string()),
  SMTP_HOST: v.optional(v.string()),
  SMTP_PORT: v.optional(v.string()),
  SMTP_USER: v.optional(v.string()),
  SMTP_PASS: v.optional(v.string()),
  SMTP_FROM: v.optional(v.string()),
});

const parsed = v.safeParse(envSchema, {
  DATABASE_URL: privateEnv.DATABASE_URL,
  BETTER_AUTH_SECRET: privateEnv.BETTER_AUTH_SECRET,
  BETTER_AUTH_URL: privateEnv.BETTER_AUTH_URL || undefined,
  S3_ENDPOINT: privateEnv.S3_ENDPOINT,
  S3_BUCKET: privateEnv.S3_BUCKET,
  S3_ACCESS_KEY: privateEnv.S3_ACCESS_KEY,
  S3_SECRET_KEY: privateEnv.S3_SECRET_KEY,
  S3_REGION: privateEnv.S3_REGION || undefined,
  S3_PUBLIC_URL: privateEnv.S3_PUBLIC_URL || undefined,
  SMTP_HOST: privateEnv.SMTP_HOST || undefined,
  SMTP_PORT: privateEnv.SMTP_PORT || undefined,
  SMTP_USER: privateEnv.SMTP_USER || undefined,
  SMTP_PASS: privateEnv.SMTP_PASS || undefined,
  SMTP_FROM: privateEnv.SMTP_FROM || undefined,
});

if (!parsed.success) {
  console.error("Invalid environment variables:");
  console.error(JSON.stringify(v.flatten(parsed.issues), null, 2));
  throw new Error("Environment validation failed. Check the errors above.");
}

export const env = parsed.output;
