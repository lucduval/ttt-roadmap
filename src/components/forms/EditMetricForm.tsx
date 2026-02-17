import React, { useState } from 'react';
import { StrategicMetric } from '@/types';
import { Label, Input, Select, Textarea } from '../ui/FormElements';

interface EditMetricFormProps {
    initialData?: StrategicMetric;
    onSave: (data: StrategicMetric) => void;
    onCancel: () => void;
}

const EditMetricForm: React.FC<EditMetricFormProps> = ({ initialData, onSave, onCancel }) => {
    const [formData, setFormData] = useState<StrategicMetric>(
        initialData || {
            engine: '',
            focus: '',
            metric: '',
            icon: 'TrendingUp',
            iconColor: 'text-emerald-600'
        }
    );

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="engine">Engine</Label>
                    <Select
                        id="engine"
                        value={formData.engine}
                        onChange={(e) => setFormData({ ...formData, engine: e.target.value })}
                    >
                        <option value="Sales Growth">Sales Growth</option>
                        <option value="Product">Product</option>
                        <option value="Library">Library</option>
                        <option value="Efficiency">Efficiency</option>
                    </Select>
                </div>
                <div>
                    <Label htmlFor="metric">Metric Name</Label>
                    <Input
                        id="metric"
                        value={formData.metric}
                        onChange={(e) => setFormData({ ...formData, metric: e.target.value })}
                        required
                    />
                </div>
            </div>
            <div>
                <Label htmlFor="focus">Focus Area</Label>
                <Input
                    id="focus"
                    value={formData.focus}
                    onChange={(e) => setFormData({ ...formData, focus: e.target.value })}
                    required
                />
            </div>

            <div>
                <Label htmlFor="description">Description</Label>
                <Input
                    id="description"
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
            </div>

            <div>
                <Label htmlFor="detailedMeasurement">Detailed Measurement</Label>
                <Textarea
                    id="detailedMeasurement"
                    value={formData.detailedMeasurement || ''}
                    onChange={(e) => setFormData({ ...formData, detailedMeasurement: e.target.value })}
                    rows={2}
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 bg-slate-50 p-3 sm:p-4 rounded-lg border border-slate-200">
                <div>
                    <Label htmlFor="baseGoal">Base Goal</Label>
                    <Input
                        id="baseGoal"
                        value={formData.baseGoal || ''}
                        onChange={(e) => setFormData({ ...formData, baseGoal: e.target.value })}
                        placeholder="e.g. 20%"
                    />
                </div>
                <div>
                    <Label htmlFor="targetGoal">Target Goal</Label>
                    <Input
                        id="targetGoal"
                        value={formData.targetGoal || ''}
                        onChange={(e) => setFormData({ ...formData, targetGoal: e.target.value })}
                        placeholder="e.g. 30%"
                    />
                </div>
                <div>
                    <Label htmlFor="stretchGoal">Stretch Goal</Label>
                    <Input
                        id="stretchGoal"
                        value={formData.stretchGoal || ''}
                        onChange={(e) => setFormData({ ...formData, stretchGoal: e.target.value })}
                        placeholder="e.g. 40%"
                    />
                </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mt-4">
                <Label htmlFor="currentValue">Current Tracking Value</Label>
                <Input
                    id="currentValue"
                    type="number"
                    value={formData.currentValue || ''}
                    onChange={(e) => setFormData({ ...formData, currentValue: parseFloat(e.target.value) || 0 })}
                    placeholder="e.g. 25"
                />
                <p className="text-xs text-slate-500 mt-1">Enter the raw number (e.g. 25 for 25%). This is used for graph calculations.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="icon">Icon Name (Lucide)</Label>
                    <Input
                        id="icon"
                        value={formData.icon}
                        onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                        required
                    />
                </div>
                <div>
                    <Label htmlFor="iconColor">Icon Color Class</Label>
                    <Input
                        id="iconColor"
                        value={formData.iconColor}
                        onChange={(e) => setFormData({ ...formData, iconColor: e.target.value })}
                        placeholder="text-blue-500"
                    />
                </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-slate-900 bg-yellow-500 rounded-md hover:bg-yellow-600"
                >
                    Save Metric
                </button>
            </div>
        </form>
    );
};

export default EditMetricForm;
