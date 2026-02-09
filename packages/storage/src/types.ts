import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";

// ── S3 Configuration ──

export interface S3Config {
  endpoint: string;
  bucket: string;
  accessKey: string;
  secretKey: string;
  region?: string;
  /** Base URL for publicly accessible files (e.g. CDN or R2 public URL). */
  publicUrl?: string;
  /** Force path-style URLs (required for MinIO and some S3-compatible providers). Defaults to true. */
  forcePathStyle?: boolean;
}

// ── Database Types ──

/**
 * Structural type for any Drizzle PostgreSQL database instance.
 * We Pick only the methods we use so the type doesn't carry TFullSchema,
 * which is invariant and prevents concrete db instances from being assignable.
 */
export type DatabaseInstance = Pick<
  PgDatabase<PgQueryResultHKT>,
  "select" | "insert" | "update" | "delete"
>;

/**
 * Schema is a record of Drizzle table objects — uses `unknown` values so concrete
 * table types are assignable.
 */
export type SchemaInstance = Record<string, unknown>;

export interface TableNames {
  fileMetadata?: string;
}

export interface ResolvedTableNames {
  fileMetadata: string;
}

// ── Storage Config ──

export interface DatabaseConfig {
  db: DatabaseInstance;
  schema: SchemaInstance;
  provider: "pg";
  tableNames?: TableNames;
}

export interface StorageConfig {
  s3: S3Config;
  database: DatabaseConfig;
}

// ── File Metadata Row ──

export interface FileMetadataRow {
  id: string;
  key: string;
  bucket: string;
  filename: string;
  mimeType: string;
  size: number;
  uploadedBy: string | null;
  createdAt: Date;
}

// ── Upload Options ──

export interface UploadOptions {
  /** S3 object key. If omitted, a UUID-prefixed key is generated from the filename. */
  key?: string;
  /** User ID to associate with the upload. */
  uploadedBy?: string;
  /** MIME type override. Falls back to the File's type or "application/octet-stream". */
  mimeType?: string;
}

export interface PresignedUploadUrlOptions {
  /** Expiry in seconds. Defaults to 3600 (1 hour). */
  expiresIn?: number;
  /** Maximum upload size in bytes. */
  maxSize?: number;
  /** MIME type constraint. */
  mimeType?: string;
}

export interface PresignedGetUrlOptions {
  /** Expiry in seconds. Defaults to 3600 (1 hour). */
  expiresIn?: number;
}

// ── Storage Instance ──

export interface StorageInstance {
  /**
   * Upload a file to S3 and record metadata in the database.
   * Returns the created metadata row.
   */
  createUpload(
    file: File | { name: string; type?: string; size: number; arrayBuffer(): Promise<ArrayBuffer> },
    opts?: UploadOptions,
  ): Promise<FileMetadataRow>;

  /**
   * Generate a presigned URL for client-side uploads.
   * Returns the URL and the key that will be used.
   */
  createPresignedUploadUrl(
    key: string,
    opts?: PresignedUploadUrlOptions,
  ): Promise<{ url: string; key: string }>;

  /**
   * Generate a presigned URL for downloading/viewing a private file.
   */
  getPresignedUrl(key: string, opts?: PresignedGetUrlOptions): Promise<string>;

  /**
   * Delete a file from S3 and remove its metadata row from the database.
   */
  deleteFile(key: string): Promise<void>;

  /**
   * Handle incoming HTTP requests for file uploads.
   * Mounts as a SvelteKit +server.ts handler.
   */
  handler(request: Request, userId: string | null): Promise<Response>;
}
