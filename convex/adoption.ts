import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/auth";

// ── Opportunities ────────────────────────────────────────────────────────────

export const upsertOpportunityData = mutation({
    args: {
        opportunities: v.array(
            v.object({
                opportunityId: v.string(),
                isAutomated: v.boolean(),
                createdOn: v.string(),
                syncedAt: v.number(),
            })
        ),
    },
    handler: async (ctx, { opportunities }) => {
        for (const opp of opportunities) {
            const existing = await ctx.db
                .query("opportunityData")
                .withIndex("by_opportunity_id", (q) => q.eq("opportunityId", opp.opportunityId))
                .first();
            if (existing) {
                await ctx.db.patch(existing._id, opp);
            } else {
                await ctx.db.insert("opportunityData", opp);
            }
        }
    },
});

export const getOpportunityData = query({
    args: {},
    handler: async (ctx) => {
        const records = await ctx.db.query("opportunityData").collect();

        const automated = records.filter((r) => r.isAutomated);
        const totalAutomated = automated.length;

        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const monthlyCounts: Record<string, number> = {};
        for (const r of automated) {
            const d = new Date(r.createdOn);
            const key = `${d.getFullYear()}-${d.getMonth()}`;
            monthlyCounts[key] = (monthlyCounts[key] ?? 0) + 1;
        }

        const byMonth = Object.entries(monthlyCounts)
            .map(([key, count]) => {
                const [year, monthIdx] = key.split("-").map(Number);
                return { month: monthNames[monthIdx], year, count, sortKey: year * 100 + monthIdx };
            })
            .sort((a, b) => a.sortKey - b.sortKey)
            .map(({ month, year, count }) => ({ month, year, count }));

        const lastSyncedAt =
            records.length > 0 ? Math.max(...records.map((r) => r.syncedAt)) : null;

        return { totalAutomated, byMonth, lastSyncedAt };
    },
});

export const upsertAdoptionData = mutation({
    args: {
        users: v.array(
            v.object({
                dynamicsId: v.string(),
                fullName: v.string(),
                email: v.optional(v.string()),
                department: v.optional(v.string()),
                jobTitle: v.optional(v.string()),
                isDisabled: v.boolean(),
                lastActiveOn: v.optional(v.string()),
                lastSyncedAt: v.number(),
            })
        ),
        activities: v.array(
            v.object({
                dynamicsUserId: v.string(),
                entityType: v.string(),
                count: v.number(),
                syncedAt: v.number(),
            })
        ),
    },
    handler: async (ctx, { users, activities }) => {
        for (const user of users) {
            const existing = await ctx.db
                .query("adoptionUsers")
                .withIndex("by_dynamics_id", (q) => q.eq("dynamicsId", user.dynamicsId))
                .first();
            if (existing) {
                await ctx.db.patch(existing._id, user);
            } else {
                await ctx.db.insert("adoptionUsers", user);
            }
        }

        for (const activity of activities) {
            const existing = await ctx.db
                .query("adoptionActivity")
                .withIndex("by_user_entity", (q) =>
                    q.eq("dynamicsUserId", activity.dynamicsUserId).eq("entityType", activity.entityType)
                )
                .first();
            if (existing) {
                await ctx.db.patch(existing._id, activity);
            } else {
                await ctx.db.insert("adoptionActivity", activity);
            }
        }
    },
});

export const getAdoptionData = query({
    args: {},
    handler: async (ctx) => {
        const users = await ctx.db.query("adoptionUsers").collect();
        const activities = await ctx.db.query("adoptionActivity").collect();

        const activityByUser: Record<string, Record<string, number>> = {};
        for (const a of activities) {
            if (!activityByUser[a.dynamicsUserId]) activityByUser[a.dynamicsUserId] = {};
            activityByUser[a.dynamicsUserId][a.entityType] = a.count;
        }

        const lastSyncedAt =
            users.length > 0 ? Math.max(...users.map((u) => u.lastSyncedAt)) : null;

        return {
            users: users.map((u) => ({
                ...u,
                activity: activityByUser[u.dynamicsId] ?? {},
            })),
            lastSyncedAt,
        };
    },
});

// ── Milestones ──────────────────────────────────────────────────────────────

export const getMilestones = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("milestones").collect();
    },
});

export const seedMilestones = mutation({
    args: {
        milestones: v.array(
            v.object({
                key: v.string(),
                label: v.string(),
                role: v.string(),
                quarter: v.string(),
                completed: v.boolean(),
            })
        ),
    },
    handler: async (ctx, { milestones }) => {
        await requireAdmin(ctx);
        for (const m of milestones) {
            const existing = await ctx.db
                .query("milestones")
                .withIndex("by_key", (q) => q.eq("key", m.key))
                .first();
            if (!existing) {
                await ctx.db.insert("milestones", m);
            }
        }
    },
});

export const toggleMilestone = mutation({
    args: {
        id: v.id("milestones"),
        completed: v.boolean(),
    },
    handler: async (ctx, { id, completed }) => {
        await requireAdmin(ctx);
        await ctx.db.patch(id, {
            completed,
            completedAt: completed ? Date.now() : undefined,
        });
    },
});
