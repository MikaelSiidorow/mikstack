import { storage } from "$lib/server/storage";
import type { RequestHandler } from "./$types";

const handle: RequestHandler = async ({ request, locals }) => {
  return storage.handler(request, locals.user?.id ?? null);
};

export const GET = handle;
export const POST = handle;
