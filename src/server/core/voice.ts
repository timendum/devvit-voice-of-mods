import { reddit, redis } from "@devvit/web/server";
import type { Comment } from "@devvit/web/server";
import type { T1, T3 } from "@devvit/shared-types/tid.js";

export type ReplyBaseProps = {
  body: string;
  distinguish: boolean;
  lock: boolean;
  // subredditId: T5;
};

interface ReplyCommentProps extends ReplyBaseProps {
  commentId: T1;
}
interface ReplyPostProps extends ReplyBaseProps {
  postId: T3;
}

async function handleContent(props: ReplyBaseProps, content: Comment) {
  console.log("Comment done:", content.permalink);
  const getUsername = reddit.getCurrentUsername();
  const lock = props.lock ? content.lock() : Promise.resolve(undefined);
  const distinguish = props.distinguish
    ? content.distinguish(true)
    : Promise.resolve(undefined);

  const [username, _l, _d] = await Promise.all([
    getUsername,
    lock,
    distinguish,
  ]);
  if (username) {
    const r = await redis.set(`comment:${content.id}`, username);
    console.log("Redis done:", r);
  }
}

export async function handleReplyComment(props: ReplyCommentProps) {
  const [user, comment] = await Promise.all([
    reddit.getCurrentUser(),
    reddit.getCommentById(props.commentId),
  ]);

  if (!user) {
    return { success: false, message: "Can't get user" };
  }
  const content = await comment.reply({ text: props.body });
  await handleContent(props, content);
}

export async function handleReplyPost(props: ReplyPostProps) {
  const [user, post] = await Promise.all([
    reddit.getCurrentUser(),
    reddit.getPostById(props.postId),
  ]);

  if (!user) {
    return { success: false, message: "Can't get user" };
  }
  const content = await post.addComment({ text: props.body });
  await handleContent(props, content);
}

export async function findOpAuthor(commentId: T1) {
  const [comment, appName] = await Promise.all([
    reddit.getCommentById(commentId),
    reddit.getAppUser(),
  ]);
  if (comment.authorName == appName?.username) {
    // Fetch the original moderator and display it
    const key = `comment:${commentId}`;
    try {
      const opMod = await redis.get(key);
      return opMod;
    } catch (e) {
      console.error("Error reading from Redis", e);
    }
  }
}

export async function initRedis() {
  await redis.expire("comment:*", 60 * 60 * 24 * 365); // Expiration for all keys
}
