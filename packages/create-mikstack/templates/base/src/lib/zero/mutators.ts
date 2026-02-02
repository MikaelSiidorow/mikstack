import { defineMutators, defineMutator } from "@rocicorp/zero";
import * as v from "valibot";
import { zql } from "./schema";

export const mutators = defineMutators({
  note: {
    create: defineMutator(
      v.object({ id: v.string(), title: v.pipe(v.string(), v.minLength(1)), content: v.string() }),
      async ({ tx, ctx, args }) => {
        const now = Date.now();
        await tx.mutate.note.insert({
          id: args.id,
          title: args.title,
          content: args.content,
          userId: ctx.userID,
          createdAt: now,
          updatedAt: now,
        });
      },
    ),
    update: defineMutator(
      v.object({ id: v.string(), title: v.pipe(v.string(), v.minLength(1)), content: v.string() }),
      async ({ tx, ctx, args }) => {
        const note = await tx.run(
          zql.note.where("id", args.id).where("userId", ctx.userID).one(),
        );
        if (!note) throw new Error("Note not found");
        await tx.mutate.note.update({
          id: args.id,
          title: args.title,
          content: args.content,
          updatedAt: Date.now(),
        });
      },
    ),
    delete: defineMutator(v.object({ id: v.string() }), async ({ tx, ctx, args }) => {
      const note = await tx.run(
        zql.note.where("id", args.id).where("userId", ctx.userID).one(),
      );
      if (!note) throw new Error("Note not found");
      await tx.mutate.note.delete({ id: args.id });
    }),
  },
});
