'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Feature } from '@/types';

// --- Types ---

interface GanttLane {
    id: string;
    title: string;
    items: Feature[];
}

export interface MetricColor {
    bg: string;
    border: string;
    progress: string;
    text: string;
    ring: string;
    label: string;
}

interface GanttChartProps {
    lanes: GanttLane[];
    onEdit?: (feature: Feature) => void;
    onUpdateDates?: (feature: Feature, newStartDate: string, newEndDate: string) => void;
    title: string;
    subtitle?: string;
    metricColorMap?: Record<string, MetricColor>;
}

// --- Constants ---

const QUARTERS = [
    { label: 'Q1 2026', start: new Date('2026-01-01'), end: new Date('2026-03-31') },
    { label: 'Q2 2026', start: new Date('2026-04-01'), end: new Date('2026-06-30') },
    { label: 'Q3 2026', start: new Date('2026-07-01'), end: new Date('2026-09-30') },
    { label: 'Q4 2026', start: new Date('2026-10-01'), end: new Date('2026-12-31') },
];

const TIMELINE_START = QUARTERS[0].start.getTime();
const TIMELINE_END = QUARTERS[3].end.getTime();
const TOTAL_DURATION = TIMELINE_END - TIMELINE_START;

const DEFAULT_COLOR: MetricColor = {
    bg: '#F1F5F9',
    border: '#CBD5E1',
    progress: '#94A3B8',
    text: '#334155',
    ring: '#94A3B8',
    label: 'Unlinked',
};

export const METRIC_COLOR_PALETTE: Omit<MetricColor, 'label'>[] = [
    { bg: '#DBEAFE', border: '#93C5FD', progress: '#3B82F6', text: '#1E3A5F', ring: '#3B82F6' },
    { bg: '#D1FAE5', border: '#6EE7B7', progress: '#10B981', text: '#064E3B', ring: '#10B981' },
    { bg: '#EDE9FE', border: '#C4B5FD', progress: '#8B5CF6', text: '#4C1D95', ring: '#8B5CF6' },
    { bg: '#FEF3C7', border: '#FCD34D', progress: '#F59E0B', text: '#78350F', ring: '#F59E0B' },
    { bg: '#FCE7F3', border: '#F9A8D4', progress: '#EC4899', text: '#831843', ring: '#EC4899' },
    { bg: '#CFFAFE', border: '#67E8F9', progress: '#06B6D4', text: '#164E63', ring: '#06B6D4' },
    { bg: '#FFEDD5', border: '#FDBA74', progress: '#F97316', text: '#7C2D12', ring: '#F97316' },
    { bg: '#E0E7FF', border: '#A5B4FC', progress: '#6366F1', text: '#312E81', ring: '#6366F1' },
];

// --- Helpers ---

function getPosition(dateStr?: string): number {
    if (!dateStr) return 0;
    const date = new Date(dateStr).getTime();
    return Math.max(0, Math.min(100, ((date - TIMELINE_START) / TOTAL_DURATION) * 100));
}

function getWidth(startStr?: string, endStr?: string): number {
    if (!startStr || !endStr) return 0;
    return Math.max(1, getPosition(endStr) - getPosition(startStr));
}

function percentToDate(percent: number): string {
    const clamped = Math.max(0, Math.min(100, percent));
    const ms = TIMELINE_START + (clamped / 100) * TOTAL_DURATION;
    return new Date(ms).toISOString();
}

function formatDate(isoStr: string): string {
    return isoStr.split('T')[0];
}

// --- Drag State ---

interface DragInfo {
    featureKey: string;
    type: 'move' | 'resize-start' | 'resize-end';
    startMouseX: number;
    containerWidth: number;
    originalLeftPct: number;
    originalWidthPct: number;
    feature: Feature;
}

// --- Component ---

const GanttChart: React.FC<GanttChartProps> = ({ lanes, onEdit, onUpdateDates, title, subtitle, metricColorMap }) => {
    const dragRef = useRef<DragInfo | null>(null);
    const previewLeftRef = useRef(0);
    const previewWidthRef = useRef(0);
    const hasDraggedRef = useRef(false);
    const onUpdateDatesRef = useRef(onUpdateDates);
    onUpdateDatesRef.current = onUpdateDates;

    const [dragPreviewKey, setDragPreviewKey] = useState<string | null>(null);
    const [previewLeft, setPreviewLeft] = useState(0);
    const [previewWidth, setPreviewWidth] = useState(0);

    const featureKey = (laneIdx: number, itemIdx: number) => `${laneIdx}-${itemIdx}`;

    const getColor = (feature: Feature): MetricColor => {
        if (feature.metricId && metricColorMap?.[feature.metricId]) {
            return metricColorMap[feature.metricId];
        }
        return DEFAULT_COLOR;
    };

    // --- Drag Handlers ---

    const initDrag = (
        clientX: number,
        target: HTMLElement,
        feature: Feature,
        laneIdx: number,
        itemIdx: number,
        type: DragInfo['type']
    ) => {
        const barsContainer = target.closest('[data-gantt-bars]') as HTMLElement;
        if (!barsContainer) return;

        const rect = barsContainer.getBoundingClientRect();
        const key = featureKey(laneIdx, itemIdx);
        const left = getPosition(feature.startDate);
        const width = getWidth(feature.startDate, feature.endDate);

        dragRef.current = {
            featureKey: key,
            type,
            startMouseX: clientX,
            containerWidth: rect.width,
            originalLeftPct: left,
            originalWidthPct: width,
            feature,
        };

        hasDraggedRef.current = false;
        previewLeftRef.current = left;
        previewWidthRef.current = width;
        setPreviewLeft(left);
        setPreviewWidth(width);
        setDragPreviewKey(key);
    };

    const handleDragStart = (
        e: React.MouseEvent,
        feature: Feature,
        laneIdx: number,
        itemIdx: number,
        type: DragInfo['type']
    ) => {
        e.preventDefault();
        e.stopPropagation();
        initDrag(e.clientX, e.target as HTMLElement, feature, laneIdx, itemIdx, type);
    };

    const handleTouchStart = (
        e: React.TouchEvent,
        feature: Feature,
        laneIdx: number,
        itemIdx: number,
        type: DragInfo['type']
    ) => {
        if (e.touches.length !== 1) return;
        const touch = e.touches[0];
        initDrag(touch.clientX, e.target as HTMLElement, feature, laneIdx, itemIdx, type);
    };

    useEffect(() => {
        if (!dragPreviewKey) return;

        const applyDelta = (clientX: number) => {
            const drag = dragRef.current;
            if (!drag) return;

            const deltaX = clientX - drag.startMouseX;
            const deltaPct = (deltaX / drag.containerWidth) * 100;

            if (Math.abs(deltaX) > 3) {
                hasDraggedRef.current = true;
            }

            let newLeft = drag.originalLeftPct;
            let newWidth = drag.originalWidthPct;

            if (drag.type === 'move') {
                newLeft = Math.max(0, Math.min(100 - drag.originalWidthPct, drag.originalLeftPct + deltaPct));
            } else if (drag.type === 'resize-start') {
                const maxDelta = drag.originalWidthPct - 1;
                const clamped = Math.max(-drag.originalLeftPct, Math.min(maxDelta, deltaPct));
                newLeft = drag.originalLeftPct + clamped;
                newWidth = drag.originalWidthPct - clamped;
            } else if (drag.type === 'resize-end') {
                const maxWidth = 100 - drag.originalLeftPct;
                newWidth = Math.max(1, Math.min(maxWidth, drag.originalWidthPct + deltaPct));
            }

            previewLeftRef.current = newLeft;
            previewWidthRef.current = newWidth;
            setPreviewLeft(newLeft);
            setPreviewWidth(newWidth);
        };

        const finishDrag = () => {
            const drag = dragRef.current;
            if (drag && hasDraggedRef.current && onUpdateDatesRef.current) {
                const newStart = percentToDate(previewLeftRef.current);
                const newEnd = percentToDate(previewLeftRef.current + previewWidthRef.current);
                onUpdateDatesRef.current(drag.feature, newStart, newEnd);
            }

            dragRef.current = null;
            setDragPreviewKey(null);

            requestAnimationFrame(() => {
                hasDraggedRef.current = false;
            });
        };

        const handleMouseMove = (e: MouseEvent) => applyDelta(e.clientX);
        const handleMouseUp = () => finishDrag();

        const handleTouchMove = (e: TouchEvent) => {
            if (e.touches.length !== 1) return;
            if (hasDraggedRef.current) e.preventDefault();
            applyDelta(e.touches[0].clientX);
        };
        const handleTouchEnd = () => finishDrag();

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        window.addEventListener('touchmove', handleTouchMove, { passive: false });
        window.addEventListener('touchend', handleTouchEnd);
        window.addEventListener('touchcancel', handleTouchEnd);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleTouchEnd);
            window.removeEventListener('touchcancel', handleTouchEnd);
        };
    }, [dragPreviewKey]);

    // --- Legend ---

    const legendEntries = metricColorMap ? Object.entries(metricColorMap) : [];

    // --- Today marker ---

    const todayPct = getPosition(new Date().toISOString());

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden select-none">
            {/* Header */}
            <div className="p-4 sm:p-6 border-b border-slate-200 bg-slate-50/50">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-base sm:text-lg font-bold text-slate-900">{title}</h3>
                        {subtitle && <p className="text-xs sm:text-sm text-slate-500">{subtitle}</p>}
                    </div>
                </div>

                {/* Color Legend */}
                {legendEntries.length > 0 && (
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
                        {legendEntries.map(([id, color]) => (
                            <div key={id} className="flex items-center gap-1.5 text-xs">
                                <div
                                    className="w-3 h-3 rounded-sm"
                                    style={{ backgroundColor: color.bg, border: `1.5px solid ${color.border}` }}
                                />
                                <span className="text-slate-600">{color.label}</span>
                            </div>
                        ))}
                        <div className="flex items-center gap-1.5 text-xs">
                            <div
                                className="w-3 h-3 rounded-sm"
                                style={{ backgroundColor: DEFAULT_COLOR.bg, border: `1.5px solid ${DEFAULT_COLOR.border}` }}
                            />
                            <span className="text-slate-600">Unlinked</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Scrollable Gantt Area */}
            <div className="overflow-x-auto">
                <div className="min-w-[480px] sm:min-w-[600px]">
                    {/* Timeline Header */}
                    <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        <div className="w-1/5 sm:w-1/4 min-w-[90px] sm:min-w-[120px] h-10 border-r border-slate-200 flex items-center pl-3 sm:pl-6 bg-slate-100/50">
                            Lanes
                        </div>
                        <div className="flex-1 flex relative">
                            {QUARTERS.map((q, i) => (
                                <div key={i} className="flex-1 flex items-center justify-center border-r border-slate-200 last:border-r-0 h-10">
                                    {q.label}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Lane Rows */}
                    <div>
                        {lanes.map((lane, laneIdx) => {
                            const validItems = lane.items.filter(f => f.startDate && f.endDate);
                            const rowHeight = Math.max(64, validItems.length * 34 + 12);

                            return (
                                <div key={lane.id} className="flex border-b border-slate-100 last:border-0 hover:bg-slate-50/30 transition-colors">
                                    {/* Lane Label */}
                                    <div
                                        className="w-1/5 sm:w-1/4 min-w-[90px] sm:min-w-[120px] p-2 sm:p-4 border-r border-slate-200 flex flex-col justify-center"
                                        style={{ minHeight: `${rowHeight}px` }}
                                    >
                                        <h4 className="font-medium text-slate-900 text-[11px] sm:text-sm leading-tight line-clamp-2">{lane.title}</h4>
                                        <span className="text-[10px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1">{lane.items.length} items</span>
                                    </div>

                                    {/* Lane Timeline Area */}
                                    <div className="flex-1 relative" style={{ minHeight: `${rowHeight}px` }}>
                                        {/* Quarter Grid Lines */}
                                        <div className="absolute inset-0 flex pointer-events-none">
                                            <div className="flex-1 border-r border-slate-100 border-dashed" />
                                            <div className="flex-1 border-r border-slate-100 border-dashed" />
                                            <div className="flex-1 border-r border-slate-100 border-dashed" />
                                            <div className="flex-1" />
                                        </div>

                                        {/* Today Marker */}
                                        {todayPct > 0 && todayPct < 100 && (
                                            <div
                                                className="absolute top-0 bottom-0 w-px bg-red-400 z-[5] pointer-events-none"
                                                style={{ left: `${todayPct}%` }}
                                            />
                                        )}

                                        {/* Bars Container (absolutely positioned children) */}
                                        <div data-gantt-bars className="absolute inset-0">
                                            {validItems.length === 0 && (
                                                <div className="flex items-center justify-center h-full text-xs text-slate-300 italic">
                                                    No active features
                                                </div>
                                            )}

                                            {validItems.map((feature, itemIdx) => {
                                                const key = featureKey(laneIdx, itemIdx);
                                                const isDragging = dragPreviewKey === key;
                                                const left = isDragging ? previewLeft : getPosition(feature.startDate);
                                                const width = isDragging ? previewWidth : getWidth(feature.startDate, feature.endDate);
                                                const progress = feature.progress || 0;
                                                const color = getColor(feature);
                                                const topPx = itemIdx * 34 + 6;

                                                // Compute preview dates for tooltip during drag
                                                const displayStart = isDragging ? formatDate(percentToDate(previewLeft)) : feature.startDate?.split('T')[0];
                                                const displayEnd = isDragging ? formatDate(percentToDate(previewLeft + previewWidth)) : feature.endDate?.split('T')[0];

                                                return (
                                                    <div
                                                        key={key}
                                                        className={`absolute h-7 rounded-md group/item transition-shadow touch-none ${
                                                            isDragging
                                                                ? 'shadow-lg z-20 opacity-90 ring-2'
                                                                : 'shadow-sm hover:shadow-md z-10'
                                                        }`}
                                                        style={{
                                                            left: `${left}%`,
                                                            width: `${width}%`,
                                                            top: `${topPx}px`,
                                                            backgroundColor: color.bg,
                                                            borderWidth: '1px',
                                                            borderColor: color.border,
                                                            cursor: isDragging ? 'grabbing' : 'grab',
                                                            ...(isDragging ? { ringColor: color.ring, boxShadow: `0 0 0 2px ${color.ring}40` } : {}),
                                                        }}
                                                        onMouseDown={(e) => handleDragStart(e, feature, laneIdx, itemIdx, 'move')}
                                                        onTouchStart={(e) => handleTouchStart(e, feature, laneIdx, itemIdx, 'move')}
                                                        onClick={() => {
                                                            if (hasDraggedRef.current) return;
                                                            if (onEdit) onEdit(feature);
                                                        }}
                                                    >
                                                        {/* Progress Fill */}
                                                        <div
                                                            className="absolute top-0 left-0 bottom-0 rounded-l-md opacity-25"
                                                            style={{ width: `${progress}%`, backgroundColor: color.progress }}
                                                        />

                                                        {/* Label */}
                                                        <div className="absolute inset-0 flex items-center px-2 sm:px-3 overflow-hidden pointer-events-none">
                                                            <span
                                                                className="text-[9px] sm:text-[10px] font-semibold truncate whitespace-nowrap"
                                                                style={{ color: color.text }}
                                                            >
                                                                {feature.title}
                                                            </span>
                                                        </div>

                                                        {/* Left Resize Handle */}
                                                        <div
                                                            className="absolute top-0 left-0 bottom-0 w-3 sm:w-2 cursor-col-resize z-10 group/handle touch-none"
                                                            onMouseDown={(e) => handleDragStart(e, feature, laneIdx, itemIdx, 'resize-start')}
                                                            onTouchStart={(e) => handleTouchStart(e, feature, laneIdx, itemIdx, 'resize-start')}
                                                        >
                                                            <div className="absolute top-1 bottom-1 left-0.5 w-1 rounded-full bg-black/0 group-hover/item:bg-black/15 transition-colors" />
                                                        </div>

                                                        {/* Right Resize Handle */}
                                                        <div
                                                            className="absolute top-0 right-0 bottom-0 w-3 sm:w-2 cursor-col-resize z-10 group/handle touch-none"
                                                            onMouseDown={(e) => handleDragStart(e, feature, laneIdx, itemIdx, 'resize-end')}
                                                            onTouchStart={(e) => handleTouchStart(e, feature, laneIdx, itemIdx, 'resize-end')}
                                                        >
                                                            <div className="absolute top-1 bottom-1 right-0.5 w-1 rounded-full bg-black/0 group-hover/item:bg-black/15 transition-colors" />
                                                        </div>

                                                        {/* Tooltip */}
                                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/item:block bg-slate-900 text-white text-xs p-2.5 rounded-lg z-30 whitespace-nowrap shadow-xl pointer-events-none">
                                                            <div className="font-bold mb-0.5">{feature.title}</div>
                                                            <div className="opacity-80">
                                                                {displayStart} &rarr; {displayEnd}
                                                            </div>
                                                            <div className="opacity-60 mt-0.5 text-[10px]">
                                                                {progress}% complete &middot; {isDragging ? 'Release to save' : 'Drag to move \u00b7 Edges to resize'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GanttChart;
