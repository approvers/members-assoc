import { html } from "hono/html";

export type LayoutProps = {
    title: string;
    children: JSX.Element | JSX.Element[];
};

export const Layout = ({ title, children }: LayoutProps): JSX.Element => html`
    <!doctype html>
    <html lang="ja">
        <head>
            <meta charset="UTF-8" />
            <meta
                name="viewport"
                content="width=device-width, initial-scale=1.0"
            />
            <title>${title}</title>
            <link rel="stylesheet" href="/static/style.css" />
        </head>
        <body>
            ${children}
        </body>
    </html>
`;
