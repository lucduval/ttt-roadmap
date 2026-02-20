import React from 'react';
import {
    BarChart3,
    Map,
    Layers,
    FileCode,
    BookOpen,
    Settings,
    FileText,
    X,
    LayoutDashboard,
    ListChecks,
    Target,
    Flag,
} from 'lucide-react';

interface NavItemProps {
    icon: React.ReactNode;
    label: string;
    active: boolean;
    onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center space-x-3 px-4 py-2.5 text-sm font-medium transition-all duration-200 rounded-md mb-1 ${active
            ? 'bg-slate-800 text-white shadow-sm'
            : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
            }`}
    >
        {icon}
        <span>{label}</span>
    </button>
);

interface SidebarProps {
    activeView: string;
    setActiveView: (view: string) => void;
    isOpen: boolean;
    onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, isOpen, onClose }) => {
    const handleNavClick = (view: string) => {
        setActiveView(view);
        onClose();
    };

    return (
        <>
            {/* Mobile overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            <aside className={`
                w-64 bg-slate-900 flex-shrink-0 flex flex-col border-r border-slate-800 h-screen fixed left-0 top-0 z-50
                transition-transform duration-300 ease-in-out safe-area-top safe-area-bottom
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                lg:translate-x-0
            `}>
                <div className="p-6 border-b border-slate-800">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 mb-2">
                            <img src="/logo.png" alt="Logo" className="w-8 h-8 rounded-full" />
                            <span className="text-white font-bold tracking-tight text-lg">TTT Roadmap</span>
                        </div>
                        <button
                            onClick={onClose}
                            className="lg:hidden p-1 text-slate-400 hover:text-white rounded-md"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="text-xs text-slate-500 font-medium pl-11">
                        Project - TTT Financial Group
                    </div>
                </div>

                <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto custom-scrollbar">
                    <div className="px-4 pb-2 text-xs font-bold text-slate-500 uppercase tracking-wider">Strategic</div>
                    <NavItem
                        icon={<FileText className="w-5 h-5" />}
                        label="Overview"
                        active={activeView === 'overview'}
                        onClick={() => handleNavClick('overview')}
                    />
                    <NavItem
                        icon={<BarChart3 className="w-5 h-5" />}
                        label="Metrics"
                        active={activeView === 'metrics'}
                        onClick={() => handleNavClick('metrics')}
                    />
                    <NavItem
                        icon={<Map className="w-5 h-5" />}
                        label="Roadmap"
                        active={activeView === 'roadmap'}
                        onClick={() => handleNavClick('roadmap')}
                    />

                    <div className="px-4 pb-2 pt-6 text-xs font-bold text-slate-500 uppercase tracking-wider">OKRs</div>
                    <NavItem
                        icon={<LayoutDashboard className="w-5 h-5" />}
                        label="OKR Dashboard"
                        active={activeView === 'okr-dashboard'}
                        onClick={() => handleNavClick('okr-dashboard')}
                    />
                    <NavItem
                        icon={<ListChecks className="w-5 h-5" />}
                        label="Q1 Key Results"
                        active={activeView === 'okr-q1'}
                        onClick={() => handleNavClick('okr-q1')}
                    />
                    <NavItem
                        icon={<Target className="w-5 h-5" />}
                        label="Objectives"
                        active={activeView === 'okr-objectives'}
                        onClick={() => handleNavClick('okr-objectives')}
                    />
                    <NavItem
                        icon={<Flag className="w-5 h-5" />}
                        label="5-Year Targets"
                        active={activeView === 'okr-targets'}
                        onClick={() => handleNavClick('okr-targets')}
                    />

                    <div className="px-4 pb-2 pt-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Product</div>
                    <NavItem
                        icon={<Layers className="w-5 h-5" />}
                        label="Features"
                        active={activeView === 'features'}
                        onClick={() => handleNavClick('features')}
                    />

                    <div className="px-4 pb-2 pt-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Library</div>
                    <NavItem
                        icon={<FileCode className="w-5 h-5" />}
                        label="Technical Specs"
                        active={activeView === 'specs'}
                        onClick={() => handleNavClick('specs')}
                    />
                    <NavItem
                        icon={<BookOpen className="w-5 h-5" />}
                        label="Training Guides"
                        active={activeView === 'training'}
                        onClick={() => handleNavClick('training')}
                    />
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <button className="flex items-center space-x-3 text-sm text-slate-400 hover:text-white transition-colors w-full px-2 py-2 rounded-md hover:bg-slate-800/50">
                        <Settings className="w-5 h-5" />
                        <span>Settings</span>
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
