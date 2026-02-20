import React from 'react';
import { AnnualObjective, FiveYearTarget } from '@/types';
import { Target, User, Link, CheckCircle2 } from 'lucide-react';

interface OKRObjectivesViewProps {
    annualObjectives: AnnualObjective[];
    fiveYearTargets: FiveYearTarget[];
}

const PILLAR_STYLES: Record<string, { accent: string; border: string; headerBg: string; chip: string; iconBg: string }> = {
    Tech: {
        accent: 'text-indigo-600',
        border: 'border-indigo-100',
        headerBg: 'bg-indigo-50',
        chip: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
        iconBg: 'bg-indigo-100',
    },
    Diversification: {
        accent: 'text-violet-600',
        border: 'border-violet-100',
        headerBg: 'bg-violet-50',
        chip: 'bg-violet-50 text-violet-700 border border-violet-200',
        iconBg: 'bg-violet-100',
    },
    Growth: {
        accent: 'text-emerald-600',
        border: 'border-emerald-100',
        headerBg: 'bg-emerald-50',
        chip: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
        iconBg: 'bg-emerald-100',
    },
    Culture: {
        accent: 'text-amber-600',
        border: 'border-amber-100',
        headerBg: 'bg-amber-50',
        chip: 'bg-amber-50 text-amber-700 border border-amber-200',
        iconBg: 'bg-amber-100',
    },
    Brand: {
        accent: 'text-rose-600',
        border: 'border-rose-100',
        headerBg: 'bg-rose-50',
        chip: 'bg-rose-50 text-rose-700 border border-rose-200',
        iconBg: 'bg-rose-100',
    },
};

const DEFAULT_STYLE = {
    accent: 'text-slate-600',
    border: 'border-slate-100',
    headerBg: 'bg-slate-50',
    chip: 'bg-slate-100 text-slate-700 border border-slate-200',
    iconBg: 'bg-slate-100',
};

const OKRObjectivesView: React.FC<OKRObjectivesViewProps> = ({
    annualObjectives,
    fiveYearTargets,
}) => {
    const pillars = ['Tech', 'Diversification', 'Growth', 'Culture', 'Brand'];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                    Annual Objectives 2026
                </h1>
                <p className="text-slate-500 mt-1 text-sm">
                    What we&apos;re committed to achieving this year
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {pillars.map((pillar) => {
                    const objectives = annualObjectives.filter((o) => o.pillar === pillar);
                    const target = fiveYearTargets.find((t) => t.pillar === pillar);
                    const styles = PILLAR_STYLES[pillar] ?? DEFAULT_STYLE;
                    const hasObjectives = objectives.length > 0;

                    return (
                        <div
                            key={pillar}
                            className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm"
                        >
                            {/* Pillar label bar */}
                            <div className={`px-5 py-3 border-b border-slate-100 ${styles.headerBg}`}>
                                <span className={`text-xs font-bold uppercase tracking-widest ${styles.accent}`}>
                                    {pillar}
                                </span>
                            </div>

                            <div className="p-5 space-y-4">
                                {/* Linked 5-year target */}
                                {target && (
                                    <div className="flex gap-2.5">
                                        <div className={`p-1.5 rounded-md flex-shrink-0 mt-0.5 ${styles.iconBg}`}>
                                            <Link className={`w-3.5 h-3.5 ${styles.accent}`} />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400 font-medium mb-0.5">
                                                5-Year Target
                                            </p>
                                            <p className="text-sm text-slate-600 leading-snug">
                                                {target.target}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Annual objectives */}
                                {hasObjectives ? (
                                    objectives.map((obj) => (
                                        <div key={obj._id ?? obj.objective} className="space-y-3">
                                            <div className="flex gap-2.5">
                                                <div className={`p-1.5 rounded-md flex-shrink-0 mt-0.5 ${styles.iconBg}`}>
                                                    <Target className={`w-3.5 h-3.5 ${styles.accent}`} />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-xs text-slate-400 font-medium mb-0.5">
                                                        Annual Objective
                                                    </p>
                                                    <p className="text-sm text-slate-900 font-semibold leading-snug">
                                                        {obj.objective}
                                                    </p>
                                                </div>
                                            </div>

                                            {obj.successMetric && (
                                                <div className="flex gap-2.5">
                                                    <div className={`p-1.5 rounded-md flex-shrink-0 mt-0.5 ${styles.iconBg}`}>
                                                        <CheckCircle2 className={`w-3.5 h-3.5 ${styles.accent}`} />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-slate-400 font-medium mb-0.5">
                                                            Success Metric
                                                        </p>
                                                        <p className="text-sm text-slate-600 leading-snug">
                                                            {obj.successMetric}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            {obj.owner && (
                                                <div className="flex items-center gap-1.5">
                                                    <User className="w-3.5 h-3.5 text-slate-400" />
                                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles.chip}`}>
                                                        {obj.owner}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex items-center gap-2 text-slate-400 text-sm py-2">
                                        <Target className="w-4 h-4" />
                                        No annual objective set yet
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default OKRObjectivesView;
