import React, { useState } from 'react';
import { KeyResult, OKRPillar, OKRStatus } from '@/types';
import { Label, Input, Select } from '../ui/FormElements';
import { Trash2 } from 'lucide-react';

function computeStatus(current: number, thresholdAmber?: number, thresholdGreen?: number): OKRStatus {
    if (thresholdAmber === undefined || thresholdGreen === undefined) return 'Green';
    if (current >= thresholdGreen) return 'Green';
    if (current >= thresholdAmber) return 'Amber';
    return 'Red';
}

interface EditKeyResultFormProps {
    initialData?: KeyResult;
    onSave: (data: KeyResult) => void;
    onCancel: () => void;
    onDelete?: () => void;
}

const PILLARS: OKRPillar[] = ['Tech', 'Diversification', 'Growth', 'Culture', 'Brand'];
const STATUSES: OKRStatus[] = ['Green', 'Amber', 'Red'];

interface ThresholdPreviewProps {
    target: number;
    current: number;
    thresholdAmber: number;
    thresholdGreen: number;
}

const ThresholdPreview: React.FC<ThresholdPreviewProps> = ({ target, current, thresholdAmber, thresholdGreen }) => {
    const safeTarget = target || 1;
    const amberPct = Math.min(100, (thresholdAmber / safeTarget) * 100);
    const greenPct = Math.min(100, (thresholdGreen / safeTarget) * 100);
    const currentPct = Math.min(100, (current / safeTarget) * 100);

    return (
        <div className="space-y-1.5 pt-1">
            {/* Colour band */}
            <div className="relative h-4 rounded-full overflow-hidden flex">
                <div className="bg-rose-200" style={{ width: `${amberPct}%` }} />
                <div className="bg-amber-200" style={{ width: `${Math.max(0, greenPct - amberPct)}%` }} />
                <div className="bg-emerald-200 flex-1" />
                {/* Current value marker */}
                <div
                    className="absolute top-0 bottom-0 w-0.5 bg-slate-700"
                    style={{ left: `${currentPct}%` }}
                />
            </div>
            {/* Labels */}
            <div className="relative h-4 text-xs text-slate-400">
                <span className="absolute left-0">0</span>
                {amberPct > 5 && amberPct < 95 && (
                    <span className="absolute -translate-x-1/2 text-amber-600 font-medium" style={{ left: `${amberPct}%` }}>
                        {thresholdAmber}
                    </span>
                )}
                {greenPct > 5 && greenPct < 95 && (
                    <span className="absolute -translate-x-1/2 text-emerald-600 font-medium" style={{ left: `${greenPct}%` }}>
                        {thresholdGreen}
                    </span>
                )}
                <span className="absolute right-0">{target}</span>
            </div>
            <p className="text-xs text-slate-400">
                Current <span className="font-medium text-slate-600">{current}</span> → status will be{' '}
                <span className={`font-semibold ${computeStatus(current, thresholdAmber, thresholdGreen) === 'Green' ? 'text-emerald-600' : computeStatus(current, thresholdAmber, thresholdGreen) === 'Amber' ? 'text-amber-600' : 'text-rose-600'}`}>
                    {computeStatus(current, thresholdAmber, thresholdGreen)}
                </span>
            </p>
        </div>
    );
};

const EditKeyResultForm: React.FC<EditKeyResultFormProps> = ({ initialData, onSave, onCancel, onDelete }) => {
    const [formData, setFormData] = useState<KeyResult>(
        initialData ?? {
            pillar: 'Growth',
            objective: '',
            keyResult: '',
            owner: '',
            target: 0,
            current: 0,
            progress: 0,
            status: 'Green',
            confidence: 7,
            quarter: 'Q1',
        }
    );

    const set = (field: keyof KeyResult, value: string | number) =>
        setFormData((prev) => ({ ...prev, [field]: value }));

    const hasThresholds =
        formData.thresholdAmber !== undefined && formData.thresholdGreen !== undefined;

    const derivedStatus: OKRStatus = hasThresholds
        ? computeStatus(formData.current, formData.thresholdAmber, formData.thresholdGreen)
        : formData.status;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const target = formData.target || 1;
        const progress = Math.min(formData.current / target, 1);
        onSave({ ...formData, progress, status: derivedStatus });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="pillar">Pillar</Label>
                    <Select
                        id="pillar"
                        value={formData.pillar}
                        onChange={(e) => set('pillar', e.target.value)}
                        required
                    >
                        {PILLARS.map((p) => (
                            <option key={p} value={p}>{p}</option>
                        ))}
                    </Select>
                </div>
                <div>
                    <Label htmlFor="quarter">Quarter</Label>
                    <Input
                        id="quarter"
                        value={formData.quarter ?? 'Q1'}
                        onChange={(e) => set('quarter', e.target.value)}
                        placeholder="e.g. Q1"
                        required
                    />
                </div>
            </div>

            <div>
                <Label htmlFor="objective">Objective</Label>
                <Input
                    id="objective"
                    value={formData.objective}
                    onChange={(e) => set('objective', e.target.value)}
                    placeholder="e.g. Growing and motivating sales team"
                    required
                />
            </div>

            <div>
                <Label htmlFor="keyResult">Key Result</Label>
                <Input
                    id="keyResult"
                    value={formData.keyResult}
                    onChange={(e) => set('keyResult', e.target.value)}
                    placeholder="e.g. 2 new BA's recruited"
                    required
                />
            </div>

            <div>
                <Label htmlFor="owner">Owner</Label>
                <Input
                    id="owner"
                    value={formData.owner ?? ''}
                    onChange={(e) => set('owner', e.target.value)}
                    placeholder="e.g. Cheldeen"
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div>
                    <Label htmlFor="target">Target</Label>
                    <Input
                        id="target"
                        type="number"
                        min={0}
                        step="any"
                        value={formData.target}
                        onChange={(e) => set('target', parseFloat(e.target.value) || 0)}
                        required
                    />
                </div>
                <div>
                    <Label htmlFor="current">Current</Label>
                    <Input
                        id="current"
                        type="number"
                        min={0}
                        step="any"
                        value={formData.current}
                        onChange={(e) => set('current', parseFloat(e.target.value) || 0)}
                        required
                    />
                </div>
                <p className="col-span-2 text-xs text-slate-500 -mt-2">
                    Progress is auto-calculated as Current ÷ Target.
                </p>
            </div>

            {/* Colour Thresholds */}
            <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-700">Colour Thresholds</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Define the numeric boundaries for Red → Amber → Green status.
                        </p>
                    </div>
                    {hasThresholds && (
                        <button
                            type="button"
                            onClick={() => setFormData((prev) => ({ ...prev, thresholdAmber: undefined, thresholdGreen: undefined }))}
                            className="text-xs text-slate-400 hover:text-red-500 transition-colors"
                        >
                            Clear
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <Label htmlFor="thresholdAmber">
                            <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                                Amber from
                            </span>
                        </Label>
                        <Input
                            id="thresholdAmber"
                            type="number"
                            min={0}
                            step="any"
                            value={formData.thresholdAmber ?? ''}
                            placeholder="e.g. 25"
                            onChange={(e) => {
                                const val = e.target.value === '' ? undefined : parseFloat(e.target.value);
                                setFormData((prev) => ({ ...prev, thresholdAmber: val }));
                            }}
                        />
                    </div>
                    <div>
                        <Label htmlFor="thresholdGreen">
                            <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                                Green from
                            </span>
                        </Label>
                        <Input
                            id="thresholdGreen"
                            type="number"
                            min={0}
                            step="any"
                            value={formData.thresholdGreen ?? ''}
                            placeholder="e.g. 75"
                            onChange={(e) => {
                                const val = e.target.value === '' ? undefined : parseFloat(e.target.value);
                                setFormData((prev) => ({ ...prev, thresholdGreen: val }));
                            }}
                        />
                    </div>
                </div>

                {/* Visual band preview */}
                {hasThresholds && formData.target > 0 && (
                    <ThresholdPreview
                        target={formData.target}
                        current={formData.current}
                        thresholdAmber={formData.thresholdAmber!}
                        thresholdGreen={formData.thresholdGreen!}
                    />
                )}
            </div>

            {/* Status + Confidence */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="status">Status</Label>
                    {hasThresholds ? (
                        <div className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-md bg-slate-50 text-sm">
                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${derivedStatus === 'Green' ? 'bg-emerald-500' : derivedStatus === 'Amber' ? 'bg-amber-400' : 'bg-rose-500'}`} />
                            <span className="text-slate-700 font-medium">{derivedStatus}</span>
                            <span className="text-slate-400 text-xs ml-1">(auto from thresholds)</span>
                        </div>
                    ) : (
                        <Select
                            id="status"
                            value={formData.status}
                            onChange={(e) => set('status', e.target.value as OKRStatus)}
                            required
                        >
                            {STATUSES.map((s) => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </Select>
                    )}
                </div>
                <div>
                    <Label htmlFor="confidence">Confidence (1–10)</Label>
                    <Input
                        id="confidence"
                        type="number"
                        min={1}
                        max={10}
                        value={formData.confidence}
                        onChange={(e) => set('confidence', Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
                        required
                    />
                </div>
            </div>

            <div className="flex justify-between items-center pt-4">
                {onDelete ? (
                    <button
                        type="button"
                        onClick={onDelete}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                        Delete
                    </button>
                ) : <div />}
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 text-sm font-medium text-slate-900 bg-yellow-500 rounded-md hover:bg-yellow-600 transition-colors"
                    >
                        Save Key Result
                    </button>
                </div>
            </div>
        </form>
    );
};

export default EditKeyResultForm;
