// ── Role Configuration for 2026 Metrics ─────────────────────────────────────
// Maps Dynamics job titles to metric roles, defines targets, and required actions.

export type MetricRole =
    | 'Tax (BAs)'
    | 'Tax (Marketers)'
    | 'Tax (Admin Hub)'
    | 'Financial Advisors'
    | 'Insurance'
    | 'Accounting'
    | 'Management';

export type Quarter = 'Q1' | 'Q2' | 'Q3' | 'Q4';

export interface RoleAction {
    name: string;
    measurement: string;
    timeline: string;
    /** Which activity entity type(s) from Dynamics map to this action */
    activityKeys: string[];
}

export interface RoleConfig {
    label: MetricRole;
    color: string;
    bgColor: string;
    icon: string; // lucide icon name
    q1Target: number; // percentage
    actions: RoleAction[];
    jobTitlePatterns: string[];
}

export interface MetricPlaceholder {
    name: string;
    description: string;
    startsIn: string; // "Q2" | "Q3" | "Q4"
    targets: { base: number; target: number; stretch: number };
    unit: string; // "%" or a count label
}

// ── Job Title → Role Mapping ────────────────────────────────────────────────

const JOB_TITLE_MAP: Record<string, MetricRole> = {
    'Brand Associate': 'Tax (BAs)',
    'Brand Associates': 'Tax (BAs)',
    'Tax Marketer': 'Tax (Marketers)',
    'Admin Hub': 'Tax (Admin Hub)',
    'Financial Advisor': 'Financial Advisors',
    'Financial Advisor Assistant': 'Financial Advisors',
    'Insurance': 'Insurance',
    'Accounting': 'Accounting',
    'Executive': 'Management',
};

// Job titles that are excluded from metrics (no role mapping)
const EXCLUDED_TITLES = new Set([
    'No longer works at TTT',
    'Tax Consultant',
    'Marketing',
    'Receptionist',
]);

export function getMetricRole(jobTitle?: string): MetricRole | null {
    if (!jobTitle) return null;
    const trimmed = jobTitle.trim();
    if (EXCLUDED_TITLES.has(trimmed)) return null;

    // Exact match first
    if (JOB_TITLE_MAP[trimmed]) return JOB_TITLE_MAP[trimmed];

    // Case-insensitive match
    const lower = trimmed.toLowerCase();
    for (const [pattern, role] of Object.entries(JOB_TITLE_MAP)) {
        if (lower === pattern.toLowerCase()) return role;
    }

    return null;
}

export function isExcludedTitle(jobTitle?: string): boolean {
    if (!jobTitle) return false;
    return EXCLUDED_TITLES.has(jobTitle.trim());
}

// ── Overall Q1 Targets ──────────────────────────────────────────────────────

export const ADOPTION_TARGETS = {
    Q1: { base: 40, target: 50, stretch: 60 },
    Q2: { base: 50, target: 60, stretch: 70 },
    Q3: { base: 60, target: 70, stretch: 80 },
    Q4: { base: 70, target: 80, stretch: 90 },
} as const;

// ── Role Definitions ────────────────────────────────────────────────────────

export const ROLE_CONFIGS: RoleConfig[] = [
    {
        label: 'Tax (BAs)',
        color: '#6366f1',
        bgColor: 'bg-indigo-50',
        icon: 'Users',
        q1Target: 70,
        jobTitlePatterns: ['Brand Associate', 'Brand Associates'],
        actions: [
            {
                name: 'Lead Management',
                measurement: 'Lead creation via tablet/phone (10am–3pm)',
                timeline: 'Daily',
                activityKeys: ['leads'],
            },
            {
                name: 'OTP Creation',
                measurement: 'Unique OTP creation events (10am–3pm)',
                timeline: 'Daily',
                activityKeys: ['otpTasks'],
            },
        ],
    },
    {
        label: 'Tax (Marketers)',
        color: '#f59e0b',
        bgColor: 'bg-amber-50',
        icon: 'Megaphone',
        q1Target: 70,
        jobTitlePatterns: ['Tax Marketer'],
        actions: [
            {
                name: 'Engagement',
                measurement: 'Interaction with Leads, Contacts, Invoices, and Cases',
                timeline: 'Weekly',
                activityKeys: ['leads', 'contacts', 'invoices', 'cases'],
            },
        ],
    },
    {
        label: 'Tax (Admin Hub)',
        color: '#8b5cf6',
        bgColor: 'bg-violet-50',
        icon: 'ClipboardList',
        q1Target: 80,
        jobTitlePatterns: ['Admin Hub'],
        actions: [
            {
                name: 'Workflow Management',
                measurement: 'Task completion status transitions',
                timeline: 'Weekly',
                activityKeys: ['cases'],
            },
            {
                name: 'Data Creation',
                measurement: 'Create events for Cases, Invoices, Leads, and Contacts',
                timeline: 'Weekly',
                activityKeys: ['cases', 'invoices', 'leads', 'contacts'],
            },
        ],
    },
    {
        label: 'Financial Advisors',
        color: '#10b981',
        bgColor: 'bg-emerald-50',
        icon: 'TrendingUp',
        q1Target: 60,
        jobTitlePatterns: ['Financial Advisor', 'Financial Advisor Assistant'],
        actions: [
            {
                name: 'Opportunity Management',
                measurement: 'Opportunity stage transitions',
                timeline: 'Weekly',
                activityKeys: ['opportunities'],
            },
        ],
    },
    {
        label: 'Insurance',
        color: '#3b82f6',
        bgColor: 'bg-blue-50',
        icon: 'Shield',
        q1Target: 50,
        jobTitlePatterns: ['Insurance'],
        actions: [
            {
                name: 'Quote Management',
                measurement: 'Quote Comparisons generated (tracked in dedicated dashboard)',
                timeline: 'Weekly',
                activityKeys: [], // tracked in separate dashboard
            },
        ],
    },
    {
        label: 'Accounting',
        color: '#ec4899',
        bgColor: 'bg-pink-50',
        icon: 'Calculator',
        q1Target: 30,
        jobTitlePatterns: ['Accounting'],
        actions: [
            {
                name: 'Lead Management',
                measurement: 'Lead or Contact record interaction (Read/Update)',
                timeline: 'Weekly',
                activityKeys: ['leads', 'contacts'],
            },
            {
                name: 'System Usage',
                measurement: 'Login logs for data viewing/reading',
                timeline: 'Weekly',
                activityKeys: [], // tracked via login
            },
        ],
    },
    {
        label: 'Management',
        color: '#0ea5e9',
        bgColor: 'bg-sky-50',
        icon: 'Crown',
        q1Target: 100,
        jobTitlePatterns: ['Executive'],
        actions: [
            {
                name: 'TTT Connect',
                measurement: 'Personalised Campaigns sent to generate opportunities',
                timeline: 'Weekly',
                activityKeys: [], // tracked separately
            },
        ],
    },
];

export function getRoleConfig(role: MetricRole): RoleConfig | undefined {
    return ROLE_CONFIGS.find((r) => r.label === role);
}

// ── Placeholder Metrics (Q2/Q3/Q4) ─────────────────────────────────────────

export const PLACEHOLDER_METRICS: MetricPlaceholder[] = [
    {
        name: 'AI Document Agent',
        description: 'Intelligent agent to autonomously process incoming financial documentation (storing docs, extracting data, updating records).',
        startsIn: 'Q2',
        targets: { base: 40, target: 60, stretch: 80 },
        unit: '% of docs processed autonomously',
    },
    {
        name: 'Level 1 Case Auto-resolution',
        description: 'Using AI and logic-based rules to resolve high-volume, low-complexity support tickets without human intervention.',
        startsIn: 'Q2',
        targets: { base: 35, target: 50, stretch: 65 },
        unit: '% of L1 cases auto-resolved',
    },
    {
        name: 'WhatsApp Engagement',
        description: 'Shift from outbound push notifications to inbound pull client servicing.',
        startsIn: 'Q2',
        targets: { base: 20, target: 30, stretch: 40 },
        unit: '% of active clients with inbound thread',
    },
    {
        name: 'Digital Compliance',
        description: 'Ensuring all in-scope documents (Letters of Engagement, Audits, Consents) are executed through Quickly Sign.',
        startsIn: 'Q2',
        targets: { base: 60, target: 70, stretch: 85 },
        unit: '% of docs signed digitally',
    },
];

// ── Milestone Definitions ───────────────────────────────────────────────────

export interface MilestoneDefinition {
    key: string;
    label: string;
    role: string;
    quarter: string;
}

export const MILESTONE_DEFINITIONS: MilestoneDefinition[] = [
    {
        key: 'q1_tax_ba_training',
        label: 'Train a champion (Jabin, Val, Jean, Cheldeen) to train the rest of the team',
        role: 'Tax (BAs)',
        quarter: 'Q1',
    },
    {
        key: 'q1_insurance_training',
        label: 'Train the Insurance team on drag and drop ingestion',
        role: 'Insurance',
        quarter: 'Q1',
    },
    {
        key: 'q1_group_training',
        label: 'TTT Academy — Basic CRM training session (views, forms, personal views, apps)',
        role: 'Group (All Staff)',
        quarter: 'Q1',
    },
];

// ── Helper: check if a user is "active" for their role ──────────────────────

export function isUserActiveForRole(
    role: MetricRole,
    activity: Record<string, number>,
    lastActiveOn?: string,
    periodDays = 30,
): boolean {
    const config = getRoleConfig(role);
    if (!config) return false;

    // Only consider actions that have trackable activity keys
    const trackableActions = config.actions.filter((a) => a.activityKeys.length > 0);

    if (trackableActions.length === 0) {
        // For roles tracked by login only (e.g. Accounting system usage, Management TTT Connect)
        // Fall back to login-based activity
        if (lastActiveOn) {
            const cutoff = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);
            return new Date(lastActiveOn) >= cutoff;
        }
        return false;
    }

    // ALL required: user must have activity on every trackable action
    return trackableActions.every((action) => {
        const actionTotal = action.activityKeys.reduce((sum, key) => sum + (activity[key] ?? 0), 0);
        return actionTotal > 0;
    });
}

/** Returns per-action completion status for a user, useful for detailed views */
export function getUserActionStatus(
    role: MetricRole,
    activity: Record<string, number>,
): { name: string; met: boolean; count: number }[] {
    const config = getRoleConfig(role);
    if (!config) return [];

    return config.actions.map((action) => {
        const count = action.activityKeys.reduce((sum, key) => sum + (activity[key] ?? 0), 0);
        return {
            name: action.name,
            met: action.activityKeys.length === 0 ? false : count > 0,
            count,
        };
    });
}
