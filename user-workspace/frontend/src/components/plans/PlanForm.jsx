import React, { useState, useEffect } from 'react';
import { plans as plansApi } from '../../utils/api';
import LoadingSpinner from '../common/LoadingSpinner';

// Define the structure of features you want to manage
const availableFeatures = [
    { key: 'maxUsers', label: 'Max Users', type: 'number', defaultValue: 5 },
    { key: 'maxPatients', label: 'Max Patients', type: 'number', defaultValue: 1000 },
    { key: 'customReportHeader', label: 'Custom Report Header', type: 'boolean', defaultValue: false },
    { key: 'customReportFooter', label: 'Custom Report Footer', type: 'boolean', defaultValue: false },
    { key: 'apiAccess', label: 'API Access', type: 'boolean', defaultValue: false },
    // Add more features here as needed
];

function PlanForm({ planData, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: 0,
        duration: 30, // Default duration (e.g., 30 days)
        isActive: true,
        features: {},
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Initialize form data when editing an existing plan or setting defaults
    useEffect(() => {
        const initialFeatures = {};
        availableFeatures.forEach(feature => {
            initialFeatures[feature.key] = planData?.features?.[feature.key] ?? feature.defaultValue;
        });

        if (planData) {
            setFormData({
                name: planData.name || '',
                description: planData.description || '',
                price: planData.price || 0,
                duration: planData.duration || 30,
                isActive: planData.isActive !== undefined ? planData.isActive : true,
                features: initialFeatures,
            });
        } else {
            // Set defaults for a new plan
             setFormData({
                name: '',
                description: '',
                price: 0,
                duration: 30,
                isActive: true,
                features: initialFeatures, // Set default features
            });
        }
    }, [planData]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleFeatureChange = (e) => {
        const { name, value, type, checked } = e.target;
        const featureKey = name.replace('feature-', ''); // Extract feature key

        setFormData(prev => ({
            ...prev,
            features: {
                ...prev.features,
                [featureKey]: type === 'checkbox' ? checked : (type === 'number' ? Number(value) : value),
            },
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            let response;
            const payload = { ...formData };

            if (planData?._id) {
                // Update existing plan
                response = await plansApi.update(planData._id, payload);
            } else {
                // Create new plan
                response = await plansApi.create(payload);
            }

            if (response.success) {
                onSuccess(); // Call parent component's success handler
            } else {
                 setError(response.message || 'An unknown error occurred.');
            }
        } catch (err) {
            console.error("Error saving plan:", err);
            setError(err.response?.data?.message || 'Failed to save plan. Please check the details and try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded shadow-md">
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}

            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Plan Name</label>
                <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
            </div>

            <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="3"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                ></textarea>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="price" className="block text-sm font-medium text-gray-700">Price ($)</label>
                    <input
                        type="number"
                        id="price"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        required
                        min="0"
                        step="0.01"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                </div>
                <div>
                    <label htmlFor="duration" className="block text-sm font-medium text-gray-700">Duration (Days)</label>
                    <input
                        type="number"
                        id="duration"
                        name="duration"
                        value={formData.duration}
                        onChange={handleChange}
                        required
                        min="1"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                </div>
            </div>

             <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Features</label>
                <div className="space-y-2">
                    {availableFeatures.map(feature => (
                        <div key={feature.key} className="flex items-center justify-between">
                            <label htmlFor={`feature-${feature.key}`} className="text-sm text-gray-600">{feature.label}</label>
                            {feature.type === 'boolean' && (
                                <input
                                    type="checkbox"
                                    id={`feature-${feature.key}`}
                                    name={`feature-${feature.key}`}
                                    checked={!!formData.features[feature.key]} // Ensure boolean value
                                    onChange={handleFeatureChange}
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                            )}
                            {feature.type === 'number' && (
                                <input
                                    type="number"
                                    id={`feature-${feature.key}`}
                                    name={`feature-${feature.key}`}
                                    value={formData.features[feature.key] || 0}
                                    onChange={handleFeatureChange}
                                    min="0"
                                    className="mt-1 block w-1/3 px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                />
                            )}
                             {/* Add other types like 'string' if needed */}
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex items-center">
                <input
                    id="isActive"
                    name="isActive"
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={handleChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                    Plan is Active
                </label>
            </div>


            <div className="flex justify-end space-x-3">
                <button
                    type="button"
                    onClick={onClose}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded inline-flex items-center"
                    disabled={loading}
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded inline-flex items-center"
                    disabled={loading}
                >
                    {loading ? <LoadingSpinner size="small" /> : (planData?._id ? 'Update Plan' : 'Create Plan')}
                </button>
            </div>
        </form>
    );
}

export default PlanForm;
