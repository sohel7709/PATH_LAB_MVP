import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { ArrowDownTrayIcon, ExclamationCircleIcon, PrinterIcon } from "@heroicons/react/24/outline";
import { useReportGenerator } from "../hooks/useReportGenerator";
import { useReportPdf } from "../hooks/useReportPdf";
import { labReportSettings } from "../utils/api";

export default function PrintReport() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [reportSettings, setReportSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const reportRef = useRef(null);

  const reportHtml = useReportGenerator(report, reportSettings, "official");
  const { printPdf: originalPrintPdf, downloadPdf, isPrinting, isDownloading } = useReportPdf(report, reportHtml);

  const printPdf = async () => {
    try {
      await apiReports.update(id, { status: "completed" });
    } catch (error) {}
    originalPrintPdf();
  };

  const fetchReportData = async () => {
    try {
      setIsLoading(true);
      setError("");
      const response = await fetch(`http://localhost:5001/api/reports/public-data/${id}`);
      const reportData = await response.json();
      setReport(reportData);
      const labId = reportData.lab?._id || reportData.lab;
      if (labId) {
        try {
          const settingsResponse = await labReportSettings.getSettings(labId);
          const settingsData = settingsResponse.data || settingsResponse;
          setReportSettings(settingsData);
        } catch (err) {}
      }
    } catch (err) {
      setError(err.message || "Failed to load report");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchReportData(); }, [id]);

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 48, height: 48, border: '3px solid #e2e8f0', borderTopColor: '#3b82f6',
            borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px'
          }} />
          <p style={{ color: '#64748b', fontSize: 14 }}>Loading report...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ background: '#fff', borderRadius: 12, padding: 32, maxWidth: 480, width: '100%', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', textAlign: 'center' }}>
          <ExclamationCircleIcon style={{ width: 48, height: 48, color: '#ef4444', margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: 18, fontWeight: 600, color: '#1e293b', marginBottom: 8 }}>Report Not Found</h3>
          <p style={{ color: '#64748b', fontSize: 14 }}>{error}</p>
        </div>
      </div>
    );
  }

  if (!report || !reportSettings) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#64748b' }}>Loading report...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9' }}>
      {/* Top Action Bar - hidden when printing */}
      <div className="print:hidden" style={{
        background: '#fff',
        borderBottom: '1px solid #e2e8f0',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}>
        {/* Lab / Report identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8, background: '#eff6ff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#3b82f6" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <p style={{ fontWeight: 600, fontSize: 14, color: '#1e293b', lineHeight: 1.2 }}>Lab Report</p>
            <p style={{ fontSize: 12, color: '#64748b' }}>Verified Medical Report</p>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={downloadPdf}
            disabled={isDownloading}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500,
              background: isDownloading ? '#f1f5f9' : '#eff6ff',
              color: '#3b82f6', border: '1px solid #bfdbfe',
              cursor: isDownloading ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s',
            }}
          >
            <ArrowDownTrayIcon style={{ width: 16, height: 16 }} />
            {isDownloading ? 'Downloading...' : 'Download PDF'}
          </button>
          <button
            onClick={originalPrintPdf}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500,
              background: '#3b82f6', color: '#fff', border: 'none',
              cursor: 'pointer', transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#2563eb'}
            onMouseLeave={e => e.currentTarget.style.background = '#3b82f6'}
          >
            <PrinterIcon style={{ width: 16, height: 16 }} />
            Print
          </button>
        </div>
      </div>

      {/* Report Preview */}
      <div style={{ padding: '24px 16px 48px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Report container */}
        <div
          ref={reportRef}
          style={{
            width: '210mm',
            minHeight: '297mm',
            background: '#fff',
            boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
            borderRadius: 4,
            overflow: 'hidden',
            maxWidth: '100%',
          }}
          dangerouslySetInnerHTML={{ __html: reportHtml }}
        />

        {/* Verified badge footer */}
        <div className="print:hidden" style={{
          marginTop: 20,
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 20px', borderRadius: 50,
          background: '#f0fdf4', border: '1px solid #86efac',
        }}>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#16a34a" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#16a34a' }}>Verified by LabNexus</span>
          <span style={{ fontSize: 11, color: '#4ade80' }}>•</span>
          <span style={{ fontSize: 11, color: '#15803d' }}>Authentic Medical Report</span>
        </div>
      </div>
    </div>
  );
}
