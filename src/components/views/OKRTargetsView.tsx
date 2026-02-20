import React from 'react';
import { FiveYearTarget } from '@/types';
import { User, MapPin, Flag } from 'lucide-react';

interface OKRTargetsViewProps {
    fiveYearTargets: FiveYearTarget[];
}

const PILLAR_CONFIG: Record<string, {
    accent: string;
    border: string;
    headerBg: string;
    chip: string;
    iconBg: string;
    titleColor: string;
    icon: string;
}> = {
    Tech: {
        accent: 'text-indigo-600',
        border: 'border-indigo-100',
        headerBg: 'bg-indigo-50',
        chip: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
        iconBg: 'bg-indigo-100',
        titleColor: 'text-indigo-900',
        icon: '💻',
    },
    Diversification: {
        accent: 'text-violet-600',
        border: 'border-violet-100',
        headerBg: 'bg-violet-50',
        chip: 'bg-violet-50 text-violet-700 border border-violet-200',
        iconBg: 'bg-violet-100',
        titleColor: 'text-violet-900',
        icon: '🔀',
    },
    Growth: {
        accent: 'text-emerald-600',
        border: 'border-emerald-100',
        headerBg: 'bg-emerald-50',
        chip: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
        iconBg: 'bg-emerald-100',
        titleColor: 'text-emerald-900',
        icon: '📈',
    },
    Culture: {
        accent: 'text-amber-600',
        border: 'border-amber-100',
        headerBg: 'bg-amber-50',
        chip: 'bg-amber-50 text-amber-700 border border-amber-200',
        iconBg: 'bg-amber-100',
        titleColor: 'text-amber-900',
        icon: '🏆',
    },
    Brand: {
        accent: 'text-rose-600',
        border: 'border-rose-100',
        headerBg: 'bg-rose-50',
        chip: 'bg-rose-50 text-rose-700 border border-rose-200',
        iconBg: 'bg-rose-100',
        titleColor: 'text-rose-900',
        icon: '⭐',
    },
};

const DEFAULT_CONFIG = {
    accent: 'text-slate-600',
    border: 'border-slate-100',
    headerBg: 'bg-slate-50',
    chip: 'bg-slate-100 text-slate-700 border border-slate-200',
    iconBg: 'bg-slate-100',
    titleColor: 'text-slate-900',
    icon: '🎯',
};

const PILLAR_ORDER = ['Tech', 'Diversification', 'Growth', 'Culture', 'Brand'];

const OKRTargetsView: React.FC<OKRTargetsViewProps> = ({ fiveYearTargets }) => {
    const sorted = [
        ...PILLAR_ORDER
            .map((p) => fiveYearTargets.find((t) => t.pillar === p))
            .filter(Boolean) as FiveYearTarget[],
        ...fiveYearTargets.filter((t) => !PILLAR_ORDER.includes(t.pillar)),
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">5-Year Targets</h1>
                <p className="text-slate-500 mt-1 text-sm">
                    Where TTT is headed — aspirational goals by 2030
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {sorted.map((target) => {
                    const config = PILLAR_CONFIG[target.pillar] ?? DEFAULT_CONFIG;
                    return (
                        <div
                            key={target._id ?? target.pillar}
                            className={`bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm`}
                        >
                            {/* Pillar header bar */}
                            <div className={`px-5 py-3 border-b ${config.border} ${config.headerBg} flex items-center gap-2`}>
                                <span>{config.icon}</span>
                                <span className={`text-xs font-bold uppercase tracking-widest ${config.accent}`}>
                                    {target.pillar}
                                </span>
                            </div>

                            <div className="p-5 space-y-4">
                                {/* Target statement */}
                                <p className={`text-base font-semibold leading-snug ${config.titleColor}`}>
                                    {target.target}
                                </p>

                                {/* Meta row */}
                                {(target.owner || target.currentPosition || target.targetValue) && (
                                    <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100">
                                        {target.owner && (
                                            <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${config.chip}`}>
                                                <User className="w-3 h-3" />
                                                {target.owner}
                                            </span>
                                        )}
                                        {target.currentPosition && (
                                            <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-slate-50 text-slate-600 border border-slate-200">
                                                <MapPin className="w-3 h-3" />
                                                Now: {target.currentPosition}
                                            </span>
                                        )}
                                        {target.targetValue && (
                                            <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-slate-50 text-slate-600 border border-slate-200">
                                                <Flag className="w-3 h-3" />
                                                Target: {target.targetValue}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {fiveYearTargets.length === 0 && (
                <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400 shadow-sm">
                    No 5-year targets have been entered yet.
                </div>
            )}
        </div>
    );
};

export default OKRTargetsView;
