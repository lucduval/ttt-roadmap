import React from 'react';

interface ConfidenceGaugeProps {
    value: number; // 1–10
}

function getConfidenceStyle(value: number): string {
    if (value >= 7) return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    if (value >= 4) return 'bg-amber-50 text-amber-700 border border-amber-200';
    return 'bg-rose-50 text-rose-700 border border-rose-200';
}

const ConfidenceGauge: React.FC<ConfidenceGaugeProps> = ({ value }) => {
    return (
        <span
            className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold tabular-nums ${getConfidenceStyle(value)}`}
            title={`Confidence: ${value}/10`}
        >
            {value}
        </span>
    );
};

export default ConfidenceGauge;
