const fs = require('fs');

async function run() {
  const latexCode = `
\\documentclass[10pt,a4paper]{article}

\\usepackage{fontawesome5}
\\usepackage{hyperref}

\\begin{document}
\\href{https://linkedin.com}{\\faLinkedin\\ LinkedIn}
\\end{document}
  `;

  const formData = new FormData();
  formData.append('filecontents[]', new Blob([latexCode], { type: 'text/plain' }), 'document.tex');
  formData.append('filename[]', 'document.tex');
  formData.append('engine', 'pdflatex');
  formData.append('return', 'pdf');

  try {
    const res = await fetch('https://texlive.net/cgi-bin/latexcgi', { 
      method: 'POST', 
      body: formData 
    });

    console.log('Status:', res.status);
    const contentType = res.headers.get('content-type') || '';
    console.log('Content-Type:', contentType);

    if (contentType.includes('text/html') || contentType.includes('text/plain')) {
      const text = await res.text();
      console.log('Response Error Body:', text);
    } else {
      const buffer = await res.arrayBuffer();
      fs.writeFileSync('test_output_header_icon.pdf', Buffer.from(buffer));
      console.log('Saved test_output_header_icon.pdf');
    }
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

run();
