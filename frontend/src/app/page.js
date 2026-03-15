'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Hero */}
      <section style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '4rem 1.5rem',
        background: 'radial-gradient(ellipse at top, rgba(99, 102, 241, 0.12) 0%, transparent 60%)',
      }}>
        <div style={{ maxWidth: '680px' }}>
          <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'center' }}>
            <img 
              src="/logo-wide.png?v=5" 
              alt="RoleFit Logo" 
              style={{ height: '64px', width: 'auto', borderRadius: '12px' }} 
            />
          </div>
          <h1 style={{
            fontSize: '3rem',
            fontWeight: 800,
            lineHeight: 1.1,
            marginBottom: '1.25rem',
            background: 'linear-gradient(135deg, #f1f5f9 0%, #818cf8 50%, #06b6d4 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Tailor Your Resume.<br />Land More Interviews.
          </h1>
          <p style={{
            fontSize: '1.125rem',
            color: 'var(--color-text-muted)',
            lineHeight: 1.6,
            marginBottom: '2rem',
          }}>
            RoleFit uses AI to analyze job descriptions and automatically generate
            ATS-optimized resumes tailored for every role you apply to.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/register" className="btn btn-primary btn-lg">
              Get Started Free →
            </Link>
            <Link href="/login" className="btn btn-secondary btn-lg">
              Sign In
            </Link>
          </div>

          {/* Feature Pills */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.75rem',
            justifyContent: 'center',
            marginTop: '3rem',
          }}>
            {['AI Resume Tailoring', 'ATS Scoring', 'Smart Project Selection', 'Email Generator', 'Job Tracker'].map((f) => (
              <span key={f} className="badge badge-primary" style={{ fontSize: '0.8125rem', padding: '0.375rem 1rem' }}>
                {f}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid  */}
      <section style={{ padding: '4rem 1.5rem', maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
        <h2 style={{ textAlign: 'center', fontSize: '1.75rem', fontWeight: 700, marginBottom: '2.5rem' }}>
          How RoleFit Works
        </h2>
        <div className="grid-3">
          {[
            { icon: '📄', title: 'Upload Resume', desc: 'Upload your master resume (PDF or DOCX). RoleFit extracts and structures your experience.' },
            { icon: '💼', title: 'Add Job', desc: 'Paste a job description or drop a link. RoleFit extracts required skills and keywords.' },
            { icon: '✨', title: 'Generate', desc: 'Get an ATS-optimized resume with tailored bullets, relevant projects, and a compatibility score.' },
          ].map((f) => (
            <div key={f.title} className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>{f.icon}</div>
              <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>{f.title}</h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', lineHeight: 1.5 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '2rem',
        textAlign: 'center',
        color: 'var(--color-text-muted)',
        fontSize: '0.8125rem',
        borderTop: '1px solid var(--color-border)',
      }}>
        Built by SmileArtist · RoleFit © {new Date().getFullYear()}
      </footer>
    </div>
  );
}
