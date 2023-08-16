const ASSOCIATION_TYPES = ["twitter", "github"] as const;

export type AssociationType = (typeof ASSOCIATION_TYPES)[number];
export const checkAssociationType = (type: string): type is AssociationType =>
    (ASSOCIATION_TYPES as readonly string[]).includes(type);

export interface AssociatedLink {
    type: AssociationType;
    id: string;
    name: string;
}
export const checkAssociationLink = (link: {
    type: string;
    id: string;
    name: string;
}): link is AssociatedLink => checkAssociationType(link.type);

export interface Member {
    discordId: string;
    username: string;
    associatedLinks: AssociatedLink[];
}
