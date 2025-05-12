import { useState, useEffect } from 'react';

// Custom hook to generate the report HTML structure
export const useReportGenerator = (report, hideTableHeadingAndReference = false) => {
  const [reportHtml, setReportHtml] = useState('');

  // Prepare data structure needed by the build function
  const prepareReportData = (currentReport) => {
    if (!currentReport) {
      console.log("useReportGenerator: Report data missing, cannot prepare.");
      return null;
    }

    console.log("useReportGenerator: Preparing data for report:", currentReport._id);

    // Group parameters by templateId first
    const paramsByTemplate = (currentReport.results || []).reduce((acc, param) => {
      const key = param.templateId || 'unknown';
      if (!acc[key]) {
        acc[key] = {
          templateName: param.templateName || (key !== 'unknown' ? `Test Group (ID: ${key})` : (currentReport.testInfo?.name || 'Test Results')),
          templateId: key, // Store templateId for notes lookup
          parameters: []
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
        section: param.section
      });
      return acc;
    }, {});

    const finalGroupedResults = Object.values(paramsByTemplate);

    // Pass general notes separately
    return {
      groupedResults: finalGroupedResults,
      testNotes: currentReport.testNotes || '',
      templateNotes: currentReport.templateNotes || {} // Pass the templateNotes map/object
    };
  };

  // Helper function to build the HTML structure
  const buildPrintHtmlStructure = (currentReport, groupedResults, generalTestNotes, templateNotesMap, hideTableHeadingAndReference) => {
    console.log("buildPrintHtmlStructure - Received templateNotesMap:", JSON.stringify(templateNotesMap)); // DEBUG LOG for notes map

    if (!currentReport) return null;

    const printContainer = document.createElement('div');
    // Basic container styling
    printContainer.style.width = '210mm';
    printContainer.style.minHeight = '297mm';
    printContainer.style.padding = '15mm';
    printContainer.style.boxSizing = 'border-box';
    printContainer.style.fontFamily = 'Arial, sans-serif';
    printContainer.style.backgroundColor = 'white';
    printContainer.style.position = 'relative';
    printContainer.style.fontSize = '11pt'; // Base font size

    // --- Patient Info Header ---
    const patientInfoDiv = document.createElement('div');
    patientInfoDiv.style.display = 'grid';
    patientInfoDiv.style.gridTemplateColumns = '1fr auto 1fr';
    patientInfoDiv.style.columnGap = '5mm';
    patientInfoDiv.style.padding = '5px 0';
    patientInfoDiv.style.borderTop = '2px solid black';
    patientInfoDiv.style.borderBottom = '2px solid black';
    patientInfoDiv.style.marginBottom = '5mm';
    patientInfoDiv.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 2px;">
        <div><strong>Patient Name:</strong> ${currentReport.patientInfo?.name || 'N/A'}</div>
        <div><strong>Age/Gender:</strong> ${currentReport.patientInfo?.age || 'N/A'} / ${currentReport.patientInfo?.gender || 'N/A'}</div>
        <div><strong>Patient ID:</strong> ${currentReport.patientInfo?.patientId || 'N/A'}</div>
      </div>
      <div style="width: 20mm; height: 20mm; border: 1px dashed #ccc; align-self: center;"></div>
      <div style="display: flex; flex-direction: column; gap: 2px;">
        <div><strong>Report Date:</strong> ${new Date(currentReport.createdAt).toLocaleString()}</div>
        <div><strong>Ref. Doctor:</strong> ${currentReport.testInfo?.referenceDoctor || 'N/A'}</div>
      </div>
    `;
    printContainer.appendChild(patientInfoDiv);

    // --- Test Results Section ---
    if (groupedResults && groupedResults.length > 0) {
      groupedResults.forEach((group) => {
        const testGroupDiv = document.createElement('div');
        testGroupDiv.style.pageBreakInside = 'avoid';
        testGroupDiv.style.marginBottom = '10mm';

        // Template Name Header
        const groupHeading = document.createElement('h3');
        groupHeading.textContent = group.templateName;
        groupHeading.style.textAlign = 'center';
        groupHeading.style.fontWeight = 'bold';
        groupHeading.style.margin = '10px 0 8px 0';
        groupHeading.style.fontSize = '13pt';
        testGroupDiv.appendChild(groupHeading);

        let table; // Declare table here

        // Special case for Widal Test: render notes first, then parameters table
        if (group.templateName.toLowerCase() === 'widal test') {
          // Render notes section first
          const notesText = templateNotesMap[group.templateId?.toString()] || '';
          if (notesText.trim() !== '') {
            const notesDiv = document.createElement('div');
            notesDiv.style.margin = '10px 0 15px 0';
            notesDiv.style.padding = '8px';
            notesDiv.style.border = '1px solid #ccc';
            notesDiv.style.backgroundColor = '#f9f9f9';
            notesDiv.style.whiteSpace = 'pre-wrap';
            notesDiv.textContent = notesText;
            testGroupDiv.appendChild(notesDiv);
          }

          // Then render parameters table
          table = document.createElement('table');
          table.style.width = '100%';
          table.style.borderCollapse = 'collapse'; // Keep this for table-cell borders
          // table.style.border = 'none'; // REMOVE this
          table.style.tableLayout = 'fixed';
          table.style.borderTop = '1px solid black'; // Add top border to table
          table.style.borderLeft = '1px solid black'; // Add left border to table


          if (!hideTableHeadingAndReference) {
            const thead = document.createElement('thead');
            thead.innerHTML = `
              <tr>
                <th style="width: 40%; text-align: left; font-weight: bold; text-transform: uppercase; font-size: 10pt; padding: 3px 8px; border-right: 1px solid black; border-bottom: 1px solid black;">Parameter</th>
                <th style="width: 20%; text-align: right; padding-right: 15px; font-weight: bold; text-transform: uppercase; font-size: 10pt; padding: 3px 8px; border-right: 1px solid black; border-bottom: 1px solid black;">Result</th>
                <th style="width: 10%; text-align: left; padding-left: 5px; font-weight: bold; text-transform: uppercase; font-size: 10pt; padding: 3px 8px; border-right: 1px solid black; border-bottom: 1px solid black;">Unit</th>
                <th style="width: 30%; text-align: left; font-weight: bold; text-transform: uppercase; font-size: 10pt; padding: 3px 8px; border-right: 1px solid black; border-bottom: 1px solid black;">Reference Range</th>
              </tr>
            `;
            table.appendChild(thead);
          }
        } else {
          // Default rendering for other tests: parameters table first, then notes
          // Parameters Table
          table = document.createElement('table');
          table.style.width = '100%';
          table.style.borderCollapse = 'collapse'; // Keep this
          // table.style.border = 'none'; // REMOVE this
          table.style.tableLayout = 'fixed';
          table.style.borderTop = '1px solid black'; // Add top border to table
          table.style.borderLeft = '1px solid black'; // Add left border to table

          if (!hideTableHeadingAndReference) {
            const thead = document.createElement('thead');
            thead.innerHTML = `
              <tr>
                <th style="width: 40%; text-align: left; font-weight: bold; text-transform: uppercase; font-size: 10pt; padding: 3px 8px; border-right: 1px solid black; border-bottom: 1px solid black;">Parameter</th>
                <th style="width: 20%; text-align: right; padding-right: 15px; font-weight: bold; text-transform: uppercase; font-size: 10pt; padding: 3px 8px; border-right: 1px solid black; border-bottom: 1px solid black;">Result</th>
                <th style="width: 10%; text-align: left; padding-left: 5px; font-weight: bold; text-transform: uppercase; font-size: 10pt; padding: 3px 8px; border-right: 1px solid black; border-bottom: 1px solid black;">Unit</th>
                <th style="width: 30%; text-align: left; font-weight: bold; text-transform: uppercase; font-size: 10pt; padding: 3px 8px; border-right: 1px solid black; border-bottom: 1px solid black;">Reference Range</th>
              </tr>
            `;
            table.appendChild(thead);
          }
        }

        const tbody = document.createElement('tbody');
        if (group.parameters && group.parameters.length > 0) {
          // Group parameters by section within the template group
          const parametersBySection = group.parameters.reduce((acc, param) => {
            const sectionKey = param.section || 'Default';
            if (!acc[sectionKey]) acc[sectionKey] = [];
            acc[sectionKey].push(param);
            return acc;
          }, {});

          Object.entries(parametersBySection).forEach(([sectionTitle, sectionParams]) => {
            // Render section title row if not 'Default'
            if (sectionTitle && sectionTitle !== 'Default') {
              const sectionRow = tbody.insertRow();
              const cell = sectionRow.insertCell();
              cell.colSpan = 4;
              cell.textContent = sectionTitle;
              cell.style.fontWeight = 'bold';
              cell.style.fontSize = '11pt';
              cell.style.padding = '6px 8px';
              cell.style.textAlign = 'left';
              cell.style.borderTop = '1px solid #ccc';
              cell.style.borderBottom = '1px solid #ccc';
              cell.style.backgroundColor = '#f8f8f8';
            }

            // Render parameters for this section
            sectionParams.forEach(param => {
              const row = tbody.insertRow();
              if (param.isHeader) {
                const cell = row.insertCell();
                cell.colSpan = 4;
                cell.textContent = param.name;
                cell.style.fontWeight = 'bold';
                cell.style.fontSize = '11pt';
                cell.style.padding = '6px 8px';
                cell.style.textAlign = 'left';
                cell.style.backgroundColor = '#f0f0f0'; // Slightly different background for param headers
              } else {
                const isAbnormal = param.flag === 'high' || param.flag === 'low' || param.flag === 'critical';
                const nameCell = row.insertCell();
                const resultCell = row.insertCell();
                const unitCell = row.insertCell();
                const rangeCell = row.insertCell();

                nameCell.textContent = param.parameter;
                nameCell.style.padding = '3px 8px';
                nameCell.style.fontSize = '10pt';
                nameCell.style.verticalAlign = 'top';
                nameCell.style.borderRight = '1px solid black';
                nameCell.style.borderBottom = '1px solid black';
                if (param.isSubparameter) nameCell.style.paddingLeft = '20px';

                resultCell.textContent = param.value !== null && param.value !== undefined ? param.value : '';
                resultCell.style.padding = '3px 15px 3px 8px';
                resultCell.style.textAlign = 'right';
                resultCell.style.fontWeight = isAbnormal ? 'bold' : 'normal';
                resultCell.style.fontSize = '10pt';
                resultCell.style.verticalAlign = 'top';
                resultCell.style.borderRight = '1px solid black';
                resultCell.style.borderBottom = '1px solid black';

                unitCell.textContent = param.unit || '';
                unitCell.style.padding = '3px 8px';
                unitCell.style.textAlign = 'left';
                unitCell.style.fontSize = '10pt';
                unitCell.style.verticalAlign = 'top';
                unitCell.style.borderRight = '1px solid black';
                unitCell.style.borderBottom = '1px solid black';

                if (!hideTableHeadingAndReference) {
                  rangeCell.textContent = param.referenceRange || '';
                  rangeCell.style.padding = '3px 8px';
                  rangeCell.style.textAlign = 'left';
                  rangeCell.style.fontSize = '10pt';
                  rangeCell.style.verticalAlign = 'top';
                  rangeCell.style.borderRight = '1px solid black'; // This will be the table's right border
                  rangeCell.style.borderBottom = '1px solid black';
                } else {
                  rangeCell.style.display = 'none';
                }
              }
            });
          });
        } else {
          const emptyRow = tbody.insertRow();
          const cell = emptyRow.insertCell();
          cell.colSpan = 4;
          cell.textContent = 'No parameters in this group.';
          cell.style.textAlign = 'center';
          cell.style.padding = '3px 8px';
          cell.style.borderRight = '1px solid black';
          cell.style.borderBottom = '1px solid black';
        }
        table.appendChild(tbody);
        testGroupDiv.appendChild(table);

        // --- Render Template-Specific Notes ---
        const templateIdForNotes = group.templateId;
        let templateSpecificNotes = null;
        if (templateIdForNotes && typeof templateNotesMap === 'object' && templateNotesMap !== null) {
          templateSpecificNotes = templateNotesMap[templateIdForNotes.toString()];
          console.log(`Notes lookup for ${templateIdForNotes}:`, templateSpecificNotes);
        }

        if (templateSpecificNotes && templateSpecificNotes.trim() !== '') {
          const templateNotesDiv = document.createElement('div');
          templateNotesDiv.style.marginTop = '5px';
          templateNotesDiv.style.marginBottom = '10px';
          templateNotesDiv.style.fontSize = '10pt';
          templateNotesDiv.style.fontStyle = 'italic';
          templateNotesDiv.style.whiteSpace = 'pre-wrap';
          templateNotesDiv.innerHTML = `${templateSpecificNotes.replace(/\n/g, '<br>')}`;
          testGroupDiv.appendChild(templateNotesDiv);
        }

        printContainer.appendChild(testGroupDiv);
      });

      // Add GENERAL test notes AFTER all template groups
      if (generalTestNotes && generalTestNotes.trim() !== '') {
        const notesDiv = document.createElement('div');
        notesDiv.style.marginTop = '15px';
        notesDiv.style.fontSize = '10pt';
        notesDiv.style.fontStyle = 'italic';
        notesDiv.style.whiteSpace = 'pre-wrap';
        notesDiv.innerHTML = `<strong>General Notes:</strong><br>${generalTestNotes.replace(/\n/g, '<br>')}`;
        printContainer.appendChild(notesDiv);
      }
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
      // Pass the necessary parts of the report to prepareReportData
      const preparedData = prepareReportData({
        _id: report._id,
        results: report.results,
        testInfo: report.testInfo,
        testNotes: report.testNotes,
        templateNotes: report.templateNotes
      });

      if (preparedData) {
        // Pass the necessary parts to buildPrintHtmlStructure
        const htmlElement = buildPrintHtmlStructure(
          report,
          preparedData.groupedResults,
          preparedData.testNotes,
          preparedData.templateNotes,
          hideTableHeadingAndReference
        );
        if (htmlElement) {
          setReportHtml(htmlElement.outerHTML);
        } else {
          setReportHtml('');
        }
      } else {
        setReportHtml('');
      }
    } else {
      setReportHtml('');
    }
  }, [report, hideTableHeadingAndReference]);

  return reportHtml;
};
