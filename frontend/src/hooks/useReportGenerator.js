import { useState, useEffect } from 'react';
import { isOutsideRange } from '../utils/reportUtils'; // Import the utility function

// Custom hook to generate the report HTML structure
export const useReportGenerator = (report) => {
  const [reportHtml, setReportHtml] = useState('');

  // Prepare data structure needed by the build function
  const prepareReportData = (currentReport) => {
    if (!currentReport) {
      console.log("Report data missing, cannot prepare.");
      return null;
    }

    const grouped = (currentReport.results || []).reduce((acc, param) => {
      const key = param.templateId || 'unknown';
      if (!acc[key]) {
        const defaultName = currentReport.testInfo?.name || 'Test Results';
        acc[key] = {
          templateName: param.templateName || (key !== 'unknown' ? `Test Group (ID: ${key})` : defaultName),
          parameters: []
        };
      }
      acc[key].parameters.push({
        parameter: param.parameter || param.name,
        value: param.value,
        unit: param.unit,
        referenceRange: param.referenceRange,
        isSubparameter: param.isSubparameter,
        notes: param.notes,
        flag: param.flag
      });
      return acc;
    }, {});

    const finalGroupedResults = Object.values(grouped);

    return {
      groupedResults: finalGroupedResults,
      testNotes: currentReport.testNotes || ''
    };
  };

  // Helper function to build the HTML structure
  const buildPrintHtmlStructure = (currentReport, groupedResults, testNotes) => {
    if (!currentReport) return null;

    const printContainer = document.createElement('div');
    printContainer.style.width = '210mm';
    printContainer.style.minHeight = '297mm';
    printContainer.style.padding = '60mm 15mm 30mm 15mm'; // Apply letterhead padding
    printContainer.style.boxSizing = 'border-box';
    printContainer.style.fontFamily = 'Arial, sans-serif';
    printContainer.style.backgroundColor = 'white';
    printContainer.style.position = 'relative';

    // Patient Info
    const patientInfoDiv = document.createElement('div');
    patientInfoDiv.style.display = 'flex';
    patientInfoDiv.style.justifyContent = 'space-between';
    patientInfoDiv.style.alignItems = 'flex-start';
    patientInfoDiv.style.fontSize = '11pt';
    patientInfoDiv.style.marginBottom = '15px';
    patientInfoDiv.style.padding = '10px 0';
    patientInfoDiv.style.borderTop = '2px solid black';
    patientInfoDiv.style.borderBottom = '2px solid black';
    patientInfoDiv.style.width = '100%';

    const leftPatientCol = document.createElement('div');
    leftPatientCol.innerHTML = `
      <div style="margin-bottom: 4px;"><strong>Patient Name:</strong> ${currentReport.patientInfo?.name || 'N/A'}</div>
      <div style="margin-bottom: 4px;"><strong>Age/Gender:</strong> ${currentReport.patientInfo?.age || 'N/A'} / ${currentReport.patientInfo?.gender || 'N/A'}</div>
      <div><strong>Patient ID:</strong> ${currentReport.patientInfo?.patientId || 'N/A'}</div>
    `;

    const centerPatientCol = document.createElement('div');
    centerPatientCol.style.width = '30px'; // Reduced width for QR space
    centerPatientCol.style.height = '30px'; // Reduced height for QR space
    centerPatientCol.style.flexShrink = '0';
    centerPatientCol.style.marginLeft = '10px';
    centerPatientCol.style.marginRight = '10px';
    // centerPatientCol.style.border = '1px dashed grey'; // Optional placeholder

    const rightPatientCol = document.createElement('div');
    rightPatientCol.style.textAlign = 'right';
    rightPatientCol.innerHTML = `
      <div style="margin-bottom: 4px;"><strong>Report Date:</strong> ${new Date(currentReport.createdAt).toLocaleDateString()}</div>
      <div><strong>Ref. Doctor:</strong> ${currentReport.testInfo?.referenceDoctor || 'N/A'}</div>
    `;

    patientInfoDiv.appendChild(leftPatientCol);
    patientInfoDiv.appendChild(centerPatientCol);
    patientInfoDiv.appendChild(rightPatientCol);
    printContainer.appendChild(patientInfoDiv);

    // Test Results Section
    if (groupedResults && groupedResults.length > 0) {
      groupedResults.forEach((group, groupIndex) => {
        const groupHeading = document.createElement('div');
        groupHeading.textContent = group.templateName;
        groupHeading.style.fontSize = '14pt';
        groupHeading.style.fontWeight = 'bold';
        groupHeading.style.textAlign = 'center';
        groupHeading.style.marginTop = '15px';
        groupHeading.style.marginBottom = '10px';
        printContainer.appendChild(groupHeading);

        const table = document.createElement('table');
        table.style.width = '100%'; // Use full width within padding
        table.style.borderCollapse = 'collapse'; 
        table.style.marginBottom = '15px';
        table.style.border = 'none'; // No outer table border

        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        headerRow.style.borderBottom = '1px solid black'; // Apply border to header row
        const headers = ['Parameter', 'Result', 'Unit', 'Reference Range'];
        const widths = ['40%', '20%', '10%', '30%']; // Adjusted widths
        const headerAlignments = ['left', 'right', 'left', 'left']; 

        headers.forEach((header, index) => {
          const th = document.createElement('th');
          th.textContent = header;
          th.style.border = 'none'; // No cell borders
          th.style.padding = '6px 8px';
          th.style.textAlign = headerAlignments[index]; 
          th.style.fontWeight = 'bold';
          th.style.fontSize = '11pt';
          th.style.width = widths[index];
          th.style.verticalAlign = 'middle';
          if (header === 'Result') th.style.paddingRight = '15px'; 
          if (header === 'Unit') th.style.paddingLeft = '5px'; 
          headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        if (group.parameters && group.parameters.length > 0) {
          group.parameters.forEach(param => { 
            const isAbnormal = param.flag === 'high' || param.flag === 'low' || param.flag === 'critical' || isOutsideRange(param.value, param.referenceRange);
            const row = document.createElement('tr');
            row.style.borderBottom = '1px solid black'; // Apply border to data row

            // Parameter Name Cell (Align Left)
            const nameCell = document.createElement('td');
            nameCell.textContent = param.parameter || param.name;
            nameCell.style.border = 'none'; // No cell borders
            nameCell.style.padding = '6px 8px';
            nameCell.style.fontSize = '11pt';
            nameCell.style.textAlign = 'left'; 
            nameCell.style.verticalAlign = 'top';
            row.appendChild(nameCell);

            // Result Cell (Align Right)
            const resultCell = document.createElement('td');
            resultCell.textContent = param.value !== null && param.value !== undefined ? param.value : '';
            resultCell.style.border = 'none'; // No cell borders
            resultCell.style.padding = '6px 15px 6px 8px'; 
            resultCell.style.textAlign = 'right'; // Correct alignment
            resultCell.style.fontWeight = isAbnormal ? 'bold' : 'normal';
            resultCell.style.fontSize = '11pt';
            resultCell.style.verticalAlign = 'top';
            row.appendChild(resultCell);

            // Unit Cell (Align Left)
            const unitCell = document.createElement('td');
            unitCell.textContent = param.unit || '';
            unitCell.style.border = 'none'; // No cell borders
            unitCell.style.padding = '6px 8px 6px 5px'; 
            unitCell.style.textAlign = 'left'; // Correct alignment
            unitCell.style.fontSize = '11pt';
            unitCell.style.verticalAlign = 'top';
            row.appendChild(unitCell);

            // Reference Range Cell (Align Left, with inline notes)
            const rangeCell = document.createElement('td');
            rangeCell.style.border = 'none'; // No cell borders
            rangeCell.style.padding = '6px 8px';
            rangeCell.style.textAlign = 'left'; 
            rangeCell.style.fontSize = '10pt';
            rangeCell.style.verticalAlign = 'top';

            const rangeText = document.createTextNode(param.referenceRange || '');
            rangeCell.appendChild(rangeText);

            if (param.notes) {
              const noteSpan = document.createElement('span');
              noteSpan.textContent = ` (${param.notes})`;
              noteSpan.style.fontStyle = 'italic';
              noteSpan.style.marginLeft = '5px';
              noteSpan.style.display = 'block';
              rangeCell.appendChild(noteSpan);
            }
            row.appendChild(rangeCell);

            tbody.appendChild(row);
          });
        } else {
          const emptyRow = document.createElement('tr');
          emptyRow.style.borderBottom = '1px solid black'; // Apply border to empty row
          const emptyCell = document.createElement('td');
          emptyCell.colSpan = 4;
          emptyCell.textContent = 'No parameters in this group.';
          emptyCell.style.textAlign = 'center';
          emptyCell.style.padding = '6px 8px';
          emptyCell.style.border = 'none'; // No cell borders
          emptyRow.appendChild(emptyCell);
          tbody.appendChild(emptyRow);
        }
        table.appendChild(tbody);
        printContainer.appendChild(table);

        // Add test notes after the first group's table
        if (groupIndex === 0 && testNotes) {
          const notesDiv = document.createElement('div');
          notesDiv.style.marginTop = '15px';
          notesDiv.style.fontSize = '10pt';
          notesDiv.style.fontStyle = 'italic';
          notesDiv.innerHTML = `<strong>Notes:</strong> ${testNotes}`;
          printContainer.appendChild(notesDiv);
        }
      });
    } else {
      const noResults = document.createElement('div');
      noResults.textContent = 'No test results available.';
      noResults.style.textAlign = 'center';
      noResults.style.marginTop = '20px';
      printContainer.appendChild(noResults);
    }

    return printContainer;
  };

  // Effect to update the HTML when the report data changes
  useEffect(() => {
    if (report) {
      const preparedData = prepareReportData(report);
      if (preparedData) {
        const htmlElement = buildPrintHtmlStructure(report, preparedData.groupedResults, preparedData.testNotes);
        if (htmlElement) {
          setReportHtml(htmlElement.outerHTML); // Store the HTML string
        } else {
          setReportHtml(''); // Clear if structure fails
        }
      } else {
        setReportHtml(''); // Clear if preparation fails
      }
    } else {
      setReportHtml(''); // Clear if no report
    }
  }, [report]); // Re-run only when report changes

  return reportHtml; // Return the generated HTML string
};
