import { notif } from "$lib/server/notifications";
import type { RequestHandler } from "./$types";

const handle: RequestHandler = async ({ request, locals }) => {
  if (!locals.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  return notif.handler(request, locals.user.id);
};

export const GET = handle;
export const POST = handle;
export const PUT = handle;
