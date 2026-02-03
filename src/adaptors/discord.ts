import { Cont, Promise } from "@mikuroxina/mini-fn";

import type { Repository } from "../services.js";
import type {
    Connection,
    GuildMember,
    User,
} from "../services/patch-members.js";

export const withDiscordRepository =
    <T>(token: string): Cont.ContT<T, Promise.PromiseHkt, Repository> =>
    async (repoUser: (repo: Repository) => Promise<T>): Promise<T> => {
        const repo = newRepo(token);
        const result = await repoUser(repo);
        await revoke(token);
        return result;
    };

const DISCORD_API = "https://discord.com/api/v10";

export const newRepo = (token: string): Repository => ({
    async user(): Promise<User> {
        const meRes = await fetch(DISCORD_API + "/users/@me", {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return await meRes.json();
    },
    async connections(): Promise<Connection[]> {
        const connectionsRes = await fetch(
            DISCORD_API + "/users/@me/connections",
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            },
        );
        return await connectionsRes.json();
    },
    async guildMember(guildId): Promise<GuildMember | undefined> {
        const connectionsRes = await fetch(
            DISCORD_API + `/users/@me/guilds/${guildId}/member`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            },
        );
        if (!connectionsRes.ok) {
            return undefined;
        }
        return connectionsRes.json();
    },
});

async function revoke(token: string) {
    await fetch(DISCORD_API + "/oauth2/token/revoke", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
            token,
        }),
    });
}
