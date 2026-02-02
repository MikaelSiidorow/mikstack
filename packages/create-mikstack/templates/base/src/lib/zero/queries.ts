import { defineQueries, defineQuery } from "@rocicorp/zero";
import { zql } from "./schema";

export const queries = defineQueries({
  note: {
    mine: defineQuery(({ ctx }) =>
      zql.note.where("userId", ctx.userID).orderBy("createdAt", "desc"),
    ),
  },
  inAppNotification: {
    mine: defineQuery(({ ctx }) =>
      zql.inAppNotification.where("userId", ctx.userID).orderBy("createdAt", "desc"),
    ),
    unread: defineQuery(({ ctx }) =>
      zql.inAppNotification
        .where("userId", ctx.userID)
        .where("read", false)
        .orderBy("createdAt", "desc"),
    ),
  },
});
