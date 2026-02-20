import React from 'react';

interface OKRProgressBarProps {
    progress: number; // 0–1 decimal
    showLabel?: boolean;
    height?: 'sm' | 'md' | 'lg';
}

function getProgressColor(progress: number): string {
    if (progress >= 0.7) return 'bg-emerald-500';
    if (progress >= 0.4) return 'bg-amber-400';
    return 'bg-rose-500';
}

const OKRProgressBar: React.FC<OKRProgressBarProps> = ({
    progress,
    showLabel = true,
    height = 'md',
}) => {
    const pct = Math.min(Math.max(progress * 100, 0), 100);
    const color = getProgressColor(progress);

    const heightClass = {
        sm: 'h-1.5',
        md: 'h-2',
        lg: 'h-2.5',
    }[height];

    return (
        <div className="flex items-center gap-3 w-full">
            <div className={`flex-1 bg-slate-200 rounded-full overflow-hidden ${heightClass}`}>
                <div
                    className={`${color} ${heightClass} rounded-full transition-all duration-500`}
                    style={{ width: `${pct}%` }}
                />
            </div>
            {showLabel && (
                <span className="text-xs font-semibold text-slate-500 w-10 text-right tabular-nums">
                    {Math.round(pct)}%
                </span>
            )}
        </div>
    );
};

export default OKRProgressBar;
