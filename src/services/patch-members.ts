import { Result } from "@mikuroxina/mini-fn";

import { type AppError, checkAssociationLink, type Member } from "../models";

export interface User {
    id: string;
    username: string;
}
export interface Connection {
    id: string;
    name: string;
    type: string;
}
export interface GuildMember {
    roles: string[];
}

export interface Repository {
    user(): Promise<User>;
    connections(): Promise<Connection[]>;
    guildMember(guildId: string): Promise<GuildMember | undefined>;
}
export interface Store {
    put(id: string, entry: unknown): Promise<void>;
}

const APPROVERS_GUILD_ID = "683939861539192860";

export const patchMembers = async (
    repository: Repository,
    store: Store,
): Promise<Result.Result<AppError, []>> => {
    const me = await repository.user();
    const connections = await repository.connections();
    const guildMember = await repository.guildMember(APPROVERS_GUILD_ID);
    if (!guildMember || guildMember.roles.length === 0) {
        return Result.err("NOT_JOINED_TO_APPROVERS");
    }

    const member = {
        discordId: me.id,
        username: me.username,
        associatedLinks: connections
            .map(({ type, id, name }) => ({ type, id, name }))
            .filter(checkAssociationLink),
    } satisfies Member;

    store.put(me.id, member);
    return Result.ok<[]>([]);
};
