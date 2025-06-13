import React, { useState, useEffect } from 'react';
import PlanForm from '../../components/plans/PlanForm'; // Import PlanForm
import { plans as plansApi } from '../../utils/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

function PlanManagement() {
    const [plansList, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedPlan, setSelectedPlan] = useState(null); // For editing
    const [isFormVisible, setIsFormVisible] = useState(false);

    const fetchPlans = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await plansApi.getAll();
            if (!response || (response.data && !Array.isArray(response.data))) {
                setError('Invalid response format from server.');
                setPlans([]);
            } else {
                setPlans(response.data || response || []);
            }
        } catch (err) {
            console.error("Error fetching plans:", err);
            setError(err.response?.data?.message || 'Failed to fetch plans. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPlans();
    }, []);

    const handleEdit = (plan) => {
        setSelectedPlan(plan);
        setIsFormVisible(true);
    };

    const handleAddNew = () => {
        setSelectedPlan(null); // Clear selection for new plan
        setIsFormVisible(true);
    };

    const handleDelete = async (planId) => {
        if (window.confirm('Are you sure you want to delete this plan? This cannot be undone.')) {
            setLoading(true);
            try {
                await plansApi.delete(planId);
                // Refresh the list after delete
                fetchPlans();
                 // If the deleted plan was being edited, close the form
                if (selectedPlan && selectedPlan._id === planId) {
                    setIsFormVisible(false);
                    setSelectedPlan(null);
                }
            } catch (err) {
                console.error("Error deleting plan:", err);
                setError(err.response?.data?.message || 'Failed to delete plan.');
                setLoading(false); // Stop loading indicator on error
            }
            // No finally block needed here as fetchPlans handles setLoading(false) on success/error
        }
    };

    const handleFormClose = () => {
        setIsFormVisible(false);
        setSelectedPlan(null);
    };

    const handleFormSuccess = () => {
        handleFormClose();
        fetchPlans(); // Refresh list on successful save/update
    };


    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Subscription Plan Management</h1>

            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}

            <div className="mb-4">
                <button
                    onClick={handleAddNew}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                    Add New Plan
                </button>
            </div>

            {loading && <LoadingSpinner />}

            {/* TODO: Replace placeholders with actual components */}
            {!loading && !isFormVisible && (
                <div>
                    <h2 className="text-xl font-semibold mb-2">Existing Plans</h2>
                    {plansList.length > 0 ? (
                        <ul className="space-y-2">
                            {plansList.map(plan => (
                                <li key={plan._id} className="border p-3 rounded shadow-sm flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold">{plan.name} (${plan.price}/{plan.duration} days)</p>
                                        <p className="text-sm text-gray-600">{plan.description}</p>
                                        <p className={`text-sm font-medium ${plan.isActive ? 'text-green-600' : 'text-red-600'}`}>
                                            {plan.isActive ? 'Active' : 'Inactive'}
                                        </p>
                                        {/* Display features */}
                                        <div className="text-xs mt-1">
                                            Features: {Object.entries(plan.features || {}).map(([key, value]) => `${key}: ${value}`).join(', ')}
                                        </div>
                                    </div>
                                    <div>
                                        <button onClick={() => handleEdit(plan)} className="bg-yellow-500 hover:bg-yellow-700 text-white text-sm font-bold py-1 px-2 rounded mr-2">Edit</button>
                                        <button onClick={() => handleDelete(plan._id)} className="bg-red-500 hover:bg-red-700 text-white text-sm font-bold py-1 px-2 rounded">Delete</button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>No plans found.</p>
                    )}
                    {/* Placeholder for PlanList component */}
                    {/* <PlanList plans={plansList} onEdit={handleEdit} onDelete={handleDelete} /> */}
                </div>
            )}

            {isFormVisible && (
                 <div className="mt-6">
                    <h2 className="text-xl font-semibold mb-3">{selectedPlan ? 'Edit Plan' : 'Create New Plan'}</h2>
                     <PlanForm
                        planData={selectedPlan}
                        onClose={handleFormClose}
                        onSuccess={handleFormSuccess} // Pass the success handler
                     />
                     {/* Cancel button is now inside PlanForm */}
                 </div>
            )}

        </div>
    );
}

export default PlanManagement;
