import React from 'react';

interface StatusBadgeProps {
    status: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
    const styles: { [key: string]: string } = {
        'High Priority': 'bg-amber-100 text-amber-800 border-amber-200',
        'In Development': 'bg-emerald-100 text-emerald-800 border-emerald-200',
        'Planning': 'bg-blue-50 text-blue-700 border-blue-200',
        'Discovery': 'bg-slate-100 text-slate-600 border-slate-200',
        'Live': 'bg-green-100 text-green-800 border-green-200',
    };

    return (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider border ${styles[status] || styles['Discovery']}`}>
            {status}
        </span>
    );
};

export default StatusBadge;
