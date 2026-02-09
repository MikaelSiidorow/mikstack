import { eq } from "drizzle-orm";
import type {
  StorageConfig,
  StorageInstance,
  ResolvedTableNames,
  FileMetadataRow,
} from "./types.ts";
import { createS3Client } from "./client.ts";
import { getTable, col } from "./internal/table.ts";

const DEFAULT_TABLE_NAMES: ResolvedTableNames = {
  fileMetadata: "fileMetadata",
};

function generateKey(filename: string): string {
  const id = crypto.randomUUID();
  const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${id}/${sanitized}`;
}

export function createStorage(config: StorageConfig): StorageInstance {
  const { s3: s3Config, database } = config;
  const { db, schema } = database;
  const s3 = createS3Client(s3Config);

  const tableNames: ResolvedTableNames = {
    ...DEFAULT_TABLE_NAMES,
    ...database.tableNames,
  };

  const instance: StorageInstance = {
    async createUpload(file, opts) {
      // Validate table exists before making any S3 calls
      const table = getTable(schema, tableNames.fileMetadata, "fileMetadata");

      const key = opts?.key ?? generateKey(file.name);
      const mimeType =
        opts?.mimeType ?? ("type" in file ? file.type : undefined) ?? "application/octet-stream";
      const size = file.size;
      const buffer = await file.arrayBuffer();

      await s3.putObject(key, buffer, mimeType);

      const id = crypto.randomUUID();
      const now = new Date();

      const row: FileMetadataRow = {
        id,
        key,
        bucket: s3Config.bucket,
        filename: file.name,
        mimeType,
        size,
        uploadedBy: opts?.uploadedBy ?? null,
        createdAt: now,
      };

      await db.insert(table).values(row);

      return row;
    },

    async createPresignedUploadUrl(key, opts) {
      const url = await s3.getPresignedPutUrl(key, {
        expiresIn: opts?.expiresIn,
        mimeType: opts?.mimeType,
        maxSize: opts?.maxSize,
      });
      return { url, key };
    },

    async getPresignedUrl(key, opts) {
      const publicUrl = s3.getPublicUrl(key);
      if (publicUrl) return publicUrl;

      return s3.getPresignedGetUrl(key, { expiresIn: opts?.expiresIn });
    },

    async deleteFile(key) {
      const table = getTable(schema, tableNames.fileMetadata, "fileMetadata");

      // Delete from both S3 and database
      await s3.deleteObject(key);
      await db.delete(table).where(eq(col(table, "key"), key));
    },

    async handler(request, userId) {
      if (!userId) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }

      const url = new URL(request.url);
      const path = url.pathname.replace(/.*\/storage/, "").replace(/\/$/, "");

      if (path === "/upload" && request.method === "POST") {
        const formData = await request.formData();
        const file = formData.get("file");
        if (!file || !(file instanceof File)) {
          return Response.json({ error: "No file provided" }, { status: 400 });
        }

        const keyParam = formData.get("key");
        const metadata = await instance.createUpload(file, {
          key: typeof keyParam === "string" ? keyParam : undefined,
          uploadedBy: userId,
        });

        return Response.json({ file: metadata }, { status: 201 });
      }

      if (path === "/presign" && request.method === "POST") {
        const body = (await request.json()) as {
          key?: string;
          filename?: string;
          expiresIn?: number;
          mimeType?: string;
          maxSize?: number;
        };

        const key = body.key ?? (body.filename ? generateKey(body.filename) : null);
        if (!key) {
          return Response.json({ error: "Provide a key or filename" }, { status: 400 });
        }

        const result = await instance.createPresignedUploadUrl(key, {
          expiresIn: body.expiresIn,
          mimeType: body.mimeType,
          maxSize: body.maxSize,
        });

        return Response.json(result);
      }

      if (path === "/delete" && request.method === "POST") {
        const body = (await request.json()) as { key?: string };
        if (!body.key) {
          return Response.json({ error: "Provide a key" }, { status: 400 });
        }

        await instance.deleteFile(body.key);
        return Response.json({ ok: true });
      }

      return Response.json({ error: "Not found" }, { status: 404 });
    },
  };

  return instance;
}
