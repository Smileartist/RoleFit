import { chat, MODEL } from './openai.js';

export async function cloneLatexTemplate(rawText) {
  if (!rawText || rawText.trim().length < 20) throw new Error('Resume text is too short to clone.');

const system = `You are an elite LaTeX compilation assistant specialized in modern resume design. Your goal is to recreate the user's uploaded resume as a PERFECT, STRICTLY ONE-PAGE, compilable LaTeX document.

BASE ARCHITECTURE (Follow this EXACTLY):
\\documentclass[10pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage[left=0.4in, top=0.3in, right=0.4in, bottom=0.3in]{geometry}
\\usepackage{titlesec}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\setlength{\\parindent}{0pt}
\\setlist[itemize]{leftmargin=*, itemsep=3pt, parsep=1pt, topsep=3pt}
\\titleformat{\\section}{\\large\\bfseries\\uppercase}{}{0em}{}[\\titlerule]
\\titlespacing*{\\section}{0pt}{8pt}{4pt}

\\begin{document}
% Header: Center the name. 
% Use \\begin{center} {\\Huge \\textbf{Name}} \\\\ \\small ... \\end{center}
% ABSOLUTELY CENTER contact items symmetrically below the name.
% Space items horizontally in 1-2 rows using explicit buffers like \\quad\\textbullet\\quad OR \\hspace{1.5em}.
% DO NOT use \\hfill which pushes items to unaligned absolute page margins.
% DO NOT center individual items vertically in stacked lists. Space horizontally.
 
% Sections: Use \\section*{Title}
% Projects: \\textbf{Project Name --- Subtitle} \\hfill \\href{...}{[Link]}
% Escaping: Escape \\%, \\&, \\$, \\_, etc.
% NO UNICODE: Use standard LaTeX characters.
\\end{document}

CRITICAL RULES:
1. STRICT ONE-PAGE LIMIT: It is better to skip a very minor bullet point than to let the content overflow to a second page. 
2. CONDENSE: If there are many projects or experiences, condense terms only for over-length sections.
3. SPACING & LAYOUT REPLICATION: Replicate the candidate's original layout spacing, dividers, paragraphs, line breaks, and page distribution EXACTLY. If the original has airy padding, keep it. DO NOT force rigid 0pt constraints unless fixing overflow.
4. EXTRACT LINKS: Check if contact list or project blocks contain clickable URLs and strictly include those fully with \\href commands layout frame.
5. Output ONLY raw LaTeX code. No code blocks or markdown.`;

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
