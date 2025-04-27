import { getAuthHeaders, handleResponse } from './api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

// Create Razorpay order for a given plan
export const createOrder = async (planId) => {
  const response = await fetch(`${API_BASE_URL}/subscriptions/create-order`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ planId }),
  });
  return handleResponse(response);
};

// Verify Razorpay payment
export const verifyPayment = async (orderId, paymentId, signature) => {
  const response = await fetch(`${API_BASE_URL}/subscriptions/verify`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature
    }),
  });
  return handleResponse(response);
};

// Start a free trial subscription
export const startTrial = async () => {
  const response = await fetch(`${API_BASE_URL}/subscriptions/trial`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
};
