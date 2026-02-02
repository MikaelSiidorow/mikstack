import { notif } from "$lib/server/notifications";
import type { RequestHandler } from "./$types";

const handle: RequestHandler = async ({ request, locals }) => {
  return notif.handler(request, locals.user?.id ?? null);
};

export const GET = handle;
export const POST = handle;
export const PUT = handle;
