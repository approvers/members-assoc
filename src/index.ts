import { Hono } from "hono";

type Bindings = {
    ASSOC_BUCKET: R2Bucket;
    DISCORD_CLIENT_ID: string;
    DISCORD_CLIENT_SECRET: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get("/", (c) => c.text("Hello Hono!"));

export default app;
