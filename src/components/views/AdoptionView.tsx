'use client';

import React, { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import {
    RefreshCw, Users, UserCheck, AlertTriangle, UserX, Search,
    ChevronUp, ChevronDown, TrendingUp, Zap,
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer, ReferenceLine, Cell, ComposedChart,
} from 'recharts';

type AdoptionStatus = 'Active' | 'At Risk' | 'Inactive';
type TimePeriod = '1d' | '1w' | '1m' | '3m';

const TIME_PERIOD_OPTIONS: { value: TimePeriod; label: string; days: number }[] = [
    { value: '1d', label: 'Last 24 hours', days: 1 },
    { value: '1w', label: 'Last 7 days', days: 7 },
    { value: '1m', label: 'Last 30 days', days: 30 },
    { value: '3m', label: 'Last 3 months', days: 90 },
];

type SortKey = 'fullName' | 'department' | 'lastActiveOn' | 'cases' | 'leads' | 'contacts' | 'invoices' | 'opportunities' | 'status';

// Q1 targets
const FA_LEAD_Q1 = { base: 80, target: 100, stretch: 120 };
const ADOPTION_Q1 = { base: 30, target: 40, stretch: 50 }; // percentages

const DEPT_COLORS: Record<string, string> = {
    Tax: '#6366f1',
    Fa: '#f59e0b',
    Accounting: '#10b981',
    Insurance: '#3b82f6',
    Finance: '#ec4899',
};
const FALLBACK_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6'];

const ACTIVITY_COLORS = {
    cases: '#6366f1',
    leads: '#f59e0b',
    contacts: '#10b981',
    invoices: '#3b82f6',
    opportunities: '#ec4899',
};

// Departments where opportunity usage is a primary KPI
const OPP_FOCUSED_DEPTS = new Set(['Fa', 'Finance']);

function getStatus(lastActiveOn: string | undefined, cutoff: Date, activity: Record<string, number>): AdoptionStatus {
    const hasActivity = Object.values(activity).reduce((sum, n) => sum + n, 0) > 0;
    const recentLogin = lastActiveOn ? new Date(lastActiveOn) >= cutoff : false;
    if (hasActivity || recentLogin) return 'Active';
    return 'Inactive';
}

function formatRelativeDate(iso?: string): string {
    if (!iso) return 'Never';
    const days = Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 30) return `${days}d ago`;
    if (days < 365) return `${Math.floor(days / 30)}mo ago`;
    return `${Math.floor(days / 365)}y ago`;
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

function formatSyncTime(ts: number | null): string {
    if (!ts) return 'Never';
    const date = new Date(ts);
    return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

const STATUS_CONFIG: Record<AdoptionStatus, { label: string; bg: string; text: string; dot: string }> = {
    Active: { label: 'Active', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    'At Risk': { label: 'At Risk', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
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

function SummaryCard({
    icon, label, value, color, active, onClick,
}: {
    icon: React.ReactNode;
    label: string;
    value: number;
    color: string;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={`flex-1 min-w-[120px] text-left p-5 rounded-xl border transition-all duration-150 ${active
                ? 'border-slate-400 bg-slate-800 shadow-md'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
            }`}
        >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${color}`}>{icon}</div>
            <div className={`text-2xl font-bold ${active ? 'text-white' : 'text-slate-900'}`}>{value}</div>
            <div className={`text-xs font-medium mt-0.5 ${active ? 'text-slate-300' : 'text-slate-500'}`}>{label}</div>
        </button>
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

    // Q1 months: Jan, Feb, Mar 2026
    const q1Months = ['Jan', 'Feb', 'Mar'];
    const monthlyMap: Record<string, number> = {};
    (oppData?.byMonth ?? []).forEach(({ month, year, count }) => {
        if (year === 2026 && q1Months.includes(month)) monthlyMap[month] = count;
    });
    const chartData = q1Months.map((m) => ({ month: m, count: monthlyMap[m] ?? 0 }));
    const cumulativeData = chartData.reduce<{ month: string; count: number; cumulative: number }[]>(
        (acc, { month, count }) => {
            const prev = acc[acc.length - 1]?.cumulative ?? 0;
            return [...acc, { month, count, cumulative: prev + count }];
        },
        []
    );

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
            {/* Section header */}
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
                    {/* KPI cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="col-span-2 sm:col-span-1 bg-slate-50 rounded-xl border border-slate-100 p-4 flex flex-col items-center justify-center">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Total Automated</span>
                            <span className={`text-4xl font-bold ${kpiColor}`}>{total}</span>
                            <span className="text-xs text-slate-400 mt-1">Q1 2026</span>
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

                    {/* Monthly trend chart */}
                    <div>
                        <h3 className="text-sm font-semibold text-slate-700 mb-4">Monthly Progress — Q1 2026</h3>
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

// ── System Adoption by Department Charts ─────────────────────────────────────

function AdoptionByDeptCharts({
    usersWithStatus,
}: {
    usersWithStatus: {
        department?: string;
        status: AdoptionStatus;
        cases: number;
        leads: number;
        contacts: number;
        invoices: number;
        opportunities: number;
    }[];
}) {
    const departments = Array.from(
        new Set(usersWithStatus.map((u) => u.department ?? 'Unknown').filter(Boolean))
    ).sort();

    const adoptionData = departments.map((dept, i) => {
        const deptUsers = usersWithStatus.filter((u) => (u.department ?? 'Unknown') === dept);
        const activeCount = deptUsers.filter((u) => u.status === 'Active').length;
        const pct = deptUsers.length > 0 ? Math.round((activeCount / deptUsers.length) * 100) : 0;
        return {
            dept,
            pct,
            total: deptUsers.length,
            active: activeCount,
            color: DEPT_COLORS[dept] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length],
        };
    });

    const activityData = departments.map((dept) => {
        const deptUsers = usersWithStatus.filter((u) => (u.department ?? 'Unknown') === dept);
        const isOppFocused = OPP_FOCUSED_DEPTS.has(dept);
        return {
            dept,
            isOppFocused,
            cases: deptUsers.reduce((s, u) => s + u.cases, 0),
            leads: deptUsers.reduce((s, u) => s + u.leads, 0),
            contacts: deptUsers.reduce((s, u) => s + u.contacts, 0),
            invoices: deptUsers.reduce((s, u) => s + u.invoices, 0),
            opportunities: deptUsers.reduce((s, u) => s + u.opportunities, 0),
        };
    });

    const hasAnyOpportunities = activityData.some((d) => d.opportunities > 0);

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-8">
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-slate-900">System Adoption by Department</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Q1 2026 targets — Base {ADOPTION_Q1.base}% / Target {ADOPTION_Q1.target}% / Stretch {ADOPTION_Q1.stretch}%</p>
                </div>
            </div>

            {/* Adoption % per department */}
            <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-4">Active User Rate per Department</h3>
                <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={adoptionData} margin={{ top: 10, right: 70, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="dept" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                            formatter={(value, _name, props) => [
                                `${value ?? 0}% (${(props.payload as { active: number }).active} / ${(props.payload as { total: number }).total} users)`,
                                'Active Rate',
                            ]}
                        />
                        <ReferenceLine
                            y={ADOPTION_Q1.base}
                            stroke="#f59e0b"
                            strokeDasharray="4 3"
                            label={{ value: `Base ${ADOPTION_Q1.base}%`, position: 'right', fontSize: 10, fill: '#d97706' }}
                        />
                        <ReferenceLine
                            y={ADOPTION_Q1.target}
                            stroke="#eab308"
                            strokeDasharray="4 3"
                            label={{ value: `Target ${ADOPTION_Q1.target}%`, position: 'right', fontSize: 10, fill: '#ca8a04' }}
                        />
                        <ReferenceLine
                            y={ADOPTION_Q1.stretch}
                            stroke="#10b981"
                            strokeDasharray="4 3"
                            label={{ value: `Stretch ${ADOPTION_Q1.stretch}%`, position: 'right', fontSize: 10, fill: '#059669' }}
                        />
                        <Bar dataKey="pct" name="Active %" radius={[4, 4, 0, 0]} maxBarSize={56}>
                            {adoptionData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-3 mt-3">
                    {adoptionData.map((d) => (
                        <div key={d.dept} className="flex items-center gap-1.5 text-xs text-slate-500">
                            <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: d.color }} />
                            {d.dept} ({d.active}/{d.total})
                        </div>
                    ))}
                </div>
            </div>

            {/* Activity breakdown per department */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-slate-700">Activity Breakdown per Department</h3>
                    {hasAnyOpportunities && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-pink-700 bg-pink-50 border border-pink-200 px-2.5 py-1 rounded-full">
                            <span className="w-2 h-2 rounded-full bg-pink-500 inline-block" />
                            Opportunities tracked for FA/Finance
                        </span>
                    )}
                </div>
                <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={activityData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="dept" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                        <Bar dataKey="cases" name="Cases" fill={ACTIVITY_COLORS.cases} radius={[3, 3, 0, 0]} maxBarSize={18} />
                        <Bar dataKey="leads" name="Leads" fill={ACTIVITY_COLORS.leads} radius={[3, 3, 0, 0]} maxBarSize={18} />
                        <Bar dataKey="contacts" name="Contacts" fill={ACTIVITY_COLORS.contacts} radius={[3, 3, 0, 0]} maxBarSize={18} />
                        <Bar dataKey="invoices" name="Invoices" fill={ACTIVITY_COLORS.invoices} radius={[3, 3, 0, 0]} maxBarSize={18} />
                        <Bar dataKey="opportunities" name="Opportunities" fill={ACTIVITY_COLORS.opportunities} radius={[3, 3, 0, 0]} maxBarSize={18} />
                    </BarChart>
                </ResponsiveContainer>
                {!hasAnyOpportunities && (
                    <p className="text-xs text-slate-400 mt-2 text-center">
                        Opportunity counts appear after syncing opportunities. Primarily tracks FA/Finance department usage.
                    </p>
                )}
            </div>
        </div>
    );
}

// ── Main View ────────────────────────────────────────────────────────────────

export default function AdoptionView() {
    const data = useQuery(api.adoption.getAdoptionData);

    const [isSyncing, setIsSyncing] = useState(false);
    const [syncError, setSyncError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<AdoptionStatus | 'all'>('all');
    const [deptFilter, setDeptFilter] = useState('all');
    const [timePeriod, setTimePeriod] = useState<TimePeriod>('1m');
    const [search, setSearch] = useState('');
    const [sortKey, setSortKey] = useState<SortKey>('status');
    const [sortAsc, setSortAsc] = useState(true);

    const handleSync = async (days?: number) => {
        setIsSyncing(true);
        setSyncError(null);
        try {
            const periodDaysValue = days ?? TIME_PERIOD_OPTIONS.find((o) => o.value === timePeriod)!.days;
            const resp = await fetch('/api/sync-dynamics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ days: periodDaysValue }),
            });
            const result = await resp.json();
            if (!resp.ok) setSyncError(result.error || 'Sync failed');
        } catch (err: unknown) {
            setSyncError(err instanceof Error ? err.message : 'Sync failed. Check your Dynamics environment variables.');
        } finally {
            setIsSyncing(false);
        }
    };

    const handleTimePeriodChange = (newPeriod: TimePeriod) => {
        setTimePeriod(newPeriod);
        const days = TIME_PERIOD_OPTIONS.find((o) => o.value === newPeriod)!.days;
        handleSync(days);
    };

    const handleSort = (key: SortKey) => {
        if (sortKey === key) setSortAsc(!sortAsc);
        else { setSortKey(key); setSortAsc(true); }
    };

    const periodDays = TIME_PERIOD_OPTIONS.find((o) => o.value === timePeriod)!.days;
    const cutoff = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);

    const usersWithStatus = (data?.users ?? []).map((u) => ({
        ...u,
        department: u.department || getDepartmentFromEmail(u.email),
        status: getStatus(u.lastActiveOn, cutoff, u.activity),
        cases: u.activity['cases'] ?? 0,
        leads: u.activity['leads'] ?? 0,
        contacts: u.activity['contacts'] ?? 0,
        invoices: u.activity['invoices'] ?? 0,
        opportunities: u.activity['opportunities'] ?? 0,
    }));

    const departments = ['all', ...Array.from(new Set(usersWithStatus.map((u) => u.department ?? 'Unknown').filter(Boolean))).sort()];

    const scopedUsers = usersWithStatus
        .filter((u) => deptFilter === 'all' || (u.department ?? 'Unknown') === deptFilter)
        .filter((u) => u.fullName.toLowerCase().includes(search.toLowerCase()) || (u.email ?? '').toLowerCase().includes(search.toLowerCase()));

    const filtered = scopedUsers
        .filter((u) => statusFilter === 'all' || u.status === statusFilter)
        .sort((a, b) => {
            const statusOrder: Record<AdoptionStatus, number> = { Active: 0, 'At Risk': 1, Inactive: 2 };
            let cmp = 0;
            if (sortKey === 'status') cmp = statusOrder[a.status] - statusOrder[b.status];
            else if (sortKey === 'fullName') cmp = a.fullName.localeCompare(b.fullName);
            else if (sortKey === 'department') cmp = (a.department ?? '').localeCompare(b.department ?? '');
            else if (sortKey === 'lastActiveOn') {
                const aTime = a.lastActiveOn ? new Date(a.lastActiveOn).getTime() : 0;
                const bTime = b.lastActiveOn ? new Date(b.lastActiveOn).getTime() : 0;
                cmp = bTime - aTime;
            } else {
                cmp = (b[sortKey] as number) - (a[sortKey] as number);
            }
            return sortAsc ? cmp : -cmp;
        });

    const total = scopedUsers.length;
    const activeCount = scopedUsers.filter((u) => u.status === 'Active').length;
    const atRiskCount = scopedUsers.filter((u) => u.status === 'At Risk').length;
    const inactiveCount = scopedUsers.filter((u) => u.status === 'Inactive').length;
    const adoptionRate = total > 0 ? Math.round((activeCount / total) * 100) : 0;

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

    if (data === undefined) {
        return (
            <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
                Loading adoption data...
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* ── Charts ── */}
            <FALeadCharts />
            {total > 0 && <AdoptionByDeptCharts usersWithStatus={usersWithStatus} />}

            {/* ── CRM Adoption Table ── */}

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">CRM User Adoption</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Tracking Dynamics 365 activity across the group &mdash; last synced:{' '}
                        <span className="font-medium text-slate-700">{formatSyncTime(data.lastSyncedAt)}</span>
                    </p>
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

            {/* Error Banner */}
            {syncError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                    <strong>Sync failed:</strong> {syncError}
                </div>
            )}

            {/* Empty State */}
            {total === 0 && (
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

            {total > 0 && (
                <>
                    {/* Summary Cards */}
                    <div className="flex flex-wrap gap-3">
                        <SummaryCard
                            icon={<Users className="w-4 h-4 text-slate-600" />}
                            label="Total Users"
                            value={total}
                            color="bg-slate-100"
                            active={statusFilter === 'all'}
                            onClick={() => setStatusFilter('all')}
                        />
                        <SummaryCard
                            icon={<UserCheck className="w-4 h-4 text-emerald-600" />}
                            label={`Active (${adoptionRate}%)`}
                            value={activeCount}
                            color="bg-emerald-50"
                            active={statusFilter === 'Active'}
                            onClick={() => setStatusFilter(statusFilter === 'Active' ? 'all' : 'Active')}
                        />
                        <SummaryCard
                            icon={<AlertTriangle className="w-4 h-4 text-amber-600" />}
                            label="At Risk"
                            value={atRiskCount}
                            color="bg-amber-50"
                            active={statusFilter === 'At Risk'}
                            onClick={() => setStatusFilter(statusFilter === 'At Risk' ? 'all' : 'At Risk')}
                        />
                        <SummaryCard
                            icon={<UserX className="w-4 h-4 text-red-600" />}
                            label="Inactive"
                            value={inactiveCount}
                            color="bg-red-50"
                            active={statusFilter === 'Inactive'}
                            onClick={() => setStatusFilter(statusFilter === 'Inactive' ? 'all' : 'Inactive')}
                        />
                    </div>

                    {/* Filters */}
                    <div className="flex flex-wrap gap-3">
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search users..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-slate-300 w-56"
                            />
                        </div>
                        <select
                            value={deptFilter}
                            onChange={(e) => setDeptFilter(e.target.value)}
                            className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-slate-300 text-slate-700"
                        >
                            {departments.map((d) => (
                                <option key={d} value={d}>{d === 'all' ? 'All Departments' : d}</option>
                            ))}
                        </select>
                        <select
                            value={timePeriod}
                            onChange={(e) => handleTimePeriodChange(e.target.value as TimePeriod)}
                            disabled={isSyncing}
                            className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-slate-300 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {TIME_PERIOD_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                        {(statusFilter !== 'all' || deptFilter !== 'all' || timePeriod !== '1m' || search) && (
                            <button
                                onClick={() => { setStatusFilter('all'); setDeptFilter('all'); setTimePeriod('1m'); setSearch(''); }}
                                className="px-3 py-2 text-sm text-slate-500 hover:text-slate-900 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 transition-colors"
                            >
                                Clear filters
                            </button>
                        )}
                        <span className="ml-auto self-center text-xs text-slate-400">
                            {filtered.length} of {total} users
                        </span>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50">
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                            <ThButton col="fullName">Name</ThButton>
                                        </th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                            <ThButton col="department">Department</ThButton>
                                        </th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                            <ThButton col="lastActiveOn">Last Login</ThButton>
                                        </th>
                                        <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                            <ThButton col="cases">Cases</ThButton>
                                        </th>
                                        <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                            <ThButton col="leads">Leads</ThButton>
                                        </th>
                                        <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                            <ThButton col="contacts">Contacts</ThButton>
                                        </th>
                                        <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                            <ThButton col="invoices">Invoices</ThButton>
                                        </th>
                                        <th className="text-right px-4 py-3 text-xs font-semibold text-pink-400 uppercase tracking-wider">
                                            <ThButton col="opportunities">Opps</ThButton>
                                        </th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                            <ThButton col="status">Status</ThButton>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                        {filtered.length === 0 ? (
                                        <tr>
                                            <td colSpan={9} className="text-center py-12 text-slate-400 text-sm">
                                                No users match the current filters.
                                            </td>
                                        </tr>
                                    ) : (
                                        filtered.map((user) => (
                                            <tr key={user._id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-4 py-3">
                                                    <div className="font-medium text-slate-900">{user.fullName}</div>
                                                    {user.email && (
                                                        <div className="text-xs text-slate-400 mt-0.5">{user.email}</div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-slate-600">
                                                    {user.department ?? <span className="text-slate-300">—</span>}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`font-medium ${user.status === 'Active' ? 'text-emerald-600' : user.status === 'At Risk' ? 'text-amber-600' : 'text-red-500'}`}>
                                                        {formatRelativeDate(user.lastActiveOn)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <span className={user.cases > 0 ? 'font-semibold text-slate-800' : 'text-slate-300'}>
                                                        {user.cases > 0 ? user.cases : '—'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <span className={user.leads > 0 ? 'font-semibold text-slate-800' : 'text-slate-300'}>
                                                        {user.leads > 0 ? user.leads : '—'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <span className={user.contacts > 0 ? 'font-semibold text-slate-800' : 'text-slate-300'}>
                                                        {user.contacts > 0 ? user.contacts : '—'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <span className={user.invoices > 0 ? 'font-semibold text-slate-800' : 'text-slate-300'}>
                                                        {user.invoices > 0 ? user.invoices : '—'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    {user.opportunities > 0 ? (
                                                        <span className={`font-semibold ${OPP_FOCUSED_DEPTS.has(user.department ?? '') ? 'text-pink-600' : 'text-slate-800'}`}>
                                                            {user.opportunities}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-300">—</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <StatusBadge status={user.status} />
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="flex flex-wrap gap-6 text-xs text-slate-400">
                        <span><strong className="text-emerald-600">Active</strong> — logged in within {TIME_PERIOD_OPTIONS.find((o) => o.value === timePeriod)!.label.toLowerCase()}</span>
                        <span><strong className="text-red-500">Inactive</strong> — no login within that period</span>
                        <span className="ml-auto">Record counts cover the last sync period</span>
                    </div>
                </>
            )}
        </div>
    );
}
