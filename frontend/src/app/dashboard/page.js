'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { getResumes, getJobs, getApplications, getTailoredResumes, createJob } from '@/lib/api';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({ resumes: 0, jobs: 0, tailored: 0, applications: 0 });
  const [recentApps, setRecentApps] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Quick Tailor State
  const [quickInput, setQuickInput] = useState('');
  const [quickLoading, setQuickLoading] = useState(false);
  const [quickError, setQuickError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) loadDashboard();
  }, [user, authLoading]);

  async function loadDashboard() {
    try {
      const [r, j, t, a] = await Promise.all([
        getResumes().catch(() => ({ resumes: [] })),
        getJobs().catch(() => ({ jobs: [] })),
        getTailoredResumes().catch(() => ({ tailored_resumes: [] })),
        getApplications().catch(() => ({ applications: [] })),
      ]);
      setStats({
        resumes: r.resumes?.length || 0,
        jobs: j.jobs?.length || 0,
        tailored: t.tailored_resumes?.length || 0,
        applications: a.applications?.length || 0,
      });
      setRecentApps((a.applications || []).slice(0, 5));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (authLoading || !user) {
    return <div className="loading-center"><div className="spinner"></div></div>;
  }

  async function handleQuickTailor(e) {
    e.preventDefault();
    if (!quickInput) return;
    setQuickLoading(true); setQuickError('');
    
    try {
      const input = quickInput.trim();
      let source_url = '';
      let description = '';

      if (input.startsWith('http://') || input.startsWith('https://')) {
        source_url = input;
      } else {
        description = input;
        if (description.length < 20) throw new Error('Description is too short. Please paste the full job description or a URL.');
      }

      // Create the job silently in the background
      const data = await createJob({
        title: '', company: '', description, source_url
      });
      // Route immediately to the tailor page with the new job ID
      router.push(`/tailor?jobId=${data.job.id}`);
    } catch (err) {
      setQuickError(err.message);
      setQuickLoading(false);
    }
  }

  const statCards = [
    { icon: '📄', label: 'Resumes', value: stats.resumes, color: '#6366f1', href: '/resumes' },
    { icon: '💼', label: 'Jobs Saved', value: stats.jobs, color: '#06b6d4', href: '/jobs' },
    { icon: '✨', label: 'Tailored', value: stats.tailored, color: '#22c55e', href: '/tailor' },
    { icon: '📋', label: 'Applications', value: stats.applications, color: '#f59e0b', href: '/tracker' },
  ];

  const statusColors = {
    saved: 'badge-neutral', applied: 'badge-primary', assessment: 'badge-warning',
    interview: 'badge-warning', offer: 'badge-success', rejected: 'badge-danger',
  };

  return (
    <div className="page-container animate-in">
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <h1>Welcome back, {user.name?.split(' ')[0]} 👋</h1>
        <p>Let&apos;s land your dream role.</p>
      </div>

      {/* Massive Quick Tailor CTA */}
      <div className="card animate-in" style={{ 
        marginBottom: '3rem', 
        padding: '2rem', 
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(34, 197, 94, 0.05) 100%)',
        border: '1px solid var(--color-primary-light)',
        textAlign: 'center'
      }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--color-primary-light)' }}>
          ✨ Magic Tailor
        </h2>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem', fontSize: '1.125rem' }}>
          Paste a target Job URL or the full Job Description text below. We will instantly extract the requirements and optimize your resume.
        </p>

        <form onSubmit={handleQuickTailor} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '800px', margin: '0 auto' }}>
          <textarea 
            className="input" 
            placeholder="https://linkedin.com/jobs/view/... OR paste the entire job description text here..." 
            value={quickInput}
            onChange={e => setQuickInput(e.target.value)}
            required
            rows="3"
            style={{ width: '100%', padding: '1rem 1.25rem', fontSize: '1rem', borderRadius: '0.75rem', resize: 'vertical' }}
          />
          <button type="submit" className="btn btn-primary btn-lg" disabled={quickLoading} style={{ alignSelf: 'center', padding: '0 3rem', fontSize: '1.125rem', borderRadius: '0.75rem' }}>
            {quickLoading ? 'Extracting...' : 'Tailor ✨'}
          </button>
        </form>
        {quickError && <div style={{ color: 'var(--color-danger)', marginTop: '1rem', fontSize: '0.875rem' }}>{quickError}</div>}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {statCards.map((s) => (
          <Link key={s.label} href={s.href} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: `${s.color}20`, color: s.color }}>{s.icon}</div>
              <div>
                <div className="stat-value">{loading ? '–' : s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem' }}>⚡ Quick Actions</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
          <Link href="/resumes" className="btn btn-primary">Upload Resume</Link>
          <Link href="/jobs" className="btn btn-secondary">Add Job</Link>
          <Link href="/tailor" className="btn btn-secondary">Tailor Resume</Link>
          <Link href="/projects" className="btn btn-secondary">Manage Projects</Link>
        </div>
      </div>

      {/* Recent Applications */}
      <div className="card">
        <div className="card-header">
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700 }}>📋 Recent Applications</h2>
          <Link href="/tracker" className="btn btn-ghost btn-sm">View All →</Link>
        </div>
        {!loading && recentApps.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h3>No applications yet</h3>
            <p>Start by adding a job and tailoring your resume</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {recentApps.map((app) => (
              <div key={app.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0.75rem 1rem', background: 'var(--color-surface)', borderRadius: '0.5rem',
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>
                    {app.jobs?.title || 'Untitled Job'}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                    {app.jobs?.company || 'Unknown Company'}
                  </div>
                </div>
                <span className={`badge ${statusColors[app.status] || 'badge-neutral'}`}>
                  {app.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
