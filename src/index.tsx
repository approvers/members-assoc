import { Result } from "@mikuroxina/mini-fn";
import { Hono } from "hono";
import { serveStatic } from "hono/cloudflare-workers";

import { withDiscordRepository } from "./adaptors/discord";
import { R2Store } from "./adaptors/r2";
import { patchMembers } from "./services/patch-members";
import { Index } from "./pages";
import { Done } from "./pages/done";

type Bindings = {
    ASSOC_BUCKET: R2Bucket;
    DISCORD_CLIENT_ID: string;
    DISCORD_CLIENT_SECRET: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use("/static/*", serveStatic({ root: "./" }));
app.get("/", (c) => c.html(<Index requestUrl={c.req.url} />));
app.get("/done", (c) => c.html(<Done />));
app.get("/redirect", async (c) => {
    const code = c.req.query("code");
    if (!code) {
        return c.text("Bad Request", 400);
    }

    const tokenRes = await fetch("https://discord.com/api/v10/oauth2/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
            client_id: c.env.DISCORD_CLIENT_ID,
            client_secret: c.env.DISCORD_CLIENT_SECRET,
            grant_type: "authorization_code",
            code,
            redirect_uri: new URL("/redirect", c.req.url).toString(),
        }),
    });
    const json = await tokenRes.json<{ access_token: string; }>();


    const store = new R2Store(c.env.ASSOC_BUCKET);
    return await withDiscordRepository<Response>(json.access_token)(async (repo) => {
        const result = await patchMembers(repo, store);
        if (Result.isErr(result)) {
            console.error(result[1]);
            return c.text("Internal Server Error", 500);
        }
        return c.redirect("/done");
    });
});

app.get("/members", async (c) => {
    const { objects } = await c.env.ASSOC_BUCKET.list();
    return c.json(objects);
});
app.get("/members/:id", async (c) => {
    const id = c.req.param("id");
    const { objects } = await c.env.ASSOC_BUCKET.list({
        limit: 1,
        prefix: id,
    });
    if (objects.length < 1) {
        return c.notFound();
    }
    return c.json(objects[0]);
});

export default app;
