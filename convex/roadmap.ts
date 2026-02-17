import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all roadmap data (departments + features nested)
export const getExploreData = query({
    args: {},
    handler: async (ctx) => {
        const departments = await ctx.db.query("departments").collect();
        const allFeatures = await ctx.db.query("features").collect();

        // Reconstruct the nested structure the frontend expects
        return departments.map(dept => {
            const deptFeatures = allFeatures.filter(f => f.departmentId === dept.id);
            return {
                ...dept,
                features: deptFeatures.map(f => ({
                    ...f,
                    whatsapp: f.whatsapp || null, // convert undefined back to null if needed
                    _id: f._id // Include ID for updates
                }))
            };
        });
    },
});

export const addFeature = mutation({
    args: {
        departmentId: v.string(),
        title: v.string(),
        description: v.string(),
        whatsapp: v.optional(v.string()),
        status: v.string(),
        docs: v.array(v.string()),
        startDate: v.optional(v.string()),
        endDate: v.optional(v.string()),
        progress: v.optional(v.number()),
        metricId: v.optional(v.id("metrics")),
    },
    handler: async (ctx, args) => {
        await ctx.db.insert("features", args);
    },
});

export const updateFeature = mutation({
    args: {
        id: v.id("features"),
        departmentId: v.string(),
        title: v.string(),
        description: v.string(),
        whatsapp: v.optional(v.string()),
        status: v.string(),
        docs: v.array(v.string()),
        startDate: v.optional(v.string()),
        endDate: v.optional(v.string()),
        progress: v.optional(v.number()),
        metricId: v.optional(v.id("metrics")),
    },
    handler: async (ctx, args) => {
        const { id, ...rest } = args;
        await ctx.db.patch(id, rest);
    },
});

export const deleteFeature = mutation({
    args: {
        id: v.id("features"),
    },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});

export const updateFeatureDates = mutation({
    args: {
        id: v.id("features"),
        startDate: v.string(),
        endDate: v.string(),
    },
    handler: async (ctx, args) => {
        const { id, startDate, endDate } = args;
        await ctx.db.patch(id, { startDate, endDate });
    },
});


// Delete all features so they can be re-seeded with updated data
export const deleteAllFeatures = mutation({
    args: {},
    handler: async (ctx) => {
        const features = await ctx.db.query("features").collect();
        for (const feature of features) {
            await ctx.db.delete(feature._id);
        }
        return { deleted: features.length };
    },
});

// Reset the features_seeded flag so seedRoadmapFeatures can run again once
export const resetFeaturesSeed = mutation({
    args: {},
    handler: async (ctx) => {
        const seeded = await ctx.db
            .query("appMetadata")
            .withIndex("by_key", q => q.eq("key", "features_seeded"))
            .first();
        if (seeded) {
            await ctx.db.delete(seeded._id);
            return { reset: true };
        }
        return { reset: false, message: "No seed flag found — already clear." };
    },
});

// Seed function
export const seed = mutation({
    args: {
        departments: v.array(v.object({
            id: v.string(),
            name: v.string(),
            role: v.string(),
            description: v.string(),
            icon: v.string(),
            features: v.array(v.object({
                title: v.string(),
                description: v.string(),
                whatsapp: v.union(v.string(), v.null()),
                status: v.string(),
                docs: v.array(v.string()),
            }))
        }))
    },
    handler: async (ctx, args) => {
        const existingDepts = await ctx.db.query("departments").collect();
        if (existingDepts.length === 0) {
            for (const dept of args.departments) {
                await ctx.db.insert("departments", {
                    id: dept.id,
                    name: dept.name,
                    role: dept.role,
                    description: dept.description,
                    icon: dept.icon,
                });

                for (const feature of dept.features) {
                    await ctx.db.insert("features", {
                        departmentId: dept.id,
                        title: feature.title,
                        description: feature.description,
                        whatsapp: feature.whatsapp || undefined,
                        status: feature.status,
                        docs: feature.docs,
                    });
                }
            }
        }
    }
});

export const seedDefaults = mutation({
    args: {},
    handler: async (ctx) => {
        const existingDepts = await ctx.db.query("departments").collect();
        if (existingDepts.length === 0) {
            const departments = [
                { id: "tax", name: "Tax", role: "Tax Consultants", description: "Tax Compliance & Advisory", icon: "FileText" },
                { id: "insurance", name: "Insurance", role: "Insurance Brokers", description: "Risk Management & coverage", icon: "Shield" },
                { id: "accounting", name: "Accounting", role: "Accountants", description: "Financial Reporting & Bookkeeping", icon: "Calculator" },
                { id: "fa", name: "Financial Advisory", role: "Financial Advisors", description: "Wealth Management & Investment", icon: "TrendingUp" },
                { id: "group", name: "Group", role: "Group Admin", description: "Group Operations & Strategy", icon: "Users" },
            ];

            for (const dept of departments) {
                await ctx.db.insert("departments", dept);
            }
        }
    }
});

export const seedRoadmapFeatures = mutation({
    args: {},
    handler: async (ctx) => {
        // Check if we've already seeded — once seeded, never re-seed
        const seeded = await ctx.db
            .query("appMetadata")
            .withIndex("by_key", q => q.eq("key", "features_seeded"))
            .first();
        if (seeded) {
            return { inserted: 0, skipped: 0, alreadySeeded: true };
        }

        const existingFeatures = await ctx.db.query("features").collect();
        const existingTitles = new Set(existingFeatures.map(f => f.title));

        const metrics = await ctx.db.query("metrics").collect();
        const metricByFocus: Record<string, any> = {};
        for (const m of metrics) {
            metricByFocus[m.focus] = m._id;
        }

        const features = [
            // ── PM-Led Items ──
            {
                departmentId: "group",
                title: "Training Rollout Program",
                description: "Prioritize training on existing CRM functionality before introducing new features. Create structured training content, schedule division-specific sessions, and establish a regular training cadence. Somerset West office as the training hub.",
                status: "In Development",
                progress: 40,
                startDate: "2026-01-05",
                endDate: "2026-03-31",
                docs: [],
                metricFocus: "System Adoption",
            },
            {
                departmentId: "group",
                title: "Division Champion Program",
                description: "Establish division champions in each department responsible for driving local system adoption. Champions run training sessions, answer questions, report adoption issues, and serve as the bridge between the product team and end users.",
                status: "In Development",
                progress: 35,
                startDate: "2026-01-15",
                endDate: "2026-03-31",
                docs: [],
                metricFocus: "System Adoption",
            },
            {
                departmentId: "group",
                title: "Level 1 Eligible Task Definition",
                description: "Define and document the specific list of Level 1 tasks eligible for auto-resolution. Scope limited to binary and low-complexity queries with clear rules and deterministic outcomes. Exclude complex cases requiring human judgement.",
                status: "In Development",
                progress: 45,
                startDate: "2026-01-15",
                endDate: "2026-03-31",
                docs: [],
                metricFocus: "Level 1 Case Auto-resolution",
            },
            {
                departmentId: "insurance",
                title: "Go4Broker Assessment & Migration Planning",
                description: "Evaluate continued use of Go4Broker vs full CRM migration for short-term insurance operations. Cost-benefit analysis, feature gap assessment, and migration planning if CRM migration is the chosen path.",
                status: "In Development",
                progress: 30,
                startDate: "2026-01-15",
                endDate: "2026-03-31",
                docs: [],
                metricFocus: null,
            },

            // ── CRM Dev: Digital Compliance / Quickly Sign Cluster ──
            {
                departmentId: "tax",
                title: "LOE Digital Signing via Quickly Sign",
                description: "Implement digital signing for Letters of Engagement via Quickly Sign. Shorten time-to-sign, reduce drop-off rates, and track the full conversion funnel from LOE issued to signed to paying client. Identify and address leakage points in the process.",
                status: "In Development",
                progress: 25,
                startDate: "2026-01-15",
                endDate: "2026-03-15",
                docs: [],
                metricFocus: "Digital Compliance",
            },
            {
                departmentId: "group",
                title: "Compliance Dashboard by Document Type & SLA",
                description: "Build compliance reporting dashboard showing digital signing rates by document type (LOE, approval, audit, consent) and turnaround time against SLA. Track conversion rates and identify bottlenecks across all divisions.",
                status: "In Development",
                progress: 20,
                startDate: "2026-01-15",
                endDate: "2026-03-31",
                docs: [],
                metricFocus: "Digital Compliance",
            },
            {
                departmentId: "accounting",
                title: "Approval Forms with Auto-Generated Summaries",
                description: "Digitize expense approval forms for tax clients with auto-generated summaries. Enable full e-signature workflow within SLA requirements. Reduce manual data entry and paper-based approval bottlenecks.",
                status: "Planning",
                progress: 5,
                startDate: "2026-03-15",
                endDate: "2026-04-15",
                docs: [],
                metricFocus: "Digital Compliance",
            },
            {
                departmentId: "fa",
                title: "Audit & Consent Form E-Signing",
                description: "Enable digital signing of audit documents and FA consent forms via Quickly Sign. Full compliance tracking with document type classification and SLA monitoring. Report by LOE, approval, audit, and consent categories.",
                status: "Planning",
                progress: 0,
                startDate: "2026-03-15",
                endDate: "2026-04-30",
                docs: [],
                metricFocus: "Digital Compliance",
            },

            // ── CRM Dev: FA Lead Generation ──
            {
                departmentId: "fa",
                title: "Data Mining Scoring Rules Engine",
                description: "Define and implement lead scoring rules using ITA/RTA-34, RP5 data, bank statements, income indicators, communication history and engagement patterns. Rules defined centrally with automated scoring and ranking of prospects.",
                status: "In Development",
                progress: 20,
                startDate: "2026-01-15",
                endDate: "2026-04-30",
                docs: [],
                metricFocus: "FA Lead Generation",
            },

            // ── CRM Dev: Case Management & Billing ──
            {
                departmentId: "group",
                title: "Case Management",
                description: "Enhanced case management with Industry as a key field on cases for better segmentation and reporting. Include visibility into which clients haven't submitted this year so consultants can identify opportunities and proactively follow up.",
                status: "Discovery",
                progress: 0,
                startDate: "2026-04-01",
                endDate: "2026-05-15",
                docs: [],
                metricFocus: null,
            },
            {
                departmentId: "accounting",
                title: "Xero Integration",
                description: "Integrate the CRM with Xero for client data synchronisation, communications tracking, reporting, and handoffs. The CRM will serve as the coordination layer without duplicating core accounting operations. Luc to work with the Accounting team to assess integration requirements and define scope.",
                status: "Discovery",
                progress: 0,
                startDate: "2026-05-01",
                endDate: "2026-07-31",
                docs: [],
                metricFocus: "System Adoption",
            },
            {
                departmentId: "tax",
                title: "Outstanding Invoice Notifications & Escalation",
                description: "Automated outstanding invoice alerts sent directly to clients with the consultant copied. If a client has an outstanding fee, notify the consultant and escalate to the manager to decide whether work should continue for that client. Structured workflow for work-stop decisions.",
                status: "Discovery",
                progress: 0,
                startDate: "2026-06-01",
                endDate: "2026-07-15",
                docs: [],
                metricFocus: null,
            },
            {
                departmentId: "tax",
                title: "Automated Monthly Client Statements",
                description: "Automated monthly statements sent on the 1st of each month to tax clients. Include line items for interest, invoices, and payments. Support optional discount and negotiation tracking. Outstanding invoices sent directly to the client with the consultant copied.",
                status: "Discovery",
                progress: 0,
                startDate: "2026-06-16",
                endDate: "2026-08-15",
                docs: [],
                metricFocus: null,
            },
            {
                departmentId: "tax",
                title: "Bad Debt Management",
                description: "Bad debt identification, tracking, and management system for the tax division. Flag overdue accounts, track aging debt, and provide reporting to manage and reduce bad debt exposure across the client base.",
                status: "Discovery",
                progress: 0,
                startDate: "2026-07-16",
                endDate: "2026-09-15",
                docs: [],
                metricFocus: null,
            },

            // ── CRM Dev: Level 1 Auto-Resolution ──
            {
                departmentId: "group",
                title: "Auto-Close Rules Engine",
                description: "Build automated rules engine to close simple support cases with correct outcomes. AI-powered classification determines case eligibility, applies resolution rules, and closes with appropriate outcome codes. Target 50% of Level 1 cases.",
                status: "Planning",
                progress: 5,
                startDate: "2026-09-01",
                endDate: "2026-10-31",
                docs: [],
                metricFocus: "Level 1 Case Auto-resolution",
            },
            {
                departmentId: "group",
                title: "Client Feedback & Auto-Acceptance Loop",
                description: "Implement client feedback mechanism for auto-resolved cases. Define waiting period after which 'no response = accepted closure'. Capture explicit feedback to validate auto-resolution quality and continuously improve rules.",
                status: "Planning",
                progress: 0,
                startDate: "2026-10-15",
                endDate: "2026-11-30",
                docs: [],
                metricFocus: "Level 1 Case Auto-resolution",
            },

            // ── External Dev: Bank Statement (Top Priority — before tax season) ──
            {
                departmentId: "fa",
                title: "Bank Statement Tool V2",
                description: "Improvements to the bank statement analysis tool focused on accuracy, language handling, and document-type classification. Initial testing planned with the Durban office before wider rollout. We'll track document collection and classification coverage against all required documents.",
                status: "In Development",
                progress: 15,
                startDate: "2026-02-01",
                endDate: "2026-05-15",
                docs: [],
                metricFocus: "FA Lead Generation",
            },

            // ── External Dev: WhatsApp Engagement (Sequential) ──
            {
                departmentId: "group",
                title: "WhatsApp Channel in All Client Touchpoints",
                description: "Include the WhatsApp contact link in every email signature, website, and client-facing document. Redirect support queries to WhatsApp as the primary servicing channel. We'll align marketing touchpoints to drive consistent WhatsApp-first behaviour across all divisions.",
                status: "In Development",
                progress: 30,
                startDate: "2026-01-15",
                endDate: "2026-02-28",
                docs: [],
                metricFocus: "WhatsApp Engagement",
            },
            {
                departmentId: "group",
                title: "Email Triage & WhatsApp Auto-Redirect",
                description: "Triage incoming support emails and auto-respond with a WhatsApp push to redirect clients to the preferred servicing channel. Reduce email volume and train client behaviour toward WhatsApp-first communication.",
                status: "Planning",
                progress: 10,
                startDate: "2026-03-01",
                endDate: "2026-04-15",
                docs: [],
                metricFocus: "WhatsApp Engagement",
            },
            {
                departmentId: "group",
                title: "New Client WhatsApp-Native Onboarding",
                description: "Onboard planned 4,500 new clients as WhatsApp-native from day one. WhatsApp becomes the default communication channel during onboarding with welcome flows, document collection, and initial servicing all via WhatsApp.",
                status: "Planning",
                progress: 15,
                startDate: "2026-04-15",
                endDate: "2026-05-31",
                docs: [],
                metricFocus: "WhatsApp Engagement",
            },
            {
                departmentId: "insurance",
                title: "WhatsApp Claims Submission",
                description: "Enable insurance claims submission and document collection via WhatsApp with pre-populated, e-signable forms. Clients can initiate claims, upload supporting documents, and sign required forms without leaving WhatsApp.",
                status: "Planning",
                progress: 5,
                startDate: "2026-06-01",
                endDate: "2026-07-15",
                docs: [],
                metricFocus: "WhatsApp Engagement",
            },
            {
                departmentId: "group",
                title: "AI WhatsApp Support Agent (Level 1)",
                description: "Deploy AI agent to handle Level 1 support queries automatically via WhatsApp. Binary and low-complexity queries resolved without human intervention. Structured workflows for common requests like document status checks, appointment scheduling, and FAQ responses.",
                status: "Discovery",
                progress: 0,
                startDate: "2026-11-01",
                endDate: "2026-12-31",
                docs: [],
                metricFocus: "WhatsApp Engagement",
            },

            // ── External Dev: System Adoption & Dashboards ──
            {
                departmentId: "group",
                title: "Office Screen Dashboards",
                description: "Deploy tailored department dashboards on office screens in Somerset West hub. Display real-time activity tracking, KPIs, and adoption metrics visible to all staff. Each department sees metrics relevant to their workflows.",
                status: "Planning",
                progress: 10,
                startDate: "2026-05-15",
                endDate: "2026-06-30",
                docs: [],
                metricFocus: "System Adoption",
            },

            // ── External Dev: Marketing Features ──
            {
                departmentId: "group",
                title: "Lead Source Tracking & Client Journey",
                description: "Track lead source attribution across campaigns, websites, and other marketing channels. Map the full client journey from first marketing touchpoint through to conversion, enabling the marketing team to measure campaign effectiveness and optimise spend.",
                status: "Discovery",
                progress: 0,
                startDate: "2026-06-15",
                endDate: "2026-08-15",
                docs: [],
                metricFocus: null,
            },
            {
                departmentId: "group",
                title: "Social Media Analytics Dashboard",
                description: "Build a social media analytics dashboard for tracking campaign performance across platforms. Similar in style to existing dashboards, providing the marketing team with visibility into engagement, reach, conversions, and ROI from social media activity.",
                status: "Discovery",
                progress: 0,
                startDate: "2026-08-15",
                endDate: "2026-10-15",
                docs: [],
                metricFocus: null,
            },

            // ── External Dev: Short-Term Insurance ──
            {
                departmentId: "insurance",
                title: "Short-Term Insurance Module",
                description: "Commission tracking, claims automation via WhatsApp, quote generation, and schedule extraction into line items. Full short-term insurance workflow within CRM to reduce dependency on external tools.",
                status: "Discovery",
                progress: 0,
                startDate: "2026-07-15",
                endDate: "2026-10-31",
                docs: [],
                metricFocus: null,
            },

            // ── External Dev: FA Cross-Sell ──
            {
                departmentId: "fa",
                title: "Post-Invoice Tax Savings & FA Cross-Sell Message",
                description: "After an invoice is paid, automatically send the client a personalised message showing how they could have achieved additional tax savings and provide tailored Financial Advisory advice. Drive FA lead generation through cross-selling opportunities from the existing tax client base.",
                status: "Discovery",
                progress: 0,
                startDate: "2026-10-01",
                endDate: "2026-11-15",
                docs: [],
                metricFocus: "FA Lead Generation",
            },

            // ── External Dev: HR & Onboarding ──
            {
                departmentId: "group",
                title: "HR Onboarding in CRM",
                description: "Digital onboarding checklist in CRM: contract signing, equipment provisioning, system access setup, licensing and security configuration. Reduce time-to-productivity for new hires and ensure consistent onboarding across all offices.",
                status: "Discovery",
                progress: 0,
                startDate: "2026-11-15",
                endDate: "2026-12-31",
                docs: [],
                metricFocus: "System Adoption",
            },
            {
                departmentId: "group",
                title: "Recruitment & Onboarding Dashboard",
                description: "Build recruitment and onboarding dashboard to track new hire pipeline, onboarding progress, adoption rates, and time-to-productivity metrics. Support the admin hub target with leading indicators and operating changes.",
                status: "Discovery",
                progress: 0,
                startDate: "2027-01-15",
                endDate: "2027-03-31",
                docs: [],
                metricFocus: "System Adoption",
            },
        ];

        let inserted = 0;
        for (const feature of features) {
            if (existingTitles.has(feature.title)) {
                continue;
            }

            const { metricFocus, ...featureData } = feature;
            const metricId = metricFocus ? metricByFocus[metricFocus] : undefined;

            await ctx.db.insert("features", {
                ...featureData,
                metricId: metricId || undefined,
            });
            inserted++;
        }

        // Mark seeding as done so it never runs again
        await ctx.db.insert("appMetadata", { key: "features_seeded", value: "true" });

        return { inserted, skipped: features.length - inserted };
    }
});
