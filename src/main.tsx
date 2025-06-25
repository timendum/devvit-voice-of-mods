import { Devvit } from "@devvit/public-api";

Devvit.configure({
  redditAPI: true,
});

const writeCommentForm = Devvit.createForm(
  (data) => ({
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
        name: "commentId",
        label: "Ignore (Parent comment id)",
        defaultValue: data.commentId,
        disabled: true,
      },
      {
        type: "string",
        name: "postId",
        label: "Ignore (Parent post id)",
        defaultValue: data.postId,
        disabled: true,
      },
    ],
    acceptLabel: "Submit",
    cancelLabel: "Cancel",
  }),
  async (event, context) => {
    console.log("Submitted with body:", event.values);
    const body = event.values.body?.trim() || "";
    if (body.length < 1) {
      context.ui.showToast("Empty comment body, no reply sent.");
      return;
    }
    let comment = undefined;
    if (event.values.commentId !== "-") {
      const parentComment = await context.reddit.getCommentById(
        event.values.commentId,
      );
      comment = await parentComment.reply({ text: body });
    } else if (event.values.postId !== "-") {
      const post = await context.reddit.getPostById(event.values.postId);
      comment = await post.addComment({ text: body });
    }
    if (!comment) {
      context.ui.showToast("No content found to reply to.");
      return;
    }
    console.log("Comment done :", comment.permalink);
    if (event.values.lock) {
      await comment.lock();
    }
    if (event.values.distinguish) {
      await comment.distinguish(true);
    }
    context.ui.showToast("Replied, refresh the page to see the comment.");
  },
);

Devvit.addMenuItem({
  location: ["post", "comment"],
  label: "Reply as Mod",
  forUserType: "moderator", // only for moderators
  onPress: async (event, context) => {
    console.log(`Pressed on ${event.targetId} by ${context.userId}`);
    if (!context.userId) {
      context.ui.showToast("User not found.");
      return;
    }
    const user = await context.reddit.getUserById(context.userId);
    if (!user) {
      context.ui.showToast("User not found.");
      return;
    }
    if (!context.subredditName) {
      context.ui.showToast("Subreddit not found.");
      return;
    }
    const permissions = await user.getModPermissionsForSubreddit(
      context.subredditName,
    );
    console.log(
      `Permissions of ${context.userId} for ${context.subredditName}:`,
      permissions,
    );
    if (!permissions.includes("mail") && !permissions.includes("all")) {
      context.ui.showToast(
        "You do not have permission to reply as a moderator.",
      );
      return;
    }
    context.ui.showForm(writeCommentForm, {
      commentId: context.commentId || "-",
      postId: context.postId || "-",
    });
  },
});

export default Devvit;
