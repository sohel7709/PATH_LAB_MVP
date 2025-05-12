/**
 * PDF Generator Script for Amylase/Lipase Report
 * 
 * This script uses Puppeteer to convert the HTML report template to a PDF file.
 * It ensures that all content is rendered in black color and important points are highlighted
 * without using color, as per the requirements.
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function generatePDF() {
  console.log('Starting PDF generation...');
  
  // Launch a new browser instance
  const browser = await puppeteer.launch({
    headless: 'new', // Use the new headless mode
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    // Create a new page
    const page = await browser.newPage();
    
    // Get the absolute path to the HTML file
    const htmlPath = path.join(__dirname, 'amylase-lipase-report.html');
    const fileUrl = `file://${htmlPath}`;
    
    console.log(`Loading HTML from: ${fileUrl}`);
    
    // Navigate to the HTML file
    await page.goto(fileUrl, { waitUntil: 'networkidle0' });
    
    // Create output directory if it doesn't exist
    const outputDir = path.join(__dirname, '../output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }
    
    // Define the output PDF path
    const outputPath = path.join(outputDir, 'amylase-lipase-report.pdf');
    
    // Generate PDF
    await page.pdf({
      path: outputPath,
      format: 'A4',
      printBackground: true,
      margin: {
top: '55mm', // Updated header margin
        right: '0',
        bottom: '30mm', // Updated footer margin
        left: '0'
      }
    });
    
    console.log(`PDF successfully generated at: ${outputPath}`);
  } catch (error) {
    console.error('Error generating PDF:', error);
  } finally {
    // Close the browser
    await browser.close();
  }
}

// Execute the function
generatePDF().catch(console.error);

/**
 * Usage:
 * 1. Run this script with Node.js:
 *    node src/generate-pdf.js
 * 
 * 2. The PDF will be generated in the 'backend/output' directory
 */
