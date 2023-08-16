export const Index = ({ requestUrl }: { requestUrl: string; }): JSX.Element => {
    const redirectUrl = `https://discord.com/api/oauth2/authorize?client_id=1141210184505639003&redirect_uri=${
        encodeURIComponent(new URL("/redirect", requestUrl).toString())
    }&response_type=code&scope=identify%20guilds.members.read%20connections`;
    return (
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
                <a href={redirectUrl} referrerPolicy="no-referrer" rel="noopener">
                    <button>アカウント情報を登録する</button>
                </a>
            </body>
        </html>
    );};
