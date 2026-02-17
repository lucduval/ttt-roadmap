'use client';

import React, { useState } from 'react';
import { Feature, StrategicMetric, Department } from '@/types';
import { Label, Input, Select, Textarea } from '../ui/FormElements';
import { Plus, X, Trash2 } from 'lucide-react';

interface EditFeatureFormProps {
    initialData?: Feature;
    initialDepartmentId?: string;
    metrics?: StrategicMetric[];
    departments?: Department[];
    onSave: (data: Feature, departmentId: string) => void;
    onCancel: () => void;
    onDelete?: () => void;
}

const EditFeatureForm: React.FC<EditFeatureFormProps> = ({ initialData, initialDepartmentId, onSave, onCancel, onDelete, metrics, departments }) => {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const isExisting = !!(initialData && (initialData as any)._id);
    const [formData, setFormData] = useState<Feature>(
        initialData || {
            title: '',
            description: '',
            whatsapp: '', // Required by type
            status: 'Discovery',
            docs: [], // Required by type
            startDate: '',
            endDate: '',
            progress: 0,
            metricId: ''
        }
    );
    // Ensure we have a valid initial department ID
    const [departmentId, setDepartmentId] = useState<string>(
        initialDepartmentId ||
        (departments && departments.length > 0 ? departments[0].id : '')
    );

    // Update derived department if props change (optional, but good for safety)
    // useEffect(() => {
    //     if (!departmentId && departments?.length) setDepartmentId(departments[0].id);
    // }, [departments, departmentId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            ...formData,
            progress: Number(formData.progress) // Ensure number
        }, departmentId);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <Label>Title</Label>
                <Input name="title" value={formData.title} onChange={handleChange} required />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <Label>Status</Label>
                    <Select name="status" value={formData.status} onChange={handleChange}>
                        <option value="Discovery">Discovery</option>
                        <option value="Planning">Planning</option>
                        <option value="In Development">In Development</option>
                        <option value="High Priority">High Priority</option>
                        <option value="Live">Live</option>
                    </Select>
                </div>
                <div>
                    <Label>Progress ({formData.progress || 0}%)</Label>
                    <div className="flex items-center h-10">
                        <input
                            type="range"
                            name="progress"
                            min="0"
                            max="100"
                            value={formData.progress || 0}
                            onChange={handleChange}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-yellow-600"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <Label>Start Date</Label>
                    <Input type="date" name="startDate" value={formData.startDate || ''} onChange={handleChange} />
                </div>
                <div>
                    <Label>End Date</Label>
                    <Input type="date" name="endDate" value={formData.endDate || ''} onChange={handleChange} />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <Label>Department</Label>
                    <Select
                        value={departmentId}
                        onChange={(e) => setDepartmentId(e.target.value)}
                        required
                    >
                        {departments?.map((dept, idx) => (
                            <option key={dept.id || `dept-${idx}`} value={dept.id}>{dept.name}</option>
                        ))}
                    </Select>
                </div>
                <div>
                    <Label>Strategic Metric</Label>
                    <Select name="metricId" value={formData.metricId || ''} onChange={handleChange}>
                        <option value="">-- Select Metric --</option>
                        {metrics?.map(m => (
                            <option key={m._id} value={m._id}>{m.focus}</option>
                        ))}
                    </Select>
                </div>
            </div>

            <div>
                <Label>Description</Label>
                <Textarea name="description" value={formData.description} onChange={handleChange} required rows={3} />
            </div>

            {/* Removed WhatsApp and Related Documents sections as requested */}

            {/* Delete Confirmation */}
            {showDeleteConfirm && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-2">
                    <p className="text-sm text-red-800 font-medium mb-3">
                        Are you sure you want to delete &ldquo;{formData.title}&rdquo;? This action cannot be undone.
                    </p>
                    <div className="flex justify-end space-x-2">
                        <button
                            type="button"
                            onClick={() => setShowDeleteConfirm(false)}
                            className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={() => onDelete && onDelete()}
                            className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors shadow-sm"
                        >
                            Yes, Delete
                        </button>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-6">
                {/* Delete button (only for existing features) */}
                <div>
                    {isExisting && onDelete && !showDeleteConfirm && (
                        <button
                            type="button"
                            onClick={() => setShowDeleteConfirm(true)}
                            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                        </button>
                    )}
                </div>

                <div className="flex space-x-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 text-sm font-medium text-slate-900 bg-yellow-500 hover:bg-yellow-600 rounded-md transition-colors shadow-sm"
                    >
                        Save Feature
                    </button>
                </div>
            </div>
        </form>
    );
};

export default EditFeatureForm;
