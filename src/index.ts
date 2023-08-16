import { Result } from "@mikuroxina/mini-fn";
import { Hono } from "hono";

import { withDiscordRepository } from "./adaptors/discord";
import { R2Store } from "./adaptors/r2";
import { patchMembers } from "./services/patch-members";

type Bindings = {
    ASSOC_BUCKET: R2Bucket;
    DISCORD_CLIENT_ID: string;
    DISCORD_CLIENT_SECRET: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get("/", (c) => c.text("Hello Hono!"));
app.patch("/members", async (c) => {
    const body = await c.req.json();
    const checkToken = (body: unknown): body is { token: string } =>
        typeof body === "object" &&
        body !== null &&
        "token" in body &&
        typeof body.token === "string";
    if (!checkToken(body)) {
        return c.text("bad Request", 400, {
            "X-Debug": "token required",
        });
    }
    const { token } = body;

    const store = new R2Store(c.env.ASSOC_BUCKET);
    return await withDiscordRepository<Response>(token)(async (repo) => {
        const result = await patchMembers(repo, store);
        if (Result.isErr(result)) {
            console.error(result[1]);
            return c.text("Internal Server Error", 500);
        }
        return c.text("OK", 200);
    });
});

export default app;
