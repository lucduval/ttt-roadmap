import React from 'react';
import { StrategicMetric } from '@/types';
import Icon from '../ui/Icon';
import { TrendingUp, Target, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface DashboardViewProps {
    metrics: StrategicMetric[];
}

const DashboardView: React.FC<DashboardViewProps> = ({ metrics }) => {

    const parseGoalValue = (goal: string | undefined): number => {
        if (!goal) return 0;
        return parseFloat(goal.replace(/[^0-9.]/g, '')) || 0;
    };

    const extractUnit = (goal: string | undefined): string => {
        if (!goal) return '';
        return goal.replace(/[0-9.,]/g, '').trim();
    };

    const overallProgress = metrics.length > 0
        ? Math.round(
            metrics.reduce((sum, m) => {
                const target = parseGoalValue(m.targetGoal);
                const current = m.currentValue || 0;
                return sum + (target > 0 ? (current / target) * 100 : 0);
            }, 0) / metrics.length
        )
        : 0;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">

            {/* ─── Header Row ─── */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
                    <p className="text-sm text-slate-500 mt-1">Live progress against 2026 strategic targets.</p>
                </div>
                <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm">
                    <div className="p-2 rounded-lg bg-yellow-50">
                        <Target className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                        <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Overall Progress</p>
                        <p className="text-2xl font-bold text-slate-900 leading-none">{overallProgress}%</p>
                    </div>
                </div>
            </div>

            {/* ─── Summary Cards Row ─── */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3">
                {metrics.map((metric, index) => {
                    const targetVal = parseGoalValue(metric.targetGoal);
                    const currentVal = metric.currentValue || 0;
                    const unit = extractUnit(metric.targetGoal);
                    const percentage = targetVal > 0 ? Math.round((currentVal / targetVal) * 100) : 0;

                    return (
                        <div
                            key={index}
                            className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 shadow-sm"
                        >
                            <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                                <div className={`p-1 sm:p-1.5 rounded-md bg-slate-50 ${metric.iconColor || 'text-slate-600'}`}>
                                    <Icon name={metric.icon} className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                </div>
                                <span className="text-[11px] sm:text-xs font-medium text-slate-500 truncate">{metric.focus}</span>
                            </div>
                            <p className="text-xl sm:text-2xl font-bold text-slate-900 leading-none">
                                {currentVal.toLocaleString()}{unit}
                            </p>
                            <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1">Target: {metric.targetGoal || '-'}</p>
                        </div>
                    );
                })}
            </div>

            {/* ─── Detailed Metric Rows ─── */}
            <div className="space-y-4">
                {metrics.map((metric, index) => {
                    const baseVal = parseGoalValue(metric.baseGoal);
                    const targetVal = parseGoalValue(metric.targetGoal);
                    const stretchVal = parseGoalValue(metric.stretchGoal);
                    const currentVal = metric.currentValue || 0;
                    const unit = extractUnit(metric.targetGoal);
                    const percentage = targetVal > 0 ? (currentVal / targetVal) * 100 : 0;

                    let statusColor = 'text-slate-400';
                    let statusBg = 'bg-slate-50';
                    let StatusIcon = Minus;
                    let statusLabel = 'On track';

                    if (percentage >= 80) {
                        statusColor = 'text-emerald-600';
                        statusBg = 'bg-emerald-50';
                        StatusIcon = ArrowUpRight;
                        statusLabel = 'Strong';
                    } else if (percentage >= 50) {
                        statusColor = 'text-yellow-600';
                        statusBg = 'bg-yellow-50';
                        StatusIcon = TrendingUp;
                        statusLabel = 'On track';
                    } else {
                        statusColor = 'text-red-500';
                        statusBg = 'bg-red-50';
                        StatusIcon = ArrowDownRight;
                        statusLabel = 'Needs focus';
                    }

                    const barColor = metric.iconColor?.replace('text-', 'bg-') || 'bg-yellow-500';

                    return (
                        <div
                            key={index}
                            className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow"
                        >
                            {/* Top row: name, status badge, value */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2.5 rounded-xl bg-slate-50 ${metric.iconColor || 'text-slate-600'}`}>
                                        <Icon name={metric.icon} className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-base sm:text-lg font-bold text-slate-900">{metric.focus}</h3>
                                        <p className="text-xs text-slate-500 mt-0.5">{metric.metric}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 sm:gap-3 pl-[52px] sm:pl-0">
                                    <span className={`inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full ${statusBg} ${statusColor}`}>
                                        <StatusIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                        {statusLabel}
                                    </span>
                                    <span className="text-xl sm:text-3xl font-bold text-slate-900 leading-none">
                                        {currentVal.toLocaleString()}{unit}
                                    </span>
                                </div>
                            </div>

                            {/* Progress visualisation */}
                            <div className="relative">
                                <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-700 ease-out ${barColor}`}
                                        style={{ width: `${Math.min(percentage, 100)}%` }}
                                    />
                                </div>

                                {/* Goal markers */}
                                <div className="flex justify-between mt-2">
                                    <div className="text-center">
                                        <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Base</p>
                                        <p className="text-sm font-bold text-slate-600">{metric.baseGoal || '-'}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[10px] uppercase tracking-wider text-yellow-500 font-semibold">Target</p>
                                        <p className="text-sm font-bold text-slate-800">{metric.targetGoal || '-'}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[10px] uppercase tracking-wider text-emerald-500 font-semibold">Stretch</p>
                                        <p className="text-sm font-bold text-slate-600">{metric.stretchGoal || '-'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Measurement detail */}
                            {metric.detailedMeasurement && (
                                <div className="mt-4 text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                    <span className="font-semibold text-slate-700">How we measure: </span>
                                    {metric.detailedMeasurement}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default DashboardView;
