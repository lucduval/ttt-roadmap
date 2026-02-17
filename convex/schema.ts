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
});
