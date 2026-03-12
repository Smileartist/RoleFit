import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { latexCode } = await request.json();
    if (!latexCode) {
      return NextResponse.json({ error: 'latexCode is required.' }, { status: 400 });
    }

    const formData = new FormData();
    formData.append('filecontents[]', new Blob([latexCode], { type: 'text/plain' }), 'document.tex');
    formData.append('filename[]', 'document.tex');
    formData.append('engine', 'pdflatex');
    formData.append('return', 'pdf');

    const res = await fetch('https://texlive.net/cgi-bin/latexcgi', { 
      method: 'POST', 
      body: formData 
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Compilation Failed: ${res.status} - ${errorText.substring(0, 500)}`);
    }

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('text/html') || contentType.includes('text/plain')) {
      const errorHtml = await res.text();
      
      // Attempt to extract the specific LaTeX error from the texlive server response
      let extractedError = errorHtml;
      const preMatch = errorHtml.match(/<pre>([\s\S]*?)<\/pre>/i);
      if (preMatch && preMatch[1]) {
         extractedError = preMatch[1].trim();
      }
      
      console.error('[LATEX COMPILE FAILED] texlive returned HTML error trace instead of PDF:', extractedError.substring(0, 200));
      return NextResponse.json({ error: `LaTeX Compilation Error: \\n\\n${extractedError}` }, { status: 400 });
    }

    const buffer = await res.arrayBuffer();
    
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="document.pdf"',
      },
    });

  } catch (err) {
    console.error('[LATEX PROXY ERROR]', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
