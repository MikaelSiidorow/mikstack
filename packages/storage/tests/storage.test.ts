import { describe, test, expect, mock } from "bun:test";
import { createStorage } from "../src/factory.ts";
import type { DatabaseInstance, SchemaInstance } from "../src/types.ts";
import { createS3Client } from "../src/client.ts";

// ── Mock Database ──

function createMockTable() {
  const col = (name: string) => ({ name, mapFromDriverValue: (v: any) => v });
  return {
    id: col("id"),
    key: col("key"),
    bucket: col("bucket"),
    filename: col("filename"),
    mimeType: col("mime_type"),
    size: col("size"),
    uploadedBy: col("uploaded_by"),
    createdAt: col("created_at"),
  };
}

function createMockDb() {
  const insertedRows: any[] = [];

  const deleteWhereObj = {
    where: mock((_cond: any) => Promise.resolve()),
  };

  const db = {
    select: mock(() => ({
      from: mock(() => ({
        where: mock(() => []),
      })),
    })),
    insert: mock((_table: any) => ({
      values: mock((values: any) => {
        insertedRows.push(values);
        return Promise.resolve();
      }),
    })),
    update: mock((_table: any) => ({
      set: mock((_values: any) => ({
        where: mock((_cond: any) => Promise.resolve()),
      })),
    })),
    delete: mock((_table: any) => deleteWhereObj),
  };

  return { db: db as unknown as DatabaseInstance, insertedRows };
}

// ── S3 Client Tests ──

describe("S3 client", () => {
  test("createS3Client returns correct interface", () => {
    const client = createS3Client({
      endpoint: "http://localhost:9000",
      bucket: "test",
      accessKey: "key",
      secretKey: "secret",
      region: "us-east-1",
    });

    expect(typeof client.putObject).toBe("function");
    expect(typeof client.deleteObject).toBe("function");
    expect(typeof client.getPresignedPutUrl).toBe("function");
    expect(typeof client.getPresignedGetUrl).toBe("function");
    expect(typeof client.getPublicUrl).toBe("function");
  });

  test("getPublicUrl returns null when publicUrl not configured", () => {
    const client = createS3Client({
      endpoint: "http://localhost:9000",
      bucket: "test",
      accessKey: "key",
      secretKey: "secret",
    });

    expect(client.getPublicUrl("some/key.txt")).toBeNull();
  });

  test("getPublicUrl returns correct URL when publicUrl configured", () => {
    const client = createS3Client({
      endpoint: "http://localhost:9000",
      bucket: "test",
      accessKey: "key",
      secretKey: "secret",
      publicUrl: "https://cdn.example.com/files",
    });

    expect(client.getPublicUrl("some/key.txt")).toBe("https://cdn.example.com/files/some/key.txt");
  });

  test("getPublicUrl strips trailing slash from publicUrl", () => {
    const client = createS3Client({
      endpoint: "http://localhost:9000",
      bucket: "test",
      accessKey: "key",
      secretKey: "secret",
      publicUrl: "https://cdn.example.com/files/",
    });

    expect(client.getPublicUrl("some/key.txt")).toBe("https://cdn.example.com/files/some/key.txt");
  });
});

// ── Handler Tests ──

describe("handler", () => {
  test("returns 401 when userId is null", async () => {
    const { db } = createMockDb();
    const schema = { fileMetadata: createMockTable() } as unknown as SchemaInstance;

    const storage = createStorage({
      s3: {
        endpoint: "http://localhost:9000",
        bucket: "test",
        accessKey: "key",
        secretKey: "secret",
      },
      database: { db, schema, provider: "pg" },
    });

    const request = new Request("http://localhost/api/storage/upload", {
      method: "POST",
    });
    const response = await storage.handler(request, null);
    expect(response.status).toBe(401);

    const body = (await response.json()) as { error: string };
    expect(body.error).toBe("Unauthorized");
  });

  test("returns 404 for unknown routes", async () => {
    const { db } = createMockDb();
    const schema = { fileMetadata: createMockTable() } as unknown as SchemaInstance;

    const storage = createStorage({
      s3: {
        endpoint: "http://localhost:9000",
        bucket: "test",
        accessKey: "key",
        secretKey: "secret",
      },
      database: { db, schema, provider: "pg" },
    });

    const request = new Request("http://localhost/api/storage/unknown", {
      method: "GET",
    });
    const response = await storage.handler(request, "user-1");
    expect(response.status).toBe(404);
  });

  test("returns 400 when no file in upload request", async () => {
    const { db } = createMockDb();
    const schema = { fileMetadata: createMockTable() } as unknown as SchemaInstance;

    const storage = createStorage({
      s3: {
        endpoint: "http://localhost:9000",
        bucket: "test",
        accessKey: "key",
        secretKey: "secret",
      },
      database: { db, schema, provider: "pg" },
    });

    const formData = new FormData();
    const request = new Request("http://localhost/api/storage/upload", {
      method: "POST",
      body: formData,
    });
    const response = await storage.handler(request, "user-1");
    expect(response.status).toBe(400);

    const body = (await response.json()) as { error: string };
    expect(body.error).toBe("No file provided");
  });

  test("returns 400 when presign request missing key and filename", async () => {
    const { db } = createMockDb();
    const schema = { fileMetadata: createMockTable() } as unknown as SchemaInstance;

    const storage = createStorage({
      s3: {
        endpoint: "http://localhost:9000",
        bucket: "test",
        accessKey: "key",
        secretKey: "secret",
      },
      database: { db, schema, provider: "pg" },
    });

    const request = new Request("http://localhost/api/storage/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const response = await storage.handler(request, "user-1");
    expect(response.status).toBe(400);

    const body = (await response.json()) as { error: string };
    expect(body.error).toBe("Provide a key or filename");
  });

  test("returns 400 when delete request missing key", async () => {
    const { db } = createMockDb();
    const schema = { fileMetadata: createMockTable() } as unknown as SchemaInstance;

    const storage = createStorage({
      s3: {
        endpoint: "http://localhost:9000",
        bucket: "test",
        accessKey: "key",
        secretKey: "secret",
      },
      database: { db, schema, provider: "pg" },
    });

    const request = new Request("http://localhost/api/storage/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const response = await storage.handler(request, "user-1");
    expect(response.status).toBe(400);

    const body = (await response.json()) as { error: string };
    expect(body.error).toBe("Provide a key");
  });
});

// ── Factory Tests ──

describe("factory", () => {
  test("throws when fileMetadata table not in schema", () => {
    const { db } = createMockDb();
    const schema = {} as unknown as SchemaInstance;

    const storage = createStorage({
      s3: {
        endpoint: "http://localhost:9000",
        bucket: "test",
        accessKey: "key",
        secretKey: "secret",
      },
      database: { db, schema, provider: "pg" },
    });

    const file = new File([new TextEncoder().encode("test")], "test.txt", {
      type: "text/plain",
    });

    expect(storage.createUpload(file)).rejects.toThrow('Table "fileMetadata" not found in schema');
  });

  test("uses custom table name when configured", () => {
    const { db } = createMockDb();
    const mockTable = createMockTable();
    const schema = { customFiles: mockTable } as unknown as SchemaInstance;

    const storage = createStorage({
      s3: {
        endpoint: "http://localhost:9000",
        bucket: "test",
        accessKey: "key",
        secretKey: "secret",
      },
      database: {
        db,
        schema,
        provider: "pg",
        tableNames: { fileMetadata: "customFiles" },
      },
    });

    const file = new File([new TextEncoder().encode("test")], "test.txt", {
      type: "text/plain",
    });

    // It will fail on S3 (no real server) but not on table lookup
    expect(storage.createUpload(file)).rejects.not.toThrow(
      'Table "fileMetadata" not found in schema',
    );
  });
});

// ── StorageError Tests ──

describe("StorageError", () => {
  test("is exported and constructable", async () => {
    const { StorageError } = await import("../src/internal/errors.ts");
    const err = new StorageError("test error");
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe("StorageError");
    expect(err.message).toBe("test error");
  });

  test("supports cause option", async () => {
    const { StorageError } = await import("../src/internal/errors.ts");
    const cause = new Error("root cause");
    const err = new StorageError("wrapper", { cause });
    expect(err.cause).toBe(cause);
  });
});
