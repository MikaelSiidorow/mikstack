import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  type PutObjectCommandInput,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { S3Config } from "./types.ts";

export interface S3ClientInstance {
  putObject(key: string, body: ArrayBuffer | Uint8Array, mimeType: string): Promise<void>;
  deleteObject(key: string): Promise<void>;
  getPresignedPutUrl(
    key: string,
    opts?: { expiresIn?: number; mimeType?: string; maxSize?: number },
  ): Promise<string>;
  getPresignedGetUrl(key: string, opts?: { expiresIn?: number }): Promise<string>;
  getPublicUrl(key: string): string | null;
}

export function createS3Client(config: S3Config): S3ClientInstance {
  const client = new S3Client({
    endpoint: config.endpoint,
    region: config.region ?? "auto",
    credentials: {
      accessKeyId: config.accessKey,
      secretAccessKey: config.secretKey,
    },
    forcePathStyle: config.forcePathStyle ?? true,
  });

  const bucket = config.bucket;

  return {
    async putObject(key, body, mimeType) {
      const input: PutObjectCommandInput = {
        Bucket: bucket,
        Key: key,
        Body: body instanceof ArrayBuffer ? new Uint8Array(body) : body,
        ContentType: mimeType,
      };
      await client.send(new PutObjectCommand(input));
    },

    async deleteObject(key) {
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    },

    async getPresignedPutUrl(key, opts) {
      const input: PutObjectCommandInput = {
        Bucket: bucket,
        Key: key,
      };
      if (opts?.mimeType) {
        input.ContentType = opts.mimeType;
      }
      if (opts?.maxSize) {
        input.ContentLength = opts.maxSize;
      }
      const url = await getSignedUrl(client, new PutObjectCommand(input), {
        expiresIn: opts?.expiresIn ?? 3600,
      });
      return url;
    },

    async getPresignedGetUrl(key, opts) {
      const url = await getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key: key }), {
        expiresIn: opts?.expiresIn ?? 3600,
      });
      return url;
    },

    getPublicUrl(key) {
      if (!config.publicUrl) return null;
      const base = config.publicUrl.replace(/\/$/, "");
      return `${base}/${key}`;
    },
  };
}
