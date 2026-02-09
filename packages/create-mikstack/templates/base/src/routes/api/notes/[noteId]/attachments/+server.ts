import { json, error } from "@sveltejs/kit";
import { eq, and } from "drizzle-orm";
import { storage } from "$lib/server/storage";
import { db } from "$lib/server/db";
import * as schema from "$lib/server/db/schema";
import type { RequestHandler } from "./$types";

/** GET /api/notes/:noteId/attachments — list attachments with download URLs */
export const GET: RequestHandler = async ({ params, locals }) => {
  if (!locals.user) return error(401, "Unauthorized");

  const note = await db
    .select()
    .from(schema.note)
    .where(and(eq(schema.note.id, params.noteId), eq(schema.note.userId, locals.user.id)))
    .then((rows) => rows[0]);

  if (!note) return error(404, "Note not found");

  const attachments = await db
    .select({
      id: schema.noteAttachment.id,
      fileId: schema.noteAttachment.fileId,
      filename: schema.fileMetadata.filename,
      mimeType: schema.fileMetadata.mimeType,
      size: schema.fileMetadata.size,
      key: schema.fileMetadata.key,
      createdAt: schema.noteAttachment.createdAt,
    })
    .from(schema.noteAttachment)
    .innerJoin(schema.fileMetadata, eq(schema.noteAttachment.fileId, schema.fileMetadata.id))
    .where(eq(schema.noteAttachment.noteId, params.noteId));

  const withUrls = await Promise.all(
    attachments.map(async (a) => ({
      id: a.id,
      fileId: a.fileId,
      filename: a.filename,
      mimeType: a.mimeType,
      size: a.size,
      createdAt: a.createdAt,
      url: await storage.getPresignedUrl(a.key, { expiresIn: 3600 }),
    })),
  );

  return json({ attachments: withUrls });
};

/** POST /api/notes/:noteId/attachments — get presigned upload URL, then confirm attachment */
export const POST: RequestHandler = async ({ params, locals, request }) => {
  if (!locals.user) return error(401, "Unauthorized");

  const note = await db
    .select()
    .from(schema.note)
    .where(and(eq(schema.note.id, params.noteId), eq(schema.note.userId, locals.user.id)))
    .then((rows) => rows[0]);

  if (!note) return error(404, "Note not found");

  const body = (await request.json()) as {
    action: "presign" | "confirm";
    filename?: string;
    mimeType?: string;
    fileId?: string;
    key?: string;
    size?: number;
  };

  if (body.action === "presign") {
    if (!body.filename) return error(400, "filename is required");

    const { url, key } = await storage.createPresignedUploadUrl(
      `notes/${params.noteId}/${crypto.randomUUID()}/${body.filename}`,
      { expiresIn: 600, mimeType: body.mimeType },
    );

    return json({ url, key });
  }

  if (body.action === "confirm") {
    if (!body.key || !body.filename || !body.size) {
      return error(400, "key, filename, and size are required");
    }

    // Record file metadata in database
    const fileId = crypto.randomUUID();
    await db.insert(schema.fileMetadata).values({
      id: fileId,
      key: body.key,
      bucket: "uploads",
      filename: body.filename,
      mimeType: body.mimeType ?? "application/octet-stream",
      size: body.size,
      uploadedBy: locals.user.id,
    });

    // Link to note
    const attachmentId = crypto.randomUUID();
    await db.insert(schema.noteAttachment).values({
      id: attachmentId,
      noteId: params.noteId,
      fileId,
    });

    return json({ id: attachmentId, fileId }, { status: 201 });
  }

  return error(400, "Invalid action. Use 'presign' or 'confirm'.");
};

/** DELETE /api/notes/:noteId/attachments?id=... — remove attachment */
export const DELETE: RequestHandler = async ({ params, locals, url }) => {
  if (!locals.user) return error(401, "Unauthorized");

  const attachmentId = url.searchParams.get("id");
  if (!attachmentId) return error(400, "Attachment id is required");

  // Verify ownership through note
  const note = await db
    .select()
    .from(schema.note)
    .where(and(eq(schema.note.id, params.noteId), eq(schema.note.userId, locals.user.id)))
    .then((rows) => rows[0]);

  if (!note) return error(404, "Note not found");

  // Get the attachment to find the file key
  const attachment = await db
    .select({ fileId: schema.noteAttachment.fileId, key: schema.fileMetadata.key })
    .from(schema.noteAttachment)
    .innerJoin(schema.fileMetadata, eq(schema.noteAttachment.fileId, schema.fileMetadata.id))
    .where(
      and(
        eq(schema.noteAttachment.id, attachmentId),
        eq(schema.noteAttachment.noteId, params.noteId),
      ),
    )
    .then((rows) => rows[0]);

  if (!attachment) return error(404, "Attachment not found");

  // Delete file from S3 + metadata, then remove attachment link
  await storage.deleteFile(attachment.key);
  await db.delete(schema.noteAttachment).where(eq(schema.noteAttachment.id, attachmentId));

  return json({ ok: true });
};
