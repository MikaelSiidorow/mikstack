export { createStorage } from "./factory.ts";
export { createS3Client } from "./client.ts";
export type {
  StorageConfig,
  StorageInstance,
  S3Config,
  DatabaseConfig,
  DatabaseInstance,
  SchemaInstance,
  TableNames,
  FileMetadataRow,
  UploadOptions,
  PresignedUploadUrlOptions,
  PresignedGetUrlOptions,
} from "./types.ts";
export { StorageError } from "./internal/errors.ts";
