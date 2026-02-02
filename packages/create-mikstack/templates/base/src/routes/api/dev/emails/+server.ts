import { dev } from "$app/environment";
import { error } from "@sveltejs/kit";
import { desc, eq } from "drizzle-orm";
import { db } from "$lib/server/db";
import { notificationDelivery } from "$lib/server/db/schema";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async () => {
  if (!dev) error(404);

  const deliveries = await db
    .select({
      id: notificationDelivery.id,
      type: notificationDelivery.type,
      channel: notificationDelivery.channel,
      recipientEmail: notificationDelivery.recipientEmail,
      status: notificationDelivery.status,
      error: notificationDelivery.error,
      createdAt: notificationDelivery.createdAt,
    })
    .from(notificationDelivery)
    .where(eq(notificationDelivery.channel, "email"))
    .orderBy(desc(notificationDelivery.createdAt))
    .limit(50);

  const rows = deliveries
    .map(
      (d) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">
        <a href="/api/dev/emails/${d.id}" target="_blank" style="color:#2563eb">${esc(d.type)}</a>
      </td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${esc(d.recipientEmail ?? "—")}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">
        <span style="padding:2px 8px;border-radius:9999px;font-size:12px;background:${statusColor(d.status)}">${esc(d.status)}</span>
        ${d.error ? `<span style="color:#ef4444;font-size:12px"> ${esc(d.error)}</span>` : ""}
      </td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:13px">${d.createdAt.toLocaleString()}</td>
    </tr>`,
    )
    .join("");

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Dev Emails</title></head>
<body style="font-family:system-ui,sans-serif;margin:0;padding:24px;background:#f9fafb">
  <h1 style="font-size:20px;margin:0 0 16px">Dev Email Log</h1>
  ${
    deliveries.length === 0
      ? '<p style="color:#6b7280">No emails sent yet.</p>'
      : `<table style="width:100%;border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
    <thead>
      <tr style="background:#f3f4f6;text-align:left">
        <th style="padding:8px 12px;font-weight:600">Type</th>
        <th style="padding:8px 12px;font-weight:600">To</th>
        <th style="padding:8px 12px;font-weight:600">Status</th>
        <th style="padding:8px 12px;font-weight:600">Sent</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>`
  }
</body>
</html>`;

  return new Response(html, {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
};

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function statusColor(status: string): string {
  switch (status) {
    case "sent":
    case "delivered":
      return "#dcfce7";
    case "failed":
      return "#fee2e2";
    default:
      return "#fef3c7";
  }
}
