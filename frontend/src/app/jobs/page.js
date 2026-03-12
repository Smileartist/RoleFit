'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { getJobs, createJob, deleteJob } from '@/lib/api';

export default function JobsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [mode, setMode] = useState('url'); // 'url' or 'text'
  const [form, setForm] = useState({ title: '', company: '', description: '', source_url: '' });

  useEffect(() => {
    if (!authLoading && !user) { router.push('/login'); return; }
    if (user) loadJobs();
  }, [user, authLoading]);

  async function loadJobs() {
    try {
      const data = await getJobs();
      setJobs(data.jobs || []);
    } catch { } finally { setLoading(false); }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setSuccess(''); setSubmitting(true);

    try {
      await createJob({
        title: form.title,
        company: form.company,
        description: mode === 'text' ? form.description : '',
        source_url: mode === 'url' ? form.source_url : '',
      });
      setSuccess('Job added successfully!');
      setForm({ title: '', company: '', description: '', source_url: '' });
      loadJobs();
    } catch (err) {
      setError(err.message);
    } finally { setSubmitting(false); }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this job?')) return;
    try { await deleteJob(id); setJobs(jobs.filter(j => j.id !== id)); } catch (err) { setError(err.message); }
  }

  if (authLoading || !user) return <div className="loading-center"><div className="spinner"></div></div>;

  return (
    <div className="page-container animate-in">
      <div className="page-header">
        <h1>💼 Jobs</h1>
        <p>Add job descriptions to tailor your resume</p>
      </div>

      {/* Add Job Form */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem' }}>Add New Job</h2>

        {/* Mode Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <button className={`btn btn-sm ${mode === 'url' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setMode('url')}>
            🔗 Paste Job URL
          </button>
          <button className={`btn btn-sm ${mode === 'text' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setMode('text')}>
            📝 Paste Description
          </button>
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}
        {success && <div className="alert alert-success" style={{ marginBottom: '1rem' }}>{success}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group">
              <label>Job Title (optional)</label>
              <input className="input" placeholder="e.g. Frontend Developer" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="input-group">
              <label>Company (optional)</label>
              <input className="input" placeholder="e.g. Google" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} />
            </div>
          </div>

          {mode === 'url' ? (
            <div className="input-group">
              <label>Job URL</label>
              <input className="input" placeholder="https://linkedin.com/jobs/..." value={form.source_url} onChange={e => setForm({ ...form, source_url: e.target.value })} required />
            </div>
          ) : (
            <div className="input-group">
              <label>Job Description</label>
              <textarea className="input" placeholder="Paste the full job description here..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required style={{ minHeight: '200px' }} />
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={submitting} style={{ alignSelf: 'flex-start' }}>
            {submitting ? 'Adding...' : '+ Add Job'}
          </button>
        </form>
      </div>

      {/* Job List */}
      {loading ? (
        <div className="loading-center"><div className="spinner"></div></div>
      ) : jobs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">💼</div>
          <h3>No jobs added</h3>
          <p>Paste a job URL or description to get started</p>
        </div>
      ) : (
        <div className="grid-2">
          {jobs.map(j => (
            <div key={j.id} className="card">
              <div className="card-header">
                <h3 style={{ fontWeight: 700 }}>{j.title || 'Untitled Job'}</h3>
                {j.source_url && (
                  <a href={j.source_url} target="_blank" rel="noopener" className="btn btn-ghost btn-sm">🔗</a>
                )}
              </div>
              {j.company && (
                <p style={{ fontSize: '0.875rem', color: 'var(--color-primary-light)', marginBottom: '0.5rem' }}>
                  🏢 {j.company}
                </p>
              )}
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem', lineHeight: 1.5 }}>
                {j.description?.substring(0, 200)}{j.description?.length > 200 ? '...' : ''}
              </p>
              {j.extracted_skills && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '0.75rem' }}>
                  {(j.extracted_skills.required_skills || j.extracted_skills.technologies || []).slice(0, 5).map(s => (
                    <span key={s} className="badge badge-primary">{s}</span>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                <span>Added {new Date(j.created_at).toLocaleDateString()}</span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                <button className="btn btn-primary btn-sm" onClick={() => router.push(`/tailor?jobId=${j.id}`)}>✨ Tailor Resume</button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(j.id)}>🗑️ Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
