import React from 'react';
import { FileCode, BookOpen, ExternalLink, FileText } from 'lucide-react';

interface DocumentRowProps {
    doc: string;
    type: 'spec' | 'training';
    department: string;
    onClick?: () => void;
}

const DocumentRow: React.FC<DocumentRowProps> = ({ doc, type, department, onClick }) => (
    <div onClick={onClick} className="group flex items-center justify-between p-3 sm:p-4 bg-white border border-slate-200 rounded-sm hover:border-slate-300 transition-all cursor-pointer gap-3">
        <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
            <div className={`p-2 rounded-md flex-shrink-0 ${type === 'spec' ? 'bg-yellow-50 text-yellow-700' : 'bg-emerald-50 text-emerald-600'}`}>
                {type === 'spec' ? <FileCode className="w-4 h-4 sm:w-5 sm:h-5" /> : <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />}
            </div>
            <div className="min-w-0">
                <h4 className="text-xs sm:text-sm font-medium text-slate-900 group-hover:text-yellow-700 transition-colors truncate">{doc}</h4>
                <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 truncate">{department}</p>
            </div>
        </div>
        <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-slate-500 flex-shrink-0" />
    </div>
);

export default DocumentRow;
