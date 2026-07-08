import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ExclamationCircleIcon,
  PrinterIcon,
  ArrowDownTrayIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";
import { reports as apiReports, labReportSettings, auth } from "../../utils/api";
import { useReportGenerator } from "../../hooks/useReportGenerator"; // Import the generator hook
import { useReportPdf } from "../../hooks/useReportPdf"; // Import the PDF hook

export default function PrintReport() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [printMode, setPrintMode] = useState("official");
  const [plainTopMargin, setPlainTopMargin] = useState(40);
  const [plainColorMode, setPlainColorMode] = useState("bw"); // "bw" | "color"
  const [reportSettings, setReportSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const reportRef = useRef(null); // Ref for the container div (keep if needed for other purposes)
  const marginLoadedRef = useRef(false); // guards against saving before the user's saved value has loaded
  const marginSaveTimerRef = useRef(null);

  // Load this user's remembered top margin so it doesn't reset to the default every print
  useEffect(() => {
    (async () => {
      try {
        const profile = await auth.getProfile();
        const savedMargin = (profile.data || profile)?.plainTopMargin;
        if (typeof savedMargin === "number") {
          setPlainTopMargin(savedMargin);
        }
      } catch (err) {
      } finally {
        marginLoadedRef.current = true;
      }
    })();
  }, []);

  // Persist changes back to the user's profile, debounced so dragging the slider
  // doesn't fire a request on every tick
  useEffect(() => {
    if (!marginLoadedRef.current) return;
    clearTimeout(marginSaveTimerRef.current);
    marginSaveTimerRef.current = setTimeout(() => {
      auth.updateProfile({ plainTopMargin }).catch(() => {});
    }, 600);
    return () => clearTimeout(marginSaveTimerRef.current);
  }, [plainTopMargin]);

  // Use the custom hooks
  // REMOVED hideTableHeadingAndReference variable definition
  //  // REMOVED log
  const reportHtml = useReportGenerator(report, reportSettings, printMode, plainTopMargin, plainColorMode);
  const {
    printPdf: originalPrintPdf,
    downloadPdf,
    isPrinting,
    isDownloading,
  } = useReportPdf(report, reportHtml, printMode, plainTopMargin); // Get PDF functions and states

  const printPdf = async () => {
    try {
      await apiReports.update(id, { status: "completed" });
          } catch (error) {
          }
    originalPrintPdf();
  };

  // Define fetchReportData function (only fetches report now)
  const fetchReportData = async () => {
    try {
      setIsLoading(true);
      setError(""); // Clear previous errors

      // Fetch the report data
      const reportResponse = await apiReports.getById(id);
// DEBUG LOG 1
      const reportData = reportResponse.data || reportResponse;
// DEBUG LOG 2

      // Fetch the lab settings - STILL NEEDED for useReportGenerator implicitly via report object
      // const labId = reportData.lab; // Assuming reportData contains lab ID
      // if (labId) {
      //   const settingsResponse = await apiLabSettings.getSettings(labId);
      //   const settingsData = settingsResponse.data || settingsResponse;
      //   // NOTE: We don't set labSettings state anymore, but the report object might need it
      //   // If useReportGenerator needs specific settings not in the main report object,
      //   // we might need to pass them separately or adjust the hook.
      //   // For now, assuming 'report' contains all necessary info.
      // } else {
      //         // }

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
// Updated error message
      setError(err.message || "Failed to load report");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchReportData();
  }, [id]);

  // REMOVED: isOutsideRange function (moved to utils)
  // REMOVED: prepareReportData function (moved to useReportGenerator hook)
  // REMOVED: buildPrintHtmlStructure function (moved to useReportGenerator hook)
  // REMOVED: useEffect for generating reportHtml (handled by useReportGenerator hook)
  // REMOVED: handlePrint function (moved to useReportPdf hook)
  // REMOVED: handleDownload function (moved to useReportPdf hook)

  // Render loading state
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

  // Render error state
  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <ExclamationCircleIcon
              className="h-5 w-5 text-red-400"
              aria-hidden="true"
            />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">{error}</h3>
          </div>
        </div>
      </div>
    );
  }

  // Render message if report state is still null after loading
  if (!report) {
    return <div>Loading report data...</div>;
  }

  // Main component return statement
  return (
    <div>
      {/* Header - Hidden when printing */}
      <div className="md:flex md:items-center md:justify-between print:hidden ">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Print Report
          </h2>
        </div>
        <div className="mt-4 flex md:ml-4 md:mt-0 items-center justify-end">
          <button
            type="button"
            onClick={() => navigate(`/reports/${id}/edit`)}
            className="btn-secondary mr-3 flex flex-col items-center"
          >
            <PencilSquareIcon className="h-5 w-5" aria-hidden="true" />
            Edit Report
          </button>
          <button
            type="button"
            onClick={downloadPdf} // Use function from hook
            disabled={isDownloading}
            className={`btn-secondary mr-3 flex flex-col items-center ${isDownloading ? "opacity-75 cursor-not-allowed" : ""}`}
          >
            <ArrowDownTrayIcon className="h-5 w-5" aria-hidden="true" />
            {isDownloading ? "Downloading..." : "Download PDF"}
          </button>
          <button
            type="button"
            onClick={printPdf} // Use function from hook
            disabled={isPrinting}
            className={`btn-primary flex flex-col items-center ${isPrinting ? "opacity-75 cursor-not-allowed" : ""}`}
          >
            <PrinterIcon className="h-5 w-5" aria-hidden="true" />
            {isPrinting ? "Printing..." : "Print"}
          </button>
        </div>
      </div>

      {/* Report Options - Hidden when printing */}
      <div className="mt-4 bg-white p-4 rounded-lg shadow-sm print:hidden">
        <h3 className="text-lg font-medium text-gray-900 mb-3">
          Report Options
        </h3>
        <div className="flex flex-wrap gap-6">
          {/* Removed Show Header/Footer/Signature options as layout is now fixed */}
          <div className="text-sm text-gray-500 italic">
            Print preview below uses the fixed report layout.
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Print Style</label>

          {/* Print mode selector */}
          <div className="flex gap-3">
            {[
              { value: "official", label: "Official", desc: "With header & footer", icon: "🏛️" },
              { value: "plain",    label: "Plain",    desc: "For pre-printed letterhead",     icon: "📄" },
            ].map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setPrintMode(m.value)}
                className={`flex-1 text-left rounded-xl border-2 px-4 py-3 transition-all ${
                  printMode === m.value
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-200 hover:border-blue-300 bg-white"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{m.icon}</span>
                  <div>
                    <div className={`text-sm font-semibold ${printMode === m.value ? "text-blue-700" : "text-gray-800"}`}>{m.label}</div>
                    <div className="text-xs text-gray-500">{m.desc}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Plain mode sub-options */}
          {printMode === "plain" && (
            <div className="mt-4 space-y-4 bg-gray-50 rounded-xl p-4 border border-gray-200">

              {/* Color mode */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Print Type</p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setPlainColorMode("bw")}
                    className={`flex-1 rounded-lg border-2 px-3 py-2.5 text-left transition-all ${
                      plainColorMode === "bw"
                        ? "border-gray-800 bg-gray-100"
                        : "border-gray-200 bg-white hover:border-gray-400"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded border-2 border-gray-800 bg-white flex items-center justify-center">
                        <div className="w-3 h-3 bg-gray-900 rounded-sm" />
                      </div>
                      <div>
                        <div className={`text-sm font-semibold ${plainColorMode === "bw" ? "text-gray-900" : "text-gray-700"}`}>
                          Black &amp; White
                        </div>
                        <div className="text-xs text-gray-500">Optimised for mono laser/inkjet printers</div>
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPlainColorMode("color")}
                    className={`flex-1 rounded-lg border-2 px-3 py-2.5 text-left transition-all ${
                      plainColorMode === "color"
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200 bg-white hover:border-blue-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded border-2 border-blue-500 bg-gradient-to-br from-blue-400 to-blue-600" />
                      <div>
                        <div className={`text-sm font-semibold ${plainColorMode === "color" ? "text-blue-700" : "text-gray-700"}`}>
                          Colour
                        </div>
                        <div className="text-xs text-gray-500">Full colour for inkjet / colour laser</div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Top margin */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Top Margin for Pre-printed Header
                </p>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="10"
                    max="80"
                    step="5"
                    value={plainTopMargin}
                    onChange={(e) => setPlainTopMargin(Number(e.target.value))}
                    className="w-40 accent-blue-600"
                  />
                  <span className="text-sm font-medium text-gray-700 w-12">{plainTopMargin} mm</span>
                  <div className="flex gap-1">
                    {[30, 40, 50, 60].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setPlainTopMargin(v)}
                        className={`px-2 py-0.5 text-xs rounded border transition-all ${
                          plainTopMargin === v
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"
                        }`}
                      >
                        {v}mm
                      </button>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>

      {/* Printable Report Preview Area */}
      <div
        ref={reportRef} // Keep ref on the outer container if needed elsewhere
        className="mt-8 bg-white shadow-sm print:shadow-none print:mt-0"
        // Apply A4 dimensions and centering for preview
        style={{
          width: "210mm",
          minHeight: "297mm", // Use minHeight for preview
          margin: "0 auto",
          // overflow: 'hidden' // REMOVED: This can interfere with fixed positioning inside
        }}
        // Render the generated HTML string for preview
        dangerouslySetInnerHTML={{ __html: reportHtml }}
      >
        {/* Removed inline style tag and ReportTemplate component */}
      </div>
    </div>
  ); // End of main return statement
} // End of PrintReport component
