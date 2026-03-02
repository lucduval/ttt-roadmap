import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/auth";

export const get = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("metrics").collect();
    },
});

const quarterlyTargetValidator = v.optional(v.array(v.object({
    quarter: v.union(v.literal('Q1'), v.literal('Q2'), v.literal('Q3'), v.literal('Q4')),
    baseGoal: v.string(),
    targetGoal: v.string(),
    stretchGoal: v.string(),
})));

const metricDefinitionsValidator = v.optional(v.array(v.object({
    sectionTitle: v.string(),
    items: v.array(v.string()),
})));

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
        quarterlyTargets: quarterlyTargetValidator,
    },
    handler: async (ctx, args) => {
        await requireAdmin(ctx);
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
        quarterlyTargets: quarterlyTargetValidator,
        metricDefinitions: metricDefinitionsValidator,
    },
    handler: async (ctx, args) => {
        await requireAdmin(ctx);
        const { id, ...rest } = args;
        await ctx.db.patch(id, rest);
    },
});

export const updateDefinitions = mutation({
    args: {
        id: v.id("metrics"),
        metricDefinitions: v.array(v.object({
            sectionTitle: v.string(),
            items: v.array(v.string()),
        })),
    },
    handler: async (ctx, args) => {
        await requireAdmin(ctx);
        await ctx.db.patch(args.id, { metricDefinitions: args.metricDefinitions });
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
            quarterlyTargets: quarterlyTargetValidator,
        }))
    },
    handler: async (ctx, args) => {
        await requireAdmin(ctx);
        const existing = await ctx.db.query("metrics").collect();
        if (existing.length === 0) {
            for (const metric of args.metrics) {
                await ctx.db.insert("metrics", metric);
            }
        }
    }
});

// Migration: patches metric definitions onto existing metrics by focus name
export const seedDefinitions = mutation({
    args: {},
    handler: async (ctx) => {
        await requireAdmin(ctx);
        const definitionsData: Record<string, { sectionTitle: string; items: string[] }[]> = {
            "System Adoption": [
                {
                    sectionTitle: "Tax Department",
                    items: [
                        "Use core CRM functionality on a daily basis",
                        "Create and manage invoices within the system",
                        "Open, update, and resolve cases end-to-end",
                        "Work leads through the pipeline from creation to close",
                        "Maintain and update contact records consistently",
                    ],
                },
                {
                    sectionTitle: "Financial Advisors",
                    items: [
                        "Actively use the Opportunities table to track and manage deals",
                        "Navigate and use the Admin Hub for day-to-day operations",
                    ],
                },
                {
                    sectionTitle: "Accounting",
                    items: [
                        "Manage leads and track their status through the pipeline",
                        "Maintain contact records accurately and keep them up to date",
                        "Create and reconcile invoices directly in the CRM",
                    ],
                },
                {
                    sectionTitle: "Insurance",
                    items: [
                        "Work leads from creation through to closure",
                        "Keep contact records current and accurate",
                        "Manage premiums and associated client records",
                        "Use the quote comparison tool to evaluate and present options",
                    ],
                },
                {
                    sectionTitle: "All Departments — Core CRM Fundamentals",
                    items: [
                        "Understand the timeline and use it to log and track activity against records",
                        "Know how records relate to one another and navigate between them confidently",
                        "Add and rearrange columns in views to suit your workflow",
                        "Create and save personal or shared views for recurring use cases",
                        "Have access to the correct apps for your role and use them consistently",
                    ],
                },
            ],
            "FA Lead Generation": [
                {
                    sectionTitle: "Lead Quality",
                    items: [
                        "A lead is only counted as validated once it has been reviewed and confirmed as a genuine opportunity by the FA",
                        "We enforce less than 10% duplication to maintain data integrity across the pipeline",
                        "Quality takes priority — the goal is meaningful opportunities, not volume",
                    ],
                },
                {
                    sectionTitle: "Automated Generation from Client Data",
                    items: [
                        "The system surfaces leads automatically by running scoring rules against existing client data",
                        "This removes the manual effort of prospecting and ensures high-value opportunities are not missed",
                        "Leads are generated without requiring FAs to initiate the search themselves",
                    ],
                },
                {
                    sectionTitle: "ITA34 & IRP5-Driven Opportunities",
                    items: [
                        "Tax assessments (ITA34) are used to identify clients with untapped financial planning potential",
                        "Payslip data (IRP5) serves as a signal for investment, savings, and insurance conversations",
                        "These documents give us a structured, repeatable way to generate high-quality leads at scale",
                    ],
                },
                {
                    sectionTitle: "FA Pipeline Management",
                    items: [
                        "Every FA has a personal pipeline view to track their leads from first contact through to closure",
                        "The platform supports structured follow-up, status tracking, and outcome logging",
                        "Nothing falls through the cracks — every lead has a clear owner and next action",
                    ],
                },
            ],
        };

        const existing = await ctx.db.query("metrics").collect();
        for (const metric of existing) {
            if ((metric as any).metricDefinitions && (metric as any).metricDefinitions.length > 0) continue;
            const definitions = definitionsData[metric.focus];
            if (definitions) {
                await ctx.db.patch(metric._id, { metricDefinitions: definitions });
            }
        }
    },
});

// Migration: patches quarterly targets onto existing metrics by focus name
export const seedQuarterlyTargets = mutation({
    args: {},
    handler: async (ctx) => {
        await requireAdmin(ctx);
        const quarterlyData: Record<string, { quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4'; baseGoal: string; targetGoal: string; stretchGoal: string; }[]> = {
            "FA Lead Generation": [
                { quarter: "Q1", baseGoal: "200", targetGoal: "250", stretchGoal: "300" },
                { quarter: "Q2", baseGoal: "220", targetGoal: "280", stretchGoal: "340" },
                { quarter: "Q3", baseGoal: "220", targetGoal: "280", stretchGoal: "340" },
                { quarter: "Q4", baseGoal: "150", targetGoal: "190", stretchGoal: "220" },
            ],
            "System Adoption": [
                { quarter: "Q1", baseGoal: "30%", targetGoal: "40%", stretchGoal: "50%" },
                { quarter: "Q2", baseGoal: "45%", targetGoal: "55%", stretchGoal: "65%" },
                { quarter: "Q3", baseGoal: "55%", targetGoal: "65%", stretchGoal: "75%" },
                { quarter: "Q4", baseGoal: "70%", targetGoal: "80%", stretchGoal: "90%" },
            ],
            "WhatsApp Engagement": [
                { quarter: "Q2", baseGoal: "10%", targetGoal: "16%", stretchGoal: "20%" },
                { quarter: "Q3", baseGoal: "18%", targetGoal: "25%", stretchGoal: "32%" },
                { quarter: "Q4", baseGoal: "24%", targetGoal: "30%", stretchGoal: "40%" },
            ],
            "Digital Compliance": [
                { quarter: "Q2", baseGoal: "55%", targetGoal: "65%", stretchGoal: "72%" },
                { quarter: "Q3", baseGoal: "60%", targetGoal: "70%", stretchGoal: "78%" },
                { quarter: "Q4", baseGoal: "65%", targetGoal: "75%", stretchGoal: "85%" },
            ],
            "Level 1 Case Auto-resolution": [
                { quarter: "Q2", baseGoal: "20%", targetGoal: "30%", stretchGoal: "40%" },
                { quarter: "Q3", baseGoal: "30%", targetGoal: "42%", stretchGoal: "55%" },
                { quarter: "Q4", baseGoal: "40%", targetGoal: "55%", stretchGoal: "68%" },
            ],
        };

        const existing = await ctx.db.query("metrics").collect();
        for (const metric of existing) {
            // Skip if already has quarterly targets
            if ((metric as any).quarterlyTargets && (metric as any).quarterlyTargets.length > 0) continue;
            const targets = quarterlyData[metric.focus];
            if (targets) {
                await ctx.db.patch(metric._id, { quarterlyTargets: targets });
            }
        }
    },
});

