import { Result } from "@mikuroxina/mini-fn";
import { Hono } from "hono";
import { serveStatic } from "hono/cloudflare-workers";
import { cors } from "hono/cors";

import { newRepo, withDiscordRepository } from "./adaptors/discord";
import { R2Store } from "./adaptors/r2";
import { AssociatedLinksSchema, checkAppError, type Member } from "./models";
import { Index } from "./pages";
import { Done } from "./pages/done";
import { Error } from "./pages/error";
import { patchMembers } from "./services/patch-members";

type Bindings = {
    ASSOC_BUCKET: R2Bucket;
    DISCORD_CLIENT_ID: string;
    DISCORD_CLIENT_SECRET: string;
};

type Variables = {
    oauthToken: string;
    member: Member;
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.get("/favicon.ico", serveStatic({ path: "./favicon.ico" }));
app.use("/static/*", serveStatic({ root: "./" }));
app.get("/", (c) => c.html(<Index requestUrl={c.req.url} />));
app.get("/done", (c) => c.html(<Done />));
app.get("/error", (c) => {
    const details = c.req.query("details");
    if (!details || !checkAppError(details)) {
        return c.redirect("/");
    }
    return c.html(<Error details={details} />);
});
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
    const json = await tokenRes.json<{ access_token: string }>();

    const store = new R2Store(c.env.ASSOC_BUCKET);
    return await withDiscordRepository<Response>(json.access_token)(
        async (repo) => {
            const result = await patchMembers(repo, store);
            if (Result.isErr(result)) {
                return c.redirect(
                    "/error?" +
                        new URLSearchParams({
                            details: result[1],
                        }),
                );
            }
            return c.redirect("/done");
        },
    );
});

app.use(
    "/*",
    cors({
        origin: [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "https://edit.members.approvers.dev",
        ],
        allowMethods: ["GET", "PUT", "DELETE", "OPTIONS"],
    }),
);

app.get("/members", async (c) => {
    const { objects } = await c.env.ASSOC_BUCKET.list();
    const ids = objects.map(({ key }) => key);
    const members = (
        await Promise.all(
            ids.map(async (id) => {
                const body = await c.env.ASSOC_BUCKET.get(id);
                if (body == null) {
                    return [];
                }
                return [await body.json<Member>()];
            }),
        )
    ).flat();
    return c.json(members);
});
app.get("/members/:id", async (c) => {
    const id = c.req.param("id");
    const body = await c.env.ASSOC_BUCKET.get(id);
    if (body == null) {
        return c.notFound();
    }
    return c.json(await body.json<Member>());
});

app.use("/members/:id/associations", async (c, next) => {
    if (c.req.method === "GET") {
        return next();
    }

    const auth = c.req.header("Authorization");
    if (!auth || !auth.startsWith("Bearer ")) {
        return c.text("Unauthorized", 401);
    }
    const token = auth.substring("Bearer ".length).trim();

    c.set("oauthToken", token);

    const id = c.req.param("id");
    let entry = await c.env.ASSOC_BUCKET.get(id);
    if (!entry) {
        const repo = newRepo(token);
        const store = new R2Store(c.env.ASSOC_BUCKET);
        const result = await patchMembers(repo, store);
        if (Result.isErr(result)) {
            return c.text("Forbidden", 403);
        }
        entry = await c.env.ASSOC_BUCKET.get(id);
    }
    if (!entry) {
        console.error("insert new member failure");
        return c.text("Internal Server Error", 500);
    }
    const stored = await entry.json<Member>();
    c.set("member", stored);
    await next();
});

app.put("/members/:id/associations", async (c) => {
    const id = c.req.param("id");
    const result = AssociatedLinksSchema.safeParse(await c.req.json());
    if (!result.success) {
        return c.text("Bad Request", 400);
    }
    await c.env.ASSOC_BUCKET.put(
        id,
        JSON.stringify({
            ...c.get("member"),
            associatedLinks: result.data,
        }),
    );
    return c.text("OK", 200);
});
app.delete("/members/:id/associations", async (c) => {
    const id = c.req.param("id");
    await c.env.ASSOC_BUCKET.put(
        id,
        JSON.stringify({
            ...c.get("member"),
            associatedLinks: [],
        }),
    );
    return c.text("OK", 200);
});

export default app;
