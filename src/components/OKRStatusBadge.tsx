import React from 'react';
import { OKRStatus } from '@/types';

interface OKRStatusBadgeProps {
    status: OKRStatus | string;
    size?: 'sm' | 'md';
}

const statusConfig: Record<string, { dot: string; text: string; bg: string }> = {
    Green: {
        dot: 'bg-emerald-500',
        text: 'text-emerald-700',
        bg: 'bg-emerald-50 border border-emerald-200',
    },
    Amber: {
        dot: 'bg-amber-400',
        text: 'text-amber-700',
        bg: 'bg-amber-50 border border-amber-200',
    },
    Red: {
        dot: 'bg-rose-500',
        text: 'text-rose-700',
        bg: 'bg-rose-50 border border-rose-200',
    },
};

const OKRStatusBadge: React.FC<OKRStatusBadgeProps> = ({ status, size = 'md' }) => {
    const config = statusConfig[status] ?? statusConfig['Red'];
    const padding = size === 'sm' ? 'px-2 py-0.5' : 'px-2.5 py-1';

    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full font-medium text-xs ${padding} ${config.bg} ${config.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${config.dot}`} />
            {status}
        </span>
    );
};

export default OKRStatusBadge;
