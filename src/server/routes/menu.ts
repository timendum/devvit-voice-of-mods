import { Hono } from "hono";
import type { MenuItemRequest, UiResponse } from "@devvit/web/shared";
import { findOpAuthor } from "../core/voice";
import { isT1 } from "@devvit/shared-types/tid.js";
import { context, reddit } from "@devvit/web/server";

export const menu = new Hono();

// url from devvit menu.items
menu.post("/reply-as-mod", async (c) => {
  const request = await c.req.json<MenuItemRequest>();
  console.log("Menu request on", request.targetId);

  // Check permissions
  const user = await reddit.getCurrentUser();
  if (!user) {
    return;
  }
  const modPermissions = await user.getModPermissionsForSubreddit(
    context.subredditName,
  );
  console.log(
    `Permissions of ${user.username} for ${context.subredditName}:`,
    modPermissions,
  );
  const canWrite =
    modPermissions.includes("all") || modPermissions.includes("mail");
  if (!canWrite) {
    return c.json<UiResponse>({
      showToast: "You do not have permission to reply as a moderator.",
    });
  }

  // reveal OP Author
  let showToast = undefined;
  if (isT1(request.targetId)) {
    const opMod = await findOpAuthor(request.targetId);
    if (opMod) {
      showToast = `Comment written by u/${opMod}`;
    }
  }

  // Form
  return c.json<UiResponse>(
    {
      showToast: showToast,
      showForm: {
        name: "write-comment", // match devvit.forms entry
        form: {
          title: "Reply anonymously as a moderator",
          fields: [
            {
              type: "paragraph",
              name: "body",
              label: "Body of the comment",
              required: true,
            },
            {
              type: "boolean",
              name: "distinguish",
              label: "Distinguish reply?",
              defaultValue: true,
            },
            {
              type: "boolean",
              name: "lock",
              label: "Lock reply?",
              defaultValue: true,
            },
            {
              type: "string",
              name: "targetId",
              label: "Ignore (target id)",
              defaultValue: request.targetId,
              disabled: true,
            },
          ],
          acceptLabel: "Submit",
          cancelLabel: "Cancel",
        },
      },
    },
    200,
  );
});
