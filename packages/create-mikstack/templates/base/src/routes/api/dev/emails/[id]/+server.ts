import { dev } from "$app/environment";
import { error } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import { db } from "$lib/server/db";
import { notificationDelivery } from "$lib/server/db/schema";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ params }) => {
  if (!dev) error(404);

  const [delivery] = await db
    .select({ content: notificationDelivery.content })
    .from(notificationDelivery)
    .where(eq(notificationDelivery.id, params.id));

  if (!delivery?.content) error(404);

  const content = delivery.content as { html?: string; subject?: string };
  if (!content.html) error(404, "No HTML content for this delivery");

  const escaped = content.html.replaceAll("&", "&amp;").replaceAll('"', "&quot;");
  const title = content.subject ? `<title>${content.subject}</title>` : "";

  const wrapper = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8">${title}<style>*{margin:0;padding:0}html,body{background:#e5e7eb}iframe{display:block;max-width:600px;width:100%;margin:24px auto;border:none;background:#fff}</style></head>
<body><iframe srcdoc="${escaped}" onload="this.style.height=this.contentDocument.documentElement.scrollHeight+'px'"></iframe></body>
</html>`;

  return new Response(wrapper, {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
};
