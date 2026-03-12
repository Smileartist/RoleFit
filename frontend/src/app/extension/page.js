'use client';

import Link from 'next/link';

export default function ExtensionPage() {
  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Hero */}
      <section style={{
        textAlign: 'center',
        padding: '4rem 1.5rem 2.5rem',
        background: 'radial-gradient(ellipse at top, rgba(99, 102, 241, 0.12) 0%, transparent 60%)',
      }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🧩</div>
        <h1 style={{
          fontSize: '2.5rem', fontWeight: 800, lineHeight: 1.1, marginBottom: '1rem',
          background: 'linear-gradient(135deg, #f1f5f9 0%, #818cf8 50%, #06b6d4 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        }}>
          RoleFit Browser Extension
        </h1>
        <p style={{ fontSize: '1.125rem', color: 'var(--color-text-muted)', maxWidth: '600px', margin: '0 auto 2rem', lineHeight: 1.6 }}>
          Extract job descriptions directly from LinkedIn, Indeed, Internshala, Unstop and more — with a single click. No copy-pasting needed.
        </p>
        <a
          href="/rolefit-extension.zip"
          download
          className="btn btn-primary btn-lg"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}
        >
          ⬇️ Download Extension (.zip)
        </a>
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: '0.75rem' }}>
          Works on Chrome, Edge, and Brave
        </p>
      </section>

      {/* Features */}
      <section style={{ padding: '3rem 1.5rem', maxWidth: '900px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, textAlign: 'center', marginBottom: '2rem' }}>
          What It Does
        </h2>
        <div className="grid-3">
          {[
            { icon: '🔍', title: 'Auto-Detect Jobs', desc: 'Recognizes job listing pages on LinkedIn, Indeed, Internshala, Unstop, and company portals automatically.' },
            { icon: '📋', title: 'One-Click Extract', desc: 'Extracts the job title, company name, and full description from the page — no manual copying.' },
            { icon: '🚀', title: 'Send to RoleFit', desc: 'Sends the extracted job data to your RoleFit dashboard instantly. Then tailor your resume from the dashboard.' },
          ].map((f) => (
            <div key={f.title} className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{f.icon}</div>
              <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>{f.title}</h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', lineHeight: 1.5 }}>{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="card" style={{ marginTop: '2rem', textAlign: 'center' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '0.75rem' }}>🌐 Supported Platforms</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
            {['LinkedIn', 'Indeed', 'Internshala', 'Unstop', 'Company Portals', 'Any Job Page'].map((p) => (
              <span key={p} className="badge badge-primary" style={{ fontSize: '0.875rem', padding: '0.375rem 1rem' }}>{p}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Installation Guide */}
      <section style={{ padding: '3rem 1.5rem', maxWidth: '800px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, textAlign: 'center', marginBottom: '0.5rem' }}>
          How to Install
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', marginBottom: '2.5rem' }}>
          Follow these 5 simple steps to set up the extension
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {[
            {
              step: 1,
              title: 'Download the Extension',
              desc: 'Click the download button above to get the extension as a .zip file.',
              icon: '⬇️',
            },
            {
              step: 2,
              title: 'Unzip the File',
              desc: 'Right-click the downloaded file and select "Extract All" (Windows) or double-click to unzip (Mac). You\'ll get a folder with 3 files inside.',
              icon: '📁',
            },
            {
              step: 3,
              title: 'Open Chrome Extensions',
              desc: 'Open Chrome and enter chrome://extensions in the address bar. You can also get there from Menu → More Tools → Extensions.',
              icon: '🌐',
              highlight: 'chrome://extensions',
            },
            {
              step: 4,
              title: 'Enable Developer Mode',
              desc: 'Toggle the "Developer mode" switch in the top-right corner of the extensions page. This allows you to load unpacked extensions.',
              icon: '🔧',
            },
            {
              step: 5,
              title: 'Load the Extension',
              desc: 'Click "Load unpacked" and select the unzipped folder. The RoleFit icon (🎯) will appear in your toolbar. You\'re ready to go!',
              icon: '✅',
            },
          ].map((s) => (
            <div key={s.step} className="card" style={{
              display: 'flex', gap: '1.25rem', alignItems: 'flex-start',
            }}>
              <div style={{
                flexShrink: 0, width: '48px', height: '48px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.25rem', fontWeight: 800, color: 'white',
              }}>
                {s.step}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontWeight: 700, fontSize: '1.0625rem', marginBottom: '0.375rem' }}>
                  {s.icon} {s.title}
                </h3>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', lineHeight: 1.6 }}>
                  {s.desc}
                </p>
                {s.highlight && (
                  <code style={{
                    display: 'inline-block', marginTop: '0.5rem', padding: '0.25rem 0.75rem',
                    background: 'var(--color-surface)', borderRadius: '0.375rem',
                    fontSize: '0.875rem', color: 'var(--color-primary-light)',
                    border: '1px solid var(--color-border)',
                  }}>
                    {s.highlight}
                  </code>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Usage */}
      <section style={{ padding: '3rem 1.5rem', maxWidth: '800px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, textAlign: 'center', marginBottom: '2rem' }}>
          How to Use
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[
            { step: '1', text: 'Click the 🎯 RoleFit icon in your Chrome toolbar' },
            { step: '2', text: 'Sign in with your RoleFit account' },
            { step: '3', text: 'Navigate to any job listing page' },
            { step: '4', text: 'Click "🔍 Extract Job from Page" — the extension reads the job details' },
            { step: '5', text: 'Click "✨ Send to RoleFit" — the job is saved to your dashboard' },
            { step: '6', text: 'Open your dashboard and go to the Tailor page to generate your optimized resume' },
          ].map((s) => (
            <div key={s.step} style={{
              display: 'flex', alignItems: 'center', gap: '1rem',
              padding: '0.875rem 1.25rem', background: 'var(--color-surface)',
              borderRadius: '0.75rem', border: '1px solid var(--color-border)',
            }}>
              <span style={{
                flexShrink: 0, width: '32px', height: '32px', borderRadius: '50%',
                background: 'rgba(99, 102, 241, 0.15)', color: 'var(--color-primary-light)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: '0.875rem',
              }}>
                {s.step}
              </span>
              <span style={{ fontSize: '0.9375rem' }}>{s.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ textAlign: 'center', padding: '3rem 1.5rem 4rem' }}>
        <div className="card" style={{
          maxWidth: '600px', margin: '0 auto', textAlign: 'center',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(6,182,212,0.08))',
          border: '1px solid rgba(99,102,241,0.2)',
        }}>
          <h3 style={{ fontWeight: 700, marginBottom: '0.75rem', fontSize: '1.25rem' }}>
            Ready to get started?
          </h3>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
            Download the extension and start tailoring your resumes in seconds.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/rolefit-extension.zip" download className="btn btn-primary btn-lg">
              ⬇️ Download Extension
            </a>
            <Link href="/dashboard" className="btn btn-secondary btn-lg">
              Open Dashboard →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
