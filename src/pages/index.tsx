import type { JSX } from "hono/jsx/jsx-runtime";

import { Layout } from "../components/layout";

export const Index = ({ requestUrl }: { requestUrl: string }): JSX.Element => {
    const redirectUrl = `https://discord.com/api/oauth2/authorize?client_id=1141210184505639003&redirect_uri=${encodeURIComponent(
        new URL("/redirect", requestUrl).toString(),
    )}&response_type=code&scope=identify%20guilds.members.read%20connections`;
    return (
        <Layout title="Approvers メンバー情報登録">
            <h1>Approvers メンバー情報登録</h1>
            <h2>Approvers へようこそ</h2>
            <p>
                こちらではあなたの Discord アカウントに関連付けてある GitHub / X
                (旧 Twitter) アカウントの情報を登録できます. これは Discord の
                OAuth を利用しており,
                下記のボタンから当サービスでのトークンの利用を認可していただくことで登録処理を開始できます.
            </p>
            <a
                class="big-button"
                href={redirectUrl}
                referrerPolicy="no-referrer"
                rel="noopener"
            >
                アカウント情報を登録する
            </a>
            <hr />
            <a
                href="https://edit.members.approvers.dev"
                referrerPolicy="no-referrer"
                rel="noopener"
            >
                アカウント情報を編集する (別サイト)
            </a>
        </Layout>
    );
};
