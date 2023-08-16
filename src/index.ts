import { Hono } from "hono";

type Bindings = {
    ASSOC_BUCKET: R2Bucket;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get("/", (c) => c.text("Hello Hono!"));

export default app;
