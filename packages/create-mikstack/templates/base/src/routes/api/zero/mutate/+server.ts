import type { RequestHandler } from "./$types";
import { handleMutateRequest } from "@rocicorp/zero/server";
import { mustGetMutator } from "@rocicorp/zero";
import { dbProvider } from "$lib/zero/db-provider.server";
import { mutators } from "$lib/zero/mutators";

export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const ctx = { userID: locals.user.id };

    const result = await handleMutateRequest(
      dbProvider,
      async (transact) => {
        return await transact(async (tx, name, args) => {
          const mutator = mustGetMutator(mutators, name);
          return await mutator.fn({ tx, ctx, args });
        });
      },
      request,
    );

    return Response.json(result);
  } catch (error) {
    console.error("Mutate error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
};
