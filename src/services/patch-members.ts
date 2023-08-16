import { Result } from "@mikuroxina/mini-fn";

import { type Member, checkAssociationLink } from "../models";

export interface User {
    id: string;
}
export interface Connection {
    id: string;
    name: string;
    type: string;
}

export interface Repository {
    user(): Promise<User>;
    connections(): Promise<Connection[]>;
}
export interface Store {
    put(id: string, entry: unknown): Promise<void>;
}

export const patchMembers = async (
    repository: Repository,
    store: Store,
): Promise<Result.Result<Error, []>> => {
    const me = await repository.user();
    const connections = await repository.connections();

    const member = {
        discordId: me.id,
        associatedLinks: connections
            .map(({ type, id, name }) => ({ type, id, name }))
            .filter(checkAssociationLink),
    } satisfies Member;

    store.put(me.id, member);
    return Result.ok<[]>([]);
};
