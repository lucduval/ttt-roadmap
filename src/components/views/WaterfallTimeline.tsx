'use client';

import React, { useMemo } from 'react';
import { Feature } from '@/types';
import { MetricColor } from './GanttChart';

interface WaterfallFeature extends Feature {
    deptName?: string;
    deptId?: string;
}

interface WaterfallTimelineProps {
    features: WaterfallFeature[];
    metricColorMap?: Record<string, MetricColor>;
    onEdit?: (feature: WaterfallFeature) => void;
}

// --- Constants (same as GanttChart) ---

const QUARTERS = [
    { label: 'Q1 2026', start: new Date('2026-01-01'), end: new Date('2026-03-31') },
    { label: 'Q2 2026', start: new Date('2026-04-01'), end: new Date('2026-06-30') },
    { label: 'Q3 2026', start: new Date('2026-07-01'), end: new Date('2026-09-30') },
    { label: 'Q4 2026', start: new Date('2026-10-01'), end: new Date('2026-12-31') },
];

const MONTHS = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const TIMELINE_START = QUARTERS[0].start.getTime();
const TIMELINE_END = QUARTERS[3].end.getTime();
const TOTAL_DURATION = TIMELINE_END - TIMELINE_START;

const DEFAULT_COLOR = {
    bg: '#F1F5F9',
    border: '#CBD5E1',
    progress: '#94A3B8',
    text: '#334155',
};

function getPosition(dateStr?: string): number {
    if (!dateStr) return 0;
    const date = new Date(dateStr).getTime();
    return Math.max(0, Math.min(100, ((date - TIMELINE_START) / TOTAL_DURATION) * 100));
}

function getWidth(startStr?: string, endStr?: string): number {
    if (!startStr || !endStr) return 0;
    return Math.max(0.8, getPosition(endStr) - getPosition(startStr));
}

function formatShortDate(dateStr: string): string {
    const d = new Date(dateStr);
    return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

const WaterfallTimeline: React.FC<WaterfallTimelineProps> = ({ features, metricColorMap, onEdit }) => {
    // Sort features chronologically by start date, then by end date
    const sorted = useMemo(() => {
        return [...features]
            .filter(f => f.startDate && f.endDate)
            .sort((a, b) => {
                const aStart = new Date(a.startDate!).getTime();
                const bStart = new Date(b.startDate!).getTime();
                if (aStart !== bStart) return aStart - bStart;
                return new Date(a.endDate!).getTime() - new Date(b.endDate!).getTime();
            });
    }, [features]);

    const todayPct = getPosition(new Date().toISOString());

    const getColor = (feature: Feature) => {
        if (feature.metricId && metricColorMap?.[feature.metricId]) {
            return metricColorMap[feature.metricId];
        }
        return DEFAULT_COLOR;
    };

    if (sorted.length === 0) {
        return null;
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="p-4 sm:p-6 border-b border-slate-200 bg-slate-50/50">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">Delivery Waterfall</h3>
                <p className="text-xs sm:text-sm text-slate-500">All features in chronological order &mdash; what&rsquo;s active now and what&rsquo;s coming up</p>
            </div>

            {/* Scrollable Area */}
            <div className="overflow-x-auto">
                <div className="min-w-[500px] sm:min-w-[700px]">
                    {/* Month Headers */}
                    <div className="flex border-b border-slate-200 bg-slate-50">
                        <div className="w-[160px] min-w-[160px] sm:w-[260px] sm:min-w-[260px] border-r border-slate-200 h-8 flex items-center pl-3 sm:pl-6">
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Feature</span>
                        </div>
                        <div className="flex-1 flex relative">
                            {MONTHS.map((month, i) => (
                                <div
                                    key={i}
                                    className="flex-1 flex items-center justify-center border-r border-slate-100 last:border-r-0 h-8 text-[10px] font-semibold text-slate-400 uppercase tracking-wider"
                                >
                                    {month}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Feature Rows */}
                    <div>
                        {sorted.map((feature, idx) => {
                            const left = getPosition(feature.startDate);
                            const width = getWidth(feature.startDate, feature.endDate);
                            const progress = feature.progress || 0;
                            const color = getColor(feature);
                            const isActive = feature.startDate && feature.endDate &&
                                new Date(feature.startDate).getTime() <= Date.now() &&
                                new Date(feature.endDate).getTime() >= Date.now();

                            return (
                                <div
                                    key={idx}
                                    className={`flex border-b border-slate-50 last:border-0 transition-colors group ${
                                        onEdit ? 'cursor-pointer hover:bg-slate-50/80' : ''
                                    }`}
                                    onClick={() => onEdit && onEdit(feature)}
                                >
                                    {/* Feature Label */}
                                    <div className="w-[160px] min-w-[160px] sm:w-[260px] sm:min-w-[260px] border-r border-slate-100 py-1.5 px-2 sm:px-4 flex items-center gap-1.5 sm:gap-2 min-h-[36px]">
                                        {/* Active indicator */}
                                        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                            isActive ? 'bg-emerald-500' : 'bg-slate-200'
                                        }`} />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[11px] sm:text-xs font-medium text-slate-800 truncate leading-tight">
                                                {feature.title}
                                            </p>
                                            <p className="text-[10px] text-slate-400 truncate leading-tight">
                                                {(feature as WaterfallFeature).deptName}
                                                {feature.startDate && feature.endDate && (
                                                    <span className="ml-1 text-slate-300 hidden sm:inline">
                                                        &middot; {formatShortDate(feature.startDate)} &ndash; {formatShortDate(feature.endDate)}
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Timeline Bar Area */}
                                    <div className="flex-1 relative min-h-[36px]">
                                        {/* Month grid lines */}
                                        <div className="absolute inset-0 flex pointer-events-none">
                                            {MONTHS.map((_, i) => (
                                                <div key={i} className="flex-1 border-r border-slate-50 last:border-r-0" />
                                            ))}
                                        </div>

                                        {/* Today marker */}
                                        {todayPct > 0 && todayPct < 100 && (
                                            <div
                                                className="absolute top-0 bottom-0 w-px bg-red-300 z-[5] pointer-events-none"
                                                style={{ left: `${todayPct}%` }}
                                            />
                                        )}

                                        {/* Bar */}
                                        <div className="absolute inset-0 flex items-center px-0">
                                            <div
                                                className="absolute h-[22px] rounded group/bar transition-shadow hover:shadow-md"
                                                style={{
                                                    left: `${left}%`,
                                                    width: `${width}%`,
                                                    backgroundColor: color.bg,
                                                    border: `1px solid ${color.border}`,
                                                }}
                                            >
                                                {/* Progress fill */}
                                                <div
                                                    className="absolute top-0 left-0 bottom-0 rounded-l opacity-30"
                                                    style={{ width: `${progress}%`, backgroundColor: color.progress }}
                                                />

                                                {/* Bar label (only shows if bar is wide enough) */}
                                                <div className="absolute inset-0 flex items-center px-1.5 overflow-hidden">
                                                    <span
                                                        className="text-[9px] font-medium truncate whitespace-nowrap opacity-80"
                                                        style={{ color: color.text }}
                                                    >
                                                        {progress > 0 && `${progress}%`}
                                                    </span>
                                                </div>

                                                {/* Tooltip */}
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover/bar:block bg-slate-900 text-white text-[10px] p-2 rounded-lg z-30 whitespace-nowrap shadow-xl pointer-events-none">
                                                    <div className="font-bold text-xs">{feature.title}</div>
                                                    <div className="opacity-70 mt-0.5">
                                                        {feature.startDate && formatShortDate(feature.startDate)} &rarr; {feature.endDate && formatShortDate(feature.endDate)}
                                                    </div>
                                                    <div className="opacity-50 mt-0.5">
                                                        {(feature as WaterfallFeature).deptName} &middot; {progress}% complete
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Today label row */}
                    {todayPct > 0 && todayPct < 100 && (
                        <div className="flex border-t border-slate-100">
                            <div className="w-[160px] min-w-[160px] sm:w-[260px] sm:min-w-[260px] border-r border-slate-100" />
                            <div className="flex-1 relative h-5">
                                <div
                                    className="absolute top-0 flex items-start -translate-x-1/2"
                                    style={{ left: `${todayPct}%` }}
                                >
                                    <span className="text-[9px] font-bold text-red-400 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                                        Today
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WaterfallTimeline;
