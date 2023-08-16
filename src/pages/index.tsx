export const Index = (): JSX.Element => (
    <html lang="ja">
        <head>
            <meta charset="UTF-8"/>
            <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
            <title>Approvers メンバー情報登録</title>
            <link rel="stylesheet" href="/static/style.css" />
        </head>
        <body>
            <h1>Approvers メンバー情報登録</h1>
            <h2>Approvers へようこそ</h2>
            <p>こちらではあなたの Discord アカウントに関連付けてある GitHub / X (旧 Twitter) アカウントの情報を登録できます. これは Discord の OAuth を利用しており, 下記のボタンから当サービスでのトークンの利用を認可していただくことで登録処理を開始できます.</p>
            <button>アカウント情報を登録する</button>
        </body>
    </html>
);
