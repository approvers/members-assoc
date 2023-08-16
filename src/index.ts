import { Hono } from "hono";

const DISCORD_API = "https://discord.com/api/v10";

async function revoke(token: string) {
    await fetch(DISCORD_API + "/oauth2/token/revoke", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
            token,
        }),
    });
}

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

    const meRes = await fetch(DISCORD_API + "/users/@me", {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    interface User {
        // https://discord.com/developers/docs/resources/user#user-object-user-structure
        id: string;
        [key: string]: unknown;
    }
    const me: User = await meRes.json();

    const connectionsRes = await fetch(DISCORD_API + "/users/@me/connections", {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    interface Connection {
        // https://discord.com/developers/docs/resources/user#connection-object-connection-structure
        id: string;
        name: string;
        type: string;
        [key: string]: unknown;
    }
    const connections: Connection[] = await connectionsRes.json();

    const ASSOCIATION_TYPES = ["twitter", "github"] as const;
    type AssociationType = (typeof ASSOCIATION_TYPES)[number];
    const checkAssociationType = (type: string): type is AssociationType =>
        (ASSOCIATION_TYPES as readonly string[]).includes(type);
    interface AssociatedLink {
        type: AssociationType;
        id: string;
        name: string;
    }
    const checkAssociationLink = (link: {
        type: string;
        id: string;
        name: string;
    }): link is AssociatedLink => checkAssociationType(link.type);
    interface Member {
        discordId: string;
        associatedLinks: AssociatedLink[];
    }
    const member = {
        discordId: me.id,
        associatedLinks: connections
            .map(({ type, id, name }) => ({ type, id, name }))
            .filter(checkAssociationLink),
    } satisfies Member;
    c.env.ASSOC_BUCKET.put(me.id, JSON.stringify(member));

    await revoke(token);
    return c.text("OK", 200);
});

export default app;
