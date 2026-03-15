'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

const DEFAULT_LATEX = `\\documentclass[a4paper,10pt]{article}
\\usepackage[left=0.75in, right=0.75in, top=0.75in, bottom=0.75in]{geometry}
\\usepackage{hyperref}
\\usepackage{titlesec}
\\usepackage{enumitem}

\\titleformat{\\section}{\\large\\bfseries\\uppercase}{}{0em}{}[\\titlerule]
\\titlespacing{\\section}{0pt}{12pt}{6pt}

\\setlength{\\parindent}{0pt}

\\begin{document}
\\pagestyle{empty}

% --- HEADER ---
\\begin{center}
    {\\Huge \\bfseries [YOUR NAME]} \\\\ \\vspace{4pt}
    [City, State] $|$ \\href{mailto:email@example.com}{email@example.com} $|$ [Phone Number] \\\\
    \\href{https://linkedin.com/in/yourprofile}{LinkedIn} $|$ \\href{https://github.com/yourprofile}{GitHub} $|$ \\href{https://yourportfolio.com}{Portfolio}
\\end{center}

% --- SUMMARY ---
\\section*{Professional Summary}
[A brief, 2-3 sentence overview of your professional background, key skills, and what you bring to the table. Highlight your most relevant experience and career goals.]

% --- SKILLS ---
\\section*{Technical Skills}
\\textbf{Languages:} [e.g., Python, JavaScript, Java, C++, SQL] \\\\
\\textbf{Frameworks/Libraries:} [e.g., React, Node.js, Spring Boot, TensorFlow] \\\\
\\textbf{Tools/Platforms:} [e.g., Git, Docker, AWS, Linux, CI/CD]

% --- EXPERIENCE ---
\\section*{Experience}

\\noindent
\\textbf{[Job Title]} \\hfill [Month, Year] -- Present \\\\
\\textit{[Company Name]} \\hfill [City, State]
\\begin{itemize}[leftmargin=*, parsep=0pt, itemsep=2pt, topsep=2pt]
    \\item {[Action verb]} [impact/result] by [task/technique] resulting in [metric/improvement].
    \\item Developed [feature/system] using [technology] to solve [specific problem].
    \\item Collaborated with cross-functional teams to [achievement].
\\end{itemize}

\\vspace{6pt}
\\noindent
\\textbf{[Previous Job Title]} \\hfill [Month, Year] -- [Month, Year] \\\\
\\textit{[Previous Company Name]} \\hfill [City, State]
\\begin{itemize}[leftmargin=*, parsep=0pt, itemsep=2pt, topsep=2pt]
    \\item {[Action verb]} [impact/result] by [task/technique] resulting in [metric/improvement].
    \\item Managed [project/process] leading to [outcome].
\\end{itemize}

% --- PROJECTS ---
\\section*{Projects}

\\noindent
\\textbf{[Project Name]} $|$ \\textit{[Core Tech Stack]} \\hfill \\href{[Project Link]}{[Link (Optional)]}
\\begin{itemize}[leftmargin=*, parsep=0pt, itemsep=2pt, topsep=2pt]
    \\item Built a [description of project] that allows users to [key feature].
    \\item Implemented [specific technology or algorithm] which improved [metric].
\\end{itemize}

\\vspace{6pt}
\\noindent
\\textbf{[Project Name 2]} $|$ \\textit{[Core Tech Stack]} \\hfill \\href{[Project Link 2]}{[Link (Optional)]}
\\begin{itemize}[leftmargin=*, parsep=0pt, itemsep=2pt, topsep=2pt]
    \\item Designed [system architecture/UI] to streamline [process].
    \\item Achieved [result] by leveraging [tool/framework].
\\end{itemize}

% --- EDUCATION ---
\\section*{Education}
\\noindent
\\textbf{[Degree, e.g., B.S. in Computer Science]} \\hfill [Graduation Month, Year] \\\\
\\textit{[University Name]} \\hfill [City, State] \\\\
GPA: [Your GPA, optional]

\\end{document}
`;

export default function BuildResumePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [latexCode, setLatexCode] = useState(DEFAULT_LATEX);
  const [isCompiling, setIsCompiling] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading]);

  async function handleCompile() {
    setIsCompiling(true);
    try {
      const res = await fetch('/api/latex/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latexCode: latexCode }),
      });

      if (!res.ok) throw new Error('Compilation Failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      
      const iframe = document.getElementsByName('pdf-preview-iframe')[0];
      if (iframe) iframe.src = url;
    } catch (e) {
      console.error('Compilation Error:', e);
      alert('Failed to compile LaTeX. Please check your syntax.');
    } finally {
      setIsCompiling(false);
    }
  }

  function handleDownloadTex() {
    const blob = new Blob([latexCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'my_resume.tex';
    a.click();
    URL.revokeObjectURL(url);
  }

  if (authLoading || !user) return <div className="loading-center"><div className="spinner"></div></div>;

  return (
    <div className="page-container animate-in" style={{ maxWidth: '1600px' }}>
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div className="builder-header-flex">
          <div className="builder-title-section">
            <h1>🔨 Build Resume</h1>
            <p>Write raw LaTeX from scratch using our ATS-friendly boilerplate</p>
          </div>
          <div className="builder-actions">
            <button className="btn btn-secondary btn-sm" onClick={() => setLatexCode(DEFAULT_LATEX)}>Reset Boilerplate</button>
            <button className="btn btn-secondary btn-sm" onClick={handleDownloadTex}>Download .tex</button>
            <button className="btn btn-primary btn-sm" onClick={handleCompile} disabled={isCompiling}>
               {isCompiling ? '🔄 Compiling...' : '🚀 Compile PDF'}
            </button>
          </div>
        </div>
      </div>

      <div className="builder-grid">
        {/* Editor Side */}
        <div className="card builder-editor-container" style={{ padding: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '0.75rem 1rem', background: '#2d2d2d', color: '#fff', fontWeight: 600, borderTopLeftRadius: '0.5rem', borderTopRightRadius: '0.5rem' }}>
             📝 LaTeX Editor
          </div>
          <textarea
            className="input"
            style={{ 
              flex: 1, border: 'none', borderRadius: '0 0 0.5rem 0.5rem', 
              fontFamily: 'monospace', fontSize: '0.875rem', padding: '1rem',
              background: '#1e1e1e', color: '#d4d4d4', resize: 'none'
            }}
            value={latexCode}
            onChange={(e) => setLatexCode(e.target.value)}
            spellCheck="false"
          />
        </div>

        {/* PDF Preview Side */}
        <div className="card builder-preview-container" style={{ padding: 0, display: 'flex', flexDirection: 'column', border: '1px solid var(--color-primary-light)' }}>
          <div style={{ padding: '0.75rem 1rem', background: 'var(--color-surface)', color: 'var(--color-primary-light)', fontWeight: 600, borderTopLeftRadius: '0.5rem', borderTopRightRadius: '0.5rem' }}>
             📄 Live PDF Preview
          </div>
          <iframe 
            name="pdf-preview-iframe" 
            style={{ width: '100%', flex: 1, border: 'none', borderRadius: '0 0 0.5rem 0.5rem', background: '#333' }} 
          />
        </div>
      </div>
      <style jsx>{`
        .builder-header-flex {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1.5rem;
          flex-wrap: wrap;
        }
        .builder-actions {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }
        @media (max-width: 600px) {
          .builder-actions {
            width: 100%;
          }
          .builder-actions button {
            flex: 1;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}
