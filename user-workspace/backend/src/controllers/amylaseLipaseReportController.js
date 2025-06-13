/**
 * Amylase/Lipase Report Controller
 * 
 * This controller handles the generation of specialized Amylase/Lipase reports
 * with all text in black color and important points highlighted without using color.
 */

const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');
const puppeteer = require('puppeteer');

/**
 * @desc    Generate Amylase/Lipase Report HTML
 * @route   GET /api/reports/amylase-lipase/html
 * @access  Private/Admin/Technician
 */
exports.generateAmylaseLipaseHtml = async (req, res, next) => {
  try {
    // Get patient data from request body
    const {
      patientName,
      patientAge,
      patientGender,
      patientId,
      sampleCollectionDate,
      sampleType,
      referringDoctor,
      amylaseValue,
      lipaseValue
    } = req.body;

    // Read the black-only HTML template
    const reportTemplatePath = path.join(__dirname, '..', 'black-only-amylase-lipase.html');
    let templateSource;
    try {
      templateSource = fs.readFileSync(reportTemplatePath, 'utf8');
      console.log('Black-only Amylase/Lipase template loaded successfully for HTML view');
    } catch (err) {
      console.error('Error reading template file:', err);
      return res.status(500).json({
        success: false,
        message: 'Error reading report template'
      });
    }
    
    // Compile the template
    let template;
    try {
      template = handlebars.compile(templateSource);
      console.log('Template compiled successfully');
    } catch (err) {
      console.error('Error compiling template:', err);
      return res.status(500).json({
        success: false,
        message: 'Error compiling report template'
      });
    }
    
    // Determine if values are abnormal
    const amylaseNormal = parseFloat(amylaseValue) <= 80;
    const lipaseNormal = parseFloat(lipaseValue) <= 60;
    
    // Prepare data for the template
    const data = {
      // Patient data
      patientName: patientName || 'akhil',
      patientAge: patientAge || '33',
      patientGender: patientGender || 'male',
      patientId: patientId || '680480b936f62c971a028be4',
      
      // Sample data
      sampleCollectionDate: sampleCollectionDate || '4/23/2025',
      sampleType: sampleType || 'Serum',
      referringDoctor: referringDoctor || 'Sohel Pathan',
      
      // Test data
      amylaseValue: amylaseValue || '33',
      amylaseNormal: amylaseNormal,
      lipaseValue: lipaseValue || '61',
      lipaseNormal: lipaseNormal
    };
    
    // Generate the HTML by injecting data into the template
    const html = template(data);
    
    // Send the HTML as the response
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    console.error('Error generating Amylase/Lipase HTML report:', error);
    next(error);
  }
};

/**
 * @desc    Generate Amylase/Lipase Report PDF
 * @route   GET /api/reports/amylase-lipase/pdf
 * @access  Private/Admin/Technician
 */
exports.generateAmylaseLipasePdf = async (req, res, next) => {
  try {
    // Get patient data from request body
    const {
      patientName,
      patientAge,
      patientGender,
      patientId,
      sampleCollectionDate,
      sampleType,
      referringDoctor,
      amylaseValue,
      lipaseValue
    } = req.body;

    // Read the black-only template specifically designed for PDF generation
    const reportTemplatePath = path.join(__dirname, '..', 'black-only-amylase-lipase.html');
    const templateSource = fs.readFileSync(reportTemplatePath, 'utf8');
    
    // Compile the template
    const template = handlebars.compile(templateSource);
    
    // Determine if values are abnormal
    const amylaseNormal = parseFloat(amylaseValue) <= 80;
    const lipaseNormal = parseFloat(lipaseValue) <= 60;
    
    // Prepare data for the template
    const data = {
      // Patient data
      patientName: patientName || 'akhil',
      patientAge: patientAge || '33',
      patientGender: patientGender || 'male',
      patientId: patientId || '680480b936f62c971a028be4',
      
      // Sample data
      sampleCollectionDate: sampleCollectionDate || '4/23/2025',
      sampleType: sampleType || 'Serum',
      referringDoctor: referringDoctor || 'Sohel Pathan',
      
      // Test data
      amylaseValue: amylaseValue || '33',
      amylaseNormal: amylaseNormal,
      lipaseValue: lipaseValue || '61',
      lipaseNormal: lipaseNormal
    };
    
    // Generate the HTML
    const html = template(data);
    
    console.log('Using black-only template for PDF generation');
    
    // Launch a headless browser
    const browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ]
    });
    
    try {
      // Create a new page
      const page = await browser.newPage();
      
      // Set viewport size to A4
      await page.setViewport({
        width: 794, // A4 width in pixels (210mm at 96 DPI)
        height: 1123, // A4 height in pixels (297mm at 96 DPI)
        deviceScaleFactor: 1
      });
      
      // Set the content of the page
      await page.setContent(html, {
        waitUntil: 'networkidle0'
      });
      
      // Set the PDF options
      const pdfOptions = {
        format: 'A4',
        printBackground: true,
        margin: {
          top: '0',
          right: '0',
          bottom: '0',
          left: '0'
        },
        preferCSSPageSize: true,
        displayHeaderFooter: false
      };
      
      // Generate the PDF
      const pdf = await page.pdf(pdfOptions);
      
      // Close the browser
      await browser.close();
      
      // Set the response headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="amylase-lipase-report-${patientId || 'patient'}.pdf"`);
      
      // Send the PDF as the response
      res.send(pdf);
    } catch (pdfError) {
      console.error('Error in PDF generation step:', pdfError);
      await browser.close();
      return res.status(500).json({
        success: false,
        message: 'Error generating PDF',
        error: pdfError.message
      });
    }
  } catch (error) {
    console.error('Error generating Amylase/Lipase PDF report:', error);
    next(error);
  }
};

/**
 * @desc    Generate Sample Amylase/Lipase Report with Default Values
 * @route   GET /api/reports/amylase-lipase/sample
 * @access  Private/Admin/Technician
 */
exports.generateSampleReport = async (req, res, next) => {
  try {
    // Default sample data
    const sampleData = {
      patientName: 'akhil',
      patientAge: '33',
      patientGender: 'male',
      patientId: '680480b936f62c971a028be4',
      sampleCollectionDate: '4/23/2025',
      sampleType: 'Serum',
      referringDoctor: 'Sohel Pathan',
      amylaseValue: '33',
      lipaseValue: '61'
    };
    
    // Read the HTML template
    const reportTemplatePath = path.join(__dirname, '..', 'amylase-lipase-report.html');
    const templateSource = fs.readFileSync(reportTemplatePath, 'utf8');
    
    // Compile the template
    const template = handlebars.compile(templateSource);
    
    // Determine if values are abnormal
    const amylaseNormal = parseFloat(sampleData.amylaseValue) <= 80;
    const lipaseNormal = parseFloat(sampleData.lipaseValue) <= 60;
    
    // Add abnormal flags to the data
    const data = {
      ...sampleData,
      amylaseNormal,
      lipaseNormal
    };
    
    // Generate the HTML
    const html = template(data);
    
    // Send the HTML as the response
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    console.error('Error generating sample report:', error);
    next(error);
  }
};
