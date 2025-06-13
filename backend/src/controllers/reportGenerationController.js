 const Report = require('../models/Report');
const Lab = require('../models/Lab');
const LabReportSettings = require('../models/LabReportSettings');
const TestTemplate = require('../models/TestTemplate'); // Import TestTemplate model
const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');
const puppeteer = require('puppeteer'); // Needed for PDF generation
const qrcode = require('qrcode'); // Re-adding for QR code generation

// Register a helper for debugging (can be useful in templates)
handlebars.registerHelper('debug', function(optionalValue) {
  console.log('Current Context (Handlebars Debug)');
  console.log('====================');
  console.log(this);

  if (optionalValue) {
    console.log('Value (Handlebars Debug)');
    console.log('====================');
    console.log(optionalValue);
  }
});

// Helper function to prepare report data for templating (HTML & PDF)
exports.prepareReportTemplateData = async (report, lab, labReportSettings, req, showHeader, showFooter) => {
    // --- Group results by templateId ---
    const groupedResults = [];
    const rawTemplateIds = report.results.map(r => r.templateId?.toString()).filter(id => id);
    console.log('[prepareReportTemplateData] Raw Template IDs from report.results:', rawTemplateIds);
    const templateIds = [...new Set(rawTemplateIds)]; // Get unique template IDs
    console.log('[prepareReportTemplateData] Unique Template IDs to process:', templateIds);

    // List of tests for which to hide table heading and reference cell (case-insensitive)
    const testsToHideTableHeadingAndReference = [
      'blood group',
      'serum for hiv i & ii test',
      'c-reactive protein (crp)',
      'rapid malaria test',
      'urine examination report',
      'dengue test report',
      'rheumatoid arthritis factor test',
      'typhi dot test',
      'troponin-i test',
      'vdrl test'
    ];

    if (templateIds.length > 0) {
      const templates = await TestTemplate.find({ '_id': { $in: templateIds } }).select('templateName name'); // Only select name fields
      const templateMap = templates.reduce((map, t) => {
        map[t._id.toString()] = { id: t._id.toString(), name: t.templateName || t.name };
        return map;
      }, {});
      console.log('[prepareReportTemplateData] Template Map (ID -> Name):', JSON.stringify(templateMap, null, 2));

      for (const templateId of templateIds) {
        const templateInfo = templateMap[templateId.toString()];
        const templateName = templateInfo ? templateInfo.name : 'Unknown Test';
        console.log(`[prepareReportTemplateData] Processing group for templateId: ${templateId}, resolved templateName: ${templateName}`);

        const parameters = report.results
          .filter(r => r.templateId && r.templateId.toString() === templateId.toString())
          .map(param => {
            const shouldHideUnitAndReference = testsToHideTableHeadingAndReference.includes(templateName.toLowerCase());
            return {
              name: param.parameter,
              result: param.value, // Use the value directly (should be '' for headers)
              unit: shouldHideUnitAndReference ? '' : param.unit, // Clear unit if test is in hide list
              referenceRange: shouldHideUnitAndReference ? '' : param.referenceRange, // Clear reference range if test is in hide list
              isAbnormal: param.flag === 'high' || param.flag === 'low' || param.flag === 'critical',
              // Use isHeader directly from the data model if present, otherwise default to false
              isHeader: param.isHeader || false,
              isSubparameter: param.isSubparameter // Pass isSubparameter to template
            };
          });

        console.log('Parameters array before header insertion:', parameters.map(p => ({ name: p.name, value: p.result, flag: p.flag, isAbnormal: p.isAbnormal }))); // Added log

        // --- START: Insert Differential Count Header ---
        // Check if this group contains 'Neutrophils' (case-insensitive)
        const neutrophilIndex = parameters.findIndex(p => p.name.toLowerCase() === 'neutrophils');

        if (neutrophilIndex !== -1) {
          // Check if the header isn't already present (to avoid duplicates if DB data is fixed later)
          const headerAlreadyExists = parameters.some(p => p.name === 'Differential Count' && p.isHeader);
          if (!headerAlreadyExists) {
            // Insert the header object before Neutrophils
            parameters.splice(neutrophilIndex, 0, {
              name: 'Differential Count',
              isHeader: true,
              result: '', // Headers don't have results/units/ranges
              unit: '',
              referenceRange: '',
              isAbnormal: false,
              isSubparameter: false
            });
            console.log(`Inserted 'Differential Count' header at index ${neutrophilIndex}`);
          } else {
             console.log("'Differential Count' header already exists, skipping dynamic insertion.");
          }
        }
        // --- END: Insert Differential Count Header ---

        console.log('Prepared parameters for template (after potential header insertion):', parameters.map(p => ({ name: p.name, isHeader: p.isHeader }))); // Debug log

        if (parameters.length > 0) {
          // --- Get template-specific notes (handle Map or Object) ---
          let notesForThisTemplate = '';
          if (report.templateNotes) {
            const notesMap = report.templateNotes;
            const templateIdString = templateId.toString();
            if (notesMap instanceof Map) {
              notesForThisTemplate = notesMap.get(templateIdString) || '';
            } else if (typeof notesMap === 'object' && notesMap !== null) {
              notesForThisTemplate = notesMap[templateIdString] || '';
            }
          }
          // --- End Get template-specific notes ---
          const shouldHideThisGroupColumns = testsToHideTableHeadingAndReference.includes(templateName.toLowerCase());
          groupedResults.push({ 
            templateName, 
            parameters, 
            templateSpecificNotes: notesForThisTemplate,
            shouldHideThisGroupColumns: shouldHideThisGroupColumns // Add per-group flag
          });
        }
      }
    } else {
       // Fallback for reports created before templateId was added or custom reports
       const parameters = report.results.map(param => ({
          name: param.parameter,
          result: param.value,
          unit: param.unit,
          referenceRange: param.referenceRange,
          isAbnormal: param.flag === 'high' || param.flag === 'low' || param.flag === 'critical',
          isHeader: param.isHeader,
          isSubparameter: param.isSubparameter,
          displayFormat: param.displayFormat // Include displayFormat for fallback
       }));
       if (parameters.length > 0) {
         // No template ID, so no specific notes here
         groupedResults.push({ templateName: report.testInfo?.name || 'Test Results', parameters, templateSpecificNotes: '' });
       }
    }
    // --- End grouping logic ---
    console.log('[prepareReportTemplateData] Final groupedResults:', JSON.stringify(groupedResults.map(g => ({ templateName: g.templateName, numParams: g.parameters.length })), null, 2));

    // Get the server's base URL for image paths
    const baseUrl = `${req.protocol}://${req.get('host')}`;

    // Re-add QR Code generation
    const publicReportUrl = `${baseUrl}/api/reports/public/${report._id}/pdf`;
    let qrCodeDataUrl = '';
    try {
      qrCodeDataUrl = await qrcode.toDataURL(publicReportUrl, { 
        errorCorrectionLevel: 'H',
        margin: 1, 
        width: 80 
      });
    } catch (qrErr) {
      console.error('[prepareReportTemplateData] Error generating QR code:', qrErr);
    }

    // Check if header and footer settings exist and should be shown
    const hasHeaderSettings = labReportSettings &&
                             (labReportSettings.header.headerImage ||
                              labReportSettings.header.labName ||
                              labReportSettings.header.doctorName);

    const hasFooterSettings = labReportSettings &&
                             (labReportSettings.footer.signature ||
                              labReportSettings.footer.footerImage);

    // Determine if any of the groupedResults templateName matches testsToHideTableHeadingAndReference (This global flag is no longer primary for conditional rendering in template)
    // console.log('Grouped Results Template Names:', groupedResults.map(g => g.templateName));
    // const hideTableHeadingAndReferenceGlobal = groupedResults.some(group => {
    //   const match = testsToHideTableHeadingAndReference.includes(group.templateName.toLowerCase());
    //   console.log(`Checking templateName "${group.templateName}" against hide list: ${match}`);
    //   return match;
    // });
    // console.log('Global hideTableHeadingAndReference flag (for reference, not direct template use):', hideTableHeadingAndReferenceGlobal);

    // Prepare data for the template
    const data = {
      // Header data - only include if settings exist and showHeader is true
      showHeader: showHeader && hasHeaderSettings,
      headerImage: (showHeader && hasHeaderSettings && labReportSettings.header.headerImage) ?
                   `${baseUrl}${labReportSettings.header.headerImage}` : '',
      labName: (showHeader && hasHeaderSettings) ?
               (labReportSettings.header.labName || lab.name || 'Pathology Laboratory') : '',
      doctorName: (showHeader && hasHeaderSettings) ?
                  (labReportSettings.header.doctorName || 'Dr. Consultant') : '',
      address: (showHeader && hasHeaderSettings) ? 
               (labReportSettings.header.address || lab.address || 'Lab Address') : '',
      phone: (showHeader && hasHeaderSettings) ? 
             (labReportSettings.header.phone || lab.phone || '') : '',
      email: (showHeader && hasHeaderSettings) ? 
             (labReportSettings.header.email || lab.email || '') : '',

      // Patient data
      patientName: report.patientInfo?.name || 'N/A',
      patientAge: report.patientInfo?.age || 'N/A',
      patientGender: report.patientInfo?.gender || 'N/A',
      patientId: report.patientInfo?.patientId || 'N/A',

      // Sample data
      // Manually format date as DD/MM/YYYY
      reportDate: (() => {
        const d = new Date(report.createdAt);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
      })(),
      sampleCollectionDate: (() => {
        const d = new Date(report.testInfo?.sampleCollectionDate || Date.now());
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
      })(),
      sampleType: report.testInfo?.sampleType || 'Blood', // Used in PDF
      referringDoctor: report.testInfo?.referenceDoctor || 'N/A',

      // Test data - Now using groupedResults which includes templateSpecificNotes
      groupedResults: groupedResults,
      testNotes: report.testNotes, // Pass general notes separately

      // Footer data - only include if settings exist and showFooter is true
      showFooter: showFooter && hasFooterSettings,
      signatureImage: (showFooter && hasFooterSettings && labReportSettings.footer.signature) ?
                      `${baseUrl}${labReportSettings.footer.signature}` : '',
      verifiedBy: (showFooter && hasFooterSettings) ?
                  (labReportSettings.footer.verifiedBy || 'Lab Incharge') : '',
      designation: (showFooter && hasFooterSettings) ?
                   (labReportSettings.footer.designation || 'Pathologist') : '',
      footerImage: (showFooter && hasFooterSettings && labReportSettings.footer.footerImage) ?
                   `${baseUrl}${labReportSettings.footer.footerImage}` : '',

      // Styling
      styling: {
        primaryColor: labReportSettings?.styling?.primaryColor || '#007bff',
        secondaryColor: labReportSettings?.styling?.secondaryColor || '#6c757d',
        fontFamily: labReportSettings?.styling?.fontFamily || 'Arial, sans-serif',
        fontSize: labReportSettings?.styling?.fontSize || 12
      },

      // Global hideTableHeadingAndReference removed, as per-group flag is now used by template
      // hideTableHeadingAndReference: hideTableHeadingAndReferenceGlobal, 

      // Re-add QR Code data
      qrCodeDataUrl: qrCodeDataUrl,
      publicReportUrl: publicReportUrl
    };
    return data;
};


// @desc    Generate HTML report
// @route   GET /api/reports/:id/html
// @access  Private/Admin/Technician
exports.generateHtmlReport = async (req, res, next) => {
  try {
    // Get the showHeader and showFooter query parameters (default to true if not provided)
    const showHeader = req.query.showHeader !== 'false';
    const showFooter = req.query.showFooter !== 'false';

    console.log(`HTML generation options - Show Header: ${showHeader}, Show Footer: ${showFooter}`);

    const report = await Report.findById(req.params.id)
      .populate({
        path: 'technician',
        select: 'name email'
      })
      .populate({
        path: 'verifiedBy',
        select: 'name email'
      });

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }
    if (report.lab.toString() !== req.user.lab.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to access this report' });
    }

    const labReportSettings = await LabReportSettings.findOne({ lab: report.lab });
    const lab = await Lab.findById(report.lab);
    if (!lab) {
      return res.status(404).json({ success: false, message: 'Lab not found' });
    }

    // Read the HTML template, now using report.html
    const reportTemplatePath = path.join(__dirname, '..', 'report.html');
    let templateSource;
    try {
      templateSource = fs.readFileSync(reportTemplatePath, 'utf8');
      console.log('report.html template loaded successfully for HTML view');
    } catch (err) {
      console.error('Error reading template file:', err);
      return res.status(500).json({ success: false, message: 'Error reading report template' });
    }

    // Compile the template
    let template;
    try {
      template = handlebars.compile(templateSource);
      console.log('Template compiled successfully');
    } catch (err) {
      console.error('Error compiling template:', err);
      return res.status(500).json({ success: false, message: 'Error compiling report template' });
    }

    // Prepare data using the helper function
    const data = await prepareReportTemplateData(report, lab, labReportSettings, req, showHeader, showFooter);

    // Generate the HTML
    const html = template(data);

    // Log the data being passed to the template for debugging
    console.log('[generateHtmlReport] Data passed to Handlebars template:', JSON.stringify(data, null, 2));
    console.log('[generateHtmlReport] Generated HTML for preview (first 500 chars):', html.substring(0, 500));
    if (html.length === 0) {
      console.error('[generateHtmlReport] CRITICAL: Handlebars rendered an empty HTML string!');
    }

    // Send the HTML as the response
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    console.error('Error generating HTML report:', error);
    next(error);
  }
};

// @desc    Generate PDF report
// @route   GET /api/reports/:id/pdf
// @access  Private/Admin/Technician
exports.generatePdfReport = async (req, res, next) => {
  let browser = null; // Define browser outside try block for finally clause
  try {
    // Get the showHeader and showFooter query parameters (default to true if not provided)
    const showHeader = req.query.showHeader !== 'false';
    const showFooter = req.query.showFooter !== 'false';

    console.log(`PDF generation options - Show Header: ${showHeader}, Show Footer: ${showFooter}`);

    const report = await Report.findById(req.params.id)
      .populate({
        path: 'technician',
        select: 'name email'
      })
      .populate({
        path: 'verifiedBy',
        select: 'name email'
      });

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }
    if (report.lab.toString() !== req.user.lab.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to access this report' });
    }

    const labReportSettings = await LabReportSettings.findOne({ lab: report.lab });
    const lab = await Lab.findById(report.lab);
    if (!lab) {
      return res.status(404).json({ success: false, message: 'Lab not found' });
    }

    // Prepare data using the helper function
    const data = await prepareReportTemplateData(report, lab, labReportSettings, req, showHeader, showFooter);

    // Read the template, now using report.html
    const reportTemplatePath = path.join(__dirname, '..', 'report.html'); // Changed to report.html
    const templateSource = fs.readFileSync(reportTemplatePath, 'utf8');

    // Compile the template
    const template = handlebars.compile(templateSource);

    // Log the data object just before rendering the PDF template
    console.log('[generatePdfReport] Data being passed to PDF template:', JSON.stringify(data, null, 2));

    // Generate the HTML
    const html = template(data);
    console.log('Using report.html template for PDF generation'); // Changed log message

    // Launch a headless browser with additional configuration
    browser = await puppeteer.launch({
      headless: 'new', // Use the new headless mode
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage', // Recommended for Docker/CI environments
        '--disable-accelerated-2d-canvas',
        '--disable-gpu', // Often necessary in headless environments
        '--window-size=1280,720' // Define a window size
      ],
      // Consider adding executablePath if Puppeteer isn't finding Chrome correctly
      // executablePath: '/path/to/your/chrome/or/chromium'
    });
    console.log('Puppeteer browser launched.');

    // Create a new page
    const page = await browser.newPage();
    console.log('New page created.');

    // Set viewport size to approximate A4 for rendering purposes
    await page.setViewport({
      width: 794, // A4 width in pixels (210mm at 96 DPI)
      height: 1123, // A4 height in pixels (297mm at 96 DPI)
      deviceScaleFactor: 1 // Use 1 for PDF generation, scale option handles final size
    });
    console.log('Viewport set.');

    // Set the content of the page with longer timeout
    await page.setContent(html, {
      waitUntil: 'networkidle0', // Wait for network activity to cease
      timeout: 60000 // Increased timeout to 60 seconds
    });
    console.log('Page content set successfully.');

    // Set the PDF options with more detailed configuration
    const pdfOptions = {
      format: 'A4',
      printBackground: true,
      margin: {
        top: '40mm', // Reserve space for pre-printed letterhead
        right: '10mm', // Add some side margins
        bottom: '10mm',
        left: '10mm'
      },
      preferCSSPageSize: true, // Use CSS @page size if defined
      displayHeaderFooter: false, // We handle header/footer in HTML
      scale: 1, // Adjust scale if needed, 1 is default
      landscape: false
    };
    console.log('Generating PDF with options:', JSON.stringify(pdfOptions));

    // Generate the PDF
    const pdf = await page.pdf(pdfOptions);
    console.log('PDF generated successfully.');

    // Close the browser
    await browser.close();
    browser = null; // Indicate browser is closed
    console.log('Browser closed successfully.');

    // Set the response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="report-${report._id}.pdf"`);

    // Send the PDF as the response
    res.send(pdf);

  } catch (error) {
    console.error('Error generating PDF report:', error);
    // Ensure browser is closed even if an error occurs mid-process
    if (browser) {
      try {
        await browser.close();
        console.log('Browser closed after error.');
      } catch (closeError) {
        console.error('Error closing browser after error:', closeError);
      }
    }
    // Pass error to the next middleware (error handler)
    next(error);
  }
};


// @desc    Test Handlebars template (Simple test endpoint)
// @route   GET /api/reports/test-template
// @access  Private/Admin/Technician (or adjust as needed)
exports.testTemplate = async (req, res, next) => {
  try {
    // Read the test template
    const testTemplatePath = path.join(__dirname, '..', 'test-template.html');
    let templateSource;
    try {
      templateSource = fs.readFileSync(testTemplatePath, 'utf8');
      console.log('Test template loaded successfully');
    } catch (err) {
      console.error('Error reading test template file:', err);
      return res.status(500).json({ success: false, message: 'Error reading test template' });
    }

    // Compile the template
    let template;
    try {
      template = handlebars.compile(templateSource);
      console.log('Test template compiled successfully');
    } catch (err) {
      console.error('Error compiling test template:', err);
      return res.status(500).json({ success: false, message: 'Error compiling test template' });
    }

    // Prepare simple test data
    const data = {
      name: 'John Doe',
      user: {
        name: 'Jane Smith',
        age: 30
      },
      showMessage: true,
      items: ['Item 1', 'Item 2', 'Item 3']
    };

    // Generate the HTML
    const html = template(data);

    // Send the HTML as the response
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    console.error('Error testing template:', error);
    next(error);
  }
};
