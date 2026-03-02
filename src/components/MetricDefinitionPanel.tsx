'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Edit2, X, Plus, Trash2, Check, ChevronRight } from 'lucide-react';
import { MetricDefinitionSection, StrategicMetric } from '@/types';
import Icon from './ui/Icon';

interface MetricDefinitionPanelProps {
    metric: StrategicMetric;
    onSave: (metricId: string, definitions: MetricDefinitionSection[]) => Promise<void>;
    onClose: () => void;
}

function deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
}

const MetricDefinitionPanel: React.FC<MetricDefinitionPanelProps> = ({ metric, onSave, onClose }) => {
    const [sections, setSections] = useState<MetricDefinitionSection[]>([]);
    const [isDirty, setIsDirty] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [addingBulletIdx, setAddingBulletIdx] = useState<number | null>(null);
    const [newBulletText, setNewBulletText] = useState('');
    const newBulletRef = useRef<HTMLInputElement>(null);

    // Reset local state when the displayed metric changes
    useEffect(() => {
        setSections(deepClone(metric.metricDefinitions ?? []));
        setIsDirty(false);
        setIsEditing(false);
        setAddingBulletIdx(null);
        setNewBulletText('');
    }, [metric._id]);

    // Sync server changes when not dirty (live Convex updates)
    useEffect(() => {
        if (!isDirty) {
            setSections(deepClone(metric.metricDefinitions ?? []));
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [metric.metricDefinitions]);

    useEffect(() => {
        if (addingBulletIdx !== null) {
            newBulletRef.current?.focus();
        }
    }, [addingBulletIdx]);

    const patch = (newSections: MetricDefinitionSection[]) => {
        setSections(newSections);
        setIsDirty(true);
    };

    // ── View-mode: add a single bullet to a section ──────────────────────────
    const handleCommitNewBullet = (sIdx: number) => {
        const text = newBulletText.trim();
        if (text) {
            const next = deepClone(sections);
            next[sIdx].items.push(text);
            patch(next);
        }
        setAddingBulletIdx(null);
        setNewBulletText('');
    };

    // ── Edit-mode: bulk textarea edit ────────────────────────────────────────
    const handleSectionTitleChange = (idx: number, value: string) => {
        const next = deepClone(sections);
        next[idx].sectionTitle = value;
        patch(next);
    };

    const handleItemsChange = (sIdx: number, raw: string) => {
        const items = raw.split('\n').map((l) => l.trimStart()).filter((l) => l.length > 0);
        const next = deepClone(sections);
        next[sIdx].items = items;
        patch(next);
    };

    const handleAddSection = () => {
        patch([...sections, { sectionTitle: '', items: [] }]);
    };

    const handleRemoveSection = (idx: number) => {
        patch(sections.filter((_, i) => i !== idx));
    };

    // ── Save / Discard ───────────────────────────────────────────────────────
    const handleSave = async () => {
        if (!metric._id) return;
        setIsSaving(true);
        try {
            await onSave(metric._id, sections);
            setIsDirty(false);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDiscard = () => {
        setSections(deepClone(metric.metricDefinitions ?? []));
        setIsDirty(false);
        setIsEditing(false);
    };

    const hasDefinitions = sections.length > 0;

    return (
        <div className="flex flex-col h-full min-h-0">

            {/* Panel header */}
            <div className="flex items-start justify-between gap-3 mb-5 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-slate-100 flex-shrink-0 ${metric.iconColor ?? ''}`}>
                        <Icon name={metric.icon} className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest mb-0.5">
                            Metric Definition
                        </p>
                        <h3 className="text-lg font-bold text-slate-900 leading-tight">{metric.focus}</h3>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0 pt-0.5">
                    {!isEditing && hasDefinitions && (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                        >
                            <Edit2 className="w-3.5 h-3.5" />
                            Edit
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                        title="Close"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Unsaved changes banner */}
            {isDirty && (
                <div className="flex items-center justify-between gap-3 mb-4 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg flex-shrink-0">
                    <span className="text-xs font-medium text-yellow-800">Unsaved changes</span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleDiscard}
                            className="text-xs text-slate-500 hover:text-slate-800 font-medium transition-colors"
                        >
                            Discard
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex items-center gap-1 px-3 py-1 text-xs font-semibold bg-yellow-500 text-slate-900 rounded-md hover:bg-yellow-600 transition-colors disabled:opacity-60"
                        >
                            <Check className="w-3 h-3" />
                            {isSaving ? 'Saving…' : 'Save'}
                        </button>
                    </div>
                </div>
            )}

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto min-h-0 space-y-3 pr-1">

                {/* ── VIEW MODE ─────────────────────────────────────────── */}
                {!isEditing && (
                    <>
                        {hasDefinitions ? (
                            <>
                                {sections.map((section, sIdx) => (
                                    <div key={sIdx} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                                        <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 flex-shrink-0" />
                                            {section.sectionTitle}
                                        </h4>

                                        <ul className="space-y-2 mb-2">
                                            {section.items.map((item, iIdx) => (
                                                <li key={iIdx} className="flex items-start gap-2.5 text-sm text-slate-600">
                                                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 flex-shrink-0 mt-0.5" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>

                                        {/* Inline "add point" */}
                                        {addingBulletIdx === sIdx ? (
                                            <div className="flex items-center gap-2 mt-2">
                                                <ChevronRight className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                                                <input
                                                    ref={newBulletRef}
                                                    type="text"
                                                    value={newBulletText}
                                                    onChange={(e) => setNewBulletText(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') handleCommitNewBullet(sIdx);
                                                        if (e.key === 'Escape') {
                                                            setAddingBulletIdx(null);
                                                            setNewBulletText('');
                                                        }
                                                    }}
                                                    onBlur={() => handleCommitNewBullet(sIdx)}
                                                    placeholder="Type a point and press Enter…"
                                                    className="flex-1 text-sm text-slate-700 border border-yellow-300 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white"
                                                />
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => {
                                                    setAddingBulletIdx(sIdx);
                                                    setNewBulletText('');
                                                }}
                                                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-yellow-600 transition-colors mt-1"
                                            >
                                                <Plus className="w-3.5 h-3.5" />
                                                Add point
                                            </button>
                                        )}
                                    </div>
                                ))}

                                <button
                                    onClick={handleAddSection}
                                    className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-200 rounded-xl text-sm text-slate-400 hover:border-yellow-300 hover:text-yellow-600 hover:bg-yellow-50/40 transition-all"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add Section
                                </button>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <p className="text-sm text-slate-400 mb-4">No definition has been added for this metric yet.</p>
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-yellow-700 bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 rounded-lg transition-colors"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add Definition
                                </button>
                            </div>
                        )}
                    </>
                )}

                {/* ── EDIT MODE ─────────────────────────────────────────── */}
                {isEditing && (
                    <div className="space-y-3">
                        {sections.map((section, idx) => (
                            <div key={idx} className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={section.sectionTitle}
                                        onChange={(e) => handleSectionTitleChange(idx, e.target.value)}
                                        placeholder="Section title"
                                        className="flex-1 text-sm font-semibold text-slate-800 border border-slate-200 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent placeholder:font-normal placeholder:text-slate-400"
                                    />
                                    <button
                                        onClick={() => handleRemoveSection(idx)}
                                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors flex-shrink-0"
                                        title="Remove section"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1.5 font-medium">
                                        Bullet points — one per line
                                    </label>
                                    <textarea
                                        rows={Math.max(3, (section.items.length ?? 0) + 1)}
                                        value={section.items.join('\n')}
                                        onChange={(e) => handleItemsChange(idx, e.target.value)}
                                        placeholder="Add bullet points here, one per line…"
                                        className="w-full text-sm text-slate-700 border border-slate-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent resize-none placeholder:text-slate-400 leading-relaxed"
                                    />
                                </div>
                            </div>
                        ))}

                        <button
                            onClick={handleAddSection}
                            className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-200 rounded-xl text-sm text-slate-400 hover:border-yellow-300 hover:text-yellow-600 hover:bg-yellow-50/40 transition-all"
                        >
                            <Plus className="w-4 h-4" />
                            Add Section
                        </button>

                        <div className="flex justify-end pt-1 border-t border-slate-100">
                            <button
                                onClick={() => setIsEditing(false)}
                                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                            >
                                Done editing
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MetricDefinitionPanel;
