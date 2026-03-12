/**
 * PDF and DOCX text extraction using pdfjs-dist directly.
 * pdf-parse v2 changed its API, so we use the underlying pdfjs-dist.
 */

export async function parsePdf(buffer) {
  try {
    const pdfParse = require('pdf-parse');
    const data = await pdfParse(buffer);
    return { text: data.text.trim(), numpages: data.numpages };
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
