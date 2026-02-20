export interface StrategicMetric {
    _id?: string; // Convex ID
    engine: string;
    focus: string;
    metric: string;
    icon: string;
    iconColor: string;
    // New fields
    description?: string;
    detailedMeasurement?: string;
    baseGoal?: string;
    targetGoal?: string;
    stretchGoal?: string;
    currentValue?: number;
}

export interface Feature {
    title: string;
    description: string;
    whatsapp: string | null;
    status: string;
    docs: string[];
    // Gantt Chart fields
    startDate?: string;
    endDate?: string;
    progress?: number;
    metricId?: string; // Convex ID reference
}

export interface Department {
    id: string;
    name: string;
    role: string;
    description: string;
    icon: string;
    features: Feature[];
}

export interface AppData {
    strategicAlignment: StrategicMetric[];
    departmentRoadmap: Department[];
}

// ─── OKR Types ───────────────────────────────────────────────────────────────

export type OKRPillar = "Tech" | "Diversification" | "Growth" | "Culture" | "Brand";
export type OKRStatus = "Green" | "Amber" | "Red";

export interface FiveYearTarget {
    _id?: string;
    pillar: string;
    target: string;
    owner?: string;
    currentPosition?: string;
    targetValue?: string;
}

export interface AnnualObjective {
    _id?: string;
    pillar: string;
    objective: string;
    owner?: string;
    linkedTarget?: string;
    successMetric?: string;
}

export interface KeyResult {
    _id?: string;
    pillar: string;
    objective: string;
    keyResult: string;
    owner?: string;
    target: number;
    current: number;
    progress: number; // 0–1 decimal
    status: OKRStatus;
    confidence: number; // 1–10
    quarter?: string;
}

export interface WeeklyEntry {
    _id?: string;
    week: string;
    pillar: string;
    objective: string;
    keyResult: string;
    owner?: string;
    target?: number;
    current?: number;
    progress?: number;
    status?: string;
    blockers?: string;
    decisionRequired?: string;
}
