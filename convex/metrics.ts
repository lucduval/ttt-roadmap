import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("metrics").collect();
    },
});

export const add = mutation({
    args: {
        engine: v.string(),
        focus: v.string(),
        metric: v.string(),
        icon: v.string(),
        iconColor: v.string(),
        description: v.optional(v.string()),
        detailedMeasurement: v.optional(v.string()),
        baseGoal: v.optional(v.string()),
        targetGoal: v.optional(v.string()),
        stretchGoal: v.optional(v.string()),
        currentValue: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        await ctx.db.insert("metrics", args);
    },
});

export const update = mutation({
    args: {
        id: v.id("metrics"),
        engine: v.string(),
        focus: v.string(),
        metric: v.string(),
        icon: v.string(),
        iconColor: v.string(),
        description: v.optional(v.string()),
        detailedMeasurement: v.optional(v.string()),
        baseGoal: v.optional(v.string()),
        targetGoal: v.optional(v.string()),
        stretchGoal: v.optional(v.string()),
        currentValue: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const { id, ...rest } = args;
        await ctx.db.patch(id, rest);
    },
});

// Seed function to initially populate data
export const seed = mutation({
    args: {
        metrics: v.array(v.object({
            engine: v.string(),
            focus: v.string(),
            metric: v.string(),
            icon: v.string(),
            iconColor: v.string(),
            description: v.optional(v.string()),
            detailedMeasurement: v.optional(v.string()),
            baseGoal: v.optional(v.string()),
            targetGoal: v.optional(v.string()),
            stretchGoal: v.optional(v.string()),
        }))
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db.query("metrics").collect();
        if (existing.length === 0) {
            for (const metric of args.metrics) {
                await ctx.db.insert("metrics", metric);
            }
        }
    }
});
