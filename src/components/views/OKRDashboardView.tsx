import React, { useState, useMemo } from 'react';
import { KeyResult, FiveYearTarget, AnnualObjective, Quarter } from '@/types';
import OKRStatusBadge from '@/components/OKRStatusBadge';
import PillarChart from '@/components/PillarChart';
import OKRProgressBar from '@/components/OKRProgressBar';
import { TrendingUp, Target, Layers, AlertTriangle, CheckCircle2, Users } from 'lucide-react';

interface OKRDashboardViewProps {
    keyResults: KeyResult[];
    fiveYearTargets: FiveYearTarget[];
    annualObjectives: AnnualObjective[];
}

const QUARTERS: Quarter[] = ['Q1', 'Q2', 'Q3', 'Q4'];
type QuarterFilter = Quarter | 'Full Year';
const AT_RISK_WEEKS_THRESHOLD = 3;

function getActiveQuarter(): Quarter {
    const month = new Date().getMonth();
    if (month <= 2) return 'Q1';
    if (month <= 5) return 'Q2';
    if (month <= 8) return 'Q3';
    return 'Q4';
}

function getQuarterEndDate(quarter: Quarter): Date {
    const year = new Date().getFullYear();
    const ends: Record<Quarter, [number, number]> = {
        Q1: [2, 31],
        Q2: [5, 30],
        Q3: [8, 30],
        Q4: [11, 31],
    };
    const [month, day] = ends[quarter];
    return new Date(year, month, day, 23, 59, 59);
}

function isAtRisk(kr: KeyResult): boolean {
    if (kr.status !== 'Red') return false;
    if (kr.progress >= 1) return false;
    const quarter = (kr.quarter ?? 'Q1') as Quarter;
    const now = new Date();
    const end = getQuarterEndDate(quarter);
    const weeksLeft = Math.max(0, (end.getTime() - now.getTime()) / (7 * 24 * 60 * 60 * 1000));
    return weeksLeft < AT_RISK_WEEKS_THRESHOLD;
}

function isCompleted(kr: KeyResult): boolean {
    return kr.progress >= 1;
}

const PILLAR_STYLES: Record<string, { label: string; accent: string; border: string; bg: string }> = {
    Tech: { label: 'text-indigo-700', accent: 'text-indigo-600', border: 'border-indigo-100', bg: 'bg-indigo-50' },
    Diversification: { label: 'text-violet-700', accent: 'text-violet-600', border: 'border-violet-100', bg: 'bg-violet-50' },
    Growth: { label: 'text-emerald-700', accent: 'text-emerald-600', border: 'border-emerald-100', bg: 'bg-emerald-50' },
    Culture: { label: 'text-amber-700', accent: 'text-amber-600', border: 'border-amber-100', bg: 'bg-amber-50' },
    Brand: { label: 'text-rose-700', accent: 'text-rose-600', border: 'border-rose-100', bg: 'bg-rose-50' },
};

const DEFAULT_STYLE = { label: 'text-slate-700', accent: 'text-slate-600', border: 'border-slate-100', bg: 'bg-slate-50' };

const STATUS_COLORS: Record<string, string> = {
    Green: 'bg-emerald-500',
    Amber: 'bg-amber-400',
    Red: 'bg-rose-500',
};

function getInitials(name: string): string {
    return name
        .split(/[\s&,]+/)
        .filter(Boolean)
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

const OKRDashboardView: React.FC<OKRDashboardViewProps> = ({
    keyResults,
    fiveYearTargets,
    annualObjectives,
}) => {
    const [selectedQuarter, setSelectedQuarter] = useState<QuarterFilter>(getActiveQuarter());
    const [selectedOwners, setSelectedOwners] = useState<string[]>([]);

    // Filter KRs by selected quarter
    const filteredKRs = useMemo(() => {
        if (selectedQuarter === 'Full Year') return keyResults;
        return keyResults.filter((kr) => (kr.quarter ?? 'Q1') === selectedQuarter);
    }, [keyResults, selectedQuarter]);

    const totalKRs = filteredKRs.length;
    const greenKRs = filteredKRs.filter((kr) => kr.status === 'Green').length;
    const amberKRs = filteredKRs.filter((kr) => kr.status === 'Amber').length;
    const redKRs = filteredKRs.filter((kr) => kr.status === 'Red').length;
    const atRiskKRs = filteredKRs.filter(isAtRisk).length;
    const completedKRs = filteredKRs.filter(isCompleted).length;
    const overallProgress =
        totalKRs > 0
            ? filteredKRs.reduce((sum, kr) => sum + kr.progress, 0) / totalKRs
            : 0;

    const pillars = ['Tech', 'Diversification', 'Growth', 'Culture', 'Brand'];

    // People Insights data
    const allOwners = useMemo(
        () => Array.from(new Set(filteredKRs.map((kr) => kr.owner).filter(Boolean))).sort() as string[],
        [filteredKRs]
    );

    const visibleOwners = useMemo(() => {
        if (selectedOwners.length === 0) return allOwners;
        return allOwners.filter((o) => selectedOwners.includes(o));
    }, [allOwners, selectedOwners]);

    const toggleOwner = (owner: string) =>
        setSelectedOwners((prev) =>
            prev.includes(owner) ? prev.filter((o) => o !== owner) : [...prev, owner]
        );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header + Quarter Selector */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">OKR Dashboard</h1>
                <p className="text-slate-500 mt-1 text-sm">2026 Annual Progress</p>

                {/* Quarter Tabs */}
                <div className="flex items-center gap-1.5 mt-4 bg-slate-100 rounded-lg p-1 w-fit">
                    {QUARTERS.map((q) => (
                        <button
                            key={q}
                            onClick={() => setSelectedQuarter(q)}
                            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
                                selectedQuarter === q
                                    ? 'bg-white text-slate-900 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            {q}
                        </button>
                    ))}
                    <button
                        onClick={() => setSelectedQuarter('Full Year')}
                        className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
                            selectedQuarter === 'Full Year'
                                ? 'bg-white text-slate-900 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        Full Year
                    </button>
                </div>
            </div>

            {/* Top Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Overall Score */}
                <div className="col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                            <TrendingUp className="w-4 h-4" />
                            Overall OKR Score
                        </div>
                        <span className="text-2xl font-bold text-slate-900 tabular-nums">
                            {Math.round(overallProgress * 100)}%
                        </span>
                    </div>
                    <OKRProgressBar progress={overallProgress} showLabel={false} height="lg" />
                    <p className="text-xs text-slate-400 mt-2">{totalKRs} key results tracked</p>
                </div>

                {/* KR Health */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-2 text-slate-500 text-sm font-medium mb-3">
                        <Target className="w-4 h-4" />
                        KR Health
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <OKRStatusBadge status="Green" size="sm" />
                            <span className="text-slate-900 font-bold tabular-nums">{greenKRs}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <OKRStatusBadge status="Amber" size="sm" />
                            <span className="text-slate-900 font-bold tabular-nums">{amberKRs}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <OKRStatusBadge status="Red" size="sm" />
                            <span className="text-slate-900 font-bold tabular-nums">{redKRs}</span>
                        </div>
                        <div className="border-t border-slate-100 pt-2 mt-1 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1.5 text-xs font-medium text-orange-600">
                                    <AlertTriangle className="w-3.5 h-3.5" />
                                    At Risk
                                </span>
                                <span className="text-orange-600 font-bold tabular-nums text-sm">{atRiskKRs}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    Completed
                                </span>
                                <span className="text-emerald-600 font-bold tabular-nums text-sm">{completedKRs}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Coverage */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-2 text-slate-500 text-sm font-medium mb-3">
                        <Layers className="w-4 h-4" />
                        Coverage
                    </div>
                    <div className="space-y-1.5">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Pillars</span>
                            <span className="text-slate-900 font-semibold">
                                {new Set(filteredKRs.map((kr) => kr.pillar)).size} / 5
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Objectives</span>
                            <span className="text-slate-900 font-semibold">
                                {annualObjectives.length}
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">5-Year Targets</span>
                            <span className="text-slate-900 font-semibold">
                                {fiveYearTargets.length}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Pillar Progress Chart */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-slate-700 mb-4">Progress by Pillar</h2>
                {filteredKRs.length > 0 ? (
                    <PillarChart keyResults={filteredKRs} showTargetLines />
                ) : (
                    <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
                        No key results data for {selectedQuarter}
                    </div>
                )}
            </div>

            {/* Per-Pillar Summary Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {pillars.map((pillar) => {
                    const krs = filteredKRs.filter((kr) => kr.pillar === pillar);
                    const avg =
                        krs.length > 0
                            ? krs.reduce((s, kr) => s + kr.progress, 0) / krs.length
                            : 0;
                    const hasData = krs.length > 0;
                    const styles = PILLAR_STYLES[pillar] ?? DEFAULT_STYLE;

                    return (
                        <div
                            key={pillar}
                            className={`rounded-xl border p-4 ${styles.border} ${styles.bg}`}
                        >
                            <div className={`text-xs font-bold uppercase tracking-wider mb-2 ${styles.label}`}>
                                {pillar}
                            </div>
                            {hasData ? (
                                <>
                                    <div className={`text-xl font-bold tabular-nums mb-2 ${styles.accent}`}>
                                        {Math.round(avg * 100)}%
                                    </div>
                                    <OKRProgressBar progress={avg} showLabel={false} height="sm" />
                                    <p className="text-xs text-slate-500 mt-1.5">
                                        {krs.length} KR{krs.length !== 1 ? 's' : ''}
                                    </p>
                                </>
                            ) : (
                                <div className="flex items-center gap-1.5 text-slate-400 text-xs mt-1">
                                    <AlertTriangle className="w-3 h-3" />
                                    No KRs yet
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* ═══ People Insights Section ═══ */}
            {allOwners.length > 0 && (
                <div className="space-y-4">
                    <div className="border-t border-slate-200 pt-6">
                        <div className="flex items-center gap-2 mb-1">
                            <Users className="w-5 h-5 text-slate-500" />
                            <h2 className="text-lg font-bold text-slate-900">People Insights</h2>
                        </div>
                        <p className="text-sm text-slate-500 mb-4">
                            Per-person KR breakdown for {selectedQuarter === 'Full Year' ? 'the full year' : selectedQuarter}
                        </p>

                        {/* Owner filter */}
                        <div className="flex flex-wrap items-center gap-2 mb-4">
                            <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Owner:</span>
                            {allOwners.map((owner) => {
                                const active = selectedOwners.includes(owner);
                                return (
                                    <button
                                        key={owner}
                                        onClick={() => toggleOwner(owner)}
                                        className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                                            active
                                                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm'
                                                : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700'
                                        }`}
                                    >
                                        {owner}
                                    </button>
                                );
                            })}
                            {selectedOwners.length > 0 && (
                                <button
                                    onClick={() => setSelectedOwners([])}
                                    className="text-xs text-slate-400 hover:text-slate-600"
                                >
                                    Clear
                                </button>
                            )}
                        </div>

                        {/* Owner cards grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {visibleOwners.map((owner) => {
                                const ownerKRs = filteredKRs.filter((kr) => kr.owner === owner);
                                if (ownerKRs.length === 0) return null;
                                const avgProgress =
                                    ownerKRs.reduce((s, kr) => s + kr.progress, 0) / ownerKRs.length;
                                const ownerGreen = ownerKRs.filter((kr) => kr.status === 'Green').length;
                                const ownerAmber = ownerKRs.filter((kr) => kr.status === 'Amber').length;
                                const ownerRed = ownerKRs.filter((kr) => kr.status === 'Red').length;
                                const ownerCompleted = ownerKRs.filter(isCompleted).length;
                                const ownerAtRisk = ownerKRs.filter(isAtRisk).length;

                                return (
                                    <div
                                        key={owner}
                                        className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm"
                                    >
                                        {/* Owner header */}
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                                                {getInitials(owner)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-800">{owner}</p>
                                                <p className="text-xs text-slate-400">
                                                    {ownerKRs.length} KR{ownerKRs.length !== 1 ? 's' : ''}
                                                </p>
                                            </div>
                                            <div className="ml-auto text-right">
                                                <p className="text-lg font-bold text-slate-900 tabular-nums">
                                                    {Math.round(avgProgress * 100)}%
                                                </p>
                                            </div>
                                        </div>

                                        {/* Progress bar */}
                                        <OKRProgressBar progress={avgProgress} showLabel={false} height="sm" />

                                        {/* Status breakdown mini bar */}
                                        <div className="flex items-center gap-1 mt-3 h-2 rounded-full overflow-hidden bg-slate-100">
                                            {ownerGreen > 0 && (
                                                <div
                                                    className="h-full bg-emerald-500 rounded-full"
                                                    style={{ width: `${(ownerGreen / ownerKRs.length) * 100}%` }}
                                                />
                                            )}
                                            {ownerAmber > 0 && (
                                                <div
                                                    className="h-full bg-amber-400 rounded-full"
                                                    style={{ width: `${(ownerAmber / ownerKRs.length) * 100}%` }}
                                                />
                                            )}
                                            {ownerRed > 0 && (
                                                <div
                                                    className="h-full bg-rose-500 rounded-full"
                                                    style={{ width: `${(ownerRed / ownerKRs.length) * 100}%` }}
                                                />
                                            )}
                                        </div>

                                        {/* Legend + counts */}
                                        <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                                            <span className="flex items-center gap-1">
                                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                                {ownerGreen}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <span className="w-2 h-2 rounded-full bg-amber-400" />
                                                {ownerAmber}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <span className="w-2 h-2 rounded-full bg-rose-500" />
                                                {ownerRed}
                                            </span>
                                            {ownerCompleted > 0 && (
                                                <span className="flex items-center gap-1 text-emerald-600">
                                                    <CheckCircle2 className="w-3 h-3" />
                                                    {ownerCompleted}
                                                </span>
                                            )}
                                            {ownerAtRisk > 0 && (
                                                <span className="flex items-center gap-1 text-orange-600">
                                                    <AlertTriangle className="w-3 h-3" />
                                                    {ownerAtRisk}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OKRDashboardView;
