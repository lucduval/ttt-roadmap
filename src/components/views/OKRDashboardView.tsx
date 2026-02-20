import React from 'react';
import { KeyResult, FiveYearTarget, AnnualObjective } from '@/types';
import OKRStatusBadge from '@/components/OKRStatusBadge';
import PillarChart from '@/components/PillarChart';
import OKRProgressBar from '@/components/OKRProgressBar';
import { TrendingUp, Target, Layers, AlertCircle } from 'lucide-react';

interface OKRDashboardViewProps {
    keyResults: KeyResult[];
    fiveYearTargets: FiveYearTarget[];
    annualObjectives: AnnualObjective[];
}

const PILLAR_STYLES: Record<string, { label: string; accent: string; border: string; bg: string }> = {
    Tech: {
        label: 'text-indigo-700',
        accent: 'text-indigo-600',
        border: 'border-indigo-100',
        bg: 'bg-indigo-50',
    },
    Diversification: {
        label: 'text-violet-700',
        accent: 'text-violet-600',
        border: 'border-violet-100',
        bg: 'bg-violet-50',
    },
    Growth: {
        label: 'text-emerald-700',
        accent: 'text-emerald-600',
        border: 'border-emerald-100',
        bg: 'bg-emerald-50',
    },
    Culture: {
        label: 'text-amber-700',
        accent: 'text-amber-600',
        border: 'border-amber-100',
        bg: 'bg-amber-50',
    },
    Brand: {
        label: 'text-rose-700',
        accent: 'text-rose-600',
        border: 'border-rose-100',
        bg: 'bg-rose-50',
    },
};

const DEFAULT_STYLE = {
    label: 'text-slate-700',
    accent: 'text-slate-600',
    border: 'border-slate-100',
    bg: 'bg-slate-50',
};

const OKRDashboardView: React.FC<OKRDashboardViewProps> = ({
    keyResults,
    fiveYearTargets,
    annualObjectives,
}) => {
    const totalKRs = keyResults.length;
    const greenKRs = keyResults.filter((kr) => kr.status === 'Green').length;
    const amberKRs = keyResults.filter((kr) => kr.status === 'Amber').length;
    const redKRs = keyResults.filter((kr) => kr.status === 'Red').length;
    const overallProgress =
        totalKRs > 0
            ? keyResults.reduce((sum, kr) => sum + kr.progress, 0) / totalKRs
            : 0;

    const pillars = ['Tech', 'Diversification', 'Growth', 'Culture', 'Brand'];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">OKR Dashboard</h1>
                <p className="text-slate-500 mt-1 text-sm">2026 Annual Progress — Q1 Overview</p>
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

                {/* Traffic Lights */}
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
                                {new Set(keyResults.map((kr) => kr.pillar)).size} / 5
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
                {keyResults.length > 0 ? (
                    <PillarChart keyResults={keyResults} />
                ) : (
                    <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
                        No key results data yet
                    </div>
                )}
            </div>

            {/* Per-Pillar Summary Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {pillars.map((pillar) => {
                    const krs = keyResults.filter((kr) => kr.pillar === pillar);
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
                                    <AlertCircle className="w-3 h-3" />
                                    No KRs yet
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default OKRDashboardView;
