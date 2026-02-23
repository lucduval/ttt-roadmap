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

export const seedAllOKRData = mutation({
    args: {},
    handler: async (ctx) => {
        const flag = await ctx.db
            .query("appMetadata")
            .withIndex("by_key", (q) => q.eq("key", "okrFullSeedV1"))
            .first();
        if (flag) return;

        // ── Annual Objectives ──────────────────────────────────────────────────

        const objectives = [
            // Tech
            { pillar: "Tech", objective: "Full Group adoption of TTT System", owner: "Tori" },
            { pillar: "Tech", objective: "Launch an AI-powered financial advisory tool that increases cross-selling opportunities by 15%", owner: "Riivo" },
            { pillar: "Tech", objective: "Empower Employees with Cutting-Edge Tools to Drive Efficiency", owner: "Riivo" },
            // Growth
            { pillar: "Growth", objective: "Growing and motivating the sales team", owner: "Cheldeen" },
            { pillar: "Growth", objective: "Stretching sales to achieve revenue targets for all 4 services", owner: "Cheldeen" },
            { pillar: "Growth", objective: "Continue the development of the revolutionary hub & Increase revenue by 100%", owner: "Tori" },
            { pillar: "Growth", objective: "Lay the groundwork to reach our team target", owner: "Sheri" },
            { pillar: "Growth", objective: "Accelerate revenue sales through alignment", owner: "James & Kelly" },
            { pillar: "Growth", objective: "Transform into a growth focused division", owner: "Bran & Netasha" },
            { pillar: "Growth", objective: "Ignite the FA team", owner: "Craig & Andrew" },
            // Diversification
            { pillar: "Diversification", objective: "Infiltrate real estate industry", owner: undefined },
            { pillar: "Diversification", objective: "Providing deeper financial clarity to existing tax base", owner: undefined },
            { pillar: "Diversification", objective: "Identify and pursue acquisition opportunities", owner: undefined },
            // Culture
            { pillar: "Culture", objective: "Foster a culture of productivity, respect, improvement and transformation", owner: undefined },
            { pillar: "Culture", objective: "Establish Employee Share Incentive Scheme", owner: undefined },
            // Brand
            { pillar: "Brand", objective: "Support the Transformation of TTT by expanding the reach and strength of the brand", owner: undefined },
        ];
        for (const o of objectives) {
            await ctx.db.insert("okrAnnualObjectives", o);
        }

        // ── Key Results ────────────────────────────────────────────────────────

        const keyResults = [
            // Tech — Full Group adoption of TTT System (Q1)
            { pillar: "Tech", objective: "Full Group adoption of TTT System", keyResult: "Establish new OPSCO team", owner: "Tori", target: 1, current: 0, progress: 0, status: "Red", confidence: 5, quarter: "Q1" },
            { pillar: "Tech", objective: "Full Group adoption of TTT System", keyResult: "TTT Academy on the system", owner: "Tori", target: 1, current: 0, progress: 0, status: "Red", confidence: 5, quarter: "Q1" },

            // Tech — AI-powered financial advisory tool (Q1)
            { pillar: "Tech", objective: "Launch an AI-powered financial advisory tool that increases cross-selling opportunities by 15%", keyResult: "Achieve a 50% adoption rate of self service tools", owner: "Riivo", target: 50, current: 0, progress: 0, status: "Red", confidence: 5, quarter: "Q1" },
            { pillar: "Tech", objective: "Launch an AI-powered financial advisory tool that increases cross-selling opportunities by 15%", keyResult: "Launch an AI-powered financial advisory tool for clients", owner: "Riivo", target: 1, current: 0, progress: 0, status: "Red", confidence: 5, quarter: "Q1" },
            { pillar: "Tech", objective: "Launch an AI-powered financial advisory tool that increases cross-selling opportunities by 15%", keyResult: "WhatsApp integration into CRM", owner: "Riivo", target: 1, current: 0, progress: 0, status: "Red", confidence: 5, quarter: "Q1" },

            // Tech — Empower Employees (Q1)
            { pillar: "Tech", objective: "Empower Employees with Cutting-Edge Tools to Drive Efficiency", keyResult: "TTT System CRM integration across the entire group by Q4", owner: "Riivo", target: 1, current: 0, progress: 0, status: "Red", confidence: 5, quarter: "Q1" },
            { pillar: "Tech", objective: "Empower Employees with Cutting-Edge Tools to Drive Efficiency", keyResult: "Reduce commission earner compilation time by 80% through the bank statement tool, 100% adoption rate", owner: "Riivo", target: 80, current: 0, progress: 0, status: "Red", confidence: 5, quarter: "Q1" },
            { pillar: "Tech", objective: "Empower Employees with Cutting-Edge Tools to Drive Efficiency", keyResult: "Reduce client email queries and calls by 50% by Q4", owner: "Riivo", target: 50, current: 0, progress: 0, status: "Red", confidence: 5, quarter: "Q1" },

            // Growth — Growing and motivating the sales team — missing Q1 KR only
            { pillar: "Growth", objective: "Growing and motivating sales team", keyResult: "Develop BA recruitment and onboarding program", owner: "Cheldeen", target: 1, current: 0, progress: 0, status: "Red", confidence: 5, quarter: "Q1" },

            // Growth — Admin Hub (Q1)
            { pillar: "Growth", objective: "Continue the development of the revolutionary hub & Increase revenue by 100%", keyResult: "Revenue target from marketers", owner: "Tori", target: 1, current: 0, progress: 0, status: "Red", confidence: 5, quarter: "Q1" },
            { pillar: "Growth", objective: "Continue the development of the revolutionary hub & Increase revenue by 100%", keyResult: "Recruitment", owner: "Tori", target: 1, current: 0, progress: 0, status: "Red", confidence: 5, quarter: "Q1" },

            // Growth — CT book (Q1)
            { pillar: "Growth", objective: "Lay the groundwork to reach our team target", keyResult: "Recruitment of 2 Tax Admin", owner: "Sheri", target: 2, current: 0, progress: 0, status: "Red", confidence: 5, quarter: "Q1" },
            { pillar: "Growth", objective: "Lay the groundwork to reach our team target", keyResult: "Develop team reward system and achieve buy-in", owner: "Sheri", target: 1, current: 0, progress: 0, status: "Red", confidence: 5, quarter: "Q1" },

            // Growth — Accounting (Q1)
            { pillar: "Growth", objective: "Accelerate revenue sales through alignment", keyResult: "Generate R30k pm revenue through increases on existing base", owner: "James & Kelly", target: 30000, current: 0, progress: 0, status: "Red", confidence: 5, quarter: "Q1" },
            { pillar: "Growth", objective: "Accelerate revenue sales through alignment", keyResult: "R50k new monthly revenue on sales", owner: "James & Kelly", target: 50000, current: 0, progress: 0, status: "Red", confidence: 5, quarter: "Q1" },
            { pillar: "Growth", objective: "Accelerate revenue sales through alignment", keyResult: "Recruit 2 new accountants", owner: "James & Kelly", target: 2, current: 0, progress: 0, status: "Red", confidence: 5, quarter: "Q1" },

            // Growth — Short Term (Q1)
            { pillar: "Growth", objective: "Transform into a growth focused division", keyResult: "Achieve R28k pm in net revenue growth", owner: "Bran & Netasha", target: 28000, current: 0, progress: 0, status: "Red", confidence: 5, quarter: "Q1" },
            { pillar: "Growth", objective: "Transform into a growth focused division", keyResult: "Contact and visit 100% of renewals >R5kpm", owner: "Bran & Netasha", target: 100, current: 0, progress: 0, status: "Red", confidence: 5, quarter: "Q1" },
            { pillar: "Growth", objective: "Transform into a growth focused division", keyResult: "Readjust portfolios and use admin hub appropriately to improve efficiencies", owner: "Bran & Netasha", target: 1, current: 0, progress: 0, status: "Red", confidence: 5, quarter: "Q1" },
            { pillar: "Growth", objective: "Transform into a growth focused division", keyResult: "Generate 100 leads from FA's", owner: "Bran & Netasha", target: 100, current: 0, progress: 0, status: "Red", confidence: 5, quarter: "Q1" },
            { pillar: "Growth", objective: "Transform into a growth focused division", keyResult: "Achieve 50% closing ratio on TTT leads", owner: "Bran & Netasha", target: 50, current: 0, progress: 0, status: "Red", confidence: 5, quarter: "Q1" },

            // Growth — FA team (Q1)
            { pillar: "Growth", objective: "Ignite the FA team", keyResult: "Achieve R50k pm average across FA's", owner: "Craig & Andrew", target: 50000, current: 0, progress: 0, status: "Red", confidence: 5, quarter: "Q1" },
            { pillar: "Growth", objective: "Ignite the FA team", keyResult: "R150m TTT AUM by end of Q1", owner: "Craig & Andrew", target: 150, current: 0, progress: 0, status: "Red", confidence: 5, quarter: "Q1" },
            { pillar: "Growth", objective: "Ignite the FA team", keyResult: "Document tiered system for ongoing fees", owner: "Craig & Andrew", target: 1, current: 0, progress: 0, status: "Red", confidence: 5, quarter: "Q1" },
            { pillar: "Growth", objective: "Ignite the FA team", keyResult: "3 new FA's", owner: "Craig & Andrew", target: 3, current: 0, progress: 0, status: "Red", confidence: 5, quarter: "Q1" },

            // Diversification — Infiltrate real estate (Q1)
            { pillar: "Diversification", objective: "Infiltrate real estate industry", keyResult: "150 clients on fixed pricing", owner: undefined, target: 150, current: 0, progress: 0, status: "Red", confidence: 5, quarter: "Q1" },

            // Diversification — Deeper financial clarity (Q1)
            { pillar: "Diversification", objective: "Providing deeper financial clarity to existing tax base", keyResult: "5% of TTT clients with 2 products by end of Q4", owner: undefined, target: 5, current: 0, progress: 0, status: "Red", confidence: 5, quarter: "Q1" },

            // Culture — Foster culture (Q1)
            { pillar: "Culture", objective: "Foster a culture of productivity, respect, improvement and transformation", keyResult: "Staff retention of 90%", owner: undefined, target: 90, current: 0, progress: 0, status: "Red", confidence: 5, quarter: "Q1" },
            { pillar: "Culture", objective: "Foster a culture of productivity, respect, improvement and transformation", keyResult: "Ongoing training and CPD", owner: undefined, target: 1, current: 0, progress: 0, status: "Red", confidence: 5, quarter: "Q1" },
            { pillar: "Culture", objective: "Foster a culture of productivity, respect, improvement and transformation", keyResult: "Study offering available to staff", owner: undefined, target: 1, current: 0, progress: 0, status: "Red", confidence: 5, quarter: "Q1" },
            { pillar: "Culture", objective: "Foster a culture of productivity, respect, improvement and transformation", keyResult: "Health and wellness activities on offer", owner: undefined, target: 1, current: 0, progress: 0, status: "Red", confidence: 5, quarter: "Q1" },

            // Culture — Share incentive scheme (Q1)
            { pillar: "Culture", objective: "Establish Employee Share Incentive Scheme", keyResult: "100% of managers to invest in management share scheme", owner: undefined, target: 100, current: 0, progress: 0, status: "Red", confidence: 5, quarter: "Q1" },

            // Brand (Q1)
            { pillar: "Brand", objective: "Support the Transformation of TTT by expanding the reach and strength of the brand", keyResult: "Achieve 35,000 followers across all social media platforms", owner: undefined, target: 35000, current: 0, progress: 0, status: "Red", confidence: 5, quarter: "Q1" },
            { pillar: "Brand", objective: "Support the Transformation of TTT by expanding the reach and strength of the brand", keyResult: "Generate revenue through direct marketing efforts", owner: undefined, target: 1, current: 0, progress: 0, status: "Red", confidence: 5, quarter: "Q1" },
        ];
        for (const kr of keyResults) {
            await ctx.db.insert("okrKeyResults", kr);
        }

        await ctx.db.insert("appMetadata", { key: "okrFullSeedV1", value: "done" });
    },
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function deriveStatus(
    current: number,
    thresholdAmber: number | undefined,
    thresholdGreen: number | undefined,
    fallback: string,
): string {
    if (thresholdAmber === undefined || thresholdGreen === undefined) return fallback;
    if (current >= thresholdGreen) return "Green";
    if (current >= thresholdAmber) return "Amber";
    return "Red";
}

// ─── Mutations ──────────────────────────────────────────────────────────────

export const updateKeyResult = mutation({
    args: {
        id: v.id("okrKeyResults"),
        pillar: v.optional(v.string()),
        objective: v.optional(v.string()),
        keyResult: v.optional(v.string()),
        owner: v.optional(v.string()),
        target: v.optional(v.number()),
        current: v.optional(v.number()),
        progress: v.optional(v.number()),
        status: v.optional(v.string()),
        confidence: v.optional(v.number()),
        quarter: v.optional(v.string()),
        thresholdAmber: v.optional(v.number()),
        thresholdGreen: v.optional(v.number()),
    },
    handler: async (ctx, { id, ...fields }) => {
        const existing = await ctx.db.get(id);
        if (!existing) return;

        const thresholdAmber = fields.thresholdAmber ?? existing.thresholdAmber;
        const thresholdGreen = fields.thresholdGreen ?? existing.thresholdGreen;
        const current = fields.current ?? existing.current;
        const resolvedStatus = deriveStatus(current, thresholdAmber, thresholdGreen, fields.status ?? existing.status);

        const updates: Record<string, number | string | undefined> = {};
        if (fields.pillar !== undefined) updates.pillar = fields.pillar;
        if (fields.objective !== undefined) updates.objective = fields.objective;
        if (fields.keyResult !== undefined) updates.keyResult = fields.keyResult;
        if (fields.owner !== undefined) updates.owner = fields.owner;
        if (fields.target !== undefined) updates.target = fields.target;
        if (fields.current !== undefined) updates.current = fields.current;
        if (fields.progress !== undefined) updates.progress = fields.progress;
        if (fields.confidence !== undefined) updates.confidence = fields.confidence;
        if (fields.quarter !== undefined) updates.quarter = fields.quarter;
        if (fields.thresholdAmber !== undefined) updates.thresholdAmber = fields.thresholdAmber;
        if (fields.thresholdGreen !== undefined) updates.thresholdGreen = fields.thresholdGreen;
        updates.status = resolvedStatus;

        await ctx.db.patch(id, updates);
    },
});

export const addKeyResult = mutation({
    args: {
        pillar: v.string(),
        objective: v.string(),
        keyResult: v.string(),
        owner: v.optional(v.string()),
        target: v.number(),
        current: v.number(),
        progress: v.number(),
        status: v.string(),
        confidence: v.number(),
        quarter: v.optional(v.string()),
        thresholdAmber: v.optional(v.number()),
        thresholdGreen: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const status = deriveStatus(args.current, args.thresholdAmber, args.thresholdGreen, args.status);
        return await ctx.db.insert("okrKeyResults", { ...args, status });
    },
});

export const migrateAnnualToQ1 = mutation({
    args: {},
    handler: async (ctx) => {
        const allKRs = await ctx.db.query("okrKeyResults").collect();
        const annualKRs = allKRs.filter((kr) => kr.quarter === "Annual" || !kr.quarter);
        for (const kr of annualKRs) {
            await ctx.db.patch(kr._id, { quarter: "Q1" });
        }
        return { updated: annualKRs.length };
    },
});

export const deleteKeyResult = mutation({
    args: { id: v.id("okrKeyResults") },
    handler: async (ctx, { id }) => {
        await ctx.db.delete(id);
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
