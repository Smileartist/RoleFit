'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  // Main nav links with icons
  const links = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/resumes', label: 'Resumes', icon: '📄' },
    { href: '/projects', label: 'Projects', icon: '🛠️' },
    { href: '/jobs', label: 'Jobs', icon: '💼' },
    { href: '/tailor', label: 'Tailor', icon: '✨' },
    { href: '/build', label: 'Build', icon: '🔨' },
    { href: '/tracker', label: 'Tracker', icon: '📋' },
  ];

  // Desktop-only links
  const desktopLinks = [
    { href: '/extension', label: 'Extension', icon: '🧩' },
  ];

  return (
    <>
      {/* Desktop Top Navbar */}
      <nav className="desktop-navbar">
        <Link href="/dashboard" className="navbar-brand">
          🎯 <span>RoleFit</span>
        </Link>
        <ul className="navbar-links">
          {links.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className={pathname === link.href ? 'active' : ''}>
                <span className="nav-icon">{link.icon}</span>
                {link.label}
              </Link>
            </li>
          ))}
          {desktopLinks.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className={pathname === link.href ? 'active' : ''}>
                <span className="nav-icon">{link.icon}</span>
                {link.label}
              </Link>
            </li>
          ))}
          <li>
            <button onClick={logout} className="btn btn-ghost btn-sm" style={{ marginLeft: '0.5rem' }}>
              Logout
            </button>
          </li>
        </ul>
      </nav>

      {/* Mobile Top Bar — minimal, just logo + logout */}
      <nav className="mobile-topbar">
        <Link href="/dashboard" className="navbar-brand">
          🎯 <span>RoleFit</span>
        </Link>
        <button onClick={logout} className="btn btn-ghost btn-sm">
          Logout
        </button>
      </nav>

      {/* Mobile Bottom Tab Bar */}
      <nav className="mobile-bottombar">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`tab-item ${pathname === link.href ? 'active' : ''}`}
          >
            <span className="tab-icon">{link.icon}</span>
            <span className="tab-label">{link.label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
