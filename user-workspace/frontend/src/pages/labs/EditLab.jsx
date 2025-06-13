import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeftIcon, CreditCardIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatDate as formatSharedDate } from '../../utils/helpers'; // Aliased import
import { DATE_FORMATS } from '../../utils/constants';

const EditLab = () => {
  const { id: labId } = useParams();
  const { user } = useAuth();
  const [labData, setLabData] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    address: { street: '', city: '', state: '', zipCode: '', country: '' },
    contact: { phone: '', email: '' },
  });
  const [availablePlans, setAvailablePlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [subscriptionHistory, setSubscriptionHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [assigningPlan, setAssigningPlan] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [assignmentError, setAssignmentError] = useState('');
  const [assignmentSuccess, setAssignmentSuccess] = useState('');

  const isSuperAdmin = user?.role === 'super-admin';

  // Fetch Lab Details, Available Plans, and Subscription History
  const fetchAllData = async () => {
    setLoading(true);
    setError('');
    setAssignmentError('');
    setAssignmentSuccess('');
    try {
      // Fetch Lab Details
      const labResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/lab-management/${labId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }).then(res => res.json());
      if (labResponse.success) {
        const lab = labResponse.data;
        setLabData(lab);
        setFormData({
          name: lab.name || '',
          address: lab.address || { street: '', city: '', state: '', zipCode: '', country: '' },
          contact: lab.contact || { phone: '', email: '' },
        });
        // Set default selected plan if lab has one
        if (lab.subscription?.plan) {
          setSelectedPlanId(lab.subscription.plan._id || lab.subscription.plan);
        }
      } else {
        setError(labResponse.message || 'Failed to fetch lab details');
      }

      // Fetch Available Plans (only if Super Admin)
      if (isSuperAdmin) {
        const plansResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/plans`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }).then(res => res.json());
        if (plansResponse.success) {
          setAvailablePlans(plansResponse.data || []);
        } else {
          console.error("Failed to fetch plans:", plansResponse.message);
        }
      }

      // Fetch Subscription History
      const historyResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/lab-management/${labId}/subscription-history`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }).then(res => res.json());
      if (historyResponse.success) {
        setSubscriptionHistory(historyResponse.data || []);
      } else {
        console.error("Failed to fetch subscription history:", historyResponse.message);
      }

    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.response?.data?.message || 'An error occurred while fetching data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [labId, isSuperAdmin]);

  // Handle changes in the main lab info form
  const handleChange = (e) => {
    const { name, value } = e.target;
    const keys = name.split('.');

    if (keys.length === 1) {
      setFormData(prevData => ({
        ...prevData,
        [name]: value
      }));
    } else if (keys.length === 2) {
      // Handle nested fields like address.city or contact.email
      setFormData(prevData => ({
        ...prevData,
        [keys[0]]: {
          ...prevData[keys[0]],
          [keys[1]]: value
        }
      }));
    }
  };

  // Handle changes in the plan selection dropdown
  const handlePlanSelectChange = (e) => {
    setSelectedPlanId(e.target.value);
  };

  // Handle submission of the main lab info form
  const handleInfoSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/lab-management/${labId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      }).then(res => res.json());
      if (response.success) {
        setSuccess('Lab information updated successfully!');
        setLabData(response.data);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(response.message || 'Failed to update lab information');
      }
    } catch (err) {
      console.error('Error updating lab info:', err);
      setError(err.response?.data?.message || 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle assigning the selected plan
  const handleAssignPlan = async () => {
    if (!selectedPlanId) {
      setAssignmentError('Please select a plan to assign.');
      return;
    }
    setAssigningPlan(true);
    setAssignmentError('');
    setAssignmentSuccess('');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/lab-management/${labId}/assign-plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ planId: selectedPlanId })
      }).then(res => res.json());
      if (response.success) {
        setAssignmentSuccess(response.message || 'Plan assigned successfully!');
        fetchAllData();
        setTimeout(() => setAssignmentSuccess(''), 4000);
      } else {
        setAssignmentError(response.message || 'Failed to assign plan');
      }
    } catch (err) {
      console.error('Error assigning plan:', err);
      setAssignmentError(err.response?.data?.message || 'An error occurred');
    } finally {
      setAssigningPlan(false);
    }
  };

  // Helper to format status strings
  const formatStatus = (status) => {
    if (!status) return 'Unknown';
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) return <LoadingSpinner />;
  if (error && !labData) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 py-8 px-4">
      <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl border border-blue-100 overflow-hidden">
        {/* Header */}
        <div className="px-8 py-6 bg-gradient-to-r from-blue-700 to-blue-500 flex items-center">
          <Link to="/labs" className="inline-flex items-center text-sm font-medium text-blue-100 hover:text-white mr-4">
            <ArrowLeftIcon className="h-5 w-5 mr-1" />
            Back to Lab List
          </Link>
          <h1 className="text-3xl font-extrabold text-white ml-2">Edit Lab</h1>
        </div>

        <div className="p-8 space-y-8">
          {/* General Error/Success Messages */}
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded mb-4">
              <p className="font-medium">Error:</p>
              <p>{error}</p>
            </div>
          )}
          {success && (
            <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded mb-4">
              <p className="font-medium">Success:</p>
              <p>{success}</p>
            </div>
          )}

          {/* Edit Lab Information Form */}
          <form onSubmit={handleInfoSubmit} className="space-y-8">
            {/* Basic Information */}
          <section>
            <h2 className="text-xl font-semibold text-blue-700 mb-4 border-b border-blue-100 pb-2">
              Basic Information
            </h2>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Lab Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="block w-full rounded-lg border border-blue-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                  placeholder="Enter lab name"
                />
              </div>
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Lab Status <span className="text-red-500">*</span>
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status || ''}
                  onChange={handleChange}
                  required
                  className="block w-full rounded-lg border border-blue-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                >
                  <option value="">-- Select Status --</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending_approval">Pending Approval</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>
          </section>

            {/* Address */}
            <section>
              <h2 className="text-xl font-semibold text-blue-700 mb-4 border-b border-blue-100 pb-2">
                Address
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="address.street" className="block text-sm font-medium text-gray-700 mb-1">
                    Street Address
                  </label>
                  <input
                    type="text"
                    id="address.street"
                    name="address.street"
                    value={formData.address.street}
                    onChange={handleChange}
                    className="block w-full rounded-lg border border-blue-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300 transition"
                    placeholder="123 Main St"
                  />
                </div>
                <div>
                  <label htmlFor="address.city" className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    id="address.city"
                    name="address.city"
                    value={formData.address.city}
                    onChange={handleChange}
                    className="block w-full rounded-lg border border-blue-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300 transition"
                    placeholder="City"
                  />
                </div>
                <div>
                  <label htmlFor="address.state" className="block text-sm font-medium text-gray-700 mb-1">
                    State/Province
                  </label>
                  <input
                    type="text"
                    id="address.state"
                    name="address.state"
                    value={formData.address.state}
                    onChange={handleChange}
                    className="block w-full rounded-lg border border-blue-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300 transition"
                    placeholder="State"
                  />
                </div>
                <div>
                  <label htmlFor="address.zipCode" className="block text-sm font-medium text-gray-700 mb-1">
                    ZIP/Postal Code
                  </label>
                  <input
                    type="text"
                    id="address.zipCode"
                    name="address.zipCode"
                    value={formData.address.zipCode}
                    onChange={handleChange}
                    className="block w-full rounded-lg border border-blue-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300 transition"
                    placeholder="ZIP Code"
                  />
                </div>
                <div>
                  <label htmlFor="address.country" className="block text-sm font-medium text-gray-700 mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    id="address.country"
                    name="address.country"
                    value={formData.address.country}
                    onChange={handleChange}
                    className="block w-full rounded-lg border border-blue-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300 transition"
                    placeholder="Country"
                  />
                </div>
              </div>
            </section>

            {/* Contact Information */}
            <section>
              <h2 className="text-xl font-semibold text-blue-700 mb-4 border-b border-blue-100 pb-2">
                Contact Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="contact.phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="contact.phone"
                    name="contact.phone"
                    value={formData.contact.phone}
                    onChange={handleChange}
                    className="block w-full rounded-lg border border-blue-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300 transition"
                    placeholder="Phone"
                  />
                </div>
                <div>
                  <label htmlFor="contact.email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="contact.email"
                    name="contact.email"
                    value={formData.contact.email}
                    onChange={handleChange}
                    className="block w-full rounded-lg border border-blue-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300 transition"
                    placeholder="Email"
                  />
                </div>
              </div>
            </section>

            {/* Actions */}
            <div className="flex justify-center space-x-4 pt-4 border-t border-gray-200">
              <Link
                to="/labs"
                className="px-6 py-3 rounded-lg border border-gray-300 bg-white text-gray-700 font-semibold shadow hover:bg-gray-50 transition focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 rounded-lg border border-transparent bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold shadow hover:from-blue-700 hover:to-blue-600 transition focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
              >
                {submitting ? <LoadingSpinner size="small" /> : "Save Lab Info"}
              </button>
            </div>
          </form>

          {/* Subscription Management Section (Super Admin Only) */}
          {isSuperAdmin && labData && (
            <section className="bg-white rounded-xl shadow border border-blue-100 p-6 space-y-6 mt-8">
              <h2 className="text-xl font-semibold text-blue-700 mb-4 border-b border-blue-100 pb-2">Subscription Management</h2>
              {/* Current Subscription Display */}
              <div className="bg-blue-50 p-4 rounded-md">
                <h3 className="text-lg font-medium text-blue-700 mb-3">Current Status</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-blue-600 block">Lab Status:</span>
                    <span className={`font-semibold ${labData.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                      {formatStatus(labData.status)}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-blue-600 block">Current Plan:</span>
                    <span className="font-semibold text-gray-800">
                      {labData.subscription?.plan?.name || 'None'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-blue-600 block">Expires On:</span>
                    <span className="font-semibold text-gray-800">
                      {formatSharedDate(labData.subscription?.endDate, DATE_FORMATS.DD_MM_YYYY)}
                    </span>
                  </div>
                </div>
              </div>
              {/* Assign/Change Plan */}
              <div>
                <h3 className="text-lg font-medium text-blue-700 mb-2">Assign/Change Plan</h3>
                {assignmentError && (
                  <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 rounded mb-3">
                    {assignmentError}
                  </div>
                )}
                {assignmentSuccess && (
                  <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-3 rounded mb-3">
                    {assignmentSuccess}
                  </div>
                )}
                <div className="flex items-center space-x-3">
                  <select
                    id="planSelect"
                    value={selectedPlanId}
                    onChange={handlePlanSelectChange}
                    className="block w-full max-w-xs rounded-lg border border-blue-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 sm:text-sm"
                  >
                    <option value="">-- Select a Plan --</option>
                    {availablePlans.filter(p => p.isActive).map(plan => (
                      <option key={plan._id} value={plan._id}>
                        {plan.name} (${plan.price}/{plan.duration} days)
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleAssignPlan}
                    disabled={assigningPlan || !selectedPlanId}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {assigningPlan ? <LoadingSpinner size="small" /> : <CreditCardIcon className="-ml-1 mr-2 h-5 w-5" />}
                    Assign Selected Plan
                  </button>
                </div>
                <p className="text-xs text-blue-600 mt-1">Assigning a plan will activate the lab and set the start/end dates.</p>
              </div>
            </section>
          )}

          {/* Subscription History Section */}
          <section className="bg-white rounded-xl shadow border border-blue-100 p-6 mt-8">
            <h2 className="text-xl font-semibold text-blue-700 mb-4 border-b border-blue-100 pb-2">Subscription History</h2>
            {subscriptionHistory.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-blue-100 text-sm">
                  <thead className="bg-blue-50">
                    <tr>
                      <th scope="col" className="px-4 py-2 text-left font-medium text-blue-700 uppercase tracking-wider">Plan</th>
                      <th scope="col" className="px-4 py-2 text-left font-medium text-blue-700 uppercase tracking-wider">Start Date</th>
                      <th scope="col" className="px-4 py-2 text-left font-medium text-blue-700 uppercase tracking-wider">End Date</th>
                      <th scope="col" className="px-4 py-2 text-left font-medium text-blue-700 uppercase tracking-wider">Status</th>
                      <th scope="col" className="px-4 py-2 text-left font-medium text-blue-700 uppercase tracking-wider">Amount</th>
                      <th scope="col" className="px-4 py-2 text-left font-medium text-blue-700 uppercase tracking-wider">Assigned By</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-blue-100">
                    {subscriptionHistory.map(record => (
                      <tr key={record._id} className="hover:bg-blue-50 transition-colors">
                        <td className="px-4 py-2 whitespace-nowrap">{record.plan?.name || 'N/A'}</td>
                        <td className="px-4 py-2 whitespace-nowrap">{formatSharedDate(record.startDate, DATE_FORMATS.DD_MM_YYYY)}</td>
                        <td className="px-4 py-2 whitespace-nowrap">{formatSharedDate(record.endDate, DATE_FORMATS.DD_MM_YYYY)}</td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            record.status === 'active' ? 'bg-green-100 text-green-800' : 
                            record.status === 'expired' ? 'bg-red-100 text-red-800' : 
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {formatStatus(record.status)}
                          </span>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          {record.paymentDetails?.amount ? `$${record.paymentDetails.amount.toFixed(2)}` : 'N/A'}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">{record.createdBy?.name || 'System'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-blue-50 p-4 rounded text-blue-600 text-center">
                No subscription history found for this lab.
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default EditLab;
