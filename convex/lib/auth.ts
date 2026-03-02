import { MutationCtx, QueryCtx } from "../_generated/server";
import { ConvexError } from "convex/values";

// UserIdentity extended with custom JWT claims from the Clerk JWT template.
// The "role" claim must be added to the Convex JWT template in the Clerk
// Dashboard: JWT Templates → Convex → add { "role": "{{user.public_metadata.role}}" }
interface UserIdentityWithRole {
    subject: string;
    issuer: string;
    tokenIdentifier: string;
    name?: string;
    email?: string;
    role?: string;
}

export async function requireAuth(ctx: QueryCtx | MutationCtx): Promise<UserIdentityWithRole> {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
        throw new ConvexError("Unauthenticated: you must be signed in");
    }
    return identity as unknown as UserIdentityWithRole;
}

export async function requireAdmin(ctx: QueryCtx | MutationCtx): Promise<UserIdentityWithRole> {
    const identity = await requireAuth(ctx);
    if (identity.role !== "admin") {
        throw new ConvexError("Unauthorized: admin access required");
    }
    return identity;
}
