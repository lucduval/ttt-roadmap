'use client';

import React, { useState } from 'react';
import { MessageCircle, FileText, Edit2, Plus, ChevronDown, Layers, Trash2 } from 'lucide-react';
import Icon from '../ui/Icon';
import StatusBadge from '../ui/StatusBadge';
import { Department, Feature } from '@/types';

interface FeaturesViewProps {
    data: Department[];
    onDocClick: (doc: string) => void;
    isEditing?: boolean;
    onEdit?: (deptId: string, feature: Feature, index: number) => void;
    onAdd?: (deptId: string) => void;
    onDelete?: (feature: Feature) => void;
}

const FeaturesView: React.FC<FeaturesViewProps> = ({ data, onDocClick, isEditing, onEdit, onAdd, onDelete }) => {
    const [expandedDept, setExpandedDept] = useState<string | null>(null);
    const [deleteConfirmKey, setDeleteConfirmKey] = useState<string | null>(null);

    const toggleDept = (deptId: string) => {
        setExpandedDept(prev => prev === deptId ? null : deptId);
    };

    const getStatusSummary = (features: Feature[]) => {
        const counts: Record<string, number> = {};
        features.forEach(f => {
            counts[f.status] = (counts[f.status] || 0) + 1;
        });
        return counts;
    };

    const getOverallProgress = (features: Feature[]) => {
        if (features.length === 0) return 0;
        const total = features.reduce((sum, f) => sum + (f.progress || 0), 0);
        return Math.round(total / features.length);
    };

    return (
        <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Features by Division</h2>
                    <p className="text-sm text-slate-500 mt-1">Click a division to view and manage its features</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {data.map((dept) => {
                    const isExpanded = expandedDept === dept.id;
                    const statusCounts = getStatusSummary(dept.features);
                    const avgProgress = getOverallProgress(dept.features);

                    return (
                        <div
                            key={dept.id}
                            className={`bg-white border rounded-xl shadow-sm overflow-hidden transition-all duration-300 ${
                                isExpanded ? 'border-yellow-300 ring-1 ring-yellow-200' : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                            }`}
                        >
                            {/* Division Card Header (always visible) */}
                            <button
                                onClick={() => toggleDept(dept.id)}
                                className="w-full text-left px-4 sm:px-6 py-4 sm:py-5 flex items-center gap-3 sm:gap-4 transition-colors hover:bg-slate-50/50"
                            >
                                <div className={`p-2 sm:p-2.5 rounded-lg flex-shrink-0 transition-colors ${
                                    isExpanded ? 'bg-yellow-500 text-white' : 'bg-slate-900 text-white'
                                }`}>
                                    <Icon name={dept.icon} className="w-5 h-5 sm:w-6 sm:h-6" />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 sm:gap-3">
                                        <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">{dept.name}</h3>
                                        <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full flex-shrink-0">
                                            {dept.features.length} {dept.features.length === 1 ? 'feature' : 'features'}
                                        </span>
                                    </div>
                                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5">{dept.role}</p>

                                    {/* Status pills row */}
                                    {dept.features.length > 0 && (
                                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                                            {Object.entries(statusCounts).map(([status, count]) => (
                                                <span key={status} className="inline-flex items-center gap-1">
                                                    <StatusBadge status={status} />
                                                    {count > 1 && <span className="text-[10px] text-slate-400 font-medium">&times;{count}</span>}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Progress ring + chevron */}
                                <div className="flex items-center gap-3 flex-shrink-0">
                                    {dept.features.length > 0 && (
                                        <div className="hidden sm:flex flex-col items-center">
                                            <span className="text-lg font-bold text-slate-900">{avgProgress}%</span>
                                            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Progress</span>
                                        </div>
                                    )}
                                    <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${
                                        isExpanded ? 'rotate-180' : ''
                                    }`} />
                                </div>
                            </button>

                            {/* Progress bar (always visible, subtle) */}
                            {dept.features.length > 0 && (
                                <div className="px-4 sm:px-6 pb-0">
                                    <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${
                                                isExpanded ? 'bg-yellow-500' : 'bg-slate-300'
                                            }`}
                                            style={{ width: `${avgProgress}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Expanded Content */}
                            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
                                isExpanded ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'
                            }`}>
                                <div className="border-t border-slate-100 mt-4">
                                    {/* Add feature button */}
                                    {isEditing && onAdd && (
                                        <div className="px-4 sm:px-6 pt-4 flex justify-end">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onAdd(dept.id); }}
                                                className="flex items-center px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded-md text-xs font-medium hover:bg-yellow-100 transition-colors border border-yellow-200"
                                            >
                                                <Plus className="w-3 h-3 mr-1.5" />
                                                Add Feature
                                            </button>
                                        </div>
                                    )}

                                    {/* Feature list */}
                                    <div className="divide-y divide-slate-100">
                                        {dept.features.map((feature, idx) => {
                                            const confirmKey = `${dept.id}-${idx}`;
                                            const isConfirmingDelete = deleteConfirmKey === confirmKey;

                                            return (
                                            <div key={idx} className="group relative p-4 sm:p-6 hover:bg-slate-50/50 transition-colors">
                                                {isEditing && (
                                                    <div className="absolute top-3 right-3 sm:top-4 sm:right-4 flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100">
                                                        {onEdit && (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); onEdit(dept.id, feature, idx); }}
                                                                className="p-1.5 bg-white border border-slate-200 text-slate-400 rounded-md hover:text-yellow-600 hover:border-yellow-200 transition-colors"
                                                            >
                                                                <Edit2 className="w-3 h-3" />
                                                            </button>
                                                        )}
                                                        {onDelete && (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); setDeleteConfirmKey(confirmKey); }}
                                                                className="p-1.5 bg-white border border-slate-200 text-slate-400 rounded-md hover:text-red-600 hover:border-red-200 transition-colors"
                                                            >
                                                                <Trash2 className="w-3 h-3" />
                                                            </button>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Inline delete confirmation */}
                                                {isConfirmingDelete && (
                                                    <div className="mb-3 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center justify-between gap-3">
                                                        <p className="text-xs text-red-800 font-medium">Delete &ldquo;{feature.title}&rdquo;?</p>
                                                        <div className="flex gap-2 flex-shrink-0">
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); setDeleteConfirmKey(null); }}
                                                                className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded transition-colors"
                                                            >
                                                                Cancel
                                                            </button>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); onDelete?.(feature); setDeleteConfirmKey(null); }}
                                                                className="px-2.5 py-1 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded transition-colors"
                                                            >
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 pr-8 gap-1 sm:gap-2">
                                                    <h4 className="text-sm sm:text-base font-semibold text-slate-900">{feature.title}</h4>
                                                    <div className="flex items-center gap-2 flex-shrink-0">
                                                        <StatusBadge status={feature.status} />
                                                        {feature.progress !== undefined && feature.progress > 0 && (
                                                            <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                                                {feature.progress}%
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <p className="text-slate-600 text-xs sm:text-sm mb-3 sm:mb-4 max-w-3xl">{feature.description}</p>

                                                {/* Timeline */}
                                                {(feature.startDate || feature.endDate) && (
                                                    <div className="mb-3 flex items-center gap-2 text-xs text-slate-400">
                                                        <span className="inline-flex items-center gap-1 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                                                            {feature.startDate && new Date(feature.startDate).toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}
                                                            {feature.startDate && feature.endDate && ' → '}
                                                            {feature.endDate && new Date(feature.endDate).toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}
                                                        </span>
                                                    </div>
                                                )}

                                                {feature.whatsapp && (
                                                    <div className="mb-3 inline-flex items-center px-2 sm:px-3 py-1.5 sm:py-2 bg-green-50 text-green-800 text-xs rounded-md border border-green-100">
                                                        <MessageCircle className="w-3 h-3 mr-1.5 sm:mr-2 flex-shrink-0" />
                                                        <span className="font-semibold mr-1">WhatsApp:</span>
                                                        <span className="truncate">{feature.whatsapp}</span>
                                                    </div>
                                                )}

                                                {feature.docs.length > 0 && (
                                                    <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2">
                                                        {feature.docs.map((doc, dIdx) => (
                                                            <button
                                                                key={dIdx}
                                                                onClick={() => onDocClick(doc)}
                                                                className="flex items-center px-2 py-1 bg-white border border-slate-200 text-[11px] sm:text-xs text-slate-500 rounded hover:text-yellow-600 hover:border-yellow-200 transition-colors"
                                                            >
                                                                <FileText className="w-3 h-3 mr-1 flex-shrink-0" />
                                                                <span className="truncate max-w-[120px] sm:max-w-none">{doc}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            );
                                        })}

                                        {dept.features.length === 0 && (
                                            <div className="p-6 sm:p-8 text-center text-slate-400 text-sm italic">
                                                No features yet. Add your first feature to get started.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default FeaturesView;
