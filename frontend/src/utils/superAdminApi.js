import { getAuthHeaders, handleResponse } from './api';

/**
 * Fetch all labs with subscription details
 */
export const getAllLabSubscriptions = async () => {
  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/super-admin/subscriptions`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
};

/**
 * Update lab subscription (plan, dates)
 * Body: { planId, startDate, endDate, status, reason }
 */
export const updateLabSubscription = async (labId, data) => {
  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/super-admin/subscriptions/${labId}/update`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

/**
 * Extend lab subscription by days
 * Body: { days, reason }
 */
export const extendLabSubscription = async (labId, days, reason) => {
  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/super-admin/subscriptions/${labId}/extend`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ days, reason }),
  });
  return handleResponse(response);
};

/**
 * Change lab plan
 * Body: { newPlanId, reason, keepEndDate }
 */
export const changeLabPlan = async (labId, newPlanId, reason, keepEndDate = false) => {
  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/super-admin/subscriptions/${labId}/change-plan`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ newPlanId, reason, keepEndDate }),
  });
  return handleResponse(response);
};

/**
 * Force expire subscription
 * Body: { reason }
 */
export const forceExpireSubscription = async (labId, reason) => {
  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/super-admin/subscriptions/${labId}/force-expire`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ reason }),
  });
  return handleResponse(response);
};

/**
 * Get subscription history for a lab
 */
export const getSubscriptionHistory = async (labId) => {
  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/super-admin/subscriptions/${labId}/history`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
};
