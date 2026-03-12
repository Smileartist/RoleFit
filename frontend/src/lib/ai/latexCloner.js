import { chat, MODEL } from './openai';

export async function cloneLatexTemplate(rawText) {
  if (!rawText || rawText.trim().length < 20) throw new Error('Resume text is too short to clone.');

const system = `You are an elite LaTeX compilation assistant specialized in modern resume design. Your goal is to recreate the user's uploaded resume as a PERFECT, STRICTLY ONE-PAGE, compilable LaTeX document.

BASE ARCHITECTURE (Follow this EXACTLY):
\\documentclass[10pt,a4paper]{article} % Use 10pt for better fit
\\usepackage[margin=0.50in]{geometry} % Tight margins for more space
\\usepackage{titlesec}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage{fontawesome5}
\\setlength{\\parindent}{0pt}
\\setlist[itemize]{leftmargin=*, itemsep=0pt, parsep=0pt, topsep=1pt} % Ultra-compact lists
\\titleformat{\\section}{\\large\\bfseries}{}{0em}{}[\\titlerule]
\\titlespacing*{\\section}{0pt}{5pt}{3pt} % Tighten section spacing

\\begin{document}
% Header: Center the name and contact info. 
% Use \\begin{center} {\\Huge \\textbf{Name}} \\\\ ... \\end{center}
% Space out icons clearly using \\quad.
% Example: \\faPhone\\ +91... \\quad \\faEnvelope\\ \\href{mailto:...}{...} \\quad \\faLinkedin\\ \\href{...}{...}
 
% Sections: Use \\section*{Title}
% Projects: \\textbf{Project Name --- Subtitle} \\hfill \\href{...}{\\faExternalLink*}
% Escaping: Escape \\%, \\&, \\$, \\_, etc.
% NO UNICODE: Use standard LaTeX hyphens (--) or dashes.
\\end{document}

CRITICAL RULES:
1. STRICT ONE-PAGE LIMIT: It is better to skip a very minor bullet point than to let the content overflow to a second page. 
2. CONDENSE: If there are many projects or experiences, condense the bullet points for the older/less relevant ones.
3. SPACING: Use the provided titlespacing and enumitem settings to keep everything compact.
4. Output ONLY raw LaTeX code. No code blocks or markdown.`;

  const user = `Here is the raw text extracted from the user's resume PDF. Generate the STRICTLY ONE-PAGE LaTeX code using the reference architecture provided:

"""
${rawText.substring(0, 8000)}
"""`;

  const response = await chat(system, user, { model: MODEL.HEAVY, temperature: 0.1 });
  
  if (!response) {
     console.error('[LATEX CLONER] Received empty or null response from AI.');
     return `\\documentclass{article}\\begin{document}Error: AI failed to clone LaTeX\\end{document}`;
  }

  // Clean off markdown blocks if the AI accidentally adds them
  let cleaned = response.trim();
  if (cleaned.startsWith('\`\`\`latex')) {
    cleaned = cleaned.substring(8);
  } else if (cleaned.startsWith('\`\`\`tex')) {
    cleaned = cleaned.substring(6);
  } else if (cleaned.startsWith('\`\`\`')) {
    cleaned = cleaned.substring(3);
  }
  if (cleaned.endsWith('\`\`\`')) {
    cleaned = cleaned.substring(0, cleaned.length - 3);
  }
  
  return cleaned.trim();
}
