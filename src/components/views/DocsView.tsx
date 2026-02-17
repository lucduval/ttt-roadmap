import React from 'react';
import DocumentRow from '../DocumentRow';
import { Department } from '@/types';

interface DocsViewProps {
    data: Department[];
    type: 'spec' | 'training';
}

const DocsView: React.FC<DocsViewProps> = ({ data, type }) => {
    // Helper to filter documents based on type
    const getDocs = () => {
        const allDocs: { name: string; dept: string }[] = [];
        data.forEach(dept => {
            dept.features.forEach(feat => {
                feat.docs.forEach(doc => {
                    const isSpec = doc.toLowerCase().includes('spec') || doc.toLowerCase().includes('schema') || doc.toLowerCase().includes('logic') || doc.toLowerCase().includes('architecture') || doc.toLowerCase().includes('api');
                    const isTraining = doc.toLowerCase().includes('guide') || doc.toLowerCase().includes('training') || doc.toLowerCase().includes('manual');

                    if (type === 'spec' && isSpec) allDocs.push({ name: doc, dept: dept.name });
                    if (type === 'training' && isTraining) allDocs.push({ name: doc, dept: dept.name });
                });
            });
        });
        return allDocs;
    };

    const docs = getDocs();

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    {type === 'spec' ? 'Technical Specifications' : 'Training & Guides'}
                </h2>
            </div>
            <div className="grid grid-cols-1 gap-4">
                {docs.length > 0 ? (
                    docs.map((d, i) => (
                        <DocumentRow key={i} doc={d.name} department={d.dept} type={type} />
                    ))
                ) : (
                    <div className="p-8 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200 text-slate-500">
                        No documents found for this category yet.
                    </div>
                )}
            </div>
        </div>
    );
};

export default DocsView;
