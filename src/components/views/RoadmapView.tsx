import React, { useMemo, useState } from 'react';
import { Layers, Edit2, Plus } from 'lucide-react';
import { Department, Feature, StrategicMetric } from '@/types';
import GanttChart, { MetricColor, METRIC_COLOR_PALETTE } from './GanttChart';
import WaterfallTimeline from './WaterfallTimeline';

interface RoadmapViewProps {
    data: Department[];
    metrics: StrategicMetric[];
    onDocClick: (doc: string) => void;
    isEditing?: boolean;
    onEdit?: (deptId: string, feature: Feature, index: number) => void;
    onAdd?: () => void;
    onUpdateDates?: (feature: Feature, newStartDate: string, newEndDate: string) => void;
}

type GanttGrouping = 'metric' | 'department';

const RoadmapView: React.FC<RoadmapViewProps> = ({ data, metrics, onDocClick, isEditing, onEdit, onAdd, onUpdateDates }) => {
    const [ganttGrouping, setGanttGrouping] = useState<GanttGrouping>('metric');

    const allFeatures = data.flatMap(d => d.features.map((f, idx) => ({ ...f, deptName: d.name, deptIcon: d.icon, deptId: d.id, originalIndex: idx })));

    // Build metric color map: metricId -> MetricColor (with label)
    const metricColorMap = useMemo(() => {
        const map: Record<string, MetricColor> = {};
        metrics.forEach((metric, index) => {
            if (!metric._id) return;
            const palette = METRIC_COLOR_PALETTE[index % METRIC_COLOR_PALETTE.length];
            map[metric._id] = {
                ...palette,
                label: metric.focus || 'Unknown',
            };
        });
        return map;
    }, [metrics]);

    // Prepare data for Strategic Gantt Chart (Group by Metric)
    const strategicLanes = useMemo(() => metrics.map((metric, index) => {
        const linkedFeatures = allFeatures.filter(f => f.metricId === metric._id);
        const laneId = metric._id || (metric.focus ? `focus-${metric.focus}` : `metric-${index}`);
        return {
            id: laneId,
            title: metric.focus || 'Unspecified Metric',
            items: linkedFeatures
        };
    }), [metrics, allFeatures]);

    // Prepare data for Department Gantt Chart (Group by Department)
    const departmentLanes = useMemo(() => data.map((dept, index) => ({
        id: dept.id || `dept-index-${index}`,
        title: dept.name,
        items: dept.features.map((f, idx) => ({ ...f, deptName: dept.name, deptId: dept.id, originalIndex: idx }))
    })), [data]);

    const activeLanes = ganttGrouping === 'metric' ? strategicLanes : departmentLanes;
    const ganttTitle = ganttGrouping === 'metric' ? 'Strategic Alignment' : 'Department Execution';
    const ganttSubtitle = ganttGrouping === 'metric'
        ? 'Features grouped by strategic metric — drag to move, resize edges to adjust duration'
        : 'Features grouped by department — drag to move, resize edges to adjust duration';

    return (
        <div className="space-y-12 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Product Roadmap</h2>
                    <p className="text-sm text-slate-500">Strategic alignment and execution timeline for 2026</p>
                </div>
                {onAdd && (
                    <button
                        onClick={onAdd}
                        className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-yellow-500 text-slate-900 rounded-md hover:bg-yellow-600 transition-colors shadow-sm text-sm font-medium flex-shrink-0"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">Add Feature</span>
                    </button>
                )}
            </div>

            {/* Gantt Chart with Grouping Toggle */}
            <div className="space-y-4">
                {/* Toggle */}
                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg w-fit">
                    <button
                        onClick={() => setGanttGrouping('metric')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                            ganttGrouping === 'metric'
                                ? 'bg-white text-slate-900 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        By Metric
                    </button>
                    <button
                        onClick={() => setGanttGrouping('department')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                            ganttGrouping === 'department'
                                ? 'bg-white text-slate-900 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        By Department
                    </button>
                </div>

                <GanttChart
                    title={ganttTitle}
                    subtitle={ganttSubtitle}
                    lanes={activeLanes}
                    onEdit={(feature: any) => onEdit && onEdit(feature.deptId, feature, feature.originalIndex)}
                    onUpdateDates={onUpdateDates}
                    metricColorMap={metricColorMap}
                />
            </div>

            {/* Waterfall Timeline — chronological overview */}
            <WaterfallTimeline
                features={allFeatures}
                metricColorMap={metricColorMap}
                onEdit={(feature: any) => onEdit && onEdit(feature.deptId, feature, feature.originalIndex)}
            />

            <div className="pt-6 sm:pt-8 border-t border-slate-200">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-4">Detailed Feature List</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    {allFeatures.map((f, idx) => {
                        const metricColor = f.metricId && metricColorMap[f.metricId] ? metricColorMap[f.metricId] : null;
                        return (
                            <div key={idx} className="group relative bg-white p-4 sm:p-5 border border-slate-200 rounded-lg shadow-sm flex flex-col hover:shadow-md transition-all">
                                {isEditing && onEdit && (
                                    <button
                                        onClick={() => onEdit(f.deptId, f, f.originalIndex)}
                                        className="absolute top-2 right-2 p-1.5 bg-slate-100 text-slate-500 rounded-md hover:bg-slate-200 hover:text-yellow-600 transition-colors sm:opacity-0 sm:group-hover:opacity-100 z-10"
                                    >
                                        <Edit2 className="w-3 h-3" />
                                    </button>
                                )}
                                <div className="flex items-center gap-2 mb-3 text-xs text-slate-500 pr-8">
                                    <div className="w-4 h-4 bg-slate-200 rounded-sm flex items-center justify-center text-slate-600 flex-shrink-0">
                                        <Layers className="w-3 h-3" />
                                    </div>
                                    <span className="truncate">{f.deptName}</span>
                                    {metricColor ? (
                                        <span
                                            className="px-1.5 py-0.5 rounded-full ml-auto text-[10px] sm:text-xs whitespace-nowrap flex-shrink-0 font-medium"
                                            style={{ backgroundColor: metricColor.bg, color: metricColor.text, border: `1px solid ${metricColor.border}` }}
                                        >
                                            {metricColor.label}
                                        </span>
                                    ) : f.metricId ? (
                                        <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-800 rounded-full border border-yellow-200 ml-auto text-[10px] sm:text-xs whitespace-nowrap flex-shrink-0">Strategy Linked</span>
                                    ) : null}
                                </div>
                                <h4 className="font-medium text-slate-900 mb-2 text-sm sm:text-base">{f.title}</h4>
                                <p className="text-xs text-slate-600 mb-4 flex-grow">{f.description}</p>
                                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                                    <span className="text-[10px] bg-slate-100 px-2 py-1 rounded text-slate-600">{f.docs.length} Documents</span>
                                    <div className="flex gap-2 text-xs text-slate-400">
                                        {f.startDate && <span>{new Date(f.startDate).toLocaleDateString()}</span>}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default RoadmapView;
