'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { getResumes, uploadResume, deleteResume, generateOriginalLatex } from '@/lib/api';

export default function ResumesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileRef = useRef(null);
  const [title, setTitle] = useState('');
  const [viewResume, setViewResume] = useState(null);
  const [resumePreviewMode, setResumePreviewMode] = useState('pdf'); // 'json' | 'pdf'
  const [renderingPdf, setRenderingPdf] = useState(false);
  const [renderError, setRenderError] = useState('');
  const [editedLatex, setEditedLatex] = useState('');
  const [savingLatex, setSavingLatex] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) { router.push('/login'); return; }
    if (user) loadResumes();
  }, [user, authLoading]);

  async function loadResumes() {
    try {
      const data = await getResumes();
      setResumes(data.resumes || []);
    } catch { } finally { setLoading(false); }
  }

  async function handleUpload(e) {
    e.preventDefault();
    const file = fileRef.current?.files[0];
    if (!file) { setError('Please select a file.'); return; }

    setUploading(true); setError(''); setSuccess('');
    try {
      await uploadResume(file, title);
      setSuccess('Resume uploaded and parsed successfully!');
      setTitle('');
      fileRef.current.value = '';
      loadResumes();
    } catch (err) {
      setError(err.message);
    } finally { setUploading(false); }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this resume?')) return;
    try {
      await deleteResume(id);
      setResumes(resumes.filter(r => r.id !== id));
    } catch (err) { setError(err.message); }
  }

  async function handleViewResume(resume) {
    if (viewResume?.id === resume.id) {
      setViewResume(null);
      return;
    }
    setViewResume(resume);
    setResumePreviewMode('pdf');
    setRenderError('');
    setEditedLatex(resume.latex_template || '');
    if (resume.latex_template) {
      try {
        setRenderingPdf(true);
        const data = await generateOriginalLatex(resume.id);
        await handleRenderPdf(data.latex_content, `iframe-resume-${resume.id}`);
      } catch (err) {
        setRenderError(err.message);
        setRenderingPdf(false);
      }
    }
  }

  async function handleSaveLatex() {
    if (!viewResume) return;
    setSavingLatex(true);
    setRenderError('');
    try {
      setRenderingPdf(true);
      const data = await generateOriginalLatex(viewResume.id, editedLatex);
      const updatedResumes = resumes.map(r => r.id === viewResume.id ? { ...r, latex_template: editedLatex } : r);
      setResumes(updatedResumes);
      setViewResume({ ...viewResume, latex_template: editedLatex });
      await handleRenderPdf(data.latex_content, `iframe-resume-${viewResume.id}`);
    } catch (err) {
      setRenderError(err.message);
      setRenderingPdf(false);
    } finally {
      setSavingLatex(false);
    }
  }

  async function handleRenderPdf(latexText, iframeId) {
    setRenderingPdf(true);
    try {
      const res = await fetch('/api/latex/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latexCode: latexText }),
      });

      if (!res.ok) {
        let errText = 'Compilation Failed';
        try {
          const errData = await res.json();
          errText = errData.error || errText;
        } catch {
          errText = await res.text();
        }
        throw new Error(errText);
      }
      
      const arrayBuffer = await res.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = typeof window !== 'undefined' ? window.btoa(binary) : '';
      const dataUri = `data:application/pdf;base64,${base64}`;
      
      const iframe = document.getElementById(iframeId);
      if (iframe) iframe.src = dataUri;
    } catch (e) {
      console.error('PDF Render Error:', e);
      setRenderError(e.message);
    } finally {
      setRenderingPdf(false);
    }
  }

  if (authLoading || !user) return <div className="loading-center"><div className="spinner"></div></div>;

  return (
    <div className="page-container animate-in">
      <div className="page-header">
        <h1>📄 My Resumes</h1>
        <p>Upload and manage your resumes</p>
      </div>

      {/* Upload Form */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem' }}>Upload New Resume</h2>
        {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}
        {success && <div className="alert alert-success" style={{ marginBottom: '1rem' }}>{success}</div>}
        <form onSubmit={handleUpload} style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end' }}>
          <div className="input-group" style={{ flex: '1 1 200px' }}>
            <label>Resume Title</label>
            <input className="input" placeholder="e.g. Frontend Resume" value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div className="input-group" style={{ flex: '1 1 200px' }}>
            <label>File (PDF or DOCX)</label>
            <input type="file" ref={fileRef} accept=".pdf,.docx" className="input" style={{ padding: '0.5rem' }} />
          </div>
          <button type="submit" className="btn btn-primary" disabled={uploading}>
            {uploading ? 'Uploading...' : '📤 Upload'}
          </button>
        </form>
      </div>

      {/* Resume List */}
      {loading ? (
        <div className="loading-center"><div className="spinner"></div></div>
      ) : resumes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📄</div>
          <h3>No resumes uploaded</h3>
          <p>Upload your first resume to get started</p>
        </div>
      ) : (
        <div className="grid-2">
          {resumes.map(r => (
            <div key={r.id} className="card">
              <div className="card-header">
                <h3 style={{ fontWeight: 700 }}>{r.title}</h3>
                <span className="badge badge-primary">{r.file_type?.toUpperCase()}</span>
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
                Uploaded {new Date(r.created_at).toLocaleDateString()}
              </p>
              {r.structured_data && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '0.75rem' }}>
                  {(r.structured_data.skills || []).slice(0, 6).map(s => (
                    <span key={s} className="badge badge-neutral">{s}</span>
                  ))}
                  {(r.structured_data.skills?.length || 0) > 6 && (
                    <span className="badge badge-neutral">+{r.structured_data.skills.length - 6}</span>
                  )}
                </div>
              )}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => handleViewResume(r)}>
                  👁️ View Details
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(r.id)}>🗑️ Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Interactive Resume View Modal */}
      {viewResume && (
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
              onClick={() => { setViewResume(null); setResumePreviewMode('pdf'); }}
              style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}
            >
              ✕
            </button>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              {viewResume.title}
            </h2>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>Uploaded on {new Date(viewResume.created_at).toLocaleDateString()}</p>
                  
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', justifyContent: 'center' }}>
              <button className={`btn ${resumePreviewMode === 'pdf' ? 'btn-primary' : 'btn-secondary'}`} 
                onClick={async () => { 
                  setResumePreviewMode('pdf'); 
                  if (viewResume.latex_template) {
                    try {
                      setRenderingPdf(true);
                      const data = await generateOriginalLatex(viewResume.id);
                      await handleRenderPdf(data.latex_content, `iframe-resume-${viewResume.id}`);
                    } catch(e) {
                      setRenderError(e.message);
                      setRenderingPdf(false);
                    }
                  } 
                }}>
                📄 Visual Render (Exact LaTeX)
              </button>
              <button className={`btn ${resumePreviewMode === 'json' ? 'btn-primary' : 'btn-secondary'}`} 
                onClick={() => setResumePreviewMode('json')}>
                {`{ }`} Extracted Struct Data
              </button>
            </div>

            {resumePreviewMode === 'json' && viewResume.structured_data && (
              <pre style={{ whiteSpace: 'pre-wrap', color: 'var(--color-text-muted)', maxHeight: '600px', overflowY: 'auto', background: 'var(--color-surface)', padding: '1.5rem', borderRadius: '0.5rem' }}>
                {JSON.stringify(viewResume.structured_data, null, 2)}
              </pre>
            )}

            {resumePreviewMode === 'pdf' && (
              <div style={{ position: 'relative', height: '700px', width: '100%', border: '1px solid var(--color-primary-light)', borderRadius: '0.5rem', overflow: 'hidden' }}>
                {viewResume.latex_template ? (
                  <>
                    {renderingPdf && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="spinner"></div></div>}
                    {renderError ? (
                       <div style={{ padding: '2rem', height: '100%', overflowY: 'auto', background: '#2a1215', color: '#ffb4ab' }}>
                         <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontWeight: 700 }}>⚠️ LaTeX Compilation Error</h3>
                         <p style={{ marginBottom: '1rem' }}>The AI successfully cloned the layout structure, but generated invalid LaTeX syntax. You can fix this by editing the Exact Generated LaTeX Code below.</p>
                         <pre style={{ whiteSpace: 'pre-wrap', background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '0.5rem', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                           {renderError}
                         </pre>
                       </div>
                    ) : (
                     <iframe id={`iframe-resume-${viewResume.id}`} style={{ width: '100%', height: '100%', border: 'none', background: '#333' }} />
                    )}
                  </>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-text-muted)', padding: '2rem', textAlign: 'center' }}>
                    <span style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</span>
                    <h3 style={{ fontSize: '1.25rem', color: '#fff', marginBottom: '0.5rem' }}>No exact LaTeX code was generated for this resume.</h3>
                    <p style={{ maxWidth: '500px', lineHeight: 1.6 }}>Old legacy uploads do not have a visual LaTeX template saved. Please re-upload this resume to generate its exact code natively!</p>
                  </div>
                )}
              </div>
            )}
            
            {resumePreviewMode === 'pdf' && viewResume.latex_template && (
              <div style={{ marginTop: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                   <p style={{ fontWeight: 600, color: 'var(--color-warning)', margin: 0 }}>View Exact LaTeX Code:</p>
                   <button className="btn btn-secondary btn-sm" onClick={handleSaveLatex} disabled={savingLatex}>
                     {savingLatex ? 'Saving...' : '💾 Save Changes'}
                   </button>
                </div>
                <textarea 
                  value={editedLatex} 
                  onChange={(e) => setEditedLatex(e.target.value)}
                  style={{ width: '100%', height: '200px', background: '#1e1e1e', color: '#d4d4d4', fontFamily: 'monospace', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #333' }}
                />
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
