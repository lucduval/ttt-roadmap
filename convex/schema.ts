import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    appMetadata: defineTable({
        key: v.string(),
        value: v.string(),
    }).index("by_key", ["key"]),
    metrics: defineTable({
        engine: v.string(),
        focus: v.string(),
        metric: v.string(),
        icon: v.string(),
        iconColor: v.string(),
        // New fields for refactor (optional for now to allow migration)
        description: v.optional(v.string()),
        detailedMeasurement: v.optional(v.string()),
        baseGoal: v.optional(v.string()),
        targetGoal: v.optional(v.string()),
        stretchGoal: v.optional(v.string()),
        currentValue: v.optional(v.number()),
        quarterlyTargets: v.optional(v.array(v.object({
            quarter: v.union(v.literal('Q1'), v.literal('Q2'), v.literal('Q3'), v.literal('Q4')),
            baseGoal: v.string(),
            targetGoal: v.string(),
            stretchGoal: v.string(),
        }))),
        metricDefinitions: v.optional(v.array(v.object({
            sectionTitle: v.string(),
            items: v.array(v.string()),
        }))),
    }),
    departments: defineTable({
        id: v.string(), // e.g. "fa"
        name: v.string(),
        role: v.string(),
        description: v.string(),
        icon: v.string(),
    }).index("by_custom_id", ["id"]),
    features: defineTable({
        departmentId: v.string(), // link to departments.id
        title: v.string(),
        description: v.string(),
        whatsapp: v.optional(v.string()), // can be null in original data, so optional here
        status: v.string(),
        docs: v.array(v.string()),
        originalIndex: v.optional(v.number()), // To preserve ordering if needed
        // New fields for Gantt charts
        startDate: v.optional(v.string()), // ISO date string
        endDate: v.optional(v.string()), // ISO date string
        progress: v.optional(v.number()), // 0-100
        metricId: v.optional(v.id("metrics")), // Link to Strategic Metric
    }).index("by_department", ["departmentId"]),

    // OKR Tables
    okrFiveYearTargets: defineTable({
        pillar: v.string(),
        target: v.string(),
        owner: v.optional(v.string()),
        currentPosition: v.optional(v.string()),
        targetValue: v.optional(v.string()),
    }).index("by_pillar", ["pillar"]),

    okrAnnualObjectives: defineTable({
        pillar: v.string(),
        objective: v.string(),
        owner: v.optional(v.string()),
        linkedTarget: v.optional(v.string()),
        successMetric: v.optional(v.string()),
    }).index("by_pillar", ["pillar"]),

    okrKeyResults: defineTable({
        pillar: v.string(),
        objective: v.string(),
        keyResult: v.string(),
        owner: v.optional(v.string()),
        target: v.number(),
        current: v.number(),
        progress: v.number(), // 0–1 decimal
        status: v.string(), // "Green" | "Amber" | "Red"
        confidence: v.number(), // 1–10
        quarter: v.optional(v.union(v.literal("Q1"), v.literal("Q2"), v.literal("Q3"), v.literal("Q4"))),
        targetValue: v.optional(v.number()), // end-of-quarter target (e.g. 100 for 100%)
        thresholdAmber: v.optional(v.number()), // current >= this → Amber
        thresholdGreen: v.optional(v.number()), // current >= this → Green
    }).index("by_pillar", ["pillar"]).index("by_quarter", ["quarter"]),

    okrWeeklyEntries: defineTable({
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
    }).index("by_week", ["week"]).index("by_pillar", ["pillar"]),

    // CRM Adoption Tracking
    adoptionUsers: defineTable({
        dynamicsId: v.string(),
        fullName: v.string(),
        email: v.optional(v.string()),
        department: v.optional(v.string()),
        jobTitle: v.optional(v.string()),
        isDisabled: v.boolean(),
        lastActiveOn: v.optional(v.string()), // ISO date from Dynamics lastactivedon
        lastSyncedAt: v.number(),
    }).index("by_dynamics_id", ["dynamicsId"]),

    adoptionActivity: defineTable({
        dynamicsUserId: v.string(),
        entityType: v.string(), // "cases" | "leads" | "contacts" | "invoices"
        count: v.number(),
        syncedAt: v.number(),
    }).index("by_user_entity", ["dynamicsUserId", "entityType"]),

    // Milestone tracking for training / one-off goals
    milestones: defineTable({
        key: v.string(),          // unique key e.g. "q1_tax_ba_training"
        label: v.string(),        // display label
        role: v.string(),         // role this milestone belongs to
        quarter: v.string(),      // "Q1" | "Q2" | "Q3" | "Q4"
        completed: v.boolean(),
        completedAt: v.optional(v.number()),
        completedBy: v.optional(v.string()),
    }).index("by_key", ["key"]).index("by_quarter", ["quarter"]),

    opportunityData: defineTable({
        opportunityId: v.string(),  // riivo_opportunityid
        isAutomated: v.boolean(),   // riivo_automatedopportunity
        createdOn: v.string(),      // createdon (ISO)
        syncedAt: v.number(),
    }).index("by_opportunity_id", ["opportunityId"]),
});
