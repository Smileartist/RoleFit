/**
 * PDF and DOCX text extraction using pdfjs-dist directly.
 * pdf-parse v2 changed its API, so we use the underlying pdfjs-dist.
 */

export async function parsePdf(buffer) {
  try {
    // Use pdfjs-dist directly (the Node.js build)
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    
    const uint8 = new Uint8Array(buffer);
    const doc = await pdfjsLib.getDocument({ data: uint8 }).promise;
    
    let fullText = '';
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .map(item => item.str)
        .join(' ');
      fullText += pageText + '\n';
    }
    
    return { text: fullText.trim(), numpages: doc.numPages };
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
