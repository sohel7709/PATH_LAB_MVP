import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ExclamationCircleIcon, PrinterIcon, PencilIcon } from '@heroicons/react/24/outline';
import { reports } from '../../utils/api';
import { formatDate, getStatusColor } from '../../utils/helpers';
import { REPORT_STATUS } from '../../utils/constants';

export default function ViewReport() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedStatus, setEditedStatus] = useState('');

  useEffect(() => {
    fetchReport();
  }, [id]);

  const fetchReport = async () => {
    try {
      setIsLoading(true);
      const data = await reports.getById(id);
      setReport(data);
      setEditedStatus(data.status);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    try {
      await reports.update(id, { status: editedStatus });
      setReport(prev => ({ ...prev, status: editedStatus }));
      setIsEditing(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <ExclamationCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">{error}</h3>
          </div>
        </div>
      </div>
    );
  }

  if (!report) {
    return <div>Report not found</div>;
  }

  return (
    <div className="max-w-7xl mx-auto print:mx-0">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between print:hidden">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Report Details
          </h2>
        </div>
        <div className="mt-4 flex md:ml-4 md:mt-0">
          <button
            type="button"
            onClick={handlePrint}
            className="btn-secondary ml-3"
          >
            <PrinterIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Print
          </button>
        </div>
      </div>

      <div className="mt-8 space-y-8">
        {/* Report Header */}
        <div className="bg-white shadow sm:rounded-lg print:shadow-none">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Report #{report.id}</h3>
              <div className="flex items-center space-x-4">
                {isEditing ? (
                  <div className="flex items-center space-x-2">
                    <select
                      value={editedStatus}
                      onChange={(e) => setEditedStatus(e.target.value)}
                      className="input-field"
                    >
                      {Object.values(REPORT_STATUS).map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleStatusUpdate}
                      className="btn-primary"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${getStatusColor(report.status)}`}>
                      {report.status}
                    </span>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <PencilIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Patient Information */}
        <div className="bg-white shadow sm:rounded-lg print:shadow-none">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Patient Information</h3>
            <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <dt className="text-sm font-medium text-gray-500">Full name</dt>
                <dd className="mt-1 text-sm text-gray-900">{report.patientName}</dd>
              </div>

              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Age</dt>
                <dd className="mt-1 text-sm text-gray-900">{report.patientAge}</dd>
              </div>

              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Gender</dt>
                <dd className="mt-1 text-sm text-gray-900">{report.patientGender}</dd>
              </div>

              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Phone</dt>
                <dd className="mt-1 text-sm text-gray-900">{report.patientPhone}</dd>
              </div>
            </div>
          </div>
        </div>

        {/* Test Information */}
        <div className="bg-white shadow sm:rounded-lg print:shadow-none">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Test Information</h3>
            <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Test name</dt>
                <dd className="mt-1 text-sm text-gray-900">{report.testName}</dd>
              </div>

              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Category</dt>
                <dd className="mt-1 text-sm text-gray-900">{report.category}</dd>
              </div>

              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Collection date</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDate(report.collectionDate)}</dd>
              </div>
            </div>
          </div>
        </div>

        {/* Test Parameters */}
        <div className="bg-white shadow sm:rounded-lg print:shadow-none">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Test Parameters</h3>
            <div className="mt-6">
              <table className="min-w-full divide-y divide-gray-300">
                <thead>
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Parameter</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Value</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Unit</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Reference Range</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {report.testParameters.map((param, index) => (
                    <tr key={index}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">{param.name}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{param.value}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{param.unit}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{param.referenceRange}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Notes */}
        {report.notes && (
          <div className="bg-white shadow sm:rounded-lg print:shadow-none">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Additional Notes</h3>
              <div className="mt-6">
                <p className="text-sm text-gray-900 whitespace-pre-wrap">{report.notes}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}