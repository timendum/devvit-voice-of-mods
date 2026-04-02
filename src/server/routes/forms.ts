import { Hono } from "hono";
import type { UiResponse } from "@devvit/web/shared";
import { isT1, isT3 } from "@devvit/shared-types/tid.js";
import { handleReplyComment, handleReplyPost } from "../core/voice";

type WriteFormValues = {
  body?: string;
  distinguish?: boolean;
  lock?: boolean;
  targetId?: string;
};

export const forms = new Hono();

const OK_TOAST: Pick<UiResponse, "showToast"> = {
  showToast: {
    text: "Replied, refresh the page to see the comment.",
    appearance: "success",
  },
};

// url matches devvit forms.<id> value
forms.post("/write-comment-submit", async (c) => {
  const values = await c.req.json<WriteFormValues>();
  console.log("Form values", values);
  const normalized = {
    body: values.body?.trim(),
    distinguish: Boolean(values.distinguish),
    lock: Boolean(values.lock),
  };

  if (!normalized.body) {
    return c.json<UiResponse>(
      {
        showToast: "Empty comment body, no reply sent.",
      },
      200,
    );
  }
  const body = normalized.body;
  const targetId = values.targetId?.trim();

  if (isT1(targetId)) {
    // Reply to Comment
    handleReplyComment({ ...normalized, body, commentId: targetId });
    return c.json<UiResponse>(OK_TOAST, 200);
  } else if (isT3(targetId)) {
    // Reply to Post
    handleReplyPost({ ...normalized, body, postId: targetId });
    return c.json<UiResponse>(OK_TOAST, 200);
  } else {
    console.error("targetId unknown", targetId);
    return c.json<UiResponse>(
      {
        showToast: "No content found to reply to",
      },
      200,
    );
  }
});
