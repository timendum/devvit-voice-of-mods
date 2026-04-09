import { Hono } from "hono";
import type { OnAppInstallRequest, TriggerResponse } from "@devvit/web/shared";
import { initRedis } from "../core/voice";

export const triggers = new Hono();

triggers.post("/app-install", async (c) => {
  // url from devvit triggers.onAppInstall
  const input = await c.req.json<OnAppInstallRequest>();
  console.log("App installed to subreddit: r/" + input.subreddit?.name);
  await initRedis();
  return c.json<TriggerResponse>(
    {
      status: "success",
    },
    200,
  );
});

triggers.post("/app-upgrade", async (c) => {
  // url from devvit triggers.onAppUpgrade
  const input = await c.req.json<OnAppInstallRequest>();
  console.log("App upgraded to subreddit: r/" + input.subreddit?.name);
  await initRedis();
  return c.json<TriggerResponse>(
    {
      status: "success",
    },
    200,
  );
});
