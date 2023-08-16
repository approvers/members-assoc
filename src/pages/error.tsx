import { Layout } from "../components/layout";
import type { AppError } from "../models";

const DESCRIPTIONS: Record<AppError, string> = {
    NOT_JOINED_TO_APPROVERS:
        "あなたの認可したアカウントが Approvers に参加していることを確認できませんでした.",
};

export const Error = ({ details }: { details: AppError }): JSX.Element => (
    <Layout title="Approvers メンバー情報登録 - 登録失敗">
        <h1>登録失敗</h1>
        <p>{DESCRIPTIONS[details]}</p>
        <a href="/">トップに戻る</a>
    </Layout>
);
