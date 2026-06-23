import { useState, useEffect } from "react";
import { getDisplayFlag } from "../utils/reportUtils";

// Custom hook to generate the report HTML structure
// REMOVED hideTableHeadingAndReference parameter
export const useReportGenerator = (
  report,
  reportSettings = null,
  printMode = "official",
  plainTopMargin = 40,
  plainColorMode = "bw", // "bw" | "color"
) => {
  const [reportHtml, setReportHtml] = useState("");


  // Prepare data structure needed by the build function
  const prepareReportData = (currentReport) => {
    if (!currentReport) {
            return null;
    }

        //  // Keep commented unless needed

    // Group parameters by templateId first
    const paramsByTemplate = (currentReport.results || []).reduce(
      (acc, param) => {
        const key = param.templateId || "unknown";
        if (!acc[key]) {
          acc[key] = {
            templateName:
              param.templateName ||
              currentReport.testInfo?.name ||
              "Test Results",
            templateId: key, // Store templateId for notes lookup
            parameters: [],
          };
        }
        // Add parameter details needed for rendering
        acc[key].parameters.push({
          parameter: param.parameter || param.name,
          value: param.value,
          unit: param.unit,
          referenceRange: param.referenceRange,
          isHeader: param.isHeader || false,
          isSubparameter: param.isSubparameter || false,
          notes: param.notes, // Keep param-specific notes if they exist
          flag: param.flag,
          section: param.section,
        });
        return acc;
      },
      {},
    );

    const finalGroupedResults = Object.values(paramsByTemplate);

    //  // Keep commented unless needed

    // Pass general notes separately
    return {
      groupedResults: finalGroupedResults,
      testNotes: currentReport.testNotes || "",
      templateNotes: currentReport.templateNotes || {}, // Pass the templateNotes map/object
    };
  };

  const createPatientInfoSection = (currentReport) => {
    const wrapper = document.createElement("div");

    const sampleDate = currentReport.testInfo?.sampleCollectionDate
      ? new Date(currentReport.testInfo.sampleCollectionDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
      : "N/A";
    const reportDate = currentReport.createdAt
      ? new Date(currentReport.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
      : "N/A";
    const gender = currentReport.patientInfo?.gender || "";
    const genderLabel = gender ? gender.charAt(0).toUpperCase() + gender.slice(1) : "N/A";

    wrapper.innerHTML = `
    <div style="
      background: #f0f4ff;
      border: 1.5px solid #c7d7f7;
      border-radius: 6px;
      margin: 3mm 0 4mm 0;
      overflow: hidden;
    ">
      <!-- Title bar -->
      <div style="
        background: #1e40af;
        color: white;
        font-size: 8pt;
        font-weight: 700;
        letter-spacing: 1px;
        text-transform: uppercase;
        padding: 2.5px 8px;
      ">Patient & Sample Details</div>

      <!-- Info grid -->
      <div style="display:grid; grid-template-columns: 1fr 1fr auto; gap: 0; padding: 4px 0;">

        <!-- Left column: Patient info -->
        <div style="padding: 4px 8px; border-right: 1px solid #c7d7f7;">
          <table style="width:100%; border-collapse:collapse; font-size:9pt;">
            <tr>
              <td style="color:#475569; padding:1.5px 0; width:38%; vertical-align:top;">Patient&nbsp;Name</td>
              <td style="padding:1.5px 0; vertical-align:top;">:&nbsp;</td>
              <td style="font-weight:700; color:#0f172a; padding:1.5px 0; vertical-align:top;">
                ${currentReport.patientInfo?.designation || ""} ${currentReport.patientInfo?.name || "N/A"}
              </td>
            </tr>
            <tr>
              <td style="color:#475569; padding:1.5px 0; vertical-align:top;">Age / Gender</td>
              <td style="padding:1.5px 0; vertical-align:top;">:&nbsp;</td>
              <td style="color:#0f172a; padding:1.5px 0; vertical-align:top;">
                <strong>${currentReport.patientInfo?.age || "N/A"} Yrs</strong> / ${genderLabel}
              </td>
            </tr>
            <tr>
              <td style="color:#475569; padding:1.5px 0; vertical-align:top;">Patient&nbsp;ID</td>
              <td style="padding:1.5px 0; vertical-align:top;">:&nbsp;</td>
              <td style="color:#0f172a; font-family:monospace; font-size:8.5pt; padding:1.5px 0; vertical-align:top;">
                ${currentReport.patientInfo?.patientId || "N/A"}
              </td>
            </tr>
            ${currentReport.patientInfo?.contact?.phone ? `
            <tr>
              <td style="color:#475569; padding:1.5px 0; vertical-align:top;">Contact</td>
              <td style="padding:1.5px 0; vertical-align:top;">:&nbsp;</td>
              <td style="color:#0f172a; padding:1.5px 0; vertical-align:top;">${currentReport.patientInfo.contact.phone}</td>
            </tr>` : ""}
          </table>
        </div>

        <!-- Right column: Test / sample info -->
        <div style="padding: 4px 8px; border-right: 1px solid #c7d7f7;">
          <table style="width:100%; border-collapse:collapse; font-size:9pt;">
            <tr>
              <td style="color:#475569; padding:1.5px 0; width:42%; vertical-align:top;">Sample&nbsp;Date</td>
              <td style="padding:1.5px 0; vertical-align:top;">:&nbsp;</td>
              <td style="color:#0f172a; padding:1.5px 0; vertical-align:top;">${sampleDate}</td>
            </tr>
            <tr>
              <td style="color:#475569; padding:1.5px 0; vertical-align:top;">Report&nbsp;Date</td>
              <td style="padding:1.5px 0; vertical-align:top;">:&nbsp;</td>
              <td style="color:#0f172a; font-weight:600; padding:1.5px 0; vertical-align:top;">${reportDate}</td>
            </tr>
            <tr>
              <td style="color:#475569; padding:1.5px 0; vertical-align:top;">Ref.&nbsp;Doctor</td>
              <td style="padding:1.5px 0; vertical-align:top;">:&nbsp;</td>
              <td style="color:#0f172a; padding:1.5px 0; vertical-align:top;">${currentReport.testInfo?.referenceDoctor || "—"}</td>
            </tr>
            <tr>
              <td style="color:#475569; padding:1.5px 0; vertical-align:top;">Sample&nbsp;ID</td>
              <td style="padding:1.5px 0; vertical-align:top;">:&nbsp;</td>
              <td style="color:#0f172a; font-family:monospace; font-size:8.5pt; padding:1.5px 0; vertical-align:top;">${currentReport.testInfo?.sampleId || "—"}</td>
            </tr>
          </table>
        </div>

        <!-- QR code -->
        <div style="
          padding: 4px 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2px;
        ">
          <img
            src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=https://labnexus.in/view-report/${currentReport._id}"
            style="width:18mm; height:18mm;"
            crossorigin="anonymous"
          />
          <div style="font-size:6pt; color:#64748b; text-align:center;">Scan to verify</div>
        </div>

      </div>
    </div>
    `;
    return wrapper;
  };

  // ── Plain B&W patient info ──────────────────────────────────────────────────
  const createPlainPatientInfoSection = (currentReport) => {
    const wrapper = document.createElement("div");

    const sampleDate = currentReport.testInfo?.sampleCollectionDate
      ? new Date(currentReport.testInfo.sampleCollectionDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
      : "N/A";
    const reportDate = currentReport.createdAt
      ? new Date(currentReport.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
      : "N/A";
    const gender = currentReport.patientInfo?.gender || "";
    const genderLabel = gender ? gender.charAt(0).toUpperCase() + gender.slice(1) : "N/A";

    wrapper.innerHTML = `
    <div style="border: 1.5px solid #000; margin: 3mm 0 4mm 0;">
      <!-- Header bar -->
      <div style="
        background: #000;
        color: #fff;
        font-size: 8pt;
        font-weight: 700;
        letter-spacing: 1px;
        text-transform: uppercase;
        padding: 2px 6px;
      ">Patient &amp; Sample Details</div>

      <!-- Three-column grid: patient | sample | QR -->
      <div style="display: grid; grid-template-columns: 1fr 1fr auto; border-top: none;">

        <!-- Left: Patient info -->
        <div style="padding: 4px 8px; border-right: 1px solid #000;">
          <table style="width:100%; border-collapse:collapse; font-size:9pt; color:#000;">
            <tr>
              <td style="padding: 1.5px 0; width:38%; font-weight:600;">Patient Name</td>
              <td style="padding: 1.5px 0; width:5%;">:</td>
              <td style="padding: 1.5px 0; font-weight:700; text-transform:uppercase;">
                ${currentReport.patientInfo?.designation || ""} ${currentReport.patientInfo?.name || "N/A"}
              </td>
            </tr>
            <tr>
              <td style="padding: 1.5px 0; font-weight:600;">Age / Gender</td>
              <td style="padding: 1.5px 0;">:</td>
              <td style="padding: 1.5px 0;">
                <strong>${currentReport.patientInfo?.age || "N/A"} Yrs</strong> / ${genderLabel}
              </td>
            </tr>
            <tr>
              <td style="padding: 1.5px 0; font-weight:600;">Patient ID</td>
              <td style="padding: 1.5px 0;">:</td>
              <td style="padding: 1.5px 0; font-family:monospace; font-size:8.5pt;">
                ${currentReport.patientInfo?.patientId || "N/A"}
              </td>
            </tr>
            ${currentReport.patientInfo?.contact?.phone ? `
            <tr>
              <td style="padding: 1.5px 0; font-weight:600;">Phone</td>
              <td style="padding: 1.5px 0;">:</td>
              <td style="padding: 1.5px 0;">${currentReport.patientInfo.contact.phone}</td>
            </tr>` : ""}
          </table>
        </div>

        <!-- Middle: Test / sample info -->
        <div style="padding: 4px 8px; border-right: 1px solid #000;">
          <table style="width:100%; border-collapse:collapse; font-size:9pt; color:#000;">
            <tr>
              <td style="padding: 1.5px 0; width:44%; font-weight:600;">Sample Date</td>
              <td style="padding: 1.5px 0; width:5%;">:</td>
              <td style="padding: 1.5px 0;">${sampleDate}</td>
            </tr>
            <tr>
              <td style="padding: 1.5px 0; font-weight:600;">Report Date</td>
              <td style="padding: 1.5px 0;">:</td>
              <td style="padding: 1.5px 0; font-weight:700;">${reportDate}</td>
            </tr>
            <tr>
              <td style="padding: 1.5px 0; font-weight:600;">Ref. Doctor</td>
              <td style="padding: 1.5px 0;">:</td>
              <td style="padding: 1.5px 0;">${currentReport.testInfo?.referenceDoctor || "—"}</td>
            </tr>
            <tr>
              <td style="padding: 1.5px 0; font-weight:600;">Sample ID</td>
              <td style="padding: 1.5px 0;">:</td>
              <td style="padding: 1.5px 0; font-family:monospace; font-size:8.5pt;">${currentReport.testInfo?.sampleId || "—"}</td>
            </tr>
          </table>
        </div>

        <!-- Right: QR code -->
        <div style="
          padding: 4px 6px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2px;
        ">
          <img
            src="https://api.qrserver.com/v1/create-qr-code/?size=140x140&color=000000&bgcolor=ffffff&data=https://labnexus.in/view-report/${currentReport._id}"
            style="width:19mm; height:19mm; display:block;"
            crossorigin="anonymous"
          />
          <div style="font-size:6pt; color:#000; text-align:center; font-weight:600; letter-spacing:0.3px;">SCAN TO VERIFY</div>
        </div>

      </div>
    </div>
    `;
    return wrapper;
  };

  const createHeader = (headerSettings) => {
    const wrapper = document.createElement("div");

    if (headerSettings.headerMode === "image" && headerSettings.headerImage) {
      const headerImg = document.createElement("img");
      headerImg.src = headerSettings.headerImage;
      headerImg.style.width = "100%";
      wrapper.appendChild(headerImg);
      return wrapper;
    }

    if (headerSettings.headerMode === "none") return wrapper;

    const design = headerSettings.headerDesign || "classic";
    const {
      labName = "", doctorName = "", registrationNo = "",
      technicianName = "", technicianDesignation = "",
      address = "", phone = "", email = "",
    } = headerSettings;

    const techBlock = (technicianName || technicianDesignation) ? `
      <div style="margin-top:3px; font-size:8.5pt; color:#555;">
        ${technicianName ? `<span style="font-weight:600;">${technicianName}</span>` : ""}
        ${technicianDesignation ? `<span> &bull; ${technicianDesignation}</span>` : ""}
      </div>` : "";

    let html = "";

    if (design === "classic") {
      // Left: lab info | Right: doctor + technician
      html = `
        <div style="display:flex; justify-content:space-between; align-items:flex-start; padding-bottom:4mm; border-bottom:2.5px solid #000; margin-bottom:4mm;">
          <div>
            <div style="font-size:22pt; font-weight:bold; color:#1d4ed8; line-height:1.1;">${labName}</div>
            ${address ? `<div style="font-size:8.5pt; color:#444; margin-top:2px;">${address}</div>` : ""}
            <div style="font-size:8.5pt; color:#444; margin-top:2px;">
              ${phone ? `&#128222; ${phone}` : ""}
              ${phone && email ? " &nbsp;|&nbsp; " : ""}
              ${email ? `&#9993; ${email}` : ""}
            </div>
          </div>
          <div style="text-align:right;">
            ${doctorName ? `<div style="font-size:13pt; font-weight:bold; color:#1d4ed8;">${doctorName}</div>` : ""}
            ${registrationNo ? `<div style="font-size:8.5pt; color:#555;">Reg. No: ${registrationNo}</div>` : ""}
            ${techBlock}
          </div>
        </div>`;

    } else if (design === "centered") {
      // Everything centered
      html = `
        <div style="text-align:center; padding-bottom:4mm; border-bottom:2.5px double #000; margin-bottom:4mm;">
          <div style="font-size:24pt; font-weight:bold; color:#1d4ed8; letter-spacing:0.5px;">${labName}</div>
          ${doctorName ? `<div style="font-size:12pt; font-weight:bold; margin-top:2px;">${doctorName}</div>` : ""}
          ${registrationNo ? `<div style="font-size:8.5pt; color:#555;">Reg. No: ${registrationNo}</div>` : ""}
          ${address ? `<div style="font-size:8.5pt; color:#444; margin-top:2px;">${address}</div>` : ""}
          <div style="font-size:8.5pt; color:#444; margin-top:2px;">
            ${phone ? `&#128222; ${phone}` : ""}
            ${phone && email ? " &nbsp;|&nbsp; " : ""}
            ${email ? `&#9993; ${email}` : ""}
          </div>
          ${(technicianName || technicianDesignation) ? `
          <div style="margin-top:4px; font-size:8.5pt; color:#555; border-top:1px solid #ddd; padding-top:3px;">
            Technician: ${technicianName}${technicianDesignation ? ` &bull; ${technicianDesignation}` : ""}
          </div>` : ""}
        </div>`;

    } else if (design === "modern") {
      // Colored banner top, white split below
      html = `
        <div style="margin-bottom:4mm;">
          <div style="background:#1d4ed8; color:white; padding:4mm 6mm; display:flex; justify-content:space-between; align-items:center; border-radius:2px 2px 0 0;">
            <div style="font-size:20pt; font-weight:bold; letter-spacing:0.5px;">${labName}</div>
            <div style="text-align:right; font-size:8.5pt; opacity:0.9;">
              ${phone ? `&#128222; ${phone}` : ""}
              ${phone && email ? "<br>" : ""}
              ${email ? `&#9993; ${email}` : ""}
            </div>
          </div>
          <div style="background:#eff6ff; padding:3mm 6mm; display:flex; justify-content:space-between; align-items:center; border:1px solid #bfdbfe; border-top:none; border-radius:0 0 2px 2px; margin-bottom:2mm;">
            <div style="font-size:8.5pt; color:#374151;">${address}</div>
            <div style="text-align:right;">
              ${doctorName ? `<div style="font-size:10pt; font-weight:bold; color:#1d4ed8;">${doctorName}</div>` : ""}
              ${registrationNo ? `<div style="font-size:7.5pt; color:#555;">Reg: ${registrationNo}</div>` : ""}
              ${techBlock}
            </div>
          </div>
        </div>`;

    } else if (design === "minimal") {
      // Single thin line, compact
      html = `
        <div style="display:flex; justify-content:space-between; align-items:flex-end; padding-bottom:2mm; border-bottom:1.5px solid #374151; margin-bottom:4mm;">
          <div>
            <span style="font-size:18pt; font-weight:bold;">${labName}</span>
            ${address ? `<span style="font-size:8pt; color:#6b7280; margin-left:8px;">${address}</span>` : ""}
          </div>
          <div style="text-align:right; font-size:8.5pt;">
            ${doctorName ? `<div style="font-weight:bold;">${doctorName}${registrationNo ? ` &bull; ${registrationNo}` : ""}</div>` : ""}
            <div style="color:#6b7280;">
              ${phone || ""}${phone && email ? " | " : ""}${email || ""}
            </div>
            ${(technicianName || technicianDesignation) ? `<div style="color:#6b7280;">${technicianName}${technicianDesignation ? ` &bull; ${technicianDesignation}` : ""}</div>` : ""}
          </div>
        </div>`;
    }

    wrapper.innerHTML = html;
    return wrapper;
  };

  const createFooter = (footerSettings) => {
    const wrapper = document.createElement("div");

    if (footerSettings.footerMode === "image" && footerSettings.footerImage) {
      const footerImg = document.createElement("img");
      footerImg.src = footerSettings.footerImage;
      footerImg.style.width = "100%";
      wrapper.appendChild(footerImg);
    } else if (footerSettings.footerMode !== "none") {
      const footerDiv = document.createElement("div");
      footerDiv.style.marginTop = "5mm";
      footerDiv.style.borderTop = "1px solid #000";

      footerDiv.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:flex-end; padding-top:3mm;">

        <div style="font-size:8.5pt; color:#444; font-style:italic; max-width:55%;">
          These are not diagnostic results. Strictly for medical use only.
        </div>

        <div style="text-align:center;">
          ${
            footerSettings.signature
              ? `<img src="${footerSettings.signature}" style="max-width:120px; max-height:60px; display:block; margin:0 auto;" />`
              : ""
          }
          <div style="font-weight:bold; font-size:9pt;">${footerSettings.verifiedBy || ""}</div>
          <div style="font-size:8.5pt;">${footerSettings.designation || ""}</div>
        </div>

      </div>
    `;

      wrapper.appendChild(footerDiv);
    }

    return wrapper;
  };

  // if (printMode === "official") {
  //   const createFooter = (footerSettings) => {
  //     const wrapper = document.createElement("div");

  //     if (footerSettings.footerMode === "image" && footerSettings.footerImage) {
  //       const footerImg = document.createElement("img");

  //       footerImg.src = footerSettings.footerImage;

  //       footerImg.style.width = "100%";
  //       footerImg.style.marginTop = "10mm";

  //       wrapper.appendChild(footerImg);
  //     } else if (footerSettings.footerMode !== "none") {
  //       const footerDiv = document.createElement("div");

  //       footerDiv.style.marginTop = "25mm";
  //       footerDiv.style.borderTop = "1px solid #000";
  //       footerDiv.style.paddingTop = "5mm";

  //       footerDiv.innerHTML = `
  //     <div style="
  //       display:flex;
  //       justify-content:space-between;
  //       align-items:flex-end;
  //     ">

  //       <div style="
  //         font-size:9pt;
  //         max-width:70%;
  //       ">
  //         These are not diagnostic results.
  //         Strictly for medical use only.
  //       </div>

  //       <div style="text-align:center">

  //         ${
  //           footerSettings.signature
  //             ? `
  //               <img
  //                 src="${footerSettings.signature}"
  //                 style="
  //                   max-width:120px;
  //                   max-height:60px;
  //                 "
  //               />
  //             `
  //             : ""
  //         }

  //         <div style="font-weight:bold;">
  //           ${footerSettings.verifiedBy || ""}
  //         </div>

  //         <div>
  //           ${footerSettings.designation || ""}
  //         </div>

  //       </div>

  //     </div>
  //   `;

  //       wrapper.appendChild(footerDiv);
  //     }

  //     return wrapper;
  //   };
  // }

  // Helper function to build the HTML structure
  // REMOVED hideTableHeadingAndReference parameter
  const buildPrintHtmlStructure = (
    currentReport,
    groupedResults,
    generalTestNotes,
    templateNotesMap,
  ) => {
    //  // Keep commented unless needed
// DEBUG LOG for notes map

    if (!currentReport) return null;

    const printContainer = document.createElement("div");

    printContainer.style.position = "relative";
    // printContainer.style.padding = "10mm";

    // if (
    //   reportSettings?.watermark?.enabled &&
    //   reportSettings?.watermark?.image
    // ) {
    //   const watermark = document.createElement("img");

    //   watermark.src = reportSettings.watermark.image;

    //   watermark.style.position = "absolute";

    //   watermark.style.top = "50%";

    //   watermark.style.left = "50%";

    //   watermark.style.transform = "translate(-50%, -50%)";

    //   watermark.style.width = "120mm";

    //   watermark.style.opacity = "0.08";

    //   watermark.style.pointerEvents = "none";

    //   watermark.style.zIndex = "0";

    //   printContainer.appendChild(watermark);
    // }

    const headerSettings = reportSettings?.header || {};
    const footerSettings = reportSettings?.footer || {};

    // Basic container styling (same as before)
    printContainer.style.width = "210mm";
    printContainer.style.boxSizing = "border-box";
    printContainer.style.fontFamily = "'Arial', 'Helvetica', sans-serif";
    printContainer.style.backgroundColor = "white";
    printContainer.style.position = "relative";
    printContainer.style.fontSize = "10pt";
    printContainer.style.color = "#0f172a";
    printContainer.style.lineHeight = "1.45";

    // if (
    //   reportSettings?.watermark?.enabled &&
    //   reportSettings?.watermark?.image
    // ) {
    //   const watermark = document.createElement("img");

    //   watermark.src = reportSettings.watermark.image;

    //   watermark.style.position = "absolute";
    //   watermark.style.top = "148.5mm";
    //   watermark.style.left = "105mm";
    //   watermark.style.transform = "translate(-50%, -50%)";

    //   watermark.style.width = "120mm";
    //   watermark.style.opacity = "0.08";
    //   watermark.style.zIndex = "0";
    //   watermark.style.pointerEvents = "none";

    //   printContainer.appendChild(watermark);
    // }

    //   if (headerSettings.headerMode === "image" && headerSettings.headerImage) {
    //     const headerImg = document.createElement("img");

    //     headerImg.src = headerSettings.headerImage;

    //     headerImg.style.width = "100%";
    //     headerImg.style.marginBottom = "5mm";

    //     printContainer.appendChild(headerImg);
    //   } else if (headerSettings.headerMode !== "none") {
    //     const customHeader = document.createElement("div");

    //     customHeader.style.marginBottom = "10mm";
    //     customHeader.style.borderBottom = "2px solid #000";
    //     customHeader.style.paddingBottom = "5mm";

    //     customHeader.innerHTML = `
    //   <div style="
    //     display:flex;
    //     justify-content:space-between;
    //     align-items:center;
    //   ">

    //     <div>

    //       <div style="
    //         font-size:28px;
    //         font-weight:bold;
    //         color:#2563eb;
    //       ">
    //         ${headerSettings.labName || ""}
    //       </div>

    //       <div style="
    //         font-size:16px;
    //         font-weight:bold;
    //       ">
    //         ${headerSettings.address || ""}
    //       </div>

    //       <div>
    //         ${headerSettings.phone || ""}
    //       </div>

    //       <div>
    //         ${headerSettings.email || ""}
    //       </div>

    //     </div>

    //     <div style="text-align:right">

    //       <div style="
    //         font-size:18px;
    //         font-weight:bold;
    //       ">
    //         ${headerSettings.doctorName || ""}
    //       </div>

    //       <div>
    //         ${headerSettings.registrationNo || ""}
    //       </div>

    //       <div>
    //         ${headerSettings.technicianName || ""}
    //       </div>

    //       <div>
    //         ${headerSettings.website || ""}
    //       </div>

    //     </div>

    //   </div>
    // `;

    //     printContainer.appendChild(customHeader);
    //   }

    // --- Patient Info Header --- (Simplified for clarity)
    //     const patientInfoDiv = document.createElement("div");
    //     patientInfoDiv.style.display = "grid";
    //     patientInfoDiv.style.gridTemplateColumns = "1fr auto 1fr";
    //     patientInfoDiv.style.columnGap = "5mm";
    //     patientInfoDiv.style.padding = "5px 0";
    //     patientInfoDiv.style.borderTop = "2px solid black";
    //     patientInfoDiv.style.borderBottom = "2px solid black";
    //     patientInfoDiv.style.marginBottom = "5mm";
    //     patientInfoDiv.innerHTML = `
    //       <div style="display: flex; flex-direction: column; gap: 2px;">
    //         <div><strong>Patient Name:</strong> ${currentReport.patientInfo?.designation || ""} ${currentReport.patientInfo?.name || "N/A"}</div>
    //         <div><strong>Age/Gender:</strong> ${currentReport.patientInfo?.age || "N/A"} / ${currentReport.patientInfo?.gender || "N/A"}</div>
    //         <div><strong>Patient ID:</strong> ${currentReport.patientInfo?.patientId || "N/A"}</div>
    //       </div>
    //       <div style="width:20mm;height:20mm;display:flex;align-items:center;justify-content:center;">
    //   <img
    //     src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=https://labnexus.in/view-report/${currentReport._id}"
    //     style="width:20mm;height:20mm;"
    //   />
    // </div>
    //       <div style="display: flex; flex-direction: column; gap: 2px;">
    //         <div><strong>Report Date:</strong> ${new Date(currentReport.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</div>
    //         <div><strong>Ref. Doctor:</strong> ${currentReport.testInfo?.referenceDoctor || "N/A"}</div>
    //       </div>
    //     `;
    //     printContainer.appendChild(patientInfoDiv);

    // List of template names (lowercase) that should hide the HEADER, UNIT, and REFERENCE columns
    const templatesToHideHeaderAndColumns = [
      "blood group",
      "serum for hiv i & ii test",
      "c-reactive protein (crp)", // Keep this format
      "rapid malaria test",
      // 'urine examination report', // Removed: Now a 3-column special case
      "dengue test report",
      "rheumatoid arthritis factor test", // Keep this format
      "typhi dot test", // Keep this format
      "troponin-i test", // Keep this format
      "vdrl test", // Keep this format
      "serum for hbsag test", // Keep this format
      "the 20-minute whole blood clotting test", // Corrected to lowercase
    ];
    // List of template names (lowercase) that should show header but hide REFERENCE column (3 columns total)
    const templatesForThreeColumns = [
      "urine examination report",
      // 'random blood sugar' // Removed, will now print with 4 columns
    ];

    // --- Test Results Section ---
    if (groupedResults && groupedResults.length > 0) {
      groupedResults.forEach((group, index) => {
        const pageDiv = document.createElement("div");

        pageDiv.style.width = "100%";
        pageDiv.style.minHeight = "auto";
        pageDiv.style.position = "relative";
        pageDiv.style.background = "white";
        pageDiv.style.overflow = "hidden";
        // In plain mode, add top space on every page so content clears the pre-printed letterhead
        if (printMode === "plain") {
          pageDiv.style.padding = `${plainTopMargin}mm 10mm 5mm 10mm`;
        } else {
          pageDiv.style.padding = "5mm 10mm";
        }

        if (index < groupedResults.length - 1) {
          pageDiv.style.pageBreakAfter = "always";
        }

        // Content wrapper
        const contentWrapper = document.createElement("div");
        contentWrapper.style.position = "relative";

        if (printMode === "official") {
          contentWrapper.appendChild(createHeader(headerSettings));
          contentWrapper.appendChild(createPatientInfoSection(report));
        } else if (plainColorMode === "color") {
          // Plain colour mode — same patient info as official but no header/footer
          contentWrapper.appendChild(createPatientInfoSection(report));
        } else {
          // Plain B&W mode — pure black & white, printer-optimised
          contentWrapper.appendChild(createPlainPatientInfoSection(report));
        }
        // Determine formatting flags for THIS group
        const lowerCaseTemplateName = (group.templateName || "").toLowerCase();
        const isWidalTest = lowerCaseTemplateName.includes("widal test");
        const isInHideList = templatesToHideHeaderAndColumns.includes(
          lowerCaseTemplateName,
        );
        const isThreeColumnTest = templatesForThreeColumns.includes(
          lowerCaseTemplateName,
        );

        const shouldHideHeader = isInHideList || isWidalTest;
        const shouldHideUnitAndReference = shouldHideHeader; // Currently, hiding header means hiding Unit/Ref too
        const shouldHideOnlyReference = isThreeColumnTest;

        const testGroupDiv = document.createElement("div");
        // testGroupDiv.style.pageBreakInside = "avoid";
        testGroupDiv.style.marginBottom = "10mm";

        //         if (index > 0) {
        //           const repeatedHeader = document.createElement("div");

        //           repeatedHeader.style.display = "grid";
        //           repeatedHeader.style.gridTemplateColumns = "1fr auto 1fr";
        //           repeatedHeader.style.columnGap = "5mm";
        //           repeatedHeader.style.padding = "5px 0";
        //           repeatedHeader.style.borderTop = "2px solid black";
        //           repeatedHeader.style.borderBottom = "2px solid black";
        //           repeatedHeader.style.marginBottom = "5mm";

        //           repeatedHeader.innerHTML = `
        //     <div style="display:flex;flex-direction:column;gap:2px;">
        //       <div><strong>Patient Name:</strong> ${currentReport.patientInfo?.designation || ""} ${currentReport.patientInfo?.name || "N/A"}</div>
        //       <div><strong>Age/Gender:</strong> ${currentReport.patientInfo?.age || "N/A"} / ${currentReport.patientInfo?.gender || "N/A"}</div>
        //       <div><strong>Patient ID:</strong> ${currentReport.patientInfo?.patientId || "N/A"}</div>
        //     </div>

        // <div style="width:20mm;height:20mm;display:flex;align-items:center;justify-content:center;">
        //   <img
        //     src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=https://labnexus.in/view-report/${currentReport._id}"
        //     style="width:20mm;height:20mm;"
        //   />
        // </div>
        //     <div style="display:flex;flex-direction:column;gap:2px;">
        //       <div><strong>Report Date:</strong> ${new Date(currentReport.createdAt).toLocaleDateString("en-GB")}</div>
        //       <div><strong>Ref. Doctor:</strong> ${currentReport.testInfo?.referenceDoctor || "N/A"}</div>
        //     </div>
        //   `;

        //           testGroupDiv.appendChild(repeatedHeader);
        //         }

        // Template Name Header
        const groupHeading = document.createElement("div");
        groupHeading.style.margin = "5mm 0 2mm 0";
        groupHeading.style.textAlign = "center";

        const isBW = printMode === "plain" && plainColorMode === "bw";
        groupHeading.innerHTML = isBW
          ? `<div style="
              display:inline-block;
              border: 1.5px solid #000;
              font-size: 11pt;
              font-weight: 700;
              letter-spacing: 0.5px;
              padding: 2px 18px;
              text-transform: uppercase;
              color: #000;
              background: #fff;
            ">${group.templateName}</div>`
          : `<div style="
              display: inline-block;
              background: #1e3a5f;
              color: white;
              font-size: 11pt;
              font-weight: 700;
              letter-spacing: 0.5px;
              padding: 3px 20px;
              border-radius: 3px;
              text-transform: uppercase;
            ">${group.templateName}</div>`;
        testGroupDiv.appendChild(groupHeading);

        // --- Widal Test Special Case: Render Notes BEFORE Table ---
        if (isWidalTest) {
          const templateIdForNotes = group.templateId;
          let templateSpecificNotes = null;
          if (
            templateIdForNotes &&
            typeof templateNotesMap === "object" &&
            templateNotesMap !== null
          ) {
            templateSpecificNotes =
              templateNotesMap[templateIdForNotes.toString()];
// DEBUG NOTES LOOKUP
          }
          if (templateSpecificNotes && templateSpecificNotes.trim() !== "") {
            const templateNotesDiv = document.createElement("div");
            templateNotesDiv.style.cssText = `
              margin: 4px 0 6px 0;
              padding: 5px 8px;
              background: #fefce8;
              border-left: 3px solid #f59e0b;
              border-radius: 0 4px 4px 0;
              font-size: 8.5pt;
              font-style: italic;
              color: #78350f;
              white-space: pre-wrap;
            `;
            templateNotesDiv.innerHTML = `<strong style="font-style:normal;">Note:</strong> ${templateSpecificNotes.replace(/\n/g, "<br>")}`;
            testGroupDiv.appendChild(templateNotesDiv);
          }
        }
        // --- End Widal Test Notes ---

        // Parameters Table
        const table = document.createElement("table");
        table.style.width = "100%";
        table.style.borderCollapse = "collapse";
        table.style.tableLayout = "fixed";
        table.style.marginTop = "2mm";
        // B&W: add outer border around entire table
        table.style.border = isBW ? "1.5px solid #000" : "none";

        // Table header styles
        const thStyle = isBW
          ? `background:#000; color:#fff; font-size:8.5pt; font-weight:700;
             text-transform:uppercase; letter-spacing:0.4px; padding:4px 8px;
             text-align:center; border:1px solid #000;`
          : `background:#1e3a5f; color:white; font-size:8.5pt; font-weight:700;
             text-transform:uppercase; letter-spacing:0.6px; padding:5px 8px;
             text-align:center; border:none;`;

        // Conditionally add the table header (Show unless in the hide list or Widal)
        if (!shouldHideHeader) {
          const thead = document.createElement("thead");
          if (shouldHideOnlyReference) {
            thead.innerHTML = `
              <tr>
                <th style="${thStyle} width:44%; text-align:left;">Parameter</th>
                <th style="${thStyle} width:28%;">Result</th>
                <th style="${thStyle} width:28%;">Unit</th>
              </tr>`;
          } else {
            thead.innerHTML = `
              <tr>
                <th style="${thStyle} width:40%; text-align:left;">Parameter</th>
                <th style="${thStyle} width:18%;">Result</th>
                <th style="${thStyle} width:12%;">Unit</th>
                <th style="${thStyle} width:30%;">Biological Ref. Interval</th>
              </tr>`;
          }
          table.appendChild(thead);
        }

        const tbody = document.createElement("tbody");
        let rowIndex = 0; // for alternating row color

        if (group.parameters && group.parameters.length > 0) {
          const parametersBySection = group.parameters.reduce((acc, param) => {
            const sectionKey = param.section || "Default";
            if (!acc[sectionKey]) acc[sectionKey] = [];
            acc[sectionKey].push(param);
            return acc;
          }, {});

          const colSpan = shouldHideUnitAndReference ? 2 : shouldHideOnlyReference ? 3 : 4;

          Object.entries(parametersBySection).forEach(([sectionTitle, sectionParams]) => {
            // Section divider row
            if (sectionTitle && sectionTitle !== "Default") {
              const sectionRow = tbody.insertRow();
              const cell = sectionRow.insertCell();
              cell.colSpan = colSpan;
              cell.textContent = sectionTitle;
              cell.style.cssText = isBW
                ? `background:#d0d0d0; font-weight:700; font-size:8.5pt; color:#000; padding:3px 8px; text-transform:uppercase; letter-spacing:0.4px; border-top:1px solid #000; border-bottom:1px solid #000;`
                : `background:#e8edf5; font-weight:700; font-size:9pt; color:#1e3a5f; padding:4px 8px; text-transform:uppercase; letter-spacing:0.4px; border:none;`;
            }

            sectionParams.forEach((param) => {
              const row = tbody.insertRow();
              const isEven = rowIndex % 2 === 0;
              rowIndex++;

              if (param.isHeader) {
                const cell = row.insertCell();
                cell.colSpan = colSpan;
                cell.textContent = param.parameter;
                cell.style.cssText = isBW
                  ? `background:#e8e8e8; font-weight:700; font-size:9.5pt; color:#000;
                     padding:3px 8px; text-align:left; border-bottom:1px solid #000; border-top:1px solid #000;`
                  : `background:#dbeafe; font-weight:700; font-size:9.5pt; color:#1e40af;
                     padding:3px 8px; text-align:left; border-bottom:1px solid #bfdbfe;`;
              } else {
                // Gender-aware, stale-flag-resilient: recompute direction from the
                // patient's gender-specific range, falling back to the stored flag
                // only for non-numeric results and preserving "critical".
                const displayFlag = getDisplayFlag(param.value, param.referenceRange, currentReport.patientInfo?.gender, param.flag);
                const isCritical = displayFlag === "critical";
                const isHigh = displayFlag === "high";
                const isAbnormal = displayFlag !== "normal";

                const resultValue = param.value !== null && param.value !== undefined ? String(param.value) : "";
                const lowerResultValue = resultValue.toLowerCase();
                const presentPlusRegex = /^present\s*\+{1,}$/;
                const isPositiveValue = lowerResultValue === "positive" || lowerResultValue === "reactive" || lowerResultValue === "present" || presentPlusRegex.test(lowerResultValue);
                const shouldBoldResult = isAbnormal || isPositiveValue;

                if (isBW) {
                  // ── BLACK & WHITE row ──────────────────────────────────────
                  // Alternating: white / very light grey stripe
                  row.style.background = isEven ? "#fff" : "#f4f4f4";

                  const bwCellBase = `color:#000; font-size:9pt; padding:3px 7px; vertical-align:middle; border-bottom:0.5px solid #bbb;`;

                  // Abnormal text marker: (H) high, (L) low, (*) critical — printed in bold
                  const abnormalMarker = isCritical
                    ? ` <strong>(*)</strong>`
                    : isAbnormal
                    ? ` <strong>${isHigh ? "(H)" : "(L)"}</strong>`
                    : "";

                  const nameCell = row.insertCell();
                  nameCell.style.cssText = `${bwCellBase} ${param.isSubparameter ? "padding-left:18px;" : ""}`;
                  nameCell.innerHTML = param.parameter || "";

                  const resultCell = row.insertCell();
                  resultCell.style.cssText = `${bwCellBase} text-align:center; font-weight:${shouldBoldResult ? "700" : "500"};`;
                  resultCell.innerHTML = `${resultValue}${abnormalMarker}`;

                  if (!shouldHideUnitAndReference) {
                    const unitCell = row.insertCell();
                    unitCell.style.cssText = `${bwCellBase} text-align:center;`;
                    unitCell.textContent = param.unit || "";
                  }

                  if (!shouldHideUnitAndReference && !shouldHideOnlyReference) {
                    const rangeCell = row.insertCell();
                    rangeCell.style.cssText = `${bwCellBase} text-align:center;`;
                    rangeCell.textContent = param.referenceRange || "";
                  }

                } else {
                  // ── COLOUR row ─────────────────────────────────────────────
                  row.style.background = isCritical ? "#fff1f2" : isAbnormal ? "#fffbeb" : isEven ? "#ffffff" : "#f8faff";

                  const arrowIndicator = isCritical
                    ? `<span style="color:#dc2626; font-weight:900; font-size:9pt; margin-left:3px;">&#9888;</span>`
                    : isAbnormal
                    ? `<span style="color:#d97706; font-weight:900; font-size:8pt; margin-left:3px;">${isHigh ? "&#9650;" : "&#9660;"}</span>`
                    : "";

                  const nameCell = row.insertCell();
                  nameCell.style.cssText = `padding:4px 8px; font-size:9.5pt; color:${isAbnormal ? "#0f172a" : "#334155"}; vertical-align:middle; border:none; border-bottom:1px solid #f1f5f9; ${param.isSubparameter ? "padding-left:20px;" : ""}`;
                  nameCell.innerHTML = param.parameter || "";

                  const resultCell = row.insertCell();
                  resultCell.style.cssText = `padding:4px 8px; text-align:center; font-size:9.5pt; font-weight:${shouldBoldResult ? "700" : "500"}; color:${isCritical ? "#dc2626" : isAbnormal ? "#b45309" : "#0f172a"}; vertical-align:middle; border:none; border-bottom:1px solid #f1f5f9;`;
                  resultCell.innerHTML = `${resultValue}${arrowIndicator}`;

                  if (!shouldHideUnitAndReference) {
                    const unitCell = row.insertCell();
                    unitCell.style.cssText = `padding:4px 6px; text-align:center; font-size:8.5pt; color:#64748b; vertical-align:middle; border:none; border-bottom:1px solid #f1f5f9;`;
                    unitCell.textContent = param.unit || "";
                  }

                  if (!shouldHideUnitAndReference && !shouldHideOnlyReference) {
                    const rangeCell = row.insertCell();
                    rangeCell.style.cssText = `padding:4px 8px; text-align:center; font-size:8.5pt; color:#475569; vertical-align:middle; border:none; border-bottom:1px solid #f1f5f9;`;
                    rangeCell.textContent = param.referenceRange || "";
                  }
                }
              }
            });
          });
        } else {
          const emptyRow = tbody.insertRow();
          const cell = emptyRow.insertCell();
          cell.colSpan = shouldHideUnitAndReference ? 2 : shouldHideOnlyReference ? 3 : 4;
          cell.textContent = "No parameters recorded.";
          cell.style.cssText = "text-align:center; padding:8px; color:#94a3b8; font-size:9pt; font-style:italic;";
        }
        table.appendChild(tbody);
        testGroupDiv.appendChild(table); // Append table to group div

        // --- Render Template-Specific Notes (Only if NOT Widal Test) ---
        if (!isWidalTest) {
          const templateIdForNotes = group.templateId; // Get templateId from the group object
          let templateSpecificNotes = null;
          if (
            templateIdForNotes &&
            typeof templateNotesMap === "object" &&
            templateNotesMap !== null
          ) {
            templateSpecificNotes =
              templateNotesMap[templateIdForNotes.toString()];
// DEBUG NOTES LOOKUP
          }

          if (templateSpecificNotes && templateSpecificNotes.trim() !== "") {
            const templateNotesDiv = document.createElement("div");
            templateNotesDiv.style.cssText = `
              margin: 4px 0 6px 0;
              padding: 5px 8px;
              background: #fefce8;
              border-left: 3px solid #f59e0b;
              border-radius: 0 4px 4px 0;
              font-size: 8.5pt;
              font-style: italic;
              color: #78350f;
              white-space: pre-wrap;
            `;
            templateNotesDiv.innerHTML = `<strong style="font-style:normal;">Note:</strong> ${templateSpecificNotes.replace(/\n/g, "<br>")}`;
            testGroupDiv.appendChild(templateNotesDiv);
          }
        }
        // --- End Template-Specific Notes ---

        // Watermark body: covers test results + footer only (after patient info)
        const bodyWrapper = document.createElement("div");
        bodyWrapper.style.position = "relative";
        bodyWrapper.style.overflow = "hidden";

        if (
          printMode === "official" &&
          reportSettings?.watermark?.enabled &&
          reportSettings?.watermark?.image
        ) {
          const watermark = document.createElement("img");
          watermark.src = reportSettings.watermark.image;
          watermark.style.position = "absolute";
          watermark.style.top = "0";
          watermark.style.left = "0";
          watermark.style.width = "100%";
          watermark.style.height = "100%";
          watermark.style.objectFit = "contain";
          watermark.style.objectPosition = "center center";
          watermark.style.opacity = "0.08";
          watermark.style.pointerEvents = "none";
          watermark.style.zIndex = "0";
          bodyWrapper.appendChild(watermark);
        }

        // Test results sit above watermark
        const bodyContent = document.createElement("div");
        bodyContent.style.position = "relative";
        bodyContent.style.zIndex = "1";
        bodyContent.appendChild(testGroupDiv);

        if (printMode === "official") {
          bodyContent.appendChild(createFooter(footerSettings));
        }

        bodyWrapper.appendChild(bodyContent);
        contentWrapper.appendChild(bodyWrapper);

        pageDiv.appendChild(contentWrapper);
        printContainer.appendChild(pageDiv);
      }); // End of groupedResults.forEach loop

      // Add GENERAL test notes AFTER all template groups
      if (generalTestNotes && generalTestNotes.trim() !== "") {
        const notesDiv = document.createElement("div");
        notesDiv.style.cssText = `
          margin: 6mm 10mm 4mm 10mm;
          padding: 6px 10px;
          background: #f0fdf4;
          border-left: 3px solid #16a34a;
          border-radius: 0 6px 6px 0;
          font-size: 8.5pt;
          color: #14532d;
          white-space: pre-wrap;
        `;
        notesDiv.innerHTML = `<strong>General Notes:</strong><br>${generalTestNotes.replace(/\n/g, "<br>")}`;
        printContainer.appendChild(notesDiv);
      }
      // Abnormal legend — B&W uses text markers, colour uses arrows
      const isPlainBW = printMode === "plain" && plainColorMode === "bw";
      const legend = document.createElement("div");
      legend.style.cssText = `
        margin: 3mm 10mm 0 10mm;
        font-size: 7.5pt;
        color: ${isPlainBW ? "#000" : "#64748b"};
        display: flex;
        gap: 12px;
        align-items: center;
        border-top: ${isPlainBW ? "1px solid #000" : "1px solid #e2e8f0"};
        padding-top: 3px;
      `;
      legend.innerHTML = isPlainBW
        ? `<span><strong>Legend:</strong></span>
           <span><strong>(H)</strong> = Above normal range</span>
           <span><strong>(L)</strong> = Below normal range</span>
           <span><strong>(*)</strong> = Critical / Immediate attention required</span>`
        : `<span>Legend:</span>
           <span><span style="color:#d97706; font-weight:900;">&#9650;</span> Above range</span>
           <span><span style="color:#d97706; font-weight:900;">&#9660;</span> Below range</span>
           <span><span style="color:#dc2626; font-weight:900;">&#9888;</span> Critical</span>
           <span style="font-style:italic;">Values in <strong style="color:#b45309;">amber bold</strong> require attention</span>`;
      printContainer.appendChild(legend);
    } else {
      const noResults = document.createElement("div");
      noResults.textContent = "No test results available.";
      noResults.style.textAlign = "center";
      noResults.style.marginTop = "20px";
      printContainer.appendChild(noResults);
    }

    //   if (footerSettings.footerMode === "image" && footerSettings.footerImage) {
    //     const footerImg = document.createElement("img");

    //     footerImg.src = footerSettings.footerImage;

    //     footerImg.style.width = "100%";
    //     footerImg.style.marginTop = "10mm";

    //     printContainer.appendChild(footerImg);
    //   } else if (footerSettings.footerMode !== "none") {
    //     const footerDiv = document.createElement("div");

    //     footerDiv.style.marginTop = "25mm";
    //     footerDiv.style.borderTop = "1px solid #000";
    //     footerDiv.style.paddingTop = "5mm";

    //     footerDiv.innerHTML = `
    //   <div style="
    //     display:flex;
    //     justify-content:space-between;
    //     align-items:flex-end;
    //   ">

    //     <div style="
    //       font-size:9pt;
    //       max-width:70%;
    //     ">
    //       These are not diagnostic results.
    //       Strictly for medical use only.
    //     </div>

    //     <div style="text-align:center">

    //       ${
    //         footerSettings.signature
    //           ? `
    //           <img
    //             src="${footerSettings.signature}"
    //             style="
    //               max-width:120px;
    //               max-height:60px;
    //             "
    //           />
    //         `
    //           : ""
    //       }

    //       <div style="font-weight:bold;">
    //         ${footerSettings.verifiedBy || ""}
    //       </div>

    //       <div>
    //         ${footerSettings.designation || ""}
    //       </div>

    //     </div>

    //   </div>
    // `;

    //     printContainer.appendChild(footerDiv);
    //   }

    return printContainer;
  };

  // Effect to update the HTML when the report data changes
  useEffect(() => {
    if (report) {
      // Pass the necessary parts of the report to prepareReportData
      const preparedData = prepareReportData({
        _id: report._id,
        results: report.results,
        testInfo: report.testInfo,
        testNotes: report.testNotes, // Pass general notes
        templateNotes: report.templateNotes, // Pass template notes map/object
      });

      if (preparedData) {
        // Pass the necessary parts to buildPrintHtmlStructure
        const htmlElement = buildPrintHtmlStructure(
          report, // Pass the full report object for patient/test info
          preparedData.groupedResults,
          preparedData.testNotes, // General notes
          preparedData.templateNotes, // Template notes map/object
          // REMOVED hideTableHeadingAndReference parameter from call
        );
        if (htmlElement) {
          setReportHtml(htmlElement.outerHTML);
        } else {
          setReportHtml("");
        }
      } else {
        setReportHtml("");
      }
    } else {
      setReportHtml("");
    }
  }, [report, reportSettings, printMode, plainTopMargin, plainColorMode]);

  return reportHtml; // Return the generated HTML string
};
