'use client';

import React, { useState, useRef } from 'react';
import {
    FileCode,
    ChevronDown,
    TrendingUp,
    CheckCircle2,
    Hash,
    ArrowRight,
    Gauge,
    Users,
    Wrench,
} from 'lucide-react';
import Icon from '../ui/Icon';
import { initiatives, Initiative } from '@/data/specsData';

const ACCENT_COLORS: Record<string, { bg: string; border: string; text: string; fill: string; light: string }> = {
    purple: { bg: 'bg-slate-700', border: 'border-slate-200', text: 'text-slate-600', fill: 'bg-slate-50', light: 'bg-slate-100' },
    emerald: { bg: 'bg-teal-800', border: 'border-teal-100', text: 'text-teal-700', fill: 'bg-teal-50/60', light: 'bg-teal-50' },
    red: { bg: 'bg-stone-700', border: 'border-stone-200', text: 'text-stone-600', fill: 'bg-stone-50', light: 'bg-stone-100' },
    yellow: { bg: 'bg-amber-800', border: 'border-amber-100', text: 'text-amber-800', fill: 'bg-amber-50/60', light: 'bg-amber-50' },
    blue: { bg: 'bg-slate-600', border: 'border-slate-200', text: 'text-slate-600', fill: 'bg-slate-50', light: 'bg-slate-100' },
};

const TechnicalSpecsView: React.FC = () => {
    const [expandedItem, setExpandedItem] = useState<string | null>(null);
    const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

    const toggleItem = (id: string) => {
        setExpandedItem(prev => (prev === id ? null : id));
    };

    const scrollToItem = (id: string) => {
        setExpandedItem(id);
        setTimeout(() => {
            cardRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">

            {/* ─── Page Header ─── */}
            <div className="border-b border-slate-200 pb-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2.5 rounded-xl bg-slate-900 text-white">
                        <FileCode className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                            2026 Initiatives
                        </h1>
                        <p className="text-sm text-slate-500 mt-0.5">
                            What we&apos;re building, why it matters, and what it takes to get there.
                        </p>
                    </div>
                </div>
            </div>

            {/* ─── Table of Contents ─── */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                    <Hash className="w-4 h-4 text-slate-400" />
                    <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Initiatives</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {initiatives.map((item, idx) => {
                        const colors = ACCENT_COLORS[item.accentColor] || ACCENT_COLORS.blue;
                        return (
                            <button
                                key={item.id}
                                onClick={() => scrollToItem(item.id)}
                                className="group flex items-center gap-3 p-3 rounded-lg text-left transition-all hover:bg-slate-50 border border-transparent hover:border-slate-200"
                            >
                                <span className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white ${colors.bg}`}>
                                    {idx + 1}
                                </span>
                                <p className="text-sm font-semibold text-slate-900 group-hover:text-slate-700 leading-snug">
                                    {item.title}
                                </p>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ─── Initiative Cards ─── */}
            <div className="space-y-4">
                {initiatives.map((item, idx) => {
                    const isExpanded = expandedItem === item.id;
                    const colors = ACCENT_COLORS[item.accentColor] || ACCENT_COLORS.blue;

                    return (
                        <div
                            key={item.id}
                            ref={el => { cardRefs.current[item.id] = el; }}
                            className={`bg-white border rounded-xl shadow-sm overflow-hidden transition-all duration-300 ${
                                isExpanded
                                    ? `${colors.border} ring-1 ${colors.border.replace('border-', 'ring-')}`
                                    : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                            }`}
                        >
                            {/* ─── Card Header (always visible) ─── */}
                            <button
                                onClick={() => toggleItem(item.id)}
                                className="w-full text-left px-5 sm:px-7 py-5 sm:py-6 flex items-center gap-4 transition-colors hover:bg-slate-50/50"
                            >
                                <span className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm ${colors.bg}`}>
                                    <Icon name={item.icon} className="w-5 h-5" />
                                </span>

                                <div className="flex-1 min-w-0">
                                    <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                                        {item.title}
                                    </h3>
                                    <p className="text-sm text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                                        {item.summary.slice(0, 120)}...
                                    </p>
                                </div>

                                <ChevronDown
                                    className={`w-5 h-5 text-slate-400 transition-transform duration-300 flex-shrink-0 ${
                                        isExpanded ? 'rotate-180' : ''
                                    }`}
                                />
                            </button>

                            {/* ─── Expanded Content ─── */}
                            <div
                                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                                    isExpanded ? 'max-h-[8000px] opacity-100' : 'max-h-0 opacity-0'
                                }`}
                            >
                                <div className="border-t border-slate-100 px-5 sm:px-7 py-6 sm:py-8 space-y-8">

                                    {/* ── Summary ── */}
                                    <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                                        {item.summary}
                                    </p>

                                    {/* ── Business Value ── */}
                                    <section>
                                        <div className="flex items-center gap-2.5 mb-4">
                                            <div className={`w-1 h-6 rounded-full ${colors.bg}`} />
                                            <TrendingUp className={`w-5 h-5 ${colors.text}`} />
                                            <h4 className="text-base font-bold text-slate-900">Business Value</h4>
                                        </div>
                                        <div className="space-y-2.5">
                                            {item.businessValue.map((value, i) => (
                                                <div key={i} className="flex items-start gap-3 text-sm text-slate-600">
                                                    <ArrowRight className={`w-4 h-4 flex-shrink-0 mt-0.5 ${colors.text}`} />
                                                    <span className="leading-relaxed">{value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </section>

                                    {/* ── What We Need To Do ── */}
                                    <section>
                                        <div className="flex items-center gap-2.5 mb-4">
                                            <div className="w-1 h-6 rounded-full bg-slate-800" />
                                            <CheckCircle2 className="w-5 h-5 text-slate-600" />
                                            <h4 className="text-base font-bold text-slate-900">What We Need To Do</h4>
                                        </div>
                                        <div className="space-y-3">
                                            {item.deliverables.map((d, i) => (
                                                <div
                                                    key={i}
                                                    className="bg-slate-50 rounded-lg border border-slate-100 p-4"
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <span className={`flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-bold text-white ${colors.bg} mt-0.5`}>
                                                            {i + 1}
                                                        </span>
                                                        <div>
                                                            <h5 className="text-sm font-bold text-slate-900 mb-1">
                                                                {d.title}
                                                            </h5>
                                                            <p className="text-sm text-slate-600 leading-relaxed">
                                                                {d.description}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </section>

                                    {/* ── Technical Steps ── */}
                                    <section>
                                        <div className="flex items-center gap-2.5 mb-4">
                                            <div className="w-1 h-6 rounded-full bg-slate-600" />
                                            <Wrench className="w-5 h-5 text-slate-600" />
                                            <h4 className="text-base font-bold text-slate-900">Technical Steps</h4>
                                        </div>
                                        <div className="bg-slate-50 rounded-lg border border-slate-100 p-4">
                                            <ul className="space-y-2.5">
                                                {item.technicalSteps.map((step, i) => (
                                                    <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                                                        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-2 ${colors.bg}`} />
                                                        <span className="leading-relaxed">{step}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </section>

                                    {/* ── Champions (if any) ── */}
                                    {item.champions && item.champions.length > 0 && (
                                        <section>
                                            <div className="flex items-center gap-2.5 mb-3">
                                                <Users className="w-4 h-4 text-slate-500" />
                                                <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Champions</h4>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {item.champions.map((c, i) => (
                                                    <span
                                                        key={i}
                                                        className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold ${colors.fill} ${colors.text} border ${colors.border}`}
                                                    >
                                                        {c}
                                                    </span>
                                                ))}
                                            </div>
                                        </section>
                                    )}

                                    {/* ── Success Metric ── */}
                                    <section>
                                        <div className={`${colors.fill} ${colors.border} border rounded-lg p-4`}>
                                            <div className="flex items-center gap-2 mb-2">
                                                <Gauge className={`w-4 h-4 ${colors.text}`} />
                                                <h4 className={`text-xs font-bold uppercase tracking-wider ${colors.text}`}>
                                                    Success Metric
                                                </h4>
                                            </div>
                                            <p className="text-sm text-slate-700 leading-relaxed">
                                                {item.successMetric}
                                            </p>
                                        </div>
                                    </section>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default TechnicalSpecsView;
