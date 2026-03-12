'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { getApplications, createApplication, updateApplication, deleteApplication, getJobs } from '@/lib/api';

const STAGES = ['saved', 'applied', 'assessment', 'interview', 'offer', 'rejected'];
const STAGE_COLORS = {
  saved: 'badge-neutral', applied: 'badge-primary', assessment: 'badge-warning',
  interview: 'badge-warning', offer: 'badge-success', rejected: 'badge-danger',
};
const STAGE_ICONS = {
  saved: '📌', applied: '📤', assessment: '📝', interview: '💬', offer: '🎉', rejected: '❌',
};

export default function TrackerPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [apps, setApps] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [addJobId, setAddJobId] = useState('');
  const [addNotes, setAddNotes] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!authLoading && !user) { router.push('/login'); return; }
    if (user) loadData();
  }, [user, authLoading]);

  async function loadData() {
    try {
      const [a, j] = await Promise.all([
        getApplications().catch(() => ({ applications: [] })),
        getJobs().catch(() => ({ jobs: [] })),
      ]);
      setApps(a.applications || []);
      setJobs(j.jobs || []);
    } catch { } finally { setLoading(false); }
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!addJobId) return;
    try {
      await createApplication({ job_id: addJobId, notes: addNotes, status: 'saved' });
      setAddJobId(''); setAddNotes(''); setShowAdd(false);
      loadData();
    } catch (err) { setError(err.message); }
  }

  async function handleStatusChange(appId, newStatus) {
    try {
      await updateApplication(appId, { status: newStatus });
      loadData();
    } catch (err) { setError(err.message); }
  }

  async function handleDelete(appId) {
    if (!confirm('Delete this application?')) return;
    try {
      await deleteApplication(appId);
      setApps(apps.filter(a => a.id !== appId));
    } catch (err) { setError(err.message); }
  }

  const filteredApps = filter === 'all' ? apps : apps.filter(a => a.status === filter);

  // Count by stage
  const counts = {};
  STAGES.forEach(s => { counts[s] = apps.filter(a => a.status === s).length; });

  if (authLoading || !user) return <div className="loading-center"><div className="spinner"></div></div>;

  return (
    <div className="page-container animate-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>📋 Job Tracker</h1>
          <p>Track your applications across all stages</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(!showAdd)}>
          {showAdd ? 'Cancel' : '+ Track Application'}
        </button>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

      {/* Add Form */}
      {showAdd && (
        <div className="card animate-in" style={{ marginBottom: '2rem' }}>
          <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="input-group">
              <label>Select Job</label>
              <select className="input" value={addJobId} onChange={e => setAddJobId(e.target.value)} required>
                <option value="">Choose...</option>
                {jobs.map(j => (
                  <option key={j.id} value={j.id}>{j.title || 'Untitled'} {j.company ? `@ ${j.company}` : ''}</option>
                ))}
              </select>
            </div>
            <div className="input-group">
              <label>Notes (optional)</label>
              <input className="input" placeholder="e.g. Applied via LinkedIn" value={addNotes} onChange={e => setAddNotes(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>Add to Tracker</button>
          </form>
        </div>
      )}

      {/* Stage Overview */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <button className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter('all')}>
          All ({apps.length})
        </button>
        {STAGES.map(s => (
          <button key={s} className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter(s)}>
            {STAGE_ICONS[s]} {s.charAt(0).toUpperCase() + s.slice(1)} ({counts[s] || 0})
          </button>
        ))}
      </div>

      {/* Application List */}
      {loading ? (
        <div className="loading-center"><div className="spinner"></div></div>
      ) : filteredApps.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <h3>{filter === 'all' ? 'No applications tracked' : `No ${filter} applications`}</h3>
          <p>Start tracking your job applications</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filteredApps.map(app => (
            <div key={app.id} className="card" style={{ padding: '1rem 1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>
                    {app.jobs?.title || 'Untitled Job'}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                    {app.jobs?.company || 'Unknown'} · Added {new Date(app.created_at).toLocaleDateString()}
                    {app.notes && ` · ${app.notes}`}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <select
                    className="input"
                    value={app.status}
                    onChange={e => handleStatusChange(app.id, e.target.value)}
                    style={{ padding: '0.375rem 0.75rem', width: 'auto', fontSize: '0.8125rem' }}
                  >
                    {STAGES.map(s => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                  <span className={`badge ${STAGE_COLORS[app.status]}`}>
                    {STAGE_ICONS[app.status]} {app.status}
                  </span>
                  <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(app.id)} title="Delete">🗑️</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
