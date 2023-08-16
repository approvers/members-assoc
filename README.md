# members-assoc

メンバーの管理と関連付け

## コンセプト

メンバーに専用なアイデンティティを割り当てて, これを Discord サーバーへの参加状態と同期させます. そして, メンバーの認証情報それぞれに対する SNS アカウント情報などを関連付けます.

:::note
これより下は執筆中であり, 情報が不完全です. 大きく変更される可能性もあります.
:::

## エンドポイント

以上のコンセプトを実現するための, 以下の HTTP API エンドポイントを設けています. エンドポイントのスキーマは OpenAPI として [openapi.yaml](./openapi.yaml) にも記述してあります. 開発の際にはぜひご利用ください.

### メンバー情報

`GET /members` は全てのメンバーの情報を取得できます. ただし, 名前と ID しか分かりません.

`GET /members/{id}` は特定のメンバーの詳細な情報を取得できます.

### 関連付け情報

`GET /members/{id}/associations`

`POST /members/{id}/associations`

`PUT /members/{id}/associations`

`PATCH /members/{id}/associations`

`DELETE /members/{id}/associations`

## 構築基盤

フレームワークとして [Hono](https://hono.dev), データベースとして [Cloudflare R2](https://www.cloudflare.com/developer-platform/r2/) を使用しています.
