'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { getProjects, createProject, updateProject, deleteProject } from '@/lib/api';

export default function ProjectsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', description: '', tech_stack: '', features: '', url: '' });

  useEffect(() => {
    if (!authLoading && !user) { router.push('/login'); return; }
    if (user) loadProjects();
  }, [user, authLoading]);

  async function loadProjects() {
    try {
      const data = await getProjects();
      setProjects(data.projects || []);
    } catch { } finally { setLoading(false); }
  }

  function resetForm() {
    setForm({ name: '', description: '', tech_stack: '', features: '', url: '' });
    setEditing(null); setShowForm(false); setError('');
  }

  function startEdit(project) {
    setForm({
      name: project.name || '',
      description: project.description || '',
      tech_stack: (project.tech_stack || []).join(', '),
      features: (project.features || []).join(', '),
      url: project.url || '',
    });
    setEditing(project.id);
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) { setError('Project name is required.'); return; }
    setError('');

    const payload = {
      name: form.name,
      description: form.description,
      tech_stack: form.tech_stack.split(',').map(s => s.trim()).filter(Boolean),
      features: form.features.split(',').map(s => s.trim()).filter(Boolean),
      url: form.url || null,
    };

    try {
      if (editing) {
        await updateProject(editing, payload);
      } else {
        await createProject(payload);
      }
      resetForm();
      loadProjects();
    } catch (err) { setError(err.message); }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this project?')) return;
    try {
      await deleteProject(id);
      setProjects(projects.filter(p => p.id !== id));
    } catch (err) { setError(err.message); }
  }

  if (authLoading || !user) return <div className="loading-center"><div className="spinner"></div></div>;

  return (
    <div className="page-container animate-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>🛠️ Projects</h1>
          <p>Manage your project portfolio</p>
        </div>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(!showForm); }}>
          {showForm ? 'Cancel' : '+ New Project'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card animate-in" style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem' }}>
            {editing ? 'Edit Project' : 'Add New Project'}
          </h2>
          {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="input-group">
              <label>Project Name *</label>
              <input className="input" placeholder="e.g. SmileArtist" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="input-group">
              <label>Description</label>
              <textarea className="input" placeholder="What does this project do?" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="input-group">
                <label>Tech Stack (comma-separated)</label>
                <input className="input" placeholder="React, Node.js, PostgreSQL" value={form.tech_stack} onChange={e => setForm({ ...form, tech_stack: e.target.value })} />
              </div>
              <div className="input-group">
                <label>Key Features (comma-separated)</label>
                <input className="input" placeholder="Auth, Real-time chat, Dashboard" value={form.features} onChange={e => setForm({ ...form, features: e.target.value })} />
              </div>
            </div>
            <div className="input-group">
              <label>Project URL (optional)</label>
              <input className="input" placeholder="https://github.com/..." value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="submit" className="btn btn-primary">
                {editing ? 'Save Changes' : 'Create Project'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Project List */}
      {loading ? (
        <div className="loading-center"><div className="spinner"></div></div>
      ) : projects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🛠️</div>
          <h3>No projects added</h3>
          <p>Add your projects so RoleFit can select relevant ones for each job</p>
        </div>
      ) : (
        <div className="grid-2">
          {projects.map(p => (
            <div key={p.id} className="card">
              <div className="card-header">
                <h3 style={{ fontWeight: 700 }}>{p.name}</h3>
                {p.url && (
                  <a href={p.url} target="_blank" rel="noopener" className="btn btn-ghost btn-sm">🔗</a>
                )}
              </div>
              {p.description && (
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem', lineHeight: 1.5 }}>
                  {p.description.length > 150 ? p.description.substring(0, 150) + '...' : p.description}
                </p>
              )}
              {Array.isArray(p.tech_stack) && p.tech_stack.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '0.75rem' }}>
                  {p.tech_stack.map(t => (
                    <span key={t} className="badge badge-primary">{t}</span>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => startEdit(p)}>✏️ Edit</button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id)}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
