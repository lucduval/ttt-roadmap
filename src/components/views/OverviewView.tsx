import React from 'react';
import { Target, Wrench, Globe, Database } from 'lucide-react';

const OverviewView: React.FC = () => {
    return (
        <div className="space-y-10 animate-in fade-in duration-500">

            {/* ─── Strategic Overview ─── */}
            <section className="bg-white p-6 sm:p-10 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-yellow-50">
                        <Target className="w-5 h-5 text-yellow-600" />
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                        2026 Strategic Priorities
                    </h1>
                </div>

                <p className="text-base sm:text-lg text-slate-600 leading-relaxed mb-8">
                    This year we&apos;re working with TTT Financial Group to shift how the business
                    operates. Every initiative, tool, and process we deliver will be tied to
                    <strong className="text-slate-800"> specific, measurable outcomes</strong>.
                    The priorities below outline the three pillars that will drive growth
                    and make sure effort translates directly into results.
                </p>

                {/* Three Pillars — full-width stacked */}
                <div className="space-y-4">

                    {/* Pillar 1 – Internal Adoption & Training */}
                    <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-5 sm:p-6">
                        <div className="flex items-center gap-2.5 mb-3">
                            <div className="p-1.5 rounded-md bg-purple-100">
                                <Wrench className="w-4 h-4 text-purple-600" />
                            </div>
                            <h3 className="font-semibold text-slate-900">Internal Adoption &amp; Training</h3>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed">
                            Before the business can grow outward, the team needs to be excellent inward.
                            2026 places a <strong className="text-slate-700">major emphasis on training</strong>. This means making sure every team member is confident and consistent with the CRM,
                            compliance tools, and internal workflows. When TTT employees use the
                            tools properly, the whole business can move forward faster.
                        </p>
                    </div>

                    {/* Pillar 2 – Client-Facing Tools */}
                    <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-5 sm:p-6">
                        <div className="flex items-center gap-2.5 mb-3">
                            <div className="p-1.5 rounded-md bg-emerald-100">
                                <Globe className="w-4 h-4 text-emerald-600" />
                            </div>
                            <h3 className="font-semibold text-slate-900">Client-Facing Tools</h3>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed">
                            Growth means letting clients help themselves.
                            <strong className="text-slate-700"> WhatsApp engagement, automated onboarding,
                            and digital signing</strong> are the channels that let clients initiate
                            actions on their own, reducing manual work for TTT while delivering
                            a faster, more modern experience. The goal: clients do more of the
                            work themselves, and they prefer it that way.
                        </p>
                    </div>

                    {/* Pillar 3 – Data-Driven Growth */}
                    <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-5 sm:p-6">
                        <div className="flex items-center gap-2.5 mb-3">
                            <div className="p-1.5 rounded-md bg-red-100">
                                <Database className="w-4 h-4 text-red-500" />
                            </div>
                            <h3 className="font-semibold text-slate-900">Data-Driven Growth</h3>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed">
                            TTT sits on a wealth of client data, especially within the tax base.
                            This year we need to be <strong className="text-slate-700">clever with that data</strong>.
                            By mining the existing tax client base for financial advisory opportunities,
                            we can turn a service relationship into a <strong className="text-slate-700">growth engine</strong>.
                            Smart scoring, customer segmentation and cross-selling are the levers that
                            will make this happen.
                        </p>
                    </div>
                </div>

            </section>
        </div>
    );
};

export default OverviewView;
