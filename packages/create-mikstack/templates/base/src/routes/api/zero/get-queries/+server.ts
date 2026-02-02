import type { RequestHandler } from "./$types";
import { handleQueryRequest } from "@rocicorp/zero/server";
import { mustGetQuery } from "@rocicorp/zero";
import { schema } from "$lib/zero/schema";
import { queries } from "$lib/zero/queries";

export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const ctx = { userID: locals.user.id };

    const response = await handleQueryRequest(
      (name, args) => {
        const query = mustGetQuery(queries, name);
        return query.fn({ args, ctx });
      },
      schema,
      request,
    );

    return Response.json(response);
  } catch (error) {
    console.error("Query error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
};
