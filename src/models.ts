import { z } from "zod";

export const AssociationSchema = z.union([
    z.literal("twitter"),
    z.literal("github"),
]);
export type Association = z.infer<typeof AssociationSchema>;

export const AssociatedLinkSchema = z.object({
    type: AssociationSchema,
    id: z.string(),
    name: z.string(),
});
export type AssociatedLink = z.infer<typeof AssociatedLinkSchema>;

export const MemberSchema = z.object({
    discordId: z.string(),
    username: z.string(),
    associatedLinks: z.array(AssociatedLinkSchema),
});
export type Member = z.infer<typeof MemberSchema>;

const APP_ERRORS = ["NOT_JOINED_TO_APPROVERS"] as const;
export type AppError = (typeof APP_ERRORS)[number];
export const checkAppError = (variant: string): variant is AppError =>
    (APP_ERRORS as readonly string[]).includes(variant);
