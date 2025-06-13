import React from "react";

export default function TestInfoFields({ formData, handleChange }) {
  return (
    <section className="mb-8">
      <h2 className="text-xl font-semibold text-blue-700 mb-4 border-b border-blue-100 pb-2">
        Test Information
      </h2>
      <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
        <div className="sm:col-span-3">
          <label htmlFor="testName" className="block text-sm font-medium text-gray-700 mb-1">
            Test Name
          </label>
          <div className="mt-1">
            <input
              type="text"
              name="testName"
              id="testName"
              required
              value={formData.testName}
              onChange={handleChange}
              className="block w-full rounded-lg border border-blue-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
            />
          </div>
        </div>
        
        <div className="sm:col-span-3">
          <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
            Test Price
          </label>
          <div className="mt-1">
            <input
              type="number"
              name="price"
              id="price"
              required
              min="0"
              step="0.01" // Allow decimal prices
              value={formData.price}
              onChange={handleChange}
              className="block w-full rounded-lg border border-blue-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
              placeholder="Enter test price"
            />
          </div>
        </div>

        <div className="sm:col-span-3">
          <label htmlFor="reportDate" className="block text-sm font-medium text-gray-700 mb-1">
            Report Date
          </label>
          <div className="mt-1">
            <input
              type="date"
              name="reportDate"
              id="reportDate"
              required
              value={formData.reportDate}
              onChange={handleChange}
              className="block w-full rounded-lg border border-blue-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
