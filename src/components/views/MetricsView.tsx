import React, { useState } from 'react';
import Icon from '../ui/Icon';
import { StrategicMetric, MetricDefinitionSection } from '@/types';
import { Edit2, Plus, BookOpen, X } from 'lucide-react';
import MetricDefinitionPanel from '../MetricDefinitionPanel';

type Quarter = 'Annual' | 'Q1' | 'Q2' | 'Q3' | 'Q4';
const QUARTERS: Quarter[] = ['Annual', 'Q1', 'Q2', 'Q3', 'Q4'];

interface MetricsViewProps {
    data: StrategicMetric[];
    onEdit?: (item: StrategicMetric, index: number) => void;
    onAdd?: () => void;
    onSaveDefinitions?: (metricId: string, definitions: MetricDefinitionSection[]) => Promise<void>;
}

const MetricsView: React.FC<MetricsViewProps> = ({ data, onEdit, onAdd, onSaveDefinitions }) => {
    const [activeQuarter, setActiveQuarter] = useState<Quarter>('Q1');
    const [activeDefMetricId, setActiveDefMetricId] = useState<string | null>(null);

    const activeDefMetric = activeDefMetricId
        ? (data.find((m) => m._id === activeDefMetricId) ?? null)
        : null;

    const isDefOpen = activeDefMetric !== null;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">

            {/* Header */}
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    {isDefOpen && (
                        <button
                            onClick={() => setActiveDefMetricId(null)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                            title="Back to all metrics"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                        {isDefOpen ? 'Metric Definitions' : 'Strategic Metrics'}
                    </h2>
                </div>
                {!isDefOpen && onAdd && (
                    <button
                        onClick={onAdd}
                        className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-yellow-500 text-slate-900 rounded-md hover:bg-yellow-600 transition-colors shadow-sm text-sm font-medium flex-shrink-0"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">Add Metric</span>
                    </button>
                )}
            </div>

            {/* Quarter Filter — only shown when definitions are closed */}
            {!isDefOpen && (
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-fit">
                    {QUARTERS.map((q) => (
                        <button
                            key={q}
                            onClick={() => setActiveQuarter(q)}
                            className={`px-3 sm:px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                                activeQuarter === q
                                    ? 'bg-white text-yellow-700 shadow-sm border border-yellow-200'
                                    : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            {q}
                        </button>
                    ))}
                </div>
            )}

            {/* ── SPLIT LAYOUT when definition is open ── */}
            {isDefOpen ? (
                <div className="flex gap-4 lg:gap-6 min-h-[calc(100vh-220px)]">

                    {/* Left: compact metric nav */}
                    <div className="w-56 lg:w-64 flex-shrink-0 space-y-1.5">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 px-1 mb-3">
                            All Metrics
                        </p>
                        {data.map((item, index) => {
                            const isActive = item._id === activeDefMetricId;
                            const hasDef = (item.metricDefinitions?.length ?? 0) > 0;
                            return (
                                <button
                                    key={index}
                                    onClick={() => setActiveDefMetricId(item._id ?? null)}
                                    className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-150 ${
                                        isActive
                                            ? 'bg-yellow-50 border border-yellow-200 shadow-sm'
                                            : 'hover:bg-slate-50 border border-transparent'
                                    }`}
                                >
                                    <div className={`p-1.5 rounded-lg bg-slate-100 flex-shrink-0 ${item.iconColor ?? ''}`}>
                                        <Icon name={item.icon} className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className={`text-sm font-semibold truncate ${isActive ? 'text-yellow-800' : 'text-slate-800'}`}>
                                            {item.focus}
                                        </p>
                                        <p className="text-xs text-slate-400 truncate">{item.engine}</p>
                                    </div>
                                    {hasDef && (
                                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isActive ? 'bg-yellow-500' : 'bg-slate-300'}`} />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Divider */}
                    <div className="w-px bg-slate-200 flex-shrink-0" />

                    {/* Right: definition panel */}
                    <div className="flex-1 min-w-0">
                        {activeDefMetric && onSaveDefinitions && (
                            <MetricDefinitionPanel
                                metric={activeDefMetric}
                                onSave={onSaveDefinitions}
                                onClose={() => setActiveDefMetricId(null)}
                            />
                        )}
                    </div>
                </div>
            ) : (
                /* ── NORMAL METRICS GRID ── */
                <div className="grid grid-cols-1 gap-4">
                    {data.map((item, index) => {
                        let base: string | undefined;
                        let target: string | undefined;
                        let stretch: string | undefined;
                        let hasData = true;

                        if (activeQuarter === 'Annual') {
                            base = item.baseGoal;
                            target = item.targetGoal;
                            stretch = item.stretchGoal;
                        } else {
                            const qData = item.quarterlyTargets?.find((qt) => qt.quarter === activeQuarter);
                            if (qData) {
                                base = qData.baseGoal;
                                target = qData.targetGoal;
                                stretch = qData.stretchGoal;
                            } else {
                                hasData = false;
                            }
                        }

                        const hasDef = (item.metricDefinitions?.length ?? 0) > 0;

                        return (
                            <div
                                key={index}
                                className={`group relative bg-white p-4 sm:p-6 border rounded-lg shadow-sm hover:shadow-md transition-all ${
                                    hasData ? 'border-slate-200' : 'border-dashed border-slate-200 opacity-60'
                                }`}
                            >
                                {/* Action buttons */}
                                <div className="absolute top-3 right-3 sm:top-4 sm:right-4 flex items-center gap-1.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-10">
                                    {onSaveDefinitions && (
                                        <button
                                            onClick={() => setActiveDefMetricId(item._id ?? null)}
                                            title="View definition"
                                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border transition-colors text-xs font-medium ${
                                                hasDef
                                                    ? 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100'
                                                    : 'bg-slate-50 text-slate-500 border-transparent hover:bg-slate-100 hover:text-slate-700'
                                            }`}
                                        >
                                            <BookOpen className="w-3.5 h-3.5" />
                                            <span className="hidden sm:inline">
                                                {hasDef ? 'Definition' : 'Add Definition'}
                                            </span>
                                        </button>
                                    )}
                                    {onEdit && (
                                        <button
                                            onClick={() => onEdit(item, index)}
                                            title="Edit metric"
                                            className="p-2 bg-slate-50 text-slate-500 rounded-full hover:bg-slate-100 hover:text-yellow-600 transition-colors"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>

                                <div className="flex flex-col md:flex-row gap-4 sm:gap-6">
                                    {/* Icon */}
                                    <div className="flex-shrink-0 flex flex-row md:flex-col items-center md:justify-center gap-3 md:w-16 space-y-0 md:space-y-2 pt-0 md:pt-2">
                                        <div className={`p-2.5 sm:p-3 rounded-xl bg-slate-50 ${item.iconColor || 'text-slate-600'}`}>
                                            <Icon name={item.icon} className="w-6 h-6 sm:w-8 sm:h-8" />
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-900 md:hidden">{item.focus}</h3>
                                    </div>

                                    {/* Main Content */}
                                    <div className="flex-1 min-w-0 pt-0 md:pt-1">
                                        <div className="hidden md:flex items-center gap-2 mb-2">
                                            <h3 className="text-xl font-bold text-slate-900">{item.focus}</h3>
                                            {hasDef && (
                                                <span className="text-[10px] font-semibold uppercase tracking-wider text-yellow-700 bg-yellow-50 border border-yellow-200 px-2 py-0.5 rounded-full">
                                                    Defined
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-600 mb-4">{item.description}</p>
                                        {item.detailedMeasurement && (
                                            <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                                <span className="font-semibold text-slate-700 block mb-1">Measurement: </span>
                                                {item.detailedMeasurement}
                                            </div>
                                        )}
                                    </div>

                                    {/* Goals */}
                                    <div className="flex-shrink-0 w-full md:w-auto md:min-w-[320px]">
                                        {hasData ? (
                                            <div className="grid grid-cols-3 gap-2 sm:gap-3">
                                                <div className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl bg-slate-50 border border-slate-100">
                                                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Base</span>
                                                    <span className="text-base sm:text-lg font-bold text-slate-700">{base || '-'}</span>
                                                </div>
                                                <div className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl bg-yellow-50 border border-yellow-100">
                                                    <span className="text-[10px] uppercase tracking-wider text-yellow-600 font-semibold mb-1">Target</span>
                                                    <span className="text-lg sm:text-2xl font-bold text-yellow-700">{target || '-'}</span>
                                                </div>
                                                <div className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                                                    <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold mb-1">Stretch</span>
                                                    <span className="text-base sm:text-lg font-bold text-emerald-700">{stretch || '-'}</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-center h-full min-h-[80px] rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4">
                                                <p className="text-sm text-slate-400 font-medium text-center">
                                                    Targets set from Q2 onwards
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {onAdd && (
                        <button
                            onClick={onAdd}
                            className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 rounded-lg text-slate-400 hover:border-yellow-200 hover:text-yellow-600 hover:bg-slate-50/50 transition-all hover:shadow-sm"
                        >
                            <Plus className="w-6 h-6 mb-2" />
                            <span className="text-sm font-medium">Add New Metric</span>
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default MetricsView;
