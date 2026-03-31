import React, { useState, useMemo } from 'react';
import { KeyResult, Quarter } from '@/types';
import OKRProgressBar from '@/components/OKRProgressBar';
import OKRStatusBadge from '@/components/OKRStatusBadge';
import ConfidenceGauge from '@/components/ConfidenceGauge';
import { User, Edit3, Plus, Search, X, ChevronDown, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface OKRQ1ViewProps {
    keyResults: KeyResult[];
    onEdit?: (kr: KeyResult) => void;
    onAdd?: () => void;
}

const PILLAR_STYLES: Record<string, { label: string; dot: string; border: string; bg: string }> = {
    Tech: {
        label: 'text-indigo-700',
        dot: 'bg-indigo-500',
        border: 'border-indigo-200',
        bg: 'bg-indigo-50',
    },
    Diversification: {
        label: 'text-violet-700',
        dot: 'bg-violet-500',
        border: 'border-violet-200',
        bg: 'bg-violet-50',
    },
    Growth: {
        label: 'text-emerald-700',
        dot: 'bg-emerald-500',
        border: 'border-emerald-200',
        bg: 'bg-emerald-50',
    },
    Culture: {
        label: 'text-amber-700',
        dot: 'bg-amber-400',
        border: 'border-amber-200',
        bg: 'bg-amber-50',
    },
    Brand: {
        label: 'text-rose-700',
        dot: 'bg-rose-500',
        border: 'border-rose-200',
        bg: 'bg-rose-50',
    },
};

const DEFAULT_STYLE = {
    label: 'text-slate-700',
    dot: 'bg-slate-400',
    border: 'border-slate-200',
    bg: 'bg-slate-50',
};

const PILLAR_ORDER = ['Tech', 'Diversification', 'Growth', 'Culture', 'Brand'];
const STATUS_OPTIONS = ['Green', 'Amber', 'Red'];
const QUARTERS: Quarter[] = ['Q1', 'Q2', 'Q3', 'Q4'];

const QUARTER_LABELS: Record<Quarter, string> = {
    Q1: 'Q1 — Jan to Mar',
    Q2: 'Q2 — Apr to Jun',
    Q3: 'Q3 — Jul to Sep',
    Q4: 'Q4 — Oct to Dec',
};

const STATUS_STYLES: Record<string, string> = {
    Green: 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200',
    Amber: 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200',
    Red: 'bg-rose-100 text-rose-700 border-rose-200 hover:bg-rose-200',
};

const AT_RISK_WEEKS_THRESHOLD = 3;

function getActiveQuarter(): Quarter {
    const month = new Date().getMonth();
    if (month <= 2) return 'Q1';
    if (month <= 5) return 'Q2';
    if (month <= 8) return 'Q3';
    return 'Q4';
}

function getQuarterEndDate(quarter: Quarter): Date {
    const year = new Date().getFullYear();
    const ends: Record<Quarter, [number, number]> = {
        Q1: [2, 31],
        Q2: [5, 30],
        Q3: [8, 30],
        Q4: [11, 31],
    };
    const [month, day] = ends[quarter];
    return new Date(year, month, day, 23, 59, 59);
}

function isAtRisk(kr: KeyResult): boolean {
    if (kr.status !== 'Red') return false;
    if (kr.progress >= 1) return false;
    const quarter = kr.quarter ?? 'Q1';
    const now = new Date();
    const end = getQuarterEndDate(quarter as Quarter);
    const weeksLeft = Math.max(0, (end.getTime() - now.getTime()) / (7 * 24 * 60 * 60 * 1000));
    return weeksLeft < AT_RISK_WEEKS_THRESHOLD;
}

function isCompleted(kr: KeyResult): boolean {
    return kr.progress >= 1;
}

const OKRQ1View: React.FC<OKRQ1ViewProps> = ({ keyResults, onEdit, onAdd }) => {
    const activeQuarter = getActiveQuarter();
    const [search, setSearch] = useState('');
    const [selectedPillars, setSelectedPillars] = useState<string[]>([]);
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
    const [selectedOwner, setSelectedOwner] = useState('');
    const [selectedQuarter, setSelectedQuarter] = useState<Quarter | 'All'>(activeQuarter);
    const [ownerDropdownOpen, setOwnerDropdownOpen] = useState(false);

    const allOwners = useMemo(
        () => Array.from(new Set(keyResults.map((kr) => kr.owner).filter(Boolean))).sort() as string[],
        [keyResults]
    );

    const presentPillars = PILLAR_ORDER.filter((p) => keyResults.some((kr) => kr.pillar === p));
    const otherPillars = Array.from(new Set(keyResults.map((kr) => kr.pillar))).filter(
        (p) => !PILLAR_ORDER.includes(p)
    );
    const sortedPillars = [...presentPillars, ...otherPillars];

    const togglePillar = (p: string) =>
        setSelectedPillars((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]);

    const toggleStatus = (s: string) =>
        setSelectedStatuses((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);

    const clearFilters = () => {
        setSearch('');
        setSelectedPillars([]);
        setSelectedStatuses([]);
        setSelectedOwner('');
        setSelectedQuarter(activeQuarter);
    };

    const hasActiveFilters = search || selectedPillars.length > 0 || selectedStatuses.length > 0 || selectedOwner || selectedQuarter !== activeQuarter;

    const filteredKRs = useMemo(() => {
        const q = search.toLowerCase();
        return keyResults.filter((kr) => {
            if (selectedQuarter !== 'All' && (kr.quarter ?? 'Q1') !== selectedQuarter) return false;
            if (selectedPillars.length > 0 && !selectedPillars.includes(kr.pillar)) return false;
            if (selectedStatuses.length > 0 && !selectedStatuses.includes(kr.status)) return false;
            if (selectedOwner && kr.owner !== selectedOwner) return false;
            if (q && !kr.keyResult.toLowerCase().includes(q) &&
                !kr.objective.toLowerCase().includes(q) &&
                !(kr.owner ?? '').toLowerCase().includes(q)) return false;
            return true;
        });
    }, [keyResults, search, selectedPillars, selectedStatuses, selectedOwner, selectedQuarter]);

    // Group by quarter when "All" is selected
    const quartersWithData = useMemo(() => {
        if (selectedQuarter !== 'All') return [selectedQuarter];
        return QUARTERS.filter((q) => filteredKRs.some((kr) => (kr.quarter ?? 'Q1') === q));
    }, [filteredKRs, selectedQuarter]);

    const renderKRList = (krs: KeyResult[]) => {
        const visiblePillars = sortedPillars.filter((p) => krs.some((kr) => kr.pillar === p));

        return visiblePillars.map((pillar) => {
            const pillarKRs = krs.filter((kr) => kr.pillar === pillar);
            const objectives = Array.from(new Set(pillarKRs.map((kr) => kr.objective)));
            const pillarAvg =
                pillarKRs.reduce((s, kr) => s + kr.progress, 0) / pillarKRs.length;
            const styles = PILLAR_STYLES[pillar] ?? DEFAULT_STYLE;

            return (
                <div key={pillar} className="space-y-3">
                    {/* Pillar header chip */}
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold uppercase tracking-wider ${styles.bg} ${styles.border} ${styles.label}`}>
                        <span className={`w-2 h-2 rounded-full ${styles.dot}`} />
                        {pillar}
                        <span className="font-normal normal-case text-slate-500">
                            {Math.round(pillarAvg * 100)}% avg · {pillarKRs.length} KR{pillarKRs.length !== 1 ? 's' : ''}
                        </span>
                    </div>

                    {objectives.map((objective) => {
                        const objKRs = pillarKRs.filter((kr) => kr.objective === objective);
                        return (
                            <div
                                key={objective}
                                className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm"
                            >
                                {/* Objective header */}
                                <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/60">
                                    <p className="text-sm font-semibold text-slate-700">{objective}</p>
                                </div>

                                {/* KR rows */}
                                <div className="divide-y divide-slate-100">
                                    {objKRs.map((kr) => {
                                        const atRisk = isAtRisk(kr);
                                        const completed = isCompleted(kr);
                                        return (
                                            <div
                                                key={kr._id ?? kr.keyResult}
                                                className={`px-5 py-4 grid grid-cols-1 lg:grid-cols-[1fr_200px_auto_auto_auto] gap-3 lg:gap-4 items-center group ${completed ? 'bg-emerald-50/40 border-l-2 border-l-emerald-400' : ''}`}
                                            >
                                                {/* KR text + owner + badges */}
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className={`text-sm font-medium leading-snug ${completed ? 'text-slate-500' : 'text-slate-800'}`}>
                                                            {kr.keyResult}
                                                        </p>
                                                        {completed && (
                                                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium text-emerald-700 bg-emerald-100 rounded-full shrink-0">
                                                                <CheckCircle2 className="w-3 h-3" />
                                                                Completed
                                                            </span>
                                                        )}
                                                        {atRisk && (
                                                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium text-orange-700 bg-orange-100 rounded-full shrink-0">
                                                                <AlertTriangle className="w-3 h-3" />
                                                                At Risk
                                                            </span>
                                                        )}
                                                    </div>
                                                    {kr.owner && (
                                                        <div className="flex items-center gap-1 mt-1 text-xs text-slate-400">
                                                            <User className="w-3 h-3" />
                                                            {kr.owner}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Progress */}
                                                <div className="min-w-0">
                                                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                                                        <span>{kr.current} / {kr.target}</span>
                                                    </div>
                                                    <OKRProgressBar
                                                        progress={kr.progress}
                                                        height="md"
                                                        target={kr.target}
                                                        thresholdAmber={kr.thresholdAmber}
                                                        thresholdGreen={kr.thresholdGreen}
                                                        status={kr.status}
                                                    />
                                                </div>

                                                {/* Status badge */}
                                                <OKRStatusBadge status={kr.status} />

                                                {/* Confidence */}
                                                <div className="flex flex-col items-center gap-0.5">
                                                    <ConfidenceGauge value={kr.confidence} />
                                                    <span className="text-xs text-slate-400">conf.</span>
                                                </div>

                                                {/* Edit button */}
                                                {onEdit && (
                                                    <button
                                                        onClick={() => onEdit(kr)}
                                                        className="p-1.5 text-slate-300 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                                                        title="Edit key result"
                                                    >
                                                        <Edit3 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            );
        });
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Key Results</h1>
                    <p className="text-slate-500 mt-1 text-sm">
                        Showing {filteredKRs.length} of {keyResults.length} key results
                    </p>
                </div>
                {onAdd && (
                    <button
                        onClick={onAdd}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-sm shrink-0"
                    >
                        <Plus className="w-4 h-4" />
                        Add Key Result
                    </button>
                )}
            </div>

            {/* Filter bar */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search key results, objectives or owners…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 transition"
                    />
                    {search && (
                        <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Quarter + Pillar + Status + Owner filters */}
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Quarter:</span>
                    <button
                        onClick={() => setSelectedQuarter('All')}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                            selectedQuarter === 'All'
                                ? 'bg-slate-800 text-white border-slate-800'
                                : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700'
                        }`}
                    >
                        All
                    </button>
                    {QUARTERS.map((q) => (
                        <button
                            key={q}
                            onClick={() => setSelectedQuarter(q)}
                            className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                                selectedQuarter === q
                                    ? 'bg-slate-800 text-white border-slate-800'
                                    : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700'
                            }`}
                        >
                            {q}
                        </button>
                    ))}

                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wide ml-2">Pillar:</span>
                    {sortedPillars.map((p) => {
                        const styles = PILLAR_STYLES[p] ?? DEFAULT_STYLE;
                        const active = selectedPillars.includes(p);
                        return (
                            <button
                                key={p}
                                onClick={() => togglePillar(p)}
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                                    active
                                        ? `${styles.bg} ${styles.border} ${styles.label} shadow-sm`
                                        : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700'
                                }`}
                            >
                                <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`} />
                                {p}
                            </button>
                        );
                    })}

                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wide ml-2">Status:</span>
                    {STATUS_OPTIONS.map((s) => {
                        const active = selectedStatuses.includes(s);
                        return (
                            <button
                                key={s}
                                onClick={() => toggleStatus(s)}
                                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                                    active
                                        ? STATUS_STYLES[s]
                                        : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700'
                                }`}
                            >
                                {s}
                            </button>
                        );
                    })}

                    {allOwners.length > 0 && (
                        <>
                            <span className="text-xs font-medium text-slate-400 uppercase tracking-wide ml-2">Owner:</span>
                            <div className="relative">
                                <button
                                    onClick={() => setOwnerDropdownOpen((o) => !o)}
                                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                                        selectedOwner
                                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                                            : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700'
                                    }`}
                                >
                                    <User className="w-3 h-3" />
                                    {selectedOwner || 'All owners'}
                                    <ChevronDown className="w-3 h-3" />
                                </button>
                                {ownerDropdownOpen && (
                                    <div className="absolute top-full left-0 mt-1 z-20 bg-white border border-slate-200 rounded-lg shadow-lg py-1 min-w-[140px]">
                                        <button
                                            onClick={() => { setSelectedOwner(''); setOwnerDropdownOpen(false); }}
                                            className="w-full text-left px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-50"
                                        >
                                            All owners
                                        </button>
                                        {allOwners.map((owner) => (
                                            <button
                                                key={owner}
                                                onClick={() => { setSelectedOwner(owner); setOwnerDropdownOpen(false); }}
                                                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 ${selectedOwner === owner ? 'text-indigo-700 font-medium' : 'text-slate-700'}`}
                                            >
                                                {owner}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="ml-auto flex items-center gap-1 px-2.5 py-1 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
                        >
                            <X className="w-3 h-3" />
                            Clear filters
                        </button>
                    )}
                </div>
            </div>

            {filteredKRs.length === 0 && (
                <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400 shadow-sm">
                    {keyResults.length === 0
                        ? 'No key results have been entered yet.'
                        : 'No key results match your current filters.'}
                </div>
            )}

            {/* Render grouped by quarter when "All" is selected */}
            {quartersWithData.map((quarter) => {
                const quarterKRs = filteredKRs.filter((kr) => (kr.quarter ?? 'Q1') === quarter);
                if (quarterKRs.length === 0) return null;

                const avgProgress = quarterKRs.reduce((s, kr) => s + kr.progress, 0) / quarterKRs.length;

                return (
                    <div key={quarter} className="space-y-4">
                        {/* Quarter section header — only show when viewing All */}
                        {selectedQuarter === 'All' && (
                            <div className="flex items-center gap-3 pt-2">
                                <h2 className="text-lg font-bold text-slate-800">{QUARTER_LABELS[quarter]}</h2>
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-500 bg-slate-100 rounded-full">
                                    {Math.round(avgProgress * 100)}% avg · {quarterKRs.length} KRs
                                </span>
                            </div>
                        )}
                        {renderKRList(quarterKRs)}
                    </div>
                );
            })}
        </div>
    );
};

export default OKRQ1View;
