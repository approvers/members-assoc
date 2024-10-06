import type { JSX } from "hono/jsx/jsx-runtime";

import { Layout } from "../components/layout";

export const Done = (): JSX.Element => (
    <Layout title="Approvers メンバー情報登録 - 登録完了">
        <h1>登録完了</h1>
        <p>登録できました. このタブは閉じてもらって構いません.</p>
    </Layout>
);
