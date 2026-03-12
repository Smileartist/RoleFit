import { createRequire } from 'module';
const require = createRequire(import.meta.url);

export async function parsePdf(buffer) {
  try {
    const pdfParse = require('pdf-parse');
    const data = await pdfParse(buffer);
    const text = data.text || '';
    console.log('[PARSER] PDF text extracted, length:', text.length);
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
