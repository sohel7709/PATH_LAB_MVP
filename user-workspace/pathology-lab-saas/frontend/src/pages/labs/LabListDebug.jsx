import React, { useState, useEffect } from 'react';
import { superAdmin } from '../../utils/api';

const LabListDebug = () => {
  const [apiResponse, setApiResponse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLabs = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get token from localStorage
        const token = localStorage.getItem('token');
        console.log('Token from localStorage:', token ? 'Token exists' : 'No token');
        
        // Make the API call
        console.log('Making API call to fetch labs...');
        const response = await superAdmin.getLabs();
        console.log('API Response:', response);
        
        setApiResponse(response);
        
        if (response.success) {
          console.log('Successfully fetched labs:', response.data);
        } else {
          console.error('Failed to fetch labs:', response.message);
          setError(response.message || 'Failed to fetch labs');
        }
      } catch (err) {
        console.error('Error fetching labs:', err);
        setError(err.message || 'An error occurred while fetching labs');
        setApiResponse({ error: err.toString() });
      } finally {
        setLoading(false);
      }
    };
    
    fetchLabs();
  }, []);

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h1 className="text-2xl font-bold mb-4">Lab List Debug</h1>
      
      <div className="mb-4">
        <h2 className="text-lg font-medium mb-2">Status</h2>
        <p>Loading: {loading ? 'Yes' : 'No'}</p>
        <p>Error: {error || 'None'}</p>
      </div>
      
      <div className="mb-4">
        <h2 className="text-lg font-medium mb-2">API Response</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
          {apiResponse ? JSON.stringify(apiResponse, null, 2) : 'No response yet'}
        </pre>
      </div>
      
      <div>
        <h2 className="text-lg font-medium mb-2">Network Request</h2>
        <p>Endpoint: <code>http://localhost:5001/api/lab-management</code></p>

        <p>Method: GET</p>
        <p>Headers: Authorization: Bearer [token]</p>
      </div>
    </div>
  );
};

export default LabListDebug;
