import { useState, useEffect } from 'react';

// Custom hook to generate the report HTML structure
// REMOVED hideTableHeadingAndReference parameter
export const useReportGenerator = (report) => {
  const [reportHtml, setReportHtml] = useState('');

  // Prepare data structure needed by the build function
  const prepareReportData = (currentReport) => {
     if (!currentReport) {
      console.log("useReportGenerator: Report data missing, cannot prepare.");
      return null;
    }

    console.log("useReportGenerator: Preparing data for report:", currentReport._id);
    // console.log("useReportGenerator: Raw results array:", currentReport.results); // Keep commented unless needed

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

    // console.log("useReportGenerator: Grouped results:", finalGroupedResults); // Keep commented unless needed

    // Pass general notes separately
    return {
      groupedResults: finalGroupedResults,
      testNotes: currentReport.testNotes || '',
      templateNotes: currentReport.templateNotes || {} // Pass the templateNotes map/object
    };
  };

  // Helper function to build the HTML structure
  // REMOVED hideTableHeadingAndReference parameter
  const buildPrintHtmlStructure = (currentReport, groupedResults, generalTestNotes, templateNotesMap) => {
    // console.log("buildPrintHtmlStructure - Received currentReport:", JSON.stringify(currentReport, null, 2)); // Keep commented unless needed
    console.log("buildPrintHtmlStructure - Received templateNotesMap:", JSON.stringify(templateNotesMap)); // DEBUG LOG for notes map

    if (!currentReport) return null;

    const printContainer = document.createElement('div');
    // Basic container styling (same as before)
    printContainer.style.width = '210mm';
    printContainer.style.minHeight = '297mm';
    printContainer.style.padding = '15mm';
    printContainer.style.boxSizing = 'border-box';
    printContainer.style.fontFamily = 'Arial, sans-serif';
    printContainer.style.backgroundColor = 'white';
    printContainer.style.position = 'relative';
    printContainer.style.fontSize = '11pt'; // Base font size

    // --- Patient Info Header --- (Simplified for clarity)
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
        <div><strong>Report Date:</strong> ${new Date(currentReport.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
        <div><strong>Ref. Doctor:</strong> ${currentReport.testInfo?.referenceDoctor || 'N/A'}</div>
      </div>
    `;
    printContainer.appendChild(patientInfoDiv);

    // List of template names (lowercase) that should hide the HEADER, UNIT, and REFERENCE columns
    const templatesToHideHeaderAndColumns = [
      'blood group',
      'serum for hiv i & ii test',
      'c-reactive protein (crp)', // Keep this format
      'rapid malaria test',
      // 'urine examination report', // Removed: Now a 3-column special case
      'dengue test report',
      'rheumatoid arthritis factor test', // Keep this format
      'typhi dot test', // Keep this format
      'troponin-i test', // Keep this format
      'vdrl test', // Keep this format
      'serum for hbsag test' // Keep this format
    ];
    // List of template names (lowercase) that should show header but hide REFERENCE column (3 columns total)
    const templatesForThreeColumns = [
        'urine examination report'
        // 'random blood sugar' // Removed, will now print with 4 columns
    ];


    // --- Test Results Section ---
    if (groupedResults && groupedResults.length > 0) {
      groupedResults.forEach((group) => {
        // Determine formatting flags for THIS group
        const lowerCaseTemplateName = (group.templateName || '').toLowerCase();
        const isWidalTest = lowerCaseTemplateName.includes('widal test');
        const isInHideList = templatesToHideHeaderAndColumns.includes(lowerCaseTemplateName);
        const isThreeColumnTest = templatesForThreeColumns.includes(lowerCaseTemplateName);

        const shouldHideHeader = isInHideList || isWidalTest;
        const shouldHideUnitAndReference = shouldHideHeader; // Currently, hiding header means hiding Unit/Ref too
        const shouldHideOnlyReference = isThreeColumnTest;

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

        // --- Widal Test Special Case: Render Notes BEFORE Table ---
        if (isWidalTest) {
          const templateIdForNotes = group.templateId;
          let templateSpecificNotes = null;
          if (templateIdForNotes && typeof templateNotesMap === 'object' && templateNotesMap !== null) {
              templateSpecificNotes = templateNotesMap[templateIdForNotes.toString()];
              console.log(`Widal Notes lookup for ${templateIdForNotes}:`, templateSpecificNotes); // DEBUG NOTES LOOKUP
          }
          if (templateSpecificNotes && templateSpecificNotes.trim() !== '') {
            const templateNotesDiv = document.createElement('div');
            templateNotesDiv.style.marginTop = '5px';
            templateNotesDiv.style.marginBottom = '10px'; // Space before table
            templateNotesDiv.style.fontSize = '10pt';
            templateNotesDiv.style.fontStyle = 'italic';
            templateNotesDiv.style.whiteSpace = 'pre-wrap';
            templateNotesDiv.style.textAlign = 'left'; // Ensure notes are left-aligned
            templateNotesDiv.innerHTML = `${templateSpecificNotes.replace(/\n/g, '<br>')}`; // Replace newlines with <br> for HTML
            testGroupDiv.appendChild(templateNotesDiv); // Append notes to group div BEFORE table
          }
        }
        // --- End Widal Test Notes ---

        // Parameters Table
        const table = document.createElement('table');
        table.style.width = '100%';
        table.style.borderCollapse = 'collapse';
        table.style.border = 'none';
        table.style.tableLayout = 'fixed';

        // Conditionally add the table header (Show unless in the hide list or Widal)
        if (!shouldHideHeader) {
          const thead = document.createElement('thead');
          // Adjust header based on whether it's a 3-column or 4-column layout
          if (shouldHideOnlyReference) {
            // 3-Column Header (Param, Result, Unit) - Center Aligned
            thead.innerHTML = `
              <tr>
                <th style="width: 40%; text-align: center; font-weight: bold; text-transform: uppercase; font-size: 10pt; padding: 3px 8px; border: 1px solid black;">Parameter</th>
                <th style="width: 30%; text-align: center; font-weight: bold; text-transform: uppercase; font-size: 10pt; padding: 3px 8px; border: 1px solid black;">Result</th>
                <th style="width: 30%; text-align: center; font-weight: bold; text-transform: uppercase; font-size: 10pt; padding: 3px 8px; border: 1px solid black;">Unit</th>
              </tr>
            `;
          } else {
            // 4-Column Header (Default) - Center Aligned
            thead.innerHTML = `
              <tr>
                <th style="width: 40%; text-align: center; font-weight: bold; text-transform: uppercase; font-size: 10pt; padding: 3px 8px; border: 1px solid black;">Parameter</th>
                <th style="width: 20%; text-align: center; font-weight: bold; text-transform: uppercase; font-size: 10pt; padding: 3px 8px; border: 1px solid black;">Result</th>
                <th style="width: 10%; text-align: center; font-weight: bold; text-transform: uppercase; font-size: 10pt; padding: 3px 8px; border: 1px solid black;">Unit</th>
                <th style="width: 30%; text-align: center; font-weight: bold; text-transform: uppercase; font-size: 10pt; padding: 3px 8px; border: 1px solid black;">Reference Range</th>
              </tr>
            `;
          }
          table.appendChild(thead);
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
              // Adjust colspan based on hidden columns
              cell.colSpan = shouldHideUnitAndReference ? 2 : (shouldHideOnlyReference ? 3 : 4);
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
              if (param.isHeader) { // This is a parameter acting as a header
                const cell = row.insertCell();
                // Adjust colspan based on hidden columns
                cell.colSpan = shouldHideUnitAndReference ? 2 : (shouldHideOnlyReference ? 3 : 4);
                cell.textContent = param.parameter; // Use param.parameter for header text
                cell.style.fontWeight = 'bold';
                cell.style.fontSize = '11pt';
                cell.style.padding = '6px 8px';
                cell.style.textAlign = 'left';
                cell.style.backgroundColor = '#f0f0f0'; // Slightly different background for param headers
              } else {
                const isAbnormal = param.flag === 'high' || param.flag === 'low' || param.flag === 'critical';
                const nameCell = row.insertCell();
                const resultCell = row.insertCell();
                // Conditionally insert Unit cell only if Unit column should be shown
                let unitCell = null;
                if (!shouldHideUnitAndReference) {
                    unitCell = row.insertCell();
                }

                nameCell.textContent = param.parameter; // Corrected from param.name
                nameCell.style.padding = '3px 8px';
                // Set widths based on column layout
                if (shouldHideUnitAndReference) { // 2 columns
                    nameCell.style.width = '50%';
                } else if (shouldHideOnlyReference) { // 3 columns
                    nameCell.style.width = '40%';
                } // Else: 4 columns, use default/thead widths
                nameCell.style.fontSize = '10pt';
                nameCell.style.verticalAlign = 'top';
                if (param.isSubparameter) nameCell.style.paddingLeft = '20px';
                nameCell.style.border = '1px solid black'; // Add border

                const resultValue = param.value !== null && param.value !== undefined ? String(param.value) : ''; // Ensure value is a string
                resultCell.textContent = resultValue;
                resultCell.style.padding = '3px 8px';
                 // Align left if 2-column layout OR if it's Urine/RBS (3-column), else right
                resultCell.style.textAlign = (shouldHideUnitAndReference || isThreeColumnTest) ? 'left' : 'right';
                // Bold if abnormal OR if value is POSITIVE/REACTIVE/PRESENT (case-insensitive) or starts with "Present" and has "+"
                const lowerResultValue = resultValue.toLowerCase();
                const presentPlusRegex = /^present\s*\+{1,}$/; // Matches "present" followed by one or more "+"
                const shouldBoldResultText = isAbnormal ||
                                             lowerResultValue === 'positive' ||
                                             lowerResultValue === 'reactive' ||
                                             lowerResultValue === 'present' ||
                                             presentPlusRegex.test(lowerResultValue);
                resultCell.style.fontWeight = shouldBoldResultText ? 'bold' : 'normal';
                resultCell.style.fontSize = '10pt';
                 // Set widths based on column layout
                if (shouldHideUnitAndReference) { // 2 columns
                    resultCell.style.width = '50%';
                } else if (shouldHideOnlyReference) { // 3 columns
                    resultCell.style.width = '30%';
                } // Else: 4 columns, use default/thead widths
                resultCell.style.verticalAlign = 'top';
                resultCell.style.border = '1px solid black'; // Add border

                // Populate Unit cell only if it was created (i.e., not 2-column layout)
                if (unitCell) {
                    unitCell.textContent = param.unit || '';
                    unitCell.style.padding = '3px 8px 3px 5px';
                    unitCell.style.textAlign = 'left';
                    unitCell.style.fontSize = '10pt';
                    // Set width for 3-column layout
                    if (shouldHideOnlyReference) {
                        unitCell.style.width = '30%';
                    } // Else: 4 columns, use default/thead widths
                    unitCell.style.verticalAlign = 'top';
                    unitCell.style.border = '1px solid black'; // Add border
                }

                // Conditionally add the reference range cell (Hide if 2-column or 3-column layout)
                if (!shouldHideUnitAndReference && !shouldHideOnlyReference) {
                  const rangeCell = row.insertCell(); // Only insert if 4 columns are needed
                  rangeCell.textContent = param.referenceRange || '';
                  rangeCell.style.padding = '3px 8px';
                  rangeCell.style.textAlign = 'left';
                  rangeCell.style.fontSize = '10pt';
                  rangeCell.style.verticalAlign = 'top';
                  rangeCell.style.border = '1px solid black'; // Add border
                }
                // No 'else' needed, the cell is simply not created if shouldHideForThisGroup is true
              }
            });
          });
        } else {
          const emptyRow = tbody.insertRow();
          const cell = emptyRow.insertCell();
           // Adjust colspan based on hidden columns
          cell.colSpan = shouldHideUnitAndReference ? 2 : (shouldHideOnlyReference ? 3 : 4);
          cell.textContent = 'No parameters in this group.';
          cell.style.textAlign = 'center';
          cell.style.padding = '3px 8px';
        }
        table.appendChild(tbody);
        testGroupDiv.appendChild(table); // Append table to group div

        // --- Render Template-Specific Notes (Only if NOT Widal Test) ---
        if (!isWidalTest) {
          const templateIdForNotes = group.templateId; // Get templateId from the group object
          let templateSpecificNotes = null;
          if (templateIdForNotes && typeof templateNotesMap === 'object' && templateNotesMap !== null) {
              templateSpecificNotes = templateNotesMap[templateIdForNotes.toString()];
              console.log(`Notes lookup for ${templateIdForNotes}:`, templateSpecificNotes); // DEBUG NOTES LOOKUP
          }

          if (templateSpecificNotes && templateSpecificNotes.trim() !== '') {
            const templateNotesDiv = document.createElement('div');
            templateNotesDiv.style.marginTop = '5px';
            templateNotesDiv.style.marginBottom = '10px';
            templateNotesDiv.style.fontSize = '10pt';
            templateNotesDiv.style.fontStyle = 'italic';
            templateNotesDiv.style.whiteSpace = 'pre-wrap';
            templateNotesDiv.innerHTML = `${templateSpecificNotes.replace(/\n/g, '<br>')}`; // Replace newlines with <br> for HTML
            testGroupDiv.appendChild(templateNotesDiv); // Append notes to group div AFTER table
          }
        }
        // --- End Template-Specific Notes ---

        printContainer.appendChild(testGroupDiv); // Append the whole group div
      }); // End of groupedResults.forEach loop

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
          testNotes: report.testNotes, // Pass general notes
          templateNotes: report.templateNotes // Pass template notes map/object
      });

      if (preparedData) {
        // Pass the necessary parts to buildPrintHtmlStructure
        const htmlElement = buildPrintHtmlStructure(
            report, // Pass the full report object for patient/test info
            preparedData.groupedResults,
            preparedData.testNotes, // General notes
            preparedData.templateNotes // Template notes map/object
            // REMOVED hideTableHeadingAndReference parameter from call
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
  }, [report]); // REMOVED hideTableHeadingAndReference from dependency array


  return reportHtml; // Return the generated HTML string
};
