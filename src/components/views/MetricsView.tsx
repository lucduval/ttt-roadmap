import React from 'react';
import Icon from '../ui/Icon';
import { StrategicMetric } from '@/types';
import { Edit2, Plus } from 'lucide-react';

interface MetricsViewProps {
    data: StrategicMetric[];
    onEdit?: (item: StrategicMetric, index: number) => void;
    onAdd?: () => void;
}

const MetricsView: React.FC<MetricsViewProps> = ({ data, onEdit, onAdd }) => {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Strategic Metrics</h2>
                {onAdd && (
                    <button
                        onClick={onAdd}
                        className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-yellow-500 text-slate-900 rounded-md hover:bg-yellow-600 transition-colors shadow-sm text-sm font-medium flex-shrink-0"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">Add Metric</span>
                    </button>
                )}
            </div>
            <div className="grid grid-cols-1 gap-4">
                {data.map((item, index) => (
                    <div key={index} className="group relative bg-white p-4 sm:p-6 border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition-all">
                        {onEdit && (
                            <button
                                onClick={() => onEdit(item, index)}
                                className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 bg-slate-50 text-slate-500 rounded-full hover:bg-slate-100 hover:text-yellow-600 transition-colors sm:opacity-0 sm:group-hover:opacity-100 z-10"
                            >
                                <Edit2 className="w-4 h-4" />
                            </button>
                        )}
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
                            <div className="flex-shrink-0 grid grid-cols-3 gap-2 sm:gap-3 w-full md:w-auto md:min-w-[320px]">
                                <div className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl bg-slate-50 border border-slate-100">
                                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Base</span>
                                    <span className="text-base sm:text-lg font-bold text-slate-700">{item.baseGoal || '-'}</span>
                                </div>
                                <div className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl bg-yellow-50 border border-yellow-100">
                                    <span className="text-[10px] uppercase tracking-wider text-yellow-600 font-semibold mb-1">Target</span>
                                    <span className="text-lg sm:text-2xl font-bold text-yellow-700">{item.targetGoal || '-'}</span>
                                </div>
                                <div className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                                    <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold mb-1">Stretch</span>
                                    <span className="text-base sm:text-lg font-bold text-emerald-700">{item.stretchGoal || '-'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

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
        </div>
    );
};

export default MetricsView;
