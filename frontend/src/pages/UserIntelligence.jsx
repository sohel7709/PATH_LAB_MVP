import React, { useEffect, useState } from "react";
import { getAuthHeaders } from "../utils/api";

const UserIntelligence = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchIntelligence = async () => {
      try {
        const response = await fetch("/api/superadmin/intelligence", {
          headers: getAuthHeaders(),
        });
        if (response.ok) {
          const json = await response.json();
          if (json.success) {
            setData(json.data);
          } else {
            setError("Failed to load intelligence data");
          }
        } else {
          setError(`Request failed with status code ${response.status}`);
        }
      } catch (err) {
        setError(err.message || "Error fetching data");
      } finally {
        setLoading(false);
      }
    };
    fetchIntelligence();
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">User Intelligence Dashboard</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600">Loading intelligence data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">User Intelligence Dashboard</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-red-600">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-7xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl shadow-xl border border-blue-100 overflow-hidden">
          <div className="px-8 py-6 bg-gradient-to-r from-blue-700 to-blue-500">
            <h1 className="text-3xl font-extrabold text-white">User Intelligence Dashboard</h1>
          </div>
          <div className="p-6 space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-2 text-blue-800">Labs ({data.labCount})</h2>
              <ul className="list-disc list-inside max-h-48 overflow-y-auto border border-blue-200 rounded p-4 bg-blue-50">
                {data.labs.map((lab) => (
                  <li key={lab._id} className="text-blue-900 font-medium">{lab.name}</li>
                ))}
              </ul>
            </section>

            <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow-md p-4 border border-blue-200">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Patients</h3>
                <p className="text-3xl font-bold text-gray-900">{data.patientCount}</p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-4 border border-blue-200">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Reports</h3>
                <p className="text-3xl font-bold text-gray-900">{data.reportCount}</p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-4 border border-blue-200">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Most Active Lab</h3>
                {data.mostActiveLab ? (
                  <p className="text-gray-900 font-medium">{data.mostActiveLab.name} with {data.mostActiveLab.reportCount} reports</p>
                ) : (
                  <p className="text-gray-500 italic">No data available</p>
                )}
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-2 text-blue-800">Storage Usage (Approximate)</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow-md p-4 border border-blue-200">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Reports</h3>
                  <p className="text-gray-900 font-medium">{data.storageUsage.reports.count} reports</p>
                  <p className="text-gray-900 font-medium">{data.storageUsage.reports.storageMB} MB</p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-4 border border-blue-200">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Patients</h3>
                  <p className="text-gray-900 font-medium">{data.storageUsage.patients.count} patients</p>
                  <p className="text-gray-900 font-medium">{data.storageUsage.patients.storageMB.toFixed(1)} MB</p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-4 border border-blue-200">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Labs</h3>
                  <p className="text-gray-900 font-medium">{data.storageUsage.labs.count} labs</p>
                  <p className="text-gray-900 font-medium">{data.storageUsage.labs.storageMB.toFixed(1)} MB</p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserIntelligence;
