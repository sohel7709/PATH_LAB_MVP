const puppeteer = require('puppeteer');

/**
 * Generates a PDF from HTML content.
 * @param {string} htmlContent - The HTML content to convert to PDF.
 * @param {object} [pdfOptions] - Optional Puppeteer PDF options.
 * @returns {Promise<Buffer>} - A promise that resolves with the PDF buffer.
 */
async function generatePdfFromHtml(htmlContent, pdfOptions = {}) {
  console.log('Starting PDF generation from HTML content...');
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();

    // Set HTML content
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    const defaultPdfOptions = {
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '10mm',
        bottom: '20mm',
        left: '10mm',
      },
    };

    const finalPdfOptions = { ...defaultPdfOptions, ...pdfOptions };

    // Generate PDF buffer
    const pdfBuffer = await page.pdf(finalPdfOptions);

    if (!pdfBuffer || pdfBuffer.length === 0) {
      console.error('Puppeteer generated an empty or null PDF buffer.');
      throw new Error('Puppeteer generated an empty or null PDF buffer.');
    }

    console.log(`PDF buffer successfully generated. Size: ${pdfBuffer.length} bytes.`);
    return pdfBuffer;
  } catch (error) {
    console.error('Error in generatePdfFromHtml:', error.message, error.stack); // Log more details
    // Ensure the browser is closed even if page.pdf() fails before the finally block
    if (browser) {
      try {
        await browser.close();
        browser = null; // Prevent double close in finally
      } catch (closeError) {
        console.error('Error closing browser after PDF generation error:', closeError);
      }
    }
    throw error; // Re-throw the error to be handled by the caller
  } finally {
    if (browser) { // browser might have been set to null if closed in catch
      await browser.close();
    }
  }
}

module.exports = { generatePdfFromHtml };
