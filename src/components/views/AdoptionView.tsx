'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import {
    RefreshCw, Users, UserCheck, UserX, Search,
    ChevronUp, ChevronDown, ChevronRight, TrendingUp, Zap,
    Target, Clock, CheckCircle2, XCircle, AlertTriangle,
    Calendar, BarChart3,
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer, ReferenceLine, Cell, ComposedChart,
} from 'recharts';
import {
    type MetricRole,
    ROLE_CONFIGS,
    ADOPTION_TARGETS,
    PLACEHOLDER_METRICS,
    MILESTONE_DEFINITIONS,
    getMetricRole,
    getRoleConfig,
    isUserActiveForRole,
    isExcludedTitle,
} from '@/lib/roleConfig';

// ── Types ────────────────────────────────────────────────────────────────────

type AdoptionStatus = 'Active' | 'Inactive';
type TimePeriod = 'this_week' | 'this_month' | 'this_quarter';
type Quarter = 'Annual' | 'Q1' | 'Q2' | 'Q3' | 'Q4';
type TabView = 'summary' | MetricRole;
type SortKey = 'fullName' | 'jobTitle' | 'lastActiveOn' | 'cases' | 'leads' | 'contacts' | 'invoices' | 'opportunities' | 'otpTasks' | 'status';

interface EnrichedUser {
    _id: string;
    dynamicsId: string;
    fullName: string;
    email?: string;
    department?: string;
    jobTitle?: string;
    lastActiveOn?: string;
    role: MetricRole | null;
    status: AdoptionStatus;
    activity: Record<string, number>;
}

// ── Calendar-aligned period helpers ──────────────────────────────────────────

function getStartOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay(); // 0=Sun
    const diff = day === 0 ? 6 : day - 1; // shift to Monday start
    d.setDate(d.getDate() - diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

function getStartOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getStartOfQuarter(date: Date): Date {
    const q = Math.floor(date.getMonth() / 3);
    return new Date(date.getFullYear(), q * 3, 1);
}

function getPeriodStart(period: TimePeriod): Date {
    const now = new Date();
    switch (period) {
        case 'this_week': return getStartOfWeek(now);
        case 'this_month': return getStartOfMonth(now);
        case 'this_quarter': return getStartOfQuarter(now);
    }
}

function getDaysForPeriod(period: TimePeriod): number {
    const start = getPeriodStart(period);
    return Math.ceil((Date.now() - start.getTime()) / (1000 * 60 * 60 * 24)) || 1;
}

function formatPeriodRange(period: TimePeriod): string {
    const start = getPeriodStart(period);
    const now = new Date();
    const fmt = (d: Date) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    return `${fmt(start)} – ${fmt(now)}`;
}

// ── Constants ────────────────────────────────────────────────────────────────

const TIME_PERIOD_OPTIONS: { value: TimePeriod; label: string }[] = [
    { value: 'this_week', label: 'This Week' },
    { value: 'this_month', label: 'This Month' },
    { value: 'this_quarter', label: 'This Quarter' },
];

const FA_LEAD_Q1 = { base: 80, target: 100, stretch: 120 };

const QUARTER_ACTIVE_METRICS: Record<string, string[]> = {
    Q1: ['System Adoption', 'FA Lead Generation'],
    Q2: ['System Adoption', 'FA Lead Generation', 'AI Document Agent', 'Level 1 Case Auto-resolution', 'WhatsApp Engagement', 'Digital Compliance'],
    Q3: ['System Adoption', 'FA Lead Generation', 'AI Document Agent', 'Level 1 Case Auto-resolution', 'WhatsApp Engagement', 'Digital Compliance'],
    Q4: ['System Adoption', 'FA Lead Generation', 'AI Document Agent', 'Level 1 Case Auto-resolution', 'WhatsApp Engagement', 'Digital Compliance'],
};

// ── Utility Functions ────────────────────────────────────────────────────────

function formatRelativeDate(iso?: string): string {
    if (!iso) return 'Never';
    const days = Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 30) return `${days}d ago`;
    if (days < 365) return `${Math.floor(days / 30)}mo ago`;
    return `${Math.floor(days / 365)}y ago`;
}

function formatSyncTime(ts: number | null): string {
    if (!ts) return 'Never';
    return new Date(ts).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function getDepartmentFromEmail(email?: string): string | undefined {
    if (!email) return undefined;
    const domain = email.split('@')[1];
    if (!domain) return undefined;
    const match = domain.match(/^ttt-(\w+)/);
    if (!match) return undefined;
    const raw = match[1];
    return raw.charAt(0).toUpperCase() + raw.slice(1);
}

// ── Small Reusable Components ────────────────────────────────────────────────

const STATUS_CONFIG: Record<AdoptionStatus, { label: string; bg: string; text: string; dot: string }> = {
    Active: { label: 'Active', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    Inactive: { label: 'Inactive', bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
};

function StatusBadge({ status }: { status: AdoptionStatus }) {
    const cfg = STATUS_CONFIG[status];
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
        </span>
    );
}

function ProgressBar({ value, base, target, stretch }: { value: number; base: number; target: number; stretch: number }) {
    const pct = Math.min(value, stretch);
    const width = (pct / stretch) * 100;
    const color = value >= stretch ? 'bg-emerald-500' : value >= target ? 'bg-yellow-500' : value >= base ? 'bg-amber-500' : 'bg-red-400';
    return (
        <div className="relative h-3 bg-slate-100 rounded-full overflow-visible">
            <div className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${color}`} style={{ width: `${width}%` }} />
            {/* Markers */}
            <div className="absolute inset-y-0 w-0.5 bg-amber-400" style={{ left: `${(base / stretch) * 100}%` }} title={`Base: ${base}%`} />
            <div className="absolute inset-y-0 w-0.5 bg-yellow-500" style={{ left: `${(target / stretch) * 100}%` }} title={`Target: ${target}%`} />
            <div className="absolute inset-y-0 w-0.5 bg-emerald-500" style={{ left: '100%' }} title={`Stretch: ${stretch}%`} />
        </div>
    );
}

function TargetLegend({ base, target, stretch }: { base: number; target: number; stretch: number }) {
    return (
        <div className="flex gap-4 text-xs text-slate-500 mt-1">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" /> Base: {base}%</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500" /> Target: {target}%</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Stretch: {stretch}%</span>
        </div>
    );
}

// ── FA Lead Generation Charts ────────────────────────────────────────────────

function FALeadCharts() {
    const oppData = useQuery(api.adoption.getOpportunityData);
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncError, setSyncError] = useState<string | null>(null);

    const handleSync = async () => {
        setIsSyncing(true);
        setSyncError(null);
        try {
            const resp = await fetch('/api/sync-opportunities', { method: 'POST' });
            const result = await resp.json();
            if (!resp.ok) setSyncError(result.error || 'Sync failed');
        } catch (err: unknown) {
            setSyncError(err instanceof Error ? err.message : 'Sync failed');
        } finally {
            setIsSyncing(false);
        }
    };

    const total = oppData?.totalAutomated ?? 0;
    const reachedStretch = total >= FA_LEAD_Q1.stretch;
    const reachedTarget = total >= FA_LEAD_Q1.target;
    const reachedBase = total >= FA_LEAD_Q1.base;
    const kpiColor = reachedStretch
        ? 'text-emerald-600' : reachedTarget
        ? 'text-yellow-600' : reachedBase
        ? 'text-amber-600'
        : 'text-red-500';

    const allMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth(); // 0-based
    const monthsToShow = allMonths.slice(0, currentMonth + 1);
    const monthlyMap: Record<string, number> = {};
    (oppData?.byMonth ?? []).forEach(({ month, year, count }) => {
        if (year === 2026 && monthsToShow.includes(month)) monthlyMap[month] = count;
    });
    const chartData = monthsToShow.map((m) => ({ month: m, count: monthlyMap[m] ?? 0 }));
    const cumulativeData = chartData.reduce<{ month: string; count: number; cumulative: number }[]>(
        (acc, { month, count }) => {
            const prev = acc[acc.length - 1]?.cumulative ?? 0;
            return [...acc, { month, count, cumulative: prev + count }];
        },
        []
    );

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
                        <Zap className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">FA Lead Generation</h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Automated opportunities — last synced:{' '}
                            <span className="font-medium text-slate-700">{formatSyncTime(oppData?.lastSyncedAt ?? null)}</span>
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleSync}
                    disabled={isSyncing}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                    {isSyncing ? 'Syncing...' : 'Sync Opportunities'}
                </button>
            </div>

            {syncError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                    <strong>Sync failed:</strong> {syncError}
                </div>
            )}

            {oppData === undefined ? (
                <div className="h-40 flex items-center justify-center text-slate-400 text-sm">Loading...</div>
            ) : (
                <>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="col-span-2 sm:col-span-1 bg-slate-50 rounded-xl border border-slate-100 p-4 flex flex-col items-center justify-center">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Total Automated</span>
                            <span className={`text-4xl font-bold ${kpiColor}`}>{total}</span>
                            <span className="text-xs text-slate-400 mt-1">2026 YTD</span>
                        </div>
                        <div className={`rounded-xl border p-4 flex flex-col items-center justify-center ${total >= FA_LEAD_Q1.base ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-100'}`}>
                            <span className="text-xs font-semibold uppercase tracking-wider text-amber-500 mb-1">Base</span>
                            <span className="text-2xl font-bold text-slate-700">{FA_LEAD_Q1.base}</span>
                            {total >= FA_LEAD_Q1.base && <span className="text-xs text-amber-600 font-medium mt-1">Reached</span>}
                        </div>
                        <div className={`rounded-xl border p-4 flex flex-col items-center justify-center ${total >= FA_LEAD_Q1.target ? 'bg-yellow-50 border-yellow-200' : 'bg-slate-50 border-slate-100'}`}>
                            <span className="text-xs font-semibold uppercase tracking-wider text-yellow-600 mb-1">Target</span>
                            <span className="text-2xl font-bold text-slate-700">{FA_LEAD_Q1.target}</span>
                            {total >= FA_LEAD_Q1.target && <span className="text-xs text-yellow-600 font-medium mt-1">Reached</span>}
                        </div>
                        <div className={`rounded-xl border p-4 flex flex-col items-center justify-center ${total >= FA_LEAD_Q1.stretch ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-100'}`}>
                            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-500 mb-1">Stretch</span>
                            <span className="text-2xl font-bold text-slate-700">{FA_LEAD_Q1.stretch}</span>
                            {total >= FA_LEAD_Q1.stretch && <span className="text-xs text-emerald-600 font-medium mt-1">Reached</span>}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-slate-700 mb-4">Monthly Progress — 2026</h3>
                        <ResponsiveContainer width="100%" height={220}>
                            <ComposedChart data={cumulativeData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                                    formatter={(value, name) => [
                                        value ?? 0,
                                        name === 'count' ? 'New this month' : 'Cumulative',
                                    ]}
                                />
                                <Legend
                                    formatter={(value) => value === 'count' ? 'New this month' : 'Cumulative total'}
                                    wrapperStyle={{ fontSize: '12px' }}
                                />
                                <ReferenceLine
                                    y={FA_LEAD_Q1.target}
                                    stroke="#eab308"
                                    strokeDasharray="5 3"
                                    label={{ value: `Target ${FA_LEAD_Q1.target}`, position: 'right', fontSize: 11, fill: '#ca8a04' }}
                                />
                                <ReferenceLine
                                    y={FA_LEAD_Q1.stretch}
                                    stroke="#10b981"
                                    strokeDasharray="5 3"
                                    label={{ value: `Stretch ${FA_LEAD_Q1.stretch}`, position: 'right', fontSize: 11, fill: '#059669' }}
                                />
                                <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={48} />
                                <Bar dataKey="cumulative" fill="#6366f1" fillOpacity={0.2} radius={[4, 4, 0, 0]} maxBarSize={48} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </>
            )}
        </div>
    );
}

// ── Role Summary Card ────────────────────────────────────────────────────────

function RoleSummaryCard({
    role,
    users,
    isActive,
    onClick,
}: {
    role: typeof ROLE_CONFIGS[number];
    users: EnrichedUser[];
    isActive: boolean;
    onClick: () => void;
}) {
    const roleUsers = users.filter((u) => u.role === role.label);
    const activeUsers = roleUsers.filter((u) => u.status === 'Active');
    const adoptionPct = roleUsers.length > 0 ? Math.round((activeUsers.length / roleUsers.length) * 100) : 0;
    const targetMet = adoptionPct >= role.q1Target;

    return (
        <button
            onClick={onClick}
            className={`text-left p-4 rounded-xl border transition-all duration-150 ${
                isActive
                    ? 'border-slate-400 bg-slate-800 shadow-md'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
            }`}
        >
            <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-semibold ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>{role.label}</span>
                {targetMet ? (
                    <CheckCircle2 className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-emerald-500'}`} />
                ) : (
                    <AlertTriangle className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-amber-500'}`} />
                )}
            </div>
            <div className={`text-2xl font-bold ${isActive ? 'text-white' : 'text-slate-900'}`}>{adoptionPct}%</div>
            <div className={`text-xs mt-0.5 ${isActive ? 'text-slate-400' : 'text-slate-500'}`}>
                Target: {role.q1Target}% · {activeUsers.length}/{roleUsers.length} users
            </div>
            <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all ${targetMet ? 'bg-emerald-500' : 'bg-amber-400'}`}
                    style={{ width: `${Math.min((adoptionPct / role.q1Target) * 100, 100)}%` }}
                />
            </div>
        </button>
    );
}

// ── Adoption By Role Chart ──────────────────────────────────────────────────

function AdoptionByRoleChart({ users }: { users: EnrichedUser[] }) {
    const chartData = ROLE_CONFIGS.map((role) => {
        const roleUsers = users.filter((u) => u.role === role.label);
        const activeCount = roleUsers.filter((u) => u.status === 'Active').length;
        const pct = roleUsers.length > 0 ? Math.round((activeCount / roleUsers.length) * 100) : 0;
        return {
            role: role.label.replace('Tax (', '').replace(')', '').replace('Financial ', ''),
            fullLabel: role.label,
            pct,
            target: role.q1Target,
            total: roleUsers.length,
            active: activeCount,
            color: role.color,
        };
    }).filter((d) => d.total > 0);

    const targets = ADOPTION_TARGETS.Q1;

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-slate-900">System Adoption by Role</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Q1 2026 — Base {targets.base}% / Target {targets.target}% / Stretch {targets.stretch}%
                    </p>
                </div>
            </div>

            <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData} margin={{ top: 10, right: 70, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="role" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                    <Tooltip
                        contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                        formatter={(value, _name, props) => [
                            `${value ?? 0}% (${(props.payload as { active: number }).active}/${(props.payload as { total: number }).total} users)`,
                            (props.payload as { fullLabel: string }).fullLabel,
                        ]}
                    />
                    <ReferenceLine y={targets.base} stroke="#f59e0b" strokeDasharray="4 3" label={{ value: `Base ${targets.base}%`, position: 'right', fontSize: 10, fill: '#d97706' }} />
                    <ReferenceLine y={targets.target} stroke="#eab308" strokeDasharray="4 3" label={{ value: `Target ${targets.target}%`, position: 'right', fontSize: 10, fill: '#ca8a04' }} />
                    <ReferenceLine y={targets.stretch} stroke="#10b981" strokeDasharray="4 3" label={{ value: `Stretch ${targets.stretch}%`, position: 'right', fontSize: 10, fill: '#059669' }} />
                    <Bar dataKey="pct" name="Adoption %" radius={[4, 4, 0, 0]} maxBarSize={56}>
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>

            <div className="flex flex-wrap gap-3">
                {chartData.map((d) => (
                    <div key={d.fullLabel} className="flex items-center gap-1.5 text-xs text-slate-500">
                        <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: d.color }} />
                        {d.fullLabel} ({d.active}/{d.total})
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Q1 Achievement Table ─────────────────────────────────────────────────────

function Q1AchievementTable({ users }: { users: EnrichedUser[] }) {
    const [expandedMetric, setExpandedMetric] = useState<string | null>(null);

    // Overall adoption
    const usersWithRoles = users.filter((u) => u.role !== null);
    const activeCount = usersWithRoles.filter((u) => u.status === 'Active').length;
    const overallPct = usersWithRoles.length > 0 ? Math.round((activeCount / usersWithRoles.length) * 100) : 0;
    const targets = ADOPTION_TARGETS.Q1;

    const systemAdoptionStatus = overallPct >= targets.target ? 'achieved' : overallPct >= targets.base ? 'partial' : 'not_achieved';

    const roleRows = ROLE_CONFIGS.map((role) => {
        const roleUsers = users.filter((u) => u.role === role.label);
        const roleActive = roleUsers.filter((u) => u.status === 'Active').length;
        const rolePct = roleUsers.length > 0 ? Math.round((roleActive / roleUsers.length) * 100) : 0;
        const met = rolePct >= role.q1Target;
        return { ...role, pct: rolePct, active: roleActive, total: roleUsers.length, met };
    }).filter((r) => r.total > 0);

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <Target className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-slate-900">Q1 Achievement Summary</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Performance against Q1 2026 targets</p>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-slate-100 bg-slate-50">
                            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Metric</th>
                            <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Current</th>
                            <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Target</th>
                            <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                            <th className="w-8"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {/* System Adoption row */}
                        <tr
                            className="hover:bg-slate-50 cursor-pointer transition-colors"
                            onClick={() => setExpandedMetric(expandedMetric === 'adoption' ? null : 'adoption')}
                        >
                            <td className="px-4 py-3 font-medium text-slate-900">System Adoption (Overall)</td>
                            <td className="px-4 py-3 text-center font-semibold">{overallPct}%</td>
                            <td className="px-4 py-3 text-center text-slate-600">{targets.target}%</td>
                            <td className="px-4 py-3 text-center">
                                {systemAdoptionStatus === 'achieved' ? (
                                    <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full text-xs font-semibold">
                                        <CheckCircle2 className="w-3.5 h-3.5" /> Achieved
                                    </span>
                                ) : systemAdoptionStatus === 'partial' ? (
                                    <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full text-xs font-semibold">
                                        <AlertTriangle className="w-3.5 h-3.5" /> Base Met
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 text-red-700 bg-red-50 px-2.5 py-1 rounded-full text-xs font-semibold">
                                        <XCircle className="w-3.5 h-3.5" /> Not Achieved
                                    </span>
                                )}
                            </td>
                            <td className="px-4 py-3">
                                <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${expandedMetric === 'adoption' ? 'rotate-90' : ''}`} />
                            </td>
                        </tr>

                        {/* Expanded role detail */}
                        {expandedMetric === 'adoption' && roleRows.map((row) => (
                            <tr key={row.label} className="bg-slate-25">
                                <td className="px-4 py-2.5 pl-10 text-slate-600 text-xs">
                                    <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ backgroundColor: row.color }} />
                                    {row.label}
                                </td>
                                <td className="px-4 py-2.5 text-center text-xs font-medium">{row.pct}%</td>
                                <td className="px-4 py-2.5 text-center text-xs text-slate-500">{row.q1Target}%</td>
                                <td className="px-4 py-2.5 text-center">
                                    {row.met ? (
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                                    ) : (
                                        <XCircle className="w-4 h-4 text-red-400 mx-auto" />
                                    )}
                                </td>
                                <td />
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ── Milestone Tracker ────────────────────────────────────────────────────────

function MilestoneTracker({ isAdmin }: { isAdmin: boolean }) {
    const milestones = useQuery(api.adoption.getMilestones);
    const seedMilestones = useMutation(api.adoption.seedMilestones);
    const toggleMilestone = useMutation(api.adoption.toggleMilestone);
    const [seeded, setSeeded] = useState(false);

    useEffect(() => {
        if (seeded || !isAdmin || milestones === undefined) return;
        if (milestones.length === 0) {
            seedMilestones({
                milestones: MILESTONE_DEFINITIONS.map((m) => ({
                    key: m.key,
                    label: m.label,
                    role: m.role,
                    quarter: m.quarter,
                    completed: false,
                })),
            });
        }
        setSeeded(true);
    }, [milestones, isAdmin, seeded, seedMilestones]);

    if (!milestones) return null;

    const q1Milestones = milestones.filter((m) => m.quarter === 'Q1');
    if (q1Milestones.length === 0) return null;

    const completedCount = q1Milestones.filter((m) => m.completed).length;

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-violet-600" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">Q1 Milestones</h2>
                        <p className="text-xs text-slate-500 mt-0.5">{completedCount}/{q1Milestones.length} completed</p>
                    </div>
                </div>
                <div className="text-sm font-semibold text-slate-700">
                    {completedCount === q1Milestones.length ? (
                        <span className="text-emerald-600">All Complete</span>
                    ) : (
                        <span className="text-amber-600">{q1Milestones.length - completedCount} remaining</span>
                    )}
                </div>
            </div>

            <div className="space-y-2">
                {q1Milestones.map((m) => (
                    <div key={m._id} className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${m.completed ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-slate-100'}`}>
                        {isAdmin ? (
                            <button
                                onClick={() => toggleMilestone({ id: m._id, completed: !m.completed })}
                                className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                                    m.completed
                                        ? 'bg-emerald-500 border-emerald-500 text-white'
                                        : 'border-slate-300 hover:border-slate-400'
                                }`}
                            >
                                {m.completed && <CheckCircle2 className="w-3.5 h-3.5" />}
                            </button>
                        ) : (
                            <div className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                                m.completed
                                    ? 'bg-emerald-500 border-emerald-500 text-white'
                                    : 'border-slate-300'
                            }`}>
                                {m.completed && <CheckCircle2 className="w-3.5 h-3.5" />}
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <p className={`text-sm ${m.completed ? 'text-emerald-800 line-through' : 'text-slate-700'}`}>{m.label}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{m.role}</p>
                        </div>
                        {m.completed && m.completedAt && (
                            <span className="text-xs text-emerald-600 flex-shrink-0">
                                {new Date(m.completedAt).toLocaleDateString()}
                            </span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Placeholder Metric Card ──────────────────────────────────────────────────

function PlaceholderMetricCard({ metric }: { metric: typeof PLACEHOLDER_METRICS[number] }) {
    return (
        <div className="bg-white rounded-xl border border-slate-200 border-dashed p-5 opacity-75">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-700">{metric.name}</h3>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500">
                    <Clock className="w-3 h-3" />
                    Coming {metric.startsIn}
                </span>
            </div>
            <p className="text-xs text-slate-500 mb-3">{metric.description}</p>
            <div className="flex gap-3 text-xs">
                <span className="text-amber-600 font-medium">Base: {metric.targets.base}%</span>
                <span className="text-yellow-600 font-medium">Target: {metric.targets.target}%</span>
                <span className="text-emerald-600 font-medium">Stretch: {metric.targets.stretch}%</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">{metric.unit}</p>
        </div>
    );
}

// ── Role Detail Tab ──────────────────────────────────────────────────────────

function RoleDetailTab({
    role,
    users,
    timePeriod,
}: {
    role: typeof ROLE_CONFIGS[number];
    users: EnrichedUser[];
    timePeriod: TimePeriod;
}) {
    const [search, setSearch] = useState('');
    const [sortKey, setSortKey] = useState<SortKey>('status');
    const [sortAsc, setSortAsc] = useState(true);

    const roleUsers = users.filter((u) => u.role === role.label);
    const activeCount = roleUsers.filter((u) => u.status === 'Active').length;
    const adoptionPct = roleUsers.length > 0 ? Math.round((activeCount / roleUsers.length) * 100) : 0;
    const targetMet = adoptionPct >= role.q1Target;

    const filtered = roleUsers
        .filter((u) => u.fullName.toLowerCase().includes(search.toLowerCase()) || (u.email ?? '').toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => {
            let cmp = 0;
            if (sortKey === 'status') cmp = a.status.localeCompare(b.status);
            else if (sortKey === 'fullName') cmp = a.fullName.localeCompare(b.fullName);
            else if (sortKey === 'lastActiveOn') {
                const aT = a.lastActiveOn ? new Date(a.lastActiveOn).getTime() : 0;
                const bT = b.lastActiveOn ? new Date(b.lastActiveOn).getTime() : 0;
                cmp = bT - aT;
            } else {
                cmp = ((b.activity[sortKey] ?? 0) as number) - ((a.activity[sortKey] ?? 0) as number);
            }
            return sortAsc ? cmp : -cmp;
        });

    const handleSort = (key: SortKey) => {
        if (sortKey === key) setSortAsc(!sortAsc);
        else { setSortKey(key); setSortAsc(true); }
    };

    const SortIcon = ({ col }: { col: SortKey }) => {
        if (sortKey !== col) return <ChevronUp className="w-3 h-3 text-slate-300" />;
        return sortAsc ? <ChevronUp className="w-3 h-3 text-slate-600" /> : <ChevronDown className="w-3 h-3 text-slate-600" />;
    };

    const ThButton = ({ col, children }: { col: SortKey; children: React.ReactNode }) => (
        <button onClick={() => handleSort(col)} className="flex items-center gap-1 hover:text-slate-900 transition-colors">
            {children}
            <SortIcon col={col} />
        </button>
    );

    // Determine which activity columns to show for this role
    const activityCols = Array.from(new Set(role.actions.flatMap((a) => a.activityKeys))).filter(Boolean);

    const ACTIVITY_LABELS: Record<string, string> = {
        cases: 'Cases',
        leads: 'Leads',
        contacts: 'Contacts',
        invoices: 'Invoices',
        opportunities: 'Opps',
        otpTasks: 'OTPs',
    };

    return (
        <div className="space-y-6">
            {/* Role Header */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">{role.label}</h2>
                        <p className="text-sm text-slate-500 mt-1">{roleUsers.length} staff members · Q1 Target: {role.q1Target}%</p>
                    </div>
                    <div className={`text-3xl font-bold ${targetMet ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {adoptionPct}%
                    </div>
                </div>
                <ProgressBar
                    value={adoptionPct}
                    base={Math.min(role.q1Target * 0.6, role.q1Target)}
                    target={role.q1Target}
                    stretch={Math.min(role.q1Target * 1.2, 100)}
                />

                {/* Required Actions */}
                <div className="mt-4 pt-4 border-t border-slate-100">
                    <h3 className="text-sm font-semibold text-slate-700 mb-2">Required Actions</h3>
                    <div className="space-y-2">
                        {role.actions.map((action) => (
                            <div key={action.name} className="flex items-start gap-3 text-sm">
                                <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: role.color }} />
                                <div>
                                    <span className="font-medium text-slate-700">{action.name}</span>
                                    <span className="text-slate-400 mx-1.5">·</span>
                                    <span className="text-slate-500">{action.measurement}</span>
                                    <span className="text-slate-400 mx-1.5">·</span>
                                    <span className="text-xs text-slate-400 font-medium">{action.timeline}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* User Table */}
            {roleUsers.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="relative flex-1 max-w-xs">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search users..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-slate-300 w-full"
                            />
                        </div>
                        <span className="text-xs text-slate-400">{filtered.length} users</span>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50">
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                            <ThButton col="fullName">Name</ThButton>
                                        </th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                            <ThButton col="lastActiveOn">Last Active</ThButton>
                                        </th>
                                        {activityCols.map((col) => (
                                            <th key={col} className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                                <ThButton col={col as SortKey}>{ACTIVITY_LABELS[col] ?? col}</ThButton>
                                            </th>
                                        ))}
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                            <ThButton col="status">Status</ThButton>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filtered.length === 0 ? (
                                        <tr>
                                            <td colSpan={3 + activityCols.length} className="text-center py-12 text-slate-400 text-sm">
                                                No users match the search.
                                            </td>
                                        </tr>
                                    ) : filtered.map((user) => (
                                        <tr key={user._id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-slate-900">{user.fullName}</div>
                                                {user.email && <div className="text-xs text-slate-400 mt-0.5">{user.email}</div>}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`font-medium ${user.status === 'Active' ? 'text-emerald-600' : 'text-red-500'}`}>
                                                    {formatRelativeDate(user.lastActiveOn)}
                                                </span>
                                            </td>
                                            {activityCols.map((col) => {
                                                const val = user.activity[col] ?? 0;
                                                return (
                                                    <td key={col} className="px-4 py-3 text-right">
                                                        <span className={val > 0 ? 'font-semibold text-slate-800' : 'text-slate-300'}>
                                                            {val > 0 ? val : '—'}
                                                        </span>
                                                    </td>
                                                );
                                            })}
                                            <td className="px-4 py-3">
                                                <StatusBadge status={user.status} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Quarter Section ──────────────────────────────────────────────────────────

function QuarterSection({
    quarter,
    users,
    isCurrentOrPast,
}: {
    quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
    users: EnrichedUser[];
    isCurrentOrPast: boolean;
}) {
    const activeMetrics = QUARTER_ACTIVE_METRICS[quarter] ?? [];
    const targets = ADOPTION_TARGETS[quarter];

    const usersWithRoles = users.filter((u) => u.role !== null);
    const activeCount = usersWithRoles.filter((u) => u.status === 'Active').length;
    const overallPct = usersWithRoles.length > 0 ? Math.round((activeCount / usersWithRoles.length) * 100) : 0;

    const isFuture = !isCurrentOrPast;

    return (
        <div className={`rounded-xl border p-6 space-y-4 ${isFuture ? 'border-dashed border-slate-200 opacity-60' : 'border-slate-200 bg-white'}`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isFuture ? 'bg-slate-100' : 'bg-indigo-50'}`}>
                        <Calendar className={`w-5 h-5 ${isFuture ? 'text-slate-400' : 'text-indigo-600'}`} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">{quarter} 2026</h2>
                        <p className="text-xs text-slate-500 mt-0.5">{activeMetrics.length} active metrics</p>
                    </div>
                </div>
                {isCurrentOrPast && (
                    <div className={`text-2xl font-bold ${overallPct >= targets.target ? 'text-emerald-600' : overallPct >= targets.base ? 'text-amber-600' : 'text-red-500'}`}>
                        {overallPct}%
                        <span className="text-sm font-normal text-slate-400 ml-1">adoption</span>
                    </div>
                )}
                {isFuture && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500">
                        <Clock className="w-3 h-3" /> Upcoming
                    </span>
                )}
            </div>

            {isCurrentOrPast && (
                <>
                    <ProgressBar value={overallPct} base={targets.base} target={targets.target} stretch={targets.stretch} />
                    <TargetLegend base={targets.base} target={targets.target} stretch={targets.stretch} />
                </>
            )}

            <div className="flex flex-wrap gap-2 pt-2">
                {activeMetrics.map((name) => {
                    const isAdoption = name === 'System Adoption';
                    const isLeadGen = name === 'FA Lead Generation';
                    const placeholder = PLACEHOLDER_METRICS.find((p) => p.name === name);

                    return (
                        <span
                            key={name}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                                isAdoption || isLeadGen
                                    ? 'bg-indigo-50 text-indigo-700'
                                    : 'bg-slate-50 text-slate-500'
                            }`}
                        >
                            {isAdoption ? <Users className="w-3 h-3" /> : isLeadGen ? <Zap className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                            {name}
                            {placeholder && !isCurrentOrPast && <span className="text-slate-400 ml-1">({placeholder.targets.target}% target)</span>}
                        </span>
                    );
                })}
            </div>
        </div>
    );
}

// ── Main View ────────────────────────────────────────────────────────────────

export default function AdoptionView() {
    const data = useQuery(api.adoption.getAdoptionData);

    const [isSyncing, setIsSyncing] = useState(false);
    const [syncError, setSyncError] = useState<string | null>(null);
    const [timePeriod, setTimePeriod] = useState<TimePeriod>('this_week');
    const [activeTab, setActiveTab] = useState<TabView>('summary');
    const [activeQuarter, setActiveQuarter] = useState<Quarter>('Annual');

    const handleSync = async (days?: number) => {
        setIsSyncing(true);
        setSyncError(null);
        try {
            const syncDays = days ?? getDaysForPeriod(timePeriod);
            const resp = await fetch('/api/sync-dynamics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ days: syncDays }),
            });
            const result = await resp.json();
            if (!resp.ok) setSyncError(result.error || 'Sync failed');
        } catch (err: unknown) {
            setSyncError(err instanceof Error ? err.message : 'Sync failed.');
        } finally {
            setIsSyncing(false);
        }
    };

    const handleTimePeriodChange = (newPeriod: TimePeriod) => {
        setTimePeriod(newPeriod);
        handleSync(getDaysForPeriod(newPeriod));
    };

    // Enrich users with role mapping and status
    const periodDays = getDaysForPeriod(timePeriod);
    const enrichedUsers: EnrichedUser[] = (data?.users ?? []).map((u) => {
        const dept = u.department || getDepartmentFromEmail(u.email);
        const role = getMetricRole(u.jobTitle);
        const active = role
            ? isUserActiveForRole(role, u.activity, u.lastActiveOn, periodDays)
            : (Object.values(u.activity).reduce((s, n) => s + n, 0) > 0);
        return {
            _id: u._id,
            dynamicsId: u.dynamicsId,
            fullName: u.fullName,
            email: u.email,
            department: dept,
            jobTitle: u.jobTitle,
            lastActiveOn: u.lastActiveOn,
            role,
            status: active ? 'Active' as AdoptionStatus : 'Inactive' as AdoptionStatus,
            activity: u.activity,
        };
    }).filter((u) => !isExcludedTitle(u.jobTitle));

    const usersWithRoles = enrichedUsers.filter((u) => u.role !== null);
    const activeCount = usersWithRoles.filter((u) => u.status === 'Active').length;
    const overallAdoption = usersWithRoles.length > 0 ? Math.round((activeCount / usersWithRoles.length) * 100) : 0;
    const targets = ADOPTION_TARGETS.Q1;

    // Determine current quarter
    const currentMonth = new Date().getMonth();
    const currentQIdx = Math.floor(currentMonth / 3); // 0=Q1, 1=Q2, etc.

    if (data === undefined) {
        return (
            <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
                Loading adoption data...
            </div>
        );
    }

    const activeRole = activeTab !== 'summary' ? ROLE_CONFIGS.find((r) => r.label === activeTab) : null;

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">2026 Performance Metrics</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        riivo Metrics Dashboard — last synced:{' '}
                        <span className="font-medium text-slate-700">{formatSyncTime(data.lastSyncedAt)}</span>
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end gap-0.5">
                        <select
                            value={timePeriod}
                            onChange={(e) => handleTimePeriodChange(e.target.value as TimePeriod)}
                            disabled={isSyncing}
                            className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-slate-300 text-slate-700 disabled:opacity-50"
                        >
                            {TIME_PERIOD_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                        <span className="text-xs text-slate-400 pr-1">{formatPeriodRange(timePeriod)}</span>
                    </div>
                    <button
                        onClick={() => handleSync()}
                        disabled={isSyncing}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                        {isSyncing ? 'Syncing...' : 'Sync Now'}
                    </button>
                </div>
            </div>

            {syncError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                    <strong>Sync failed:</strong> {syncError}
                </div>
            )}

            {/* Quarter Selector */}
            <div className="flex gap-2 flex-wrap">
                {(['Annual', 'Q1', 'Q2', 'Q3', 'Q4'] as Quarter[]).map((q) => (
                    <button
                        key={q}
                        onClick={() => setActiveQuarter(q)}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                            activeQuarter === q
                                ? 'bg-slate-900 text-white'
                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                        {q}
                    </button>
                ))}
            </div>

            {/* Annual View */}
            {activeQuarter === 'Annual' && (
                <div className="space-y-8">
                    {/* Overall Summary Card */}
                    <div className="bg-white rounded-xl border border-slate-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">Overall System Adoption</h2>
                                <p className="text-sm text-slate-500 mt-0.5">
                                    {activeCount} of {usersWithRoles.length} tracked staff actively using the CRM
                                </p>
                            </div>
                            <div className={`text-4xl font-bold ${
                                overallAdoption >= targets.stretch ? 'text-emerald-600' :
                                overallAdoption >= targets.target ? 'text-yellow-600' :
                                overallAdoption >= targets.base ? 'text-amber-600' :
                                'text-red-500'
                            }`}>
                                {overallAdoption}%
                            </div>
                        </div>
                        <ProgressBar value={overallAdoption} base={targets.base} target={targets.target} stretch={targets.stretch} />
                        <TargetLegend base={targets.base} target={targets.target} stretch={targets.stretch} />
                    </div>

                    {/* Tab Navigation: Summary + Role Tabs */}
                    <div className="flex gap-1 flex-wrap bg-slate-100 p-1 rounded-lg">
                        <button
                            onClick={() => setActiveTab('summary')}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                                activeTab === 'summary' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            Summary
                        </button>
                        {ROLE_CONFIGS.map((role) => {
                            const roleUserCount = enrichedUsers.filter((u) => u.role === role.label).length;
                            if (roleUserCount === 0) return null;
                            return (
                                <button
                                    key={role.label}
                                    onClick={() => setActiveTab(role.label)}
                                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                                        activeTab === role.label ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                >
                                    <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: role.color }} />
                                    {role.label.replace('Tax (', '').replace(')', '').replace('Financial ', '')}
                                </button>
                            );
                        })}
                    </div>

                    {/* Tab Content */}
                    {activeTab === 'summary' ? (
                        <div className="space-y-8">
                            {/* Role Summary Cards */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {ROLE_CONFIGS.map((role) => {
                                    const hasUsers = enrichedUsers.some((u) => u.role === role.label);
                                    if (!hasUsers) return null;
                                    return (
                                        <RoleSummaryCard
                                            key={role.label}
                                            role={role}
                                            users={enrichedUsers}
                                            isActive={false}
                                            onClick={() => setActiveTab(role.label)}
                                        />
                                    );
                                })}
                            </div>

                            {/* Charts */}
                            <AdoptionByRoleChart users={enrichedUsers} />
                            <FALeadCharts />

                            {/* Q1 Achievement Table */}
                            <Q1AchievementTable users={enrichedUsers} />

                            {/* Milestones */}
                            <MilestoneTracker isAdmin={true} />

                            {/* Upcoming Metrics */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                                        <Clock className="w-5 h-5 text-slate-500" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-900">Upcoming Metrics</h2>
                                        <p className="text-xs text-slate-500 mt-0.5">Metrics launching in Q2–Q4 2026</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {PLACEHOLDER_METRICS.map((m) => (
                                        <PlaceholderMetricCard key={m.name} metric={m} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : activeRole ? (
                        <RoleDetailTab role={activeRole} users={enrichedUsers} timePeriod={timePeriod} />
                    ) : null}
                </div>
            )}

            {/* Quarter-Specific Views */}
            {activeQuarter !== 'Annual' && (
                <div className="space-y-6">
                    <QuarterSection
                        quarter={activeQuarter as 'Q1' | 'Q2' | 'Q3' | 'Q4'}
                        users={enrichedUsers}
                        isCurrentOrPast={(['Q1', 'Q2', 'Q3', 'Q4'].indexOf(activeQuarter) <= currentQIdx)}
                    />

                    {activeQuarter === 'Q1' && (
                        <div className="space-y-6">
                            <Q1AchievementTable users={enrichedUsers} />
                            <MilestoneTracker isAdmin={true} />

                            {/* Role breakdown for Q1 */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {ROLE_CONFIGS.map((role) => {
                                    const hasUsers = enrichedUsers.some((u) => u.role === role.label);
                                    if (!hasUsers) return null;
                                    return (
                                        <RoleSummaryCard
                                            key={role.label}
                                            role={role}
                                            users={enrichedUsers}
                                            isActive={false}
                                            onClick={() => { setActiveQuarter('Annual'); setActiveTab(role.label); }}
                                        />
                                    );
                                })}
                            </div>

                            <AdoptionByRoleChart users={enrichedUsers} />
                            <FALeadCharts />
                        </div>
                    )}

                    {/* For Q2+ show placeholder metrics that are active in that quarter */}
                    {activeQuarter !== 'Q1' && (
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-slate-700">New Metrics This Quarter</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {PLACEHOLDER_METRICS
                                    .filter((m) => {
                                        const metricStartQ = parseInt(m.startsIn.replace('Q', ''));
                                        const viewQ = parseInt(activeQuarter.replace('Q', ''));
                                        return metricStartQ <= viewQ;
                                    })
                                    .map((m) => (
                                        <PlaceholderMetricCard key={m.name} metric={m} />
                                    ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Empty State */}
            {enrichedUsers.length === 0 && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-12 text-center">
                    <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-600 font-medium">No data yet</p>
                    <p className="text-slate-400 text-sm mt-1 mb-6">
                        Click &ldquo;Sync Now&rdquo; to pull user activity from Dynamics 365.
                    </p>
                    <button
                        onClick={() => handleSync()}
                        disabled={isSyncing}
                        className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 transition-colors"
                    >
                        <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                        {isSyncing ? 'Syncing...' : 'Run First Sync'}
                    </button>
                </div>
            )}
        </div>
    );
}
