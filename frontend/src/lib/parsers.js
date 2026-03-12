import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Mock missing DOM globals for Vercel Serverless environment
if (typeof global.DOMMatrix === 'undefined') {
  global.DOMMatrix = class {};
}
if (typeof global.ImageData === 'undefined') {
  global.ImageData = class {};
}
if (typeof global.Path2D === 'undefined') {
  global.Path2D = class {};
}

export async function parsePdf(buffer) {
  try {
    const { PdfReader } = require('pdfreader');
    
    return new Promise((resolve, reject) => {
      let fullText = '';
      let pageCount = 0;
      
      new PdfReader().parseBuffer(buffer, (err, item) => {
        if (err) {
          console.error('PdfReader error:', err);
          reject(err);
        } else if (!item) {
          // End of file
          console.log('[PARSER] PdfReader finished. Text length:', fullText.length);
          resolve({ text: fullText.trim(), numpages: pageCount });
        } else if (item.page) {
          pageCount++;
          fullText += '\n'; // New page separator
        } else if (item.text) {
          fullText += item.text + ' ';
        }
      });
    });
  } catch (err) {
    console.error('PDF parse error:', err);
    return { text: '', numpages: 0 };
  }
}

export async function parseDocx(buffer) {
  try {
    const mammothModule = await import('mammoth');
    const mammoth = mammothModule.default || mammothModule;
    return await mammoth.extractRawText({ buffer });
  } catch (err) {
    console.error('DOCX parse error:', err);
    return { value: '' };
  }
}
