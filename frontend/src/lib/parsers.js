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
    const pdfParse = require('pdf-parse');
    const data = await pdfParse(buffer);
    const text = data.text || '';
    console.log('[PARSER] PDF text extracted, length:', text.length);
    if (text.length > 0) {
      console.log('[PARSER] Snippet:', text.substring(0, 50));
    }
    return { text: text.trim(), numpages: data.numpages };
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
