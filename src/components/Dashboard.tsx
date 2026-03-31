'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import OverviewView from './views/OverviewView';
import MetricsView from './views/MetricsView';
import FeaturesView from './views/FeaturesView';
import RoadmapView from './views/RoadmapView';
import DocsView from './views/DocsView';
import TechnicalSpecsView from './views/TechnicalSpecsView';
import { StrategicMetric, Feature, Department, FiveYearTarget, AnnualObjective, KeyResult, MetricDefinitionSection } from '@/types';
import { Menu, Lock } from 'lucide-react';
import { UserButton, useUser } from '@clerk/nextjs';
import OKRDashboardView from './views/OKRDashboardView';
import OKRQ1View from './views/OKRQ1View';
import OKRObjectivesView from './views/OKRObjectivesView';
import OKRTargetsView from './views/OKRTargetsView';
import AdoptionView from './views/AdoptionView';
import Modal from './ui/Modal';
import EditMetricForm from './forms/EditMetricForm';
import EditFeatureForm from './forms/EditFeatureForm';
import EditKeyResultForm from './forms/EditKeyResultForm';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

const AccessDenied: React.FC = () => (
    <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-3">
        <Lock className="w-10 h-10 text-slate-300" />
        <p className="text-lg font-medium text-slate-500">Access Restricted</p>
        <p className="text-sm text-slate-400">This view is available to admins only.</p>
    </div>
);

export default function Dashboard() {
    const { user } = useUser();
    const isAdmin = user?.publicMetadata?.role === "admin";

    // Convex Data
    const metrics = useQuery(api.metrics.get);
    const departmentRoadmap = useQuery(api.roadmap.getExploreData);
    const okrFiveYearTargets = useQuery(api.okr.getFiveYearTargets);
    const okrAnnualObjectives = useQuery(api.okr.getAnnualObjectives);
    const okrKeyResults = useQuery(api.okr.getKeyResults, {});

    // Mutations
    const seedMetrics = useMutation(api.metrics.seed);
    const seedRoadmap = useMutation(api.roadmap.seed);
    const seedDefaults = useMutation(api.roadmap.seedDefaults);
    const seedRoadmapFeatures = useMutation(api.roadmap.seedRoadmapFeatures);
    const seedOKRData = useMutation(api.okr.seedOKRData);
    const seedAllOKRData = useMutation(api.okr.seedAllOKRData);
    const addMetric = useMutation(api.metrics.add);
    const updateMetric = useMutation(api.metrics.update);
    const seedQuarterlyTargets = useMutation(api.metrics.seedQuarterlyTargets);
    const seedDefinitions = useMutation(api.metrics.seedDefinitions);
    const updateDefinitions = useMutation(api.metrics.updateDefinitions);
    const addFeature = useMutation(api.roadmap.addFeature);
    const updateFeature = useMutation(api.roadmap.updateFeature);
    const updateFeatureDates = useMutation(api.roadmap.updateFeatureDates);
    const deleteFeatureMutation = useMutation(api.roadmap.deleteFeature);
    const updateKeyResultMutation = useMutation(api.okr.updateKeyResult);
    const addKeyResultMutation = useMutation(api.okr.addKeyResult);
    const deleteKeyResultMutation = useMutation(api.okr.deleteKeyResult);

    const [activeView, setActiveView] = useState('overview');
    const [activeToast, setActiveToast] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Modal State
    const [metricModal, setMetricModal] = useState<{ isOpen: boolean, item?: StrategicMetric, index?: number }>({ isOpen: false });
    const [featureModal, setFeatureModal] = useState<{ isOpen: boolean, deptId?: string, feature?: Feature, featureIndex?: number }>({ isOpen: false });
    const [keyResultModal, setKeyResultModal] = useState<{ isOpen: boolean, item?: KeyResult }>({ isOpen: false });

    // Initial Seeding Effect — admin-only, runs once (backend is idempotent via _metadata flag)
    const [seedAttempted, setSeedAttempted] = useState(false);
    useEffect(() => {
        if (seedAttempted || !isAdmin) return;
        const seedData = async () => {
            if (metrics !== undefined && metrics.length === 0) {
                const localData = await import('../data/data.json');
                const metricsWithCast = localData.strategicAlignment.map((m: any) => ({
                    ...m,
                    quarterlyTargets: m.quarterlyTargets?.map((qt: any) => ({
                        ...qt,
                        quarter: qt.quarter as 'Q1' | 'Q2' | 'Q3' | 'Q4',
                    })),
                }));
                await seedMetrics({ metrics: metricsWithCast });
            }
            if (departmentRoadmap !== undefined && departmentRoadmap.length === 0) {
                await seedDefaults();
            }
            // Seed OKR data (idempotent — guarded inside the mutation)
            if (okrFiveYearTargets !== undefined) {
                await seedOKRData();
                await seedAllOKRData();
            }
            // Seed roadmap features once departments and metrics exist
            if (
                metrics !== undefined && metrics.length > 0 &&
                departmentRoadmap !== undefined && departmentRoadmap.length > 0
            ) {
                await seedRoadmapFeatures();
            }
            // Always run quarterly targets migration (idempotent — skips already-patched records)
            await seedQuarterlyTargets();
            // Always run definitions seed (idempotent — skips already-patched records)
            await seedDefinitions();

            setSeedAttempted(true);
        };
        seedData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [metrics, departmentRoadmap, okrFiveYearTargets, isAdmin]);


    const handleDocClick = (docTitle: string) => {
        setActiveToast(`Opening: ${docTitle}`);
        setTimeout(() => setActiveToast(null), 3000);
    };

    // Metric Handlers
    const handleSaveMetric = async (metric: StrategicMetric) => {
        setIsSaving(true);
        try {
            if (metricModal.item && (metricModal.item as any)._id) {
                await updateMetric({
                    id: (metricModal.item as any)._id,
                    ...metric
                });
            } else {
                await addMetric(metric);
            }
            setActiveToast('Metric saved successfully');
            setTimeout(() => setActiveToast(null), 3000);
        } catch (error) {
            console.error("Failed to save metric:", error);
            setActiveToast('Error saving metric');
            setTimeout(() => setActiveToast(null), 3000);
        } finally {
            setIsSaving(false);
            setMetricModal({ isOpen: false });
        }
    };

    // Definition Handlers
    const handleSaveDefinitions = async (metricId: string, definitions: MetricDefinitionSection[]) => {
        try {
            await updateDefinitions({ id: metricId as any, metricDefinitions: definitions });
            setActiveToast('Definition saved successfully');
            setTimeout(() => setActiveToast(null), 3000);
        } catch (error) {
            console.error('Failed to save definitions:', error);
            setActiveToast('Error saving definition');
            setTimeout(() => setActiveToast(null), 3000);
        }
    };

    // Feature Handlers
    const handleSaveFeature = async (feature: Feature, departmentId: string) => {
        if (!departmentId) return;

        setIsSaving(true);
        try {
            if (featureModal.feature && (featureModal.feature as any)._id) {
                // If department changed, this might need a different mutation if strict ownership.
                // Assuming updateFeature handles it or we re-add.
                // For now assuming updateFeature updates the departmentId field.
                await updateFeature({
                    id: (featureModal.feature as any)._id,
                    departmentId: departmentId,
                    title: feature.title,
                    description: feature.description,
                    whatsapp: feature.whatsapp || undefined,
                    status: feature.status,
                    docs: feature.docs,
                    startDate: feature.startDate || undefined,
                    endDate: feature.endDate || undefined,
                    progress: feature.progress,
                    metricId: (feature.metricId && feature.metricId !== '') ? feature.metricId as any : undefined
                });
            } else {
                await addFeature({
                    departmentId: departmentId,
                    title: feature.title,
                    description: feature.description,
                    whatsapp: feature.whatsapp || undefined,
                    status: feature.status,
                    docs: feature.docs,
                    startDate: feature.startDate || undefined,
                    endDate: feature.endDate || undefined,
                    progress: feature.progress,
                    metricId: (feature.metricId && feature.metricId !== '') ? feature.metricId as any : undefined
                });
            }
            setActiveToast('Feature saved successfully');
            setTimeout(() => setActiveToast(null), 3000);
        } catch (error) {
            console.error("Failed to save feature:", error);
            setActiveToast('Error saving feature');
            setTimeout(() => setActiveToast(null), 3000);
        } finally {
            setIsSaving(false);
            setFeatureModal({ isOpen: false });
        }
    };

    // Quick date update handler for Gantt drag/resize
    const handleUpdateFeatureDates = async (feature: Feature, newStartDate: string, newEndDate: string) => {
        const featureId = (feature as any)._id;
        if (!featureId) return;

        try {
            await updateFeatureDates({
                id: featureId,
                startDate: newStartDate,
                endDate: newEndDate,
            });
        } catch (error) {
            console.error("Failed to update feature dates:", error);
            setActiveToast('Error updating dates');
            setTimeout(() => setActiveToast(null), 3000);
        }
    };

    // Delete feature handler
    const handleDeleteFeature = async () => {
        const featureId = (featureModal.feature as any)?._id;
        if (!featureId) return;

        setIsSaving(true);
        try {
            await deleteFeatureMutation({ id: featureId });
            setActiveToast('Feature deleted');
            setTimeout(() => setActiveToast(null), 3000);
        } catch (error) {
            console.error("Failed to delete feature:", error);
            setActiveToast('Error deleting feature');
            setTimeout(() => setActiveToast(null), 3000);
        } finally {
            setIsSaving(false);
            setFeatureModal({ isOpen: false });
        }
    };

    // Key Result Handlers
    const handleSaveKeyResult = async (kr: KeyResult) => {
        setIsSaving(true);
        try {
            if (keyResultModal.item && (keyResultModal.item as any)._id) {
                await updateKeyResultMutation({
                    id: (keyResultModal.item as any)._id,
                    pillar: kr.pillar,
                    objective: kr.objective,
                    keyResult: kr.keyResult,
                    owner: kr.owner,
                    target: kr.target,
                    current: kr.current,
                    progress: kr.progress,
                    status: kr.status,
                    confidence: kr.confidence,
                    quarter: kr.quarter as "Q1" | "Q2" | "Q3" | "Q4" | undefined,
                    targetValue: kr.targetValue,
                    thresholdAmber: kr.thresholdAmber,
                    thresholdGreen: kr.thresholdGreen,
                });
            } else {
                await addKeyResultMutation({
                    pillar: kr.pillar,
                    objective: kr.objective,
                    keyResult: kr.keyResult,
                    owner: kr.owner,
                    target: kr.target,
                    current: kr.current,
                    progress: kr.progress,
                    status: kr.status,
                    confidence: kr.confidence,
                    quarter: (kr.quarter ?? 'Q1') as "Q1" | "Q2" | "Q3" | "Q4",
                    targetValue: kr.targetValue,
                    thresholdAmber: kr.thresholdAmber,
                    thresholdGreen: kr.thresholdGreen,
                });
            }
            setActiveToast('Key result saved successfully');
            setTimeout(() => setActiveToast(null), 3000);
        } catch (error) {
            console.error('Failed to save key result:', error);
            setActiveToast('Error saving key result');
            setTimeout(() => setActiveToast(null), 3000);
        } finally {
            setIsSaving(false);
            setKeyResultModal({ isOpen: false });
        }
    };

    const handleDeleteKeyResult = async () => {
        const id = (keyResultModal.item as any)?._id;
        if (!id) return;
        setIsSaving(true);
        try {
            await deleteKeyResultMutation({ id });
            setActiveToast('Key result deleted');
            setTimeout(() => setActiveToast(null), 3000);
        } catch (error) {
            console.error('Failed to delete key result:', error);
            setActiveToast('Error deleting key result');
            setTimeout(() => setActiveToast(null), 3000);
        } finally {
            setIsSaving(false);
            setKeyResultModal({ isOpen: false });
        }
    };

    if (
        metrics === undefined ||
        departmentRoadmap === undefined ||
        okrFiveYearTargets === undefined ||
        okrAnnualObjectives === undefined ||
        okrKeyResults === undefined
    ) {
        return <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-400">Loading...</div>;
    }

    // Cast types for UI components (Convex types -> UI types)
    const uiMetrics: StrategicMetric[] = metrics.map((m: any) => ({ ...m }));
    const uiRoadmap: Department[] = departmentRoadmap.map((d: any) => ({ ...d }));
    const uiFiveYearTargets: FiveYearTarget[] = okrFiveYearTargets.map((t: any) => ({ ...t }));
    const uiAnnualObjectives: AnnualObjective[] = okrAnnualObjectives.map((o: any) => ({ ...o }));
    const uiKeyResults: KeyResult[] = okrKeyResults.map((kr: any) => ({ ...kr }));

    return (
        <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
            <Sidebar activeView={activeView} setActiveView={setActiveView} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* CONTENT AREA */}
            <main className="flex-1 flex flex-col h-full overflow-hidden lg:ml-64 relative">

                {/* Mobile Header */}
                <div className="sticky top-0 z-30 flex items-center justify-between bg-white/80 backdrop-blur-sm border-b border-slate-200 px-4 py-3 lg:hidden">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                    <div className="flex items-center space-x-2">
                        <img src="/logo.png" alt="Logo" className="w-6 h-6 rounded-full" />
                        <span className="font-bold text-slate-900 text-sm">TTT Roadmap</span>
                    </div>
                    <UserButton afterSignOutUrl="/sign-in" />
                </div>

                {/* Top Bar with Saving Indicator & User */}
                <div className="absolute top-3 right-3 sm:top-4 sm:right-8 z-40 flex items-center gap-3 max-lg:hidden">
                    {isSaving && <span className="text-xs text-slate-400 animate-pulse bg-white/80 backdrop-blur-sm px-2 py-1 rounded">Saving...</span>}
                    <UserButton afterSignOutUrl="/sign-in" />
                </div>

                {/* Toast - bottom on mobile, top on desktop */}
                <div className={`fixed left-1/2 -translate-x-1/2 z-50 transition-all duration-300 bottom-6 lg:bottom-auto lg:top-6 ${activeToast ? 'translate-y-0 opacity-100' : 'translate-y-4 lg:-translate-y-4 opacity-0 pointer-events-none'}`}>
                    <div className="bg-slate-900 text-white text-sm font-medium py-3 px-4 sm:px-6 rounded-lg shadow-lg flex items-center max-w-[90vw]">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full mr-3 animate-pulse flex-shrink-0"></div>
                        <span className="truncate">{activeToast}</span>
                    </div>
                </div>

                {/* Scrollable Main Content */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-12 scroll-smooth">
                    <div className="max-w-6xl mx-auto pt-2 sm:pt-4 lg:pt-8">
                        {activeView === 'overview' && <OverviewView />}
                        {activeView === 'metrics' && (
                            isAdmin ? (
                                <MetricsView
                                    data={uiMetrics}
                                    onEdit={(item, index) => setMetricModal({ isOpen: true, item, index })}
                                    onAdd={() => setMetricModal({ isOpen: true })}
                                    onSaveDefinitions={handleSaveDefinitions}
                                />
                            ) : <AccessDenied />
                        )}
                        {activeView === 'roadmap' && (
                            <RoadmapView
                                data={uiRoadmap}
                                metrics={uiMetrics}
                                onDocClick={handleDocClick}
                                isEditing={isAdmin}
                                onEdit={isAdmin ? (deptId, feature, index) => setFeatureModal({ isOpen: true, deptId, feature, featureIndex: index }) : () => {}}
                                onAdd={isAdmin ? () => setFeatureModal({ isOpen: true, deptId: uiRoadmap[0]?.id }) : () => {}}
                                onUpdateDates={isAdmin ? handleUpdateFeatureDates : async () => {}}
                            />
                        )}
                        {activeView === 'features' && (
                            <FeaturesView
                                data={uiRoadmap}
                                onDocClick={handleDocClick}
                                isEditing={isAdmin}
                                onEdit={isAdmin ? (deptId, feature, index) => setFeatureModal({ isOpen: true, deptId, feature, featureIndex: index }) : () => {}}
                                onAdd={isAdmin ? (deptId) => setFeatureModal({ isOpen: true, deptId }) : () => {}}
                                onDelete={isAdmin ? async (feature) => {
                                    const featureId = (feature as any)?._id;
                                    if (!featureId) return;
                                    try {
                                        await deleteFeatureMutation({ id: featureId });
                                        setActiveToast('Feature deleted');
                                        setTimeout(() => setActiveToast(null), 3000);
                                    } catch (error) {
                                        console.error("Failed to delete feature:", error);
                                        setActiveToast('Error deleting feature');
                                        setTimeout(() => setActiveToast(null), 3000);
                                    }
                                } : async () => {}}
                            />
                        )}
                        {activeView === 'specs' && <TechnicalSpecsView />}
                        {activeView === 'training' && <DocsView data={uiRoadmap} type="training" />}
                        {activeView === 'okr-dashboard' && (
                            <OKRDashboardView
                                keyResults={uiKeyResults}
                                fiveYearTargets={uiFiveYearTargets}
                                annualObjectives={uiAnnualObjectives}
                            />
                        )}
                        {activeView === 'okr-q1' && (
                            <OKRQ1View
                                keyResults={uiKeyResults}
                                onEdit={isAdmin ? (kr) => setKeyResultModal({ isOpen: true, item: kr }) : () => {}}
                                onAdd={isAdmin ? () => setKeyResultModal({ isOpen: true }) : () => {}}
                            />
                        )}
                        {activeView === 'okr-objectives' && (
                            <OKRObjectivesView
                                annualObjectives={uiAnnualObjectives}
                                fiveYearTargets={uiFiveYearTargets}
                            />
                        )}
                        {activeView === 'okr-targets' && (
                            <OKRTargetsView fiveYearTargets={uiFiveYearTargets} />
                        )}
                        {activeView === 'adoption' && (
                            isAdmin ? <AdoptionView /> : <AccessDenied />
                        )}
                    </div>
                </div>

                {/* Modals */}
                <Modal
                    isOpen={metricModal.isOpen}
                    onClose={() => setMetricModal({ isOpen: false })}
                    title={metricModal.item ? 'Edit Metric' : 'Add Metric'}
                >
                    <EditMetricForm
                        initialData={metricModal.item}
                        onSave={handleSaveMetric}
                        onCancel={() => setMetricModal({ isOpen: false })}
                    />
                </Modal>

                <Modal
                    isOpen={featureModal.isOpen}
                    onClose={() => setFeatureModal({ isOpen: false })}
                    title={featureModal.feature ? 'Edit Feature' : 'Add Feature'}
                >
                    <EditFeatureForm
                        initialData={featureModal.feature}
                        initialDepartmentId={featureModal.deptId}
                        metrics={uiMetrics}
                        departments={uiRoadmap}
                        onSave={handleSaveFeature}
                        onCancel={() => setFeatureModal({ isOpen: false })}
                        onDelete={featureModal.feature ? handleDeleteFeature : undefined}
                    />
                </Modal>

                <Modal
                    isOpen={keyResultModal.isOpen}
                    onClose={() => setKeyResultModal({ isOpen: false })}
                    title={keyResultModal.item ? 'Edit Key Result' : 'Add Key Result'}
                >
                    <EditKeyResultForm
                        initialData={keyResultModal.item}
                        onSave={handleSaveKeyResult}
                        onCancel={() => setKeyResultModal({ isOpen: false })}
                        onDelete={keyResultModal.item ? handleDeleteKeyResult : undefined}
                    />
                </Modal>


            </main>
        </div>
    );
}
