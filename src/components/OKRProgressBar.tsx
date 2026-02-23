import React from 'react';

interface OKRProgressBarProps {
    progress: number; // 0–1 decimal
    showLabel?: boolean;
    height?: 'sm' | 'md' | 'lg';
    // Optional threshold markers (raw values relative to target)
    target?: number;
    thresholdAmber?: number;
    thresholdGreen?: number;
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
    target,
    thresholdAmber,
    thresholdGreen,
}) => {
    const pct = Math.min(Math.max(progress * 100, 0), 100);
    const color = getProgressColor(progress);

    const heightClass = {
        sm: 'h-1.5',
        md: 'h-2',
        lg: 'h-2.5',
    }[height];

    const hasThresholds =
        target !== undefined && target > 0 &&
        thresholdAmber !== undefined &&
        thresholdGreen !== undefined;

    const amberPct = hasThresholds ? Math.min(100, (thresholdAmber! / target!) * 100) : null;
    const greenPct = hasThresholds ? Math.min(100, (thresholdGreen! / target!) * 100) : null;

    return (
        <div className="flex items-center gap-3 w-full">
            <div className={`relative flex-1 bg-slate-200 rounded-full overflow-visible ${heightClass}`}>
                <div
                    className={`${color} ${heightClass} rounded-full transition-all duration-500`}
                    style={{ width: `${pct}%` }}
                />
                {/* Threshold tick marks */}
                {amberPct !== null && (
                    <div
                        className="absolute top-1/2 -translate-y-1/2 w-px bg-amber-400 opacity-70"
                        style={{ left: `${amberPct}%`, height: '160%' }}
                        title={`Amber ≥ ${thresholdAmber}`}
                    />
                )}
                {greenPct !== null && (
                    <div
                        className="absolute top-1/2 -translate-y-1/2 w-px bg-emerald-500 opacity-70"
                        style={{ left: `${greenPct}%`, height: '160%' }}
                        title={`Green ≥ ${thresholdGreen}`}
                    />
                )}
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
