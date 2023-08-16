const REDIRECT_URL = "https://discord.com/api/oauth2/authorize?client_id=1141210184505639003&redirect_uri=http%3A%2F%2F127.0.0.1%3A3000%2Fredirect&response_type=code&scope=identify%20guilds.members.read%20connections";

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
            <a href={REDIRECT_URL} referrerPolicy="no-referrer" rel="noopener">
                <button>アカウント情報を登録する</button>
            </a>
        </body>
    </html>
);
