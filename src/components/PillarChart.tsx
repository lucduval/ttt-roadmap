'use client';

import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from 'recharts';
import { KeyResult } from '@/types';

interface PillarChartProps {
    keyResults: KeyResult[];
}

const PILLAR_COLORS: Record<string, string> = {
    Tech: '#6366f1',
    Diversification: '#8b5cf6',
    Growth: '#10b981',
    Culture: '#f59e0b',
    Brand: '#f43f5e',
};

const DEFAULT_COLOR = '#94a3b8';

interface TooltipPayload {
    value: number;
}

const CustomTooltip = ({
    active,
    payload,
    label,
}: {
    active?: boolean;
    payload?: TooltipPayload[];
    label?: string;
}) => {
    if (active && payload && payload.length) {
        const pct = Math.round(payload[0].value * 100);
        return (
            <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm shadow-md">
                <p className="text-slate-600 font-medium">{label}</p>
                <p className="text-slate-900 font-bold">{pct}% progress</p>
            </div>
        );
    }
    return null;
};

const PillarChart: React.FC<PillarChartProps> = ({ keyResults }) => {
    const pillars = ['Tech', 'Diversification', 'Growth', 'Culture', 'Brand'];

    const data = pillars.map((pillar) => {
        const krs = keyResults.filter((kr) => kr.pillar === pillar);
        const avg =
            krs.length > 0
                ? krs.reduce((sum, kr) => sum + kr.progress, 0) / krs.length
                : 0;
        return { pillar, progress: avg, count: krs.length };
    });

    return (
        <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                    dataKey="pillar"
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                />
                <YAxis
                    tickFormatter={(v) => `${Math.round(v * 100)}%`}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    domain={[0, 1]}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(148,163,184,0.12)' }} />
                <Bar dataKey="progress" radius={[4, 4, 0, 0]} maxBarSize={48}>
                    {data.map((entry) => (
                        <Cell
                            key={entry.pillar}
                            fill={PILLAR_COLORS[entry.pillar] ?? DEFAULT_COLOR}
                        />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
};

export default PillarChart;
