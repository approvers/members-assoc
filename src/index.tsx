import { Result } from "@mikuroxina/mini-fn";
import { Hono } from "hono";
import { serveStatic } from "hono/cloudflare-workers";

import { newRepo, withDiscordRepository } from "./adaptors/discord";
import { R2Store } from "./adaptors/r2";
import { APPROVERS_GUILD_ID } from "./consts";
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
    const auth = c.req.header("Authorization");
    if (!auth || !auth.startsWith("Bearer ")) {
        return c.text("Unauthorized", 401);
    }
    const token = auth.substring(6).trim();
    const member = await newRepo(token).guildMember(APPROVERS_GUILD_ID);
    if (!member || member.roles.length === 0) {
        return c.text("Not Found", 404);
    }
    c.set("oauthToken", token);

    const id = c.req.param("id");
    const entry = await c.env.ASSOC_BUCKET.get(id);
    if (!entry) {
        return c.text("Not Found", 404);
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
