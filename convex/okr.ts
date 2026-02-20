import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ─── Queries ────────────────────────────────────────────────────────────────

export const getFiveYearTargets = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("okrFiveYearTargets").collect();
    },
});

export const getAnnualObjectives = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("okrAnnualObjectives").collect();
    },
});

export const getKeyResults = query({
    args: { quarter: v.optional(v.string()) },
    handler: async (ctx, { quarter }) => {
        if (quarter) {
            return await ctx.db
                .query("okrKeyResults")
                .withIndex("by_quarter", (q) => q.eq("quarter", quarter))
                .collect();
        }
        return await ctx.db.query("okrKeyResults").collect();
    },
});

export const getWeeklyEntries = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("okrWeeklyEntries").collect();
    },
});

// ─── Seed ───────────────────────────────────────────────────────────────────

export const seedOKRData = mutation({
    args: {},
    handler: async (ctx) => {
        // Guard: skip if already seeded
        const existing = await ctx.db.query("okrFiveYearTargets").first();
        if (existing) return;

        // 5-Year Targets (Sheet 1)
        const targets = [
            {
                pillar: "Tech",
                target: "At the tip of your fingers, you have access to all of your financial information",
                owner: "Riivo (Luc)",
                currentPosition: "10% adoption",
                targetValue: "100% adoption",
            },
            {
                pillar: "Diversification",
                target: "Majority of TTT clients utilize multiple products and services",
                owner: undefined,
                currentPosition: undefined,
                targetValue: undefined,
            },
            {
                pillar: "Growth",
                target: "Empower 50,000 families to achieve financial clarity and success",
                owner: undefined,
                currentPosition: undefined,
                targetValue: "50,000 clients",
            },
            {
                pillar: "Culture",
                target: "The best company in South Africa to work for",
                owner: undefined,
                currentPosition: undefined,
                targetValue: undefined,
            },
            {
                pillar: "Brand",
                target: "Most respected and trusted financial services company in South Africa",
                owner: undefined,
                currentPosition: undefined,
                targetValue: undefined,
            },
        ];
        for (const t of targets) {
            await ctx.db.insert("okrFiveYearTargets", t);
        }

        // Annual Objectives (Sheet 2)
        const objectives = [
            {
                pillar: "Growth",
                objective: "4500 new clients",
                owner: "Cheldeen, Andrew, Netasha",
                linkedTarget: "50,000 clients",
                successMetric: "3600 new clients",
            },
        ];
        for (const o of objectives) {
            await ctx.db.insert("okrAnnualObjectives", o);
        }

        // Q1 Key Results (Sheet 3 — real rows only)
        const keyResults = [
            {
                pillar: "Growth",
                objective: "Growing and motivating sales team",
                keyResult: "2 new BA's recruited",
                owner: "Cheldeen",
                target: 2,
                current: 1,
                progress: 0.5,
                status: "Amber",
                confidence: 8,
                quarter: "Q1",
            },
            {
                pillar: "Growth",
                objective: "Growing and motivating sales team",
                keyResult: "50 Real estate presentations",
                owner: "Cheldeen",
                target: 50,
                current: 5,
                progress: 0.1,
                status: "Red",
                confidence: 5,
                quarter: "Q1",
            },
            {
                pillar: "Growth",
                objective: "Growing and motivating sales team",
                keyResult: "150 new clients Feb + March",
                owner: "Cheldeen",
                target: 150,
                current: 19.5,
                progress: 0.13,
                status: "Red",
                confidence: 9,
                quarter: "Q1",
            },
        ];
        for (const kr of keyResults) {
            await ctx.db.insert("okrKeyResults", kr);
        }
    },
});

// ─── Mutations ──────────────────────────────────────────────────────────────

export const updateKeyResult = mutation({
    args: {
        id: v.id("okrKeyResults"),
        current: v.optional(v.number()),
        confidence: v.optional(v.number()),
        status: v.optional(v.string()),
        progress: v.optional(v.number()),
    },
    handler: async (ctx, { id, ...fields }) => {
        const updates: Record<string, number | string> = {};
        if (fields.current !== undefined) updates.current = fields.current;
        if (fields.confidence !== undefined) updates.confidence = fields.confidence;
        if (fields.status !== undefined) updates.status = fields.status;
        if (fields.progress !== undefined) updates.progress = fields.progress;
        await ctx.db.patch(id, updates);
    },
});

export const addWeeklyEntry = mutation({
    args: {
        week: v.string(),
        pillar: v.string(),
        objective: v.string(),
        keyResult: v.string(),
        owner: v.optional(v.string()),
        target: v.optional(v.number()),
        current: v.optional(v.number()),
        progress: v.optional(v.number()),
        status: v.optional(v.string()),
        blockers: v.optional(v.string()),
        decisionRequired: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("okrWeeklyEntries", args);
    },
});
