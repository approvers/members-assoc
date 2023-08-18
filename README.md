# members-assoc

メンバーの管理と関連付け

## コンセプト

メンバーに専用なアイデンティティを割り当てて, これを Discord サーバーへの参加状態と同期させます. そして, メンバーの認証情報それぞれに対する SNS アカウント情報などを関連付けます.

## フロントエンド

API とは別に登録処理用の簡易的な画面を `/` (ルート) で用意しています. これにより OAuth 2.0 のフローを用いて, Discord の OAuth API 経由で Discord に関連付けてあるアカウント情報 (GitHub と X のみ) を自動登録できます.

## バックエンド

以下の HTTP API エンドポイントを設けています. エンドポイントのスキーマは OpenAPI として [openapi.yaml](./openapi.yaml) にも記述してあります. 開発の際にはぜひご利用ください.

### メンバー情報

以下のエンドポイントはいずれも JSON オブジェクトを返します. スキーマの詳細は openapi.yaml を確認してください.

`GET /members` は全てのメンバーの情報のリストを取得できます.

`GET /members/{id}` は特定のメンバーのみの情報 1 件を取得できます. 存在しない場合は `404 Not Found` を返します.

### 関連付け情報

`PUT /members/{id}/associations` は特定のメンバーに関連付けられたアカウント情報を, リクエスト本文のリストで上書きします. スキーマの詳細は openapi.yaml を確認してください.

`DELETE /members/{id}/associations` は特定のメンバーに関連付けられたアカウント情報をすべて削除します.

## 構築基盤

フレームワークとして [Hono](https://hono.dev), データベースとして [Cloudflare R2](https://www.cloudflare.com/developer-platform/r2/) を使用しています.
