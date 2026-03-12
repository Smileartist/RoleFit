'use client';

import { useEffect, useState, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { getResumes, getJobs, tailorResume, generateEmail, getTailoredResumes, generatePdf, saveLatexContent, deleteTailoredResume } from '@/lib/api';

export default function TailorPage() {
  return (
    <Suspense fallback={<div className="loading-center"><div className="spinner"></div></div>}>
      <TailorContent />
    </Suspense>
  );
}

function TailorContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [resumes, setResumes] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [tailored, setTailored] = useState([]);
  const [selectedResume, setSelectedResume] = useState('');
  const [selectedJob, setSelectedJob] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [emailText, setEmailText] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [isEditingLatex, setIsEditingLatex] = useState(false);
  const [latexCode, setLatexCode] = useState('');
  const [savingLatex, setSavingLatex] = useState(false);
  const [previewMode, setPreviewMode] = useState('text'); // 'text' | 'pdf'
  const [pdfsLoading, setPdfsLoading] = useState(false);
  const [selectedTailoredModal, setSelectedTailoredModal] = useState(null); // ID of past tailored resume to view
  const [modalPdfsLoading, setModalPdfsLoading] = useState(false);
  const [modalPreviewMode, setModalPreviewMode] = useState('text'); // 'text' | 'pdf'

  const originalResume = resumes.find(r => r.id === selectedResume)?.structured_data;

  useEffect(() => {
    if (!authLoading && !user) { router.push('/login'); return; }
    if (user) loadData();
  }, [user, authLoading]);

  async function loadData() {
    try {
      const [r, j, t] = await Promise.all([
        getResumes().catch(() => ({ resumes: [] })),
        getJobs().catch(() => ({ jobs: [] })),
        getTailoredResumes().catch(() => ({ tailored_resumes: [] })),
      ]);
      const loadedResumes = r.resumes || [];
      const loadedJobs = j.jobs || [];
      setResumes(loadedResumes);
      setJobs(loadedJobs);
      setTailored(t.tailored_resumes || []);

      if (loadedResumes.length > 0 && !selectedResume) {
        setSelectedResume(loadedResumes[0].id);
      }

      const jobIdFromUrl = searchParams.get('jobId');
      if (jobIdFromUrl && loadedJobs.some(job => job.id === jobIdFromUrl)) {
        setSelectedJob(jobIdFromUrl);
      } else if (loadedJobs.length > 0 && !selectedJob) {
        setSelectedJob(loadedJobs[0].id);
      }
    } catch { } finally { setLoading(false); }
  }

  async function handleTailor(force = false) {
    if (!selectedResume || !selectedJob) { setError('Select both a resume and a job.'); return; }
    setProcessing(true); setError(''); setResult(null); setEmailText('');

    try {
      const data = await tailorResume(selectedResume, selectedJob, force);
      setResult({ ...data.tailored_resume, _cached: !!data.cached });
      loadData();
    } catch (err) {
      setError(err.message);
    } finally { setProcessing(false); }
  }

  async function handleGenerateEmail() {
    if (!selectedResume || !selectedJob) return;
    try {
      const data = await generateEmail(selectedResume, selectedJob);
      setEmailText(data.email);
    } catch (err) { setError(err.message); }
  }

  function copyEmail() {
    navigator.clipboard.writeText(emailText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function fetchLatexContent(id) {
    try {
      setPdfGenerating(true);
      const data = await generatePdf(id);
      return data.latex_content;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setPdfGenerating(false);
    }
  }

  async function handleToggleEditLatex(id) {
    if (!isEditingLatex) {
      const content = await fetchLatexContent(id);
      setLatexCode(content || '');
      setIsEditingLatex(true);
    } else {
      setIsEditingLatex(false);
    }
  }

  async function handleSaveLatex(id) {
    try {
      setSavingLatex(true);
      await saveLatexContent(id, latexCode);
      setIsEditingLatex(false);
      loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingLatex(false);
    }
  }

  async function handleDownloadTex(id) {
    const content = await fetchLatexContent(id);
    if (!content) return;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tailored_resume.tex';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleDownloadPdf(id) {
    const content = await fetchLatexContent(id);
    if (!content) return;
    
    // Compile and download via local API
    try {
      const res = await fetch('/api/latex/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latexCode: content }),
      });

      if (!res.ok) throw new Error('Compilation Failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'tailored_resume.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError('Failed to download PDF: ' + e.message);
    }
  }

  async function handleLoadPdfs() {
    setPreviewMode('pdf');
    setPdfsLoading(true);
    try {
      const [origRes, tailRes] = await Promise.all([
        generatePdf(result.id, true),
        generatePdf(result.id, false)
      ]);
      await Promise.all([
        fetchAndRenderPdf(origRes.latex_content, 'iframe-original'),
        fetchAndRenderPdf(tailRes.latex_content, 'iframe-tailored')
      ]);
    } catch (err) {
      setError('Failed to load PDF preview: ' + err.message);
    } finally {
      setPdfsLoading(false);
    }
  }

  async function fetchAndRenderPdf(latexText, iframeName) {
    try {
      const res = await fetch('/api/latex/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latexCode: latexText }),
      });

      if (!res.ok) throw new Error('LaTeX Compilation Error');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      
      const iframe = document.getElementsByName(iframeName)[0];
      if (iframe) iframe.src = url;
    } catch (e) {
      console.error('PDF Render Error:', e);
    }
  }

  async function handleDeleteTailored(id, e) {
    e.stopPropagation(); // prevent modal opening
    if (!confirm('Are you sure you want to delete this historical tailored resume?')) return;
    try {
      await deleteTailoredResume(id);
      loadData();
    } catch (err) {
      setError('Failed to delete: ' + err.message);
    }
  }

  async function handleLoadModalPdfs(modalData) {
    setModalPreviewMode('pdf');
    setModalPdfsLoading(true);
    try {
      const [origRes, tailRes] = await Promise.all([
        generatePdf(modalData.id, true),
        generatePdf(modalData.id, false)
      ]);
      await Promise.all([
        fetchAndRenderPdf(origRes.latex_content, 'modal-iframe-original'),
        fetchAndRenderPdf(tailRes.latex_content, 'modal-iframe-tailored')
      ]);
    } catch (err) {
      setError('Failed to load PDF preview: ' + err.message);
    } finally {
      setModalPdfsLoading(false);
    }
  }

  if (authLoading || !user) return <div className="loading-center"><div className="spinner"></div></div>;

  return (
    <div className="page-container animate-in">
      <div className="page-header">
        <h1>✨ Tailor Resume</h1>
        <p>Select a resume and job to generate an optimized version</p>
      </div>

      {/* Selection */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div className="input-group">
            <label>Select Resume</label>
            <select className="input" value={selectedResume} onChange={e => setSelectedResume(e.target.value)}>
              <option value="">Choose a resume...</option>
              {resumes.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
            </select>
          </div>
          <div className="input-group">
            <label>Select Job</label>
            <select className="input" value={selectedJob} onChange={e => setSelectedJob(e.target.value)}>
              <option value="">Choose a job...</option>
              {jobs.map(j => <option key={j.id} value={j.id}>{j.title || j.company || 'Untitled'} {j.company ? `@ ${j.company}` : ''}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => handleTailor(false)} disabled={processing || !selectedResume || !selectedJob}>
            {processing ? '🔄 Processing...' : '✨ Generate Tailored Resume'}
          </button>
          <button className="btn btn-secondary" onClick={() => handleTailor(true)} disabled={processing || !selectedResume || !selectedJob}>
            🔄 Re-generate (Fresh)
          </button>
          <button className="btn btn-secondary" onClick={handleGenerateEmail} disabled={!selectedResume || !selectedJob}>
            📧 Generate Email
          </button>
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2rem' }}>
          {/* ATS Score Comparison */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '1.5rem' }}>ATS Match Score</h3>
            
            <div style={{ display: 'flex', gap: '3rem', alignItems: 'center' }}>
              
              {/* Original Score */}
              {result.ats_feedback?.original_score !== undefined && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div className="score-ring" style={{ marginBottom: '0.75rem', transform: 'scale(0.85)' }}>
                    <svg width="100" height="100" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="var(--color-surface)" strokeWidth="8" />
                      <circle cx="50" cy="50" r="42" fill="none"
                        stroke={result.ats_feedback.original_score >= 70 ? 'var(--color-success)' : result.ats_feedback.original_score >= 40 ? 'var(--color-warning)' : 'var(--color-danger)'}
                        strokeWidth="8" strokeLinecap="round"
                        strokeDasharray={`${(result.ats_feedback.original_score / 100) * 264} 264`}
                        style={{ opacity: 0.7 }}
                      />
                    </svg>
                    <span className="score-value" style={{ color: 'var(--color-text-muted)', fontSize: '1.25rem' }}>{result.ats_feedback.original_score}</span>
                  </div>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Original Resume</span>
                </div>
              )}

              {/* Arrow Indicator */}
              {result.ats_feedback?.original_score !== undefined && (
                 <div style={{ fontSize: '1.5rem', color: 'var(--color-primary-light)', opacity: 0.5 }}>→</div>
              )}

              {/* Tailored Score */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div className="score-ring" style={{ marginBottom: '0.75rem', transform: 'scale(1.1)' }}>
                  <svg width="100" height="100" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="var(--color-surface)" strokeWidth="8" />
                    <circle cx="50" cy="50" r="42" fill="none"
                      stroke={result.ats_score >= 70 ? 'var(--color-success)' : result.ats_score >= 40 ? 'var(--color-warning)' : 'var(--color-danger)'}
                      strokeWidth="8" strokeLinecap="round"
                      strokeDasharray={`${(result.ats_score / 100) * 264} 264`}
                    />
                  </svg>
                  <span className="score-value" style={{ fontSize: '1.5rem', color: 'var(--color-text)' }}>{result.ats_score}</span>
                </div>
                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-primary-light)' }}>Tailored Resume</span>
                {result.ats_feedback?.original_score !== undefined && (
                   <span style={{ fontSize: '0.75rem', color: 'var(--color-success)', fontWeight: 600, marginTop: '0.25rem' }}>
                     +{result.ats_score - result.ats_feedback.original_score} Match Boost
                   </span>
                )}
              </div>
            </div>

            {/* Suggestions */}
            {result.ats_feedback?.suggestions && result.ats_feedback.suggestions.length > 0 && (
              <div style={{ width: '100%', marginTop: '2rem', padding: '1rem', background: 'var(--color-surface)', borderRadius: '0.5rem' }}>
                <p style={{ fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--color-warning)' }}>Areas for Improvement:</p>
                <ul style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', paddingLeft: '1.25rem', margin: 0 }}>
                  {result.ats_feedback.suggestions.map((s, i) => <li key={i} style={{ marginBottom: '0.25rem' }}>{s}</li>)}
                </ul>
              </div>
            )}
          </div>

          {/* Toggle Preview Mode */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
            <button className={`btn ${previewMode === 'text' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setPreviewMode('text')}>
              📝 Text Data View
            </button>
            <button className={`btn ${previewMode === 'pdf' ? 'btn-primary' : 'btn-secondary'}`} onClick={handleLoadPdfs} disabled={pdfsLoading}>
              {pdfsLoading ? 'Loading Visual PDFs...' : '📄 Visual PDF Preview'}
            </button>
          </div>

          {previewMode === 'text' ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            {/* Original Resume Text */}
            <div className="card" style={{ maxHeight: '400px', overflow: 'auto' }}>
              <h3 style={{ fontWeight: 700, marginBottom: '1rem', color: 'var(--color-text-muted)' }}>Original Resume</h3>
              
              {originalResume?.skills && originalResume.skills.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>Technical Skills</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', opacity: 0.8 }}>
                    {originalResume.skills.map((skill, i) => (
                      <span key={i} className="badge badge-secondary" style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}>{String(skill)}</span>
                    ))}
                  </div>
                </div>
              )}

              {originalResume?.experience && originalResume.experience.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>Experience</p>
                  {originalResume.experience.map((exp, i) => (
                    <div key={i} style={{ marginBottom: '0.75rem', opacity: 0.8 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.8125rem' }}>{exp.title}</div>
                      {exp.bullets && (
                        <ul style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', paddingLeft: '1.25rem', marginTop: '0.25rem' }}>
                          {exp.bullets.map((b, j) => <li key={j}>{b}</li>)}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {originalResume?.projects && originalResume.projects.length > 0 && (
                <div>
                  <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>Projects</p>
                  {originalResume.projects.map((p, i) => (
                    <div key={i} style={{ marginBottom: '0.75rem', opacity: 0.8 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.8125rem' }}>{p.name}</div>
                      {p.bullets && (
                        <ul style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', paddingLeft: '1.25rem', marginTop: '0.25rem' }}>
                          {p.bullets.map((b, j) => <li key={j}>{b}</li>)}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tailored Content */}
            <div className="card" style={{ maxHeight: '400px', overflow: 'auto', border: '1px solid var(--color-primary-light)' }}>
              <h3 style={{ fontWeight: 700, marginBottom: '1rem', color: 'var(--color-primary-light)' }}>Tailored Content (Proposed)</h3>
            
            {result.tailored_data?.skills && result.tailored_data.skills.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-primary-light)', marginBottom: '0.5rem' }}>Optimized Technical Skills</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                  {result.tailored_data.skills.map((skill, i) => (
                    <span key={i} className="badge badge-primary" style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}>{skill}</span>
                  ))}
                </div>
              </div>
            )}

            {result.tailored_data?.tailored_experience_bullets && result.tailored_data.tailored_experience_bullets.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-primary-light)', marginBottom: '0.5rem' }}>Experience Bullets</p>
                <ul style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', paddingLeft: '1.25rem' }}>
                  {result.tailored_data.tailored_experience_bullets.map((b, i) => (
                    <li key={i} style={{ marginBottom: '0.375rem' }}>{b}</li>
                  ))}
                </ul>
              </div>
            )}
            {result.tailored_data?.selected_projects?.length > 0 && (
              <div>
                <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-accent)', marginBottom: '0.5rem' }}>Selected Projects</p>
                {result.tailored_data.selected_projects.map((p, i) => (
                  <div key={i} style={{ marginBottom: '0.75rem', padding: '0.75rem', background: 'var(--color-surface)', borderRadius: '0.5rem' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{p.name}</div>
                    {p.bullet_points && (
                      <ul style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', paddingLeft: '1.25rem', marginTop: '0.25rem' }}>
                        {p.bullet_points.map((b, j) => <li key={j}>{b}</li>)}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={() => handleDownloadPdf(result.id)} disabled={pdfGenerating}>
                {pdfGenerating ? 'Generating...' : '📄 Download PDF'}
              </button>
              <button className="btn btn-secondary" onClick={() => handleDownloadTex(result.id)} disabled={pdfGenerating}>
                {pdfGenerating ? 'Generating...' : '📝 Download .tex'}
              </button>
              <button className="btn btn-secondary" onClick={() => handleToggleEditLatex(result.id)} disabled={pdfGenerating}>
                {isEditingLatex ? 'Cancel Edit' : '✏️ Edit LaTeX'}
              </button>
            </div>
          </div>
          </div>
          ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
             <div className="card" style={{ padding: 0, height: '800px', display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ padding: '1rem', margin: 0, background: 'var(--color-surface)', fontSize: '0.875rem' }}>Original Resume (PDF)</h3>
                <iframe name="iframe-original" style={{ width: '100%', flex: 1, border: 'none', background: '#333' }} />
             </div>
             <div className="card" style={{ padding: 0, height: '800px', border: '1px solid var(--color-primary-light)', display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ padding: '1rem', margin: 0, background: 'var(--color-surface)', color: 'var(--color-primary-light)', fontSize: '0.875rem' }}>Tailored Optimized Resume (PDF)</h3>
                <iframe name="iframe-tailored" style={{ width: '100%', flex: 1, border: 'none', background: '#333' }} />
             </div>
          </div>
          )}
          
          {/* LaTeX Editor */}
          {isEditingLatex && (
             <div className="card animate-in" style={{ border: '1px solid var(--color-primary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ fontWeight: 700 }}>📝 Edit LaTeX Source</h3>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>Any changes saved here will reflect in the PDF</div>
                </div>
                <textarea 
                  className="input" 
                  style={{ width: '100%', height: '500px', fontFamily: 'monospace', fontSize: '0.875rem', whiteSpace: 'pre', background: '#1e1e1e', color: '#d4d4d4' }}
                  value={latexCode}
                  onChange={(e) => setLatexCode(e.target.value)}
                  spellCheck="false"
                />
                <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem' }}>
                  <button className="btn btn-primary" onClick={() => handleSaveLatex(result.id)} disabled={savingLatex}>
                    {savingLatex ? 'Saving...' : '💾 Save Changes'}
                  </button>
                  <button className="btn btn-secondary" onClick={() => setIsEditingLatex(false)}>
                    Cancel
                  </button>
                </div>
             </div>
          )}
        </div>
      )}

      {/* Email */}
      {emailText && (
        <div className="card animate-in" style={{ marginBottom: '2rem' }}>
          <div className="card-header">
            <h3 style={{ fontWeight: 700 }}>📧 Application Email</h3>
            <button className="btn btn-primary btn-sm" onClick={copyEmail}>
              {copied ? '✅ Copied!' : '📋 Copy'}
            </button>
          </div>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: 1.6, background: 'var(--color-surface)', padding: '1rem', borderRadius: '0.5rem' }}>
            {emailText}
          </pre>
        </div>
      )}

      {/* Past Tailored Resumes */}
      {tailored.length > 0 && (
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>📜 Past Tailored Resumes</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {tailored.map(t => (
              <div key={t.id} 
                onClick={() => setSelectedTailoredModal(t)}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '0.75rem 1rem', background: 'var(--color-surface)', borderRadius: '0.5rem',
                  cursor: 'pointer', transition: 'transform 0.2s', border: '1px solid transparent'
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                    {t.resumes?.title || 'Resume'} → {t.jobs?.title || t.jobs?.company || 'Job'}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                    {new Date(t.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <span className={`badge ${t.ats_score >= 70 ? 'badge-success' : t.ats_score >= 40 ? 'badge-warning' : 'badge-danger'}`}>
                    ATS: {t.ats_score}
                  </span>
                  <button onClick={(e) => handleDeleteTailored(t.id, e)} style={{ background: 'transparent', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interactive Modal for Past Tailored Resumes */}
      {selectedTailoredModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', zIndex: 1000,
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          backdropFilter: 'blur(4px)', padding: '2rem'
        }}>
          <div className="card animate-in" style={{
            width: '100%', maxWidth: '1000px', maxHeight: '95vh', overflowY: 'auto',
            background: 'var(--color-background)', position: 'relative'
          }}>
            <button 
              onClick={() => { setSelectedTailoredModal(null); setModalPreviewMode('text'); }}
              style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}
            >
              ✕
            </button>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              {selectedTailoredModal.jobs?.title || 'Job'} @ {selectedTailoredModal.jobs?.company || 'Company'}
            </h2>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>Tailored on {new Date(selectedTailoredModal.created_at).toLocaleDateString()}</p>

            {/* ATS Score Rings */}
            <div className="card" style={{ display: 'flex', justifyContent: 'center', gap: '4rem', alignItems: 'center', marginBottom: '2rem', background: 'var(--color-surface)' }}>
              {/* Original Score */}
              {selectedTailoredModal.ats_feedback?.original_score !== undefined && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div className="score-ring" style={{ marginBottom: '0.75rem', transform: 'scale(0.85)' }}>
                    <svg width="100" height="100" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="#333" strokeWidth="8" />
                      <circle cx="50" cy="50" r="42" fill="none"
                        stroke={selectedTailoredModal.ats_feedback.original_score >= 70 ? 'var(--color-success)' : selectedTailoredModal.ats_feedback.original_score >= 40 ? 'var(--color-warning)' : 'var(--color-danger)'}
                        strokeWidth="8" strokeLinecap="round"
                        strokeDasharray={`${(selectedTailoredModal.ats_feedback.original_score / 100) * 264} 264`}
                      />
                    </svg>
                    <span className="score-value" style={{ color: 'var(--color-text-muted)', fontSize: '1.25rem' }}>{selectedTailoredModal.ats_feedback.original_score}</span>
                  </div>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Original Resume</span>
                </div>
              )}

              {/* Arrow */}
              {selectedTailoredModal.ats_feedback?.original_score !== undefined && (
                 <div style={{ fontSize: '2rem', color: 'var(--color-primary-light)', opacity: 0.5 }}>→</div>
              )}

              {/* Final Score */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div className="score-ring" style={{ marginBottom: '0.75rem', transform: 'scale(1.1)' }}>
                  <svg width="100" height="100" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#333" strokeWidth="8" />
                    <circle cx="50" cy="50" r="42" fill="none"
                      stroke={selectedTailoredModal.ats_score >= 70 ? 'var(--color-success)' : selectedTailoredModal.ats_score >= 40 ? 'var(--color-warning)' : 'var(--color-danger)'}
                      strokeWidth="8" strokeLinecap="round"
                      strokeDasharray={`${(selectedTailoredModal.ats_score / 100) * 264} 264`}
                    />
                  </svg>
                  <span className="score-value" style={{ fontSize: '1.5rem', color: 'var(--color-text)' }}>{selectedTailoredModal.ats_score}</span>
                </div>
                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-primary-light)' }}>Tailored Resume</span>
                {selectedTailoredModal.ats_feedback?.original_score !== undefined && (
                   <span style={{ fontSize: '0.75rem', color: 'var(--color-success)', fontWeight: 600, marginTop: '0.25rem' }}>
                     +{selectedTailoredModal.ats_score - selectedTailoredModal.ats_feedback.original_score} Match Boost
                   </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '2rem' }}>
              <button className="btn btn-primary" onClick={() => handleDownloadPdf(selectedTailoredModal.id)} disabled={pdfGenerating}>
                {pdfGenerating ? 'Generating...' : '📄 Download Tailored PDF'}
              </button>
              <button className="btn btn-secondary" onClick={() => handleDownloadTex(selectedTailoredModal.id)} disabled={pdfGenerating}>
                {pdfGenerating ? 'Generating...' : '📝 Download Tailored .tex'}
              </button>
            </div>

            {/* Toggle Preview Mode */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', justifyContent: 'center' }}>
              <button className={`btn ${modalPreviewMode === 'text' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setModalPreviewMode('text')}>
                📝 Stats View
              </button>
              <button className={`btn ${modalPreviewMode === 'pdf' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => handleLoadModalPdfs(selectedTailoredModal)} disabled={modalPdfsLoading}>
                {modalPdfsLoading ? 'Loading Visual PDFs...' : '📄 Original vs Tailored Preview'}
              </button>
            </div>

            {modalPreviewMode === 'pdf' && (
              <div className="animate-in" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginTop: '1rem' }}>
                 <div className="card" style={{ padding: 0, height: '700px', display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ padding: '1rem', margin: 0, background: 'var(--color-surface)', fontSize: '0.875rem' }}>Original Resume (PDF)</h3>
                    <iframe name="modal-iframe-original" style={{ width: '100%', flex: 1, border: 'none', background: '#333' }} />
                 </div>
                 <div className="card" style={{ padding: 0, height: '700px', border: '1px solid var(--color-primary-light)', display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ padding: '1rem', margin: 0, background: 'var(--color-surface)', color: 'var(--color-primary-light)', fontSize: '0.875rem' }}>Tailored Optimized Resume (PDF)</h3>
                    <iframe name="modal-iframe-tailored" style={{ width: '100%', flex: 1, border: 'none', background: '#333' }} />
                 </div>
              </div>
            )}

            {error && <div className="alert alert-error" style={{ marginTop: '1rem' }}>{error}</div>}
          </div>
        </div>
      )}
    </div>
  );
}
