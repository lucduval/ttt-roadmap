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
