import React from 'react';
import { KeyResult } from '@/types';
import OKRProgressBar from '@/components/OKRProgressBar';
import OKRStatusBadge from '@/components/OKRStatusBadge';
import ConfidenceGauge from '@/components/ConfidenceGauge';
import { User, Edit3, Plus } from 'lucide-react';

interface OKRQ1ViewProps {
    keyResults: KeyResult[];
    onEdit?: (kr: KeyResult) => void;
    onAdd?: () => void;
}

const PILLAR_STYLES: Record<string, { label: string; dot: string; border: string; bg: string }> = {
    Tech: {
        label: 'text-indigo-700',
        dot: 'bg-indigo-500',
        border: 'border-indigo-200',
        bg: 'bg-indigo-50',
    },
    Diversification: {
        label: 'text-violet-700',
        dot: 'bg-violet-500',
        border: 'border-violet-200',
        bg: 'bg-violet-50',
    },
    Growth: {
        label: 'text-emerald-700',
        dot: 'bg-emerald-500',
        border: 'border-emerald-200',
        bg: 'bg-emerald-50',
    },
    Culture: {
        label: 'text-amber-700',
        dot: 'bg-amber-400',
        border: 'border-amber-200',
        bg: 'bg-amber-50',
    },
    Brand: {
        label: 'text-rose-700',
        dot: 'bg-rose-500',
        border: 'border-rose-200',
        bg: 'bg-rose-50',
    },
};

const DEFAULT_STYLE = {
    label: 'text-slate-700',
    dot: 'bg-slate-400',
    border: 'border-slate-200',
    bg: 'bg-slate-50',
};

const OKRQ1View: React.FC<OKRQ1ViewProps> = ({ keyResults, onEdit, onAdd }) => {
    const pillarOrder = ['Tech', 'Diversification', 'Growth', 'Culture', 'Brand'];
    const presentPillars = pillarOrder.filter((p) =>
        keyResults.some((kr) => kr.pillar === p)
    );
    const otherPillars = Array.from(new Set(keyResults.map((kr) => kr.pillar))).filter(
        (p) => !pillarOrder.includes(p)
    );
    const sortedPillars = [...presentPillars, ...otherPillars];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Q1 Key Results</h1>
                    <p className="text-slate-500 mt-1 text-sm">Detailed progress by pillar and objective</p>
                </div>
                {onAdd && (
                    <button
                        onClick={onAdd}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-sm shrink-0"
                    >
                        <Plus className="w-4 h-4" />
                        Add Key Result
                    </button>
                )}
            </div>

            {keyResults.length === 0 && (
                <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400 shadow-sm">
                    No Q1 key results have been entered yet.
                </div>
            )}

            {sortedPillars.map((pillar) => {
                const pillarKRs = keyResults.filter((kr) => kr.pillar === pillar);
                const objectives = Array.from(new Set(pillarKRs.map((kr) => kr.objective)));
                const pillarAvg =
                    pillarKRs.reduce((s, kr) => s + kr.progress, 0) / pillarKRs.length;
                const styles = PILLAR_STYLES[pillar] ?? DEFAULT_STYLE;

                return (
                    <div key={pillar} className="space-y-3">
                        {/* Pillar header chip */}
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold uppercase tracking-wider ${styles.bg} ${styles.border} ${styles.label}`}>
                            <span className={`w-2 h-2 rounded-full ${styles.dot}`} />
                            {pillar}
                            <span className="font-normal normal-case text-slate-500">
                                {Math.round(pillarAvg * 100)}% avg
                            </span>
                        </div>

                        {objectives.map((objective) => {
                            const objKRs = pillarKRs.filter((kr) => kr.objective === objective);
                            return (
                                <div
                                    key={objective}
                                    className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm"
                                >
                                    {/* Objective header */}
                                    <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/60">
                                        <p className="text-sm font-semibold text-slate-700">{objective}</p>
                                    </div>

                                    {/* KR rows */}
                                    <div className="divide-y divide-slate-100">
                                        {objKRs.map((kr) => (
                                            <div
                                                key={kr._id ?? kr.keyResult}
                                                className="px-5 py-4 grid grid-cols-1 lg:grid-cols-[1fr_200px_auto_auto_auto] gap-3 lg:gap-4 items-center group"
                                            >
                                                {/* KR text + owner */}
                                                <div>
                                                    <p className="text-sm text-slate-800 font-medium leading-snug">
                                                        {kr.keyResult}
                                                    </p>
                                                    {kr.owner && (
                                                        <div className="flex items-center gap-1 mt-1 text-xs text-slate-400">
                                                            <User className="w-3 h-3" />
                                                            {kr.owner}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Progress */}
                                                <div className="min-w-0">
                                                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                                                        <span>{kr.current} / {kr.target}</span>
                                                    </div>
                                                    <OKRProgressBar
                                                        progress={kr.progress}
                                                        height="md"
                                                        target={kr.target}
                                                        thresholdAmber={kr.thresholdAmber}
                                                        thresholdGreen={kr.thresholdGreen}
                                                    />
                                                </div>

                                                {/* Status badge */}
                                                <OKRStatusBadge status={kr.status} />

                                                {/* Confidence */}
                                                <div className="flex flex-col items-center gap-0.5">
                                                    <ConfidenceGauge value={kr.confidence} />
                                                    <span className="text-xs text-slate-400">conf.</span>
                                                </div>

                                                {/* Edit button */}
                                                {onEdit && (
                                                    <button
                                                        onClick={() => onEdit(kr)}
                                                        className="p-1.5 text-slate-300 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                                                        title="Edit key result"
                                                    >
                                                        <Edit3 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                );
            })}
        </div>
    );
};

export default OKRQ1View;
