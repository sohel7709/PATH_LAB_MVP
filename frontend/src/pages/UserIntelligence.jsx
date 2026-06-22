import React, { useEffect, useState } from "react";
import { getAuthHeaders } from "../utils/api";

const UserIntelligence = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchIntelligence = async () => {
      try {
        const response = await fetch("/api/superadmin/intelligence", { headers: getAuthHeaders() });
        if (response.ok) {
          const json = await response.json();
          if (json.success) setData(json.data);
          else setError("Failed to load intelligence data");
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
      <div className="page-enter space-y-6">
        <div>
          <div className="skeleton h-8 w-64 mb-2 rounded" />
          <div className="skeleton h-4 w-40 rounded" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-24 rounded-xl" />)}
        </div>
        <div className="skeleton h-48 rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-enter">
        <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--text)' }}>User Intelligence Dashboard</h1>
        <div className="alert alert-error">{error}</div>
      </div>
    );
  }

  const totalStorageMB = (
    (data.storageUsage?.reports?.storageMB || 0) +
    (data.storageUsage?.patients?.storageMB || 0) +
    (data.storageUsage?.labs?.storageMB || 0)
  ).toFixed(1);

  return (
    <div className="page-enter space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>User Intelligence</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-2)' }}>System-wide analytics and insights</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'var(--primary-bg)', border: '1px solid var(--primary)' }}>
          <span className="h-2 w-2 rounded-full animate-pulse" style={{ background: 'var(--primary)' }} />
          <span className="text-xs font-medium" style={{ color: 'var(--primary)' }}>Live Data</span>
        </div>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Labs',
            value: data.labCount,
            icon: (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            ),
            iconBg: '#eff6ff', iconColor: '#3b82f6',
          },
          {
            label: 'Total Patients',
            value: data.patientCount,
            icon: (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            ),
            iconBg: '#f0fdf4', iconColor: '#22c55e',
          },
          {
            label: 'Total Reports',
            value: data.reportCount,
            icon: (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            ),
            iconBg: '#faf5ff', iconColor: '#a855f7',
          },
          {
            label: 'Total Storage',
            value: `${totalStorageMB} MB`,
            icon: (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
              </svg>
            ),
            iconBg: '#fff7ed', iconColor: '#f97316',
          },
        ].map(s => (
          <div key={s.label} className="card p-5 flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: s.iconBg, color: s.iconColor }}>
              {s.icon}
            </div>
            <div>
              <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
              <p className="text-2xl font-bold mt-0.5" style={{ color: 'var(--text)' }}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Most Active Lab */}
      {data.mostActiveLab && (
        <div className="card p-5 flex items-center gap-4" style={{ border: '1px solid var(--primary-bg)', background: 'var(--primary-bg)' }}>
          <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--primary)', color: '#fff' }}>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-medium" style={{ color: 'var(--primary)' }}>Most Active Lab</p>
            <p className="font-semibold" style={{ color: 'var(--text)' }}>{data.mostActiveLab.name}</p>
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>{data.mostActiveLab.reportCount} reports generated</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Labs List */}
        <div className="card">
          <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <h2 className="font-semibold" style={{ color: 'var(--text)' }}>
              Registered Labs
              <span className="ml-2 badge badge-blue">{data.labCount}</span>
            </h2>
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: 280 }}>
            {data.labs.map((lab, idx) => (
              <div key={lab._id} className="flex items-center gap-3 px-5 py-3" style={{ borderBottom: idx < data.labs.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div className="h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0" style={{ background: 'var(--primary-bg)', color: 'var(--primary)' }}>
                  {lab.name?.charAt(0)?.toUpperCase()}
                </div>
                <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>{lab.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Storage Usage */}
        <div className="card p-5">
          <h2 className="font-semibold mb-4" style={{ color: 'var(--text)' }}>Storage Usage (Approx.)</h2>
          <div className="space-y-4">
            {[
              { label: 'Reports', count: data.storageUsage?.reports?.count, mb: data.storageUsage?.reports?.storageMB, color: '#a855f7' },
              { label: 'Patients', count: data.storageUsage?.patients?.count, mb: data.storageUsage?.patients?.storageMB?.toFixed(1), color: '#22c55e' },
              { label: 'Labs', count: data.storageUsage?.labs?.count, mb: data.storageUsage?.labs?.storageMB?.toFixed(1), color: '#3b82f6' },
            ].map(s => {
              const pct = totalStorageMB > 0 ? ((s.mb / totalStorageMB) * 100).toFixed(0) : 0;
              return (
                <div key={s.label}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span style={{ color: 'var(--text-2)' }}>{s.label} ({s.count})</span>
                    <span style={{ color: 'var(--text-muted)' }}>{s.mb} MB ({pct}%)</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                    <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: s.color }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-3 gap-3 mt-5">
            {[
              { label: 'Reports', count: data.storageUsage?.reports?.count, mb: data.storageUsage?.reports?.storageMB },
              { label: 'Patients', count: data.storageUsage?.patients?.count, mb: data.storageUsage?.patients?.storageMB?.toFixed(1) },
              { label: 'Labs', count: data.storageUsage?.labs?.count, mb: data.storageUsage?.labs?.storageMB?.toFixed(1) },
            ].map(s => (
              <div key={s.label} className="rounded-lg p-3 text-center" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                <p className="text-lg font-bold" style={{ color: 'var(--text)' }}>{s.count}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
                <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--text-2)' }}>{s.mb} MB</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserIntelligence;
