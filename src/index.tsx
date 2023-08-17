import { Result } from "@mikuroxina/mini-fn";
import { sign, verify } from "@tsndr/cloudflare-worker-jwt";
import { Hono } from "hono";
import { serveStatic } from "hono/cloudflare-workers";
import { getCookie, setCookie } from "hono/cookie";

import { withDiscordRepository } from "./adaptors/discord";
import { R2Store } from "./adaptors/r2";
import { checkAppError, type Member } from "./models";
import { Index } from "./pages";
import { Done } from "./pages/done";
import { Error } from "./pages/error";
import { patchMembers } from "./services/patch-members";

type Bindings = {
    ASSOC_BUCKET: R2Bucket;
    DISCORD_CLIENT_ID: string;
    DISCORD_CLIENT_SECRET: string;
    JWT_SECRET: string;
};

const app = new Hono<{ Bindings: Bindings }>();

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
            const jwt = await sign(
                {
                    exp: Math.floor(Date.now() / 1000) + 1000,
                },
                c.env.JWT_SECRET,
            );
            setCookie(c, "JWT_AUTH", jwt, {
                maxAge: 1000,
                httpOnly: true,
                sameSite: "Strict",
                secure: true,
            });
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
    const authCookie = getCookie(c, "JWT_AUTH");
    if (!authCookie) {
        return c.text("Unauthorized", 401);
    }
    const verification = await verify(authCookie, c.env.JWT_SECRET);
    if (!verification) {
        return c.text("Unauthorized", 401);
    }
    await next();
});

app.patch("/members/:id/associations", async () => {
    // TODO
});

export default app;
