import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { ArrowDownTrayIcon, PrinterIcon, ShieldCheckIcon, ExclamationCircleIcon } from "@heroicons/react/24/outline";
import { useReportGenerator } from "../hooks/useReportGenerator";
import { useReportPdf } from "../hooks/useReportPdf";

const API = import.meta.env.VITE_API_BASE_URL || "/api";

export default function PublicReport() {
  const { id } = useParams();
  const [report, setReport]             = useState(null);
  const [reportSettings, setReportSettings] = useState(null);
  const [isLoading, setIsLoading]       = useState(true);
  const [error, setError]               = useState("");
  const reportRef = useRef(null);

  const reportHtml = useReportGenerator(report, reportSettings, "official");
  const { downloadPdf, printPdf, isDownloading } = useReportPdf(report, reportHtml);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        setError("");

        // 1. Fetch report (public, no auth needed)
        const res = await fetch(`${API}/reports/public-data/${id}`);
        if (!res.ok) throw new Error("Report not found or has been removed.");
        const reportData = await res.json();
        setReport(reportData);

        // 2. Fetch lab display settings (public endpoint)
        const labId = reportData.lab?._id || reportData.lab;
        if (labId) {
          try {
            const sRes = await fetch(`${API}/labs/${labId}/report-settings/public`);
            if (sRes.ok) {
              const sData = await sRes.json();
              setReportSettings(sData.data || sData);
            }
          } catch (_) {
            // settings not critical — report still renders without them
          }
        }
      } catch (err) {
        setError(err.message || "Failed to load report.");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id]);

  /* ── Loading ── */
  if (isLoading) return (
    <div style={styles.center}>
      <div style={styles.spinner} />
      <p style={{ color: "#64748b", fontSize: 14, marginTop: 16 }}>Loading report…</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  /* ── Error ── */
  if (error) return (
    <div style={styles.center}>
      <div style={styles.card}>
        <ExclamationCircleIcon style={{ width: 48, height: 48, color: "#ef4444", margin: "0 auto 16px", display: "block" }} />
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", textAlign: "center" }}>Report Not Found</h2>
        <p style={{ fontSize: 14, color: "#64748b", textAlign: "center", marginTop: 8 }}>{error}</p>
      </div>
    </div>
  );

  if (!report) return null;

  const labName = report.lab?.name || "Pathology Lab";
  const patientName = `${report.patientInfo?.designation || ""} ${report.patientInfo?.name || ""}`.trim();
  const reportDate = report.createdAt
    ? new Date(report.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : "";

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9" }}>

      {/* ── Top bar ── */}
      <div className="print:hidden" style={styles.topBar}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Lab icon */}
          <div style={{ width: 38, height: 38, borderRadius: 8, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#3b82f6" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: 14, color: "#1e293b", lineHeight: 1.2 }}>{labName}</p>
            <p style={{ fontSize: 12, color: "#64748b" }}>
              {patientName && <span>{patientName} · </span>}
              {reportDate}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={downloadPdf} disabled={isDownloading} style={styles.btnOutline}>
            <ArrowDownTrayIcon style={{ width: 15, height: 15 }} />
            {isDownloading ? "Downloading…" : "Download PDF"}
          </button>
          <button onClick={printPdf} style={styles.btnPrimary}
            onMouseEnter={e => e.currentTarget.style.background = "#2563eb"}
            onMouseLeave={e => e.currentTarget.style.background = "#3b82f6"}>
            <PrinterIcon style={{ width: 15, height: 15 }} />
            Print
          </button>
        </div>
      </div>

      {/* ── Report sheet ── */}
      <div style={{ padding: "28px 16px 56px", display: "flex", flexDirection: "column", alignItems: "center" }}>

        {/* Verified ribbon */}
        <div className="print:hidden" style={styles.ribbon}>
          <ShieldCheckIcon style={{ width: 15, height: 15, color: "#16a34a" }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: "#16a34a" }}>Digitally Verified Report</span>
          <span style={{ fontSize: 11, color: "#86efac" }}>·</span>
          <span style={{ fontSize: 11, color: "#15803d" }}>Scan QR code to re-verify authenticity</span>
        </div>

        {/* A4 paper */}
        <div
          ref={reportRef}
          style={{
            width: "210mm",
            minHeight: "297mm",
            background: "#fff",
            boxShadow: "0 4px 32px rgba(0,0,0,0.12)",
            borderRadius: 4,
            overflow: "hidden",
            maxWidth: "100%",
            marginTop: 12,
          }}
          dangerouslySetInnerHTML={{ __html: reportHtml }}
        />

        {/* Bottom trust badge */}
        <div className="print:hidden" style={styles.trustBadge}>
          <ShieldCheckIcon style={{ width: 16, height: 16, color: "#16a34a" }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: "#16a34a" }}>Authentic Medical Report</span>
          <span style={{ fontSize: 11, color: "#86efac" }}>·</span>
          <span style={{ fontSize: 11, color: "#15803d" }}>Powered by LabNexus</span>
        </div>
      </div>
    </div>
  );
}

/* ── Styles ── */
const styles = {
  center: {
    minHeight: "100vh", background: "#f8fafc",
    display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
  },
  spinner: {
    width: 44, height: 44,
    border: "3px solid #e2e8f0", borderTopColor: "#3b82f6",
    borderRadius: "50%", animation: "spin 0.8s linear infinite",
  },
  card: {
    background: "#fff", borderRadius: 12, padding: 36,
    maxWidth: 400, width: "100%", boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
  },
  topBar: {
    background: "#fff", borderBottom: "1px solid #e2e8f0",
    padding: "10px 20px", display: "flex", alignItems: "center",
    justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10,
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  },
  ribbon: {
    display: "flex", alignItems: "center", gap: 6,
    padding: "6px 16px", borderRadius: 50,
    background: "#f0fdf4", border: "1px solid #86efac",
  },
  trustBadge: {
    marginTop: 20, display: "flex", alignItems: "center", gap: 8,
    padding: "9px 20px", borderRadius: 50,
    background: "#f0fdf4", border: "1px solid #86efac",
  },
  btnOutline: {
    display: "flex", alignItems: "center", gap: 6,
    padding: "7px 14px", borderRadius: 8, fontSize: 13, fontWeight: 500,
    background: "#eff6ff", color: "#3b82f6", border: "1px solid #bfdbfe",
    cursor: "pointer",
  },
  btnPrimary: {
    display: "flex", alignItems: "center", gap: 6,
    padding: "7px 14px", borderRadius: 8, fontSize: 13, fontWeight: 500,
    background: "#3b82f6", color: "#fff", border: "none", cursor: "pointer",
    transition: "background 0.15s",
  },
};
