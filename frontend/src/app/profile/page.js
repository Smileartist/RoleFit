'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function ProfilePage() {
  const { user, updateProfile, updatePassword, deleteAccount, logout } = useAuth();
  
  const [name, setName] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [profileStatus, setProfileStatus] = useState({ type: '', message: '' });
  const [passwordStatus, setPasswordStatus] = useState({ type: '', message: '' });
  const [isDeleting, setIsDeleting] = useState(false);

  const handleUpdateName = async (e) => {
    e.preventDefault();
    setProfileStatus({ type: 'loading', message: 'Updating...' });
    try {
      await updateProfile(name);
      setProfileStatus({ type: 'success', message: 'Name updated successfully!' });
    } catch (err) {
      setProfileStatus({ type: 'error', message: err.message });
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: 'error', message: 'New passwords do not match' });
      return;
    }
    setPasswordStatus({ type: 'loading', message: 'Updating...' });
    try {
      await updatePassword(currentPassword, newPassword);
      setPasswordStatus({ type: 'success', message: 'Password updated successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordStatus({ type: 'error', message: err.message });
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you absolutely sure you want to delete your account? This action cannot be undone and all your data (resumes, projects, jobs) will be permanently removed.')) {
      try {
        setIsDeleting(true);
        await deleteAccount();
      } catch (err) {
        alert('Failed to delete account: ' + err.message);
        setIsDeleting(false);
      }
    }
  };

  return (
    <div className="page-container animate-in">
      <header className="page-header">
        <h1>👤 My Profile</h1>
        <p>Manage your account settings and preferences</p>
      </header>

      <div className="grid-2">
        {/* Edit Profile Section */}
        <section className="card">
          <div className="card-header">
            <h3>Edit Name</h3>
          </div>
          <form onSubmit={handleUpdateName} className="flex-stack" style={{ gap: '1.25rem' }}>
            <div className="input-group">
              <label>Full Name</label>
              <input
                type="text"
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your Name"
                required
              />
            </div>
            
            {profileStatus.message && (
              <div className={`alert alert-${profileStatus.type === 'error' ? 'error' : 'success'}`}>
                {profileStatus.message}
              </div>
            )}
            
            <button type="submit" className="btn btn-primary" disabled={profileStatus.type === 'loading'}>
              {profileStatus.type === 'loading' ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </section>

        {/* Change Password Section */}
        <section className="card">
          <div className="card-header">
            <h3>Change Password</h3>
          </div>
          <form onSubmit={handleUpdatePassword} className="flex-stack" style={{ gap: '1.25rem' }}>
            <div className="input-group">
              <label>Current Password</label>
              <input
                type="password"
                className="input"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <div className="input-group">
              <label>New Password</label>
              <input
                type="password"
                className="input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <div className="input-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                className="input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            {passwordStatus.message && (
              <div className={`alert alert-${passwordStatus.type === 'error' ? 'error' : 'success'}`}>
                {passwordStatus.message}
              </div>
            )}

            <button type="submit" className="btn btn-secondary" disabled={passwordStatus.type === 'loading'}>
              {passwordStatus.type === 'loading' ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </section>

        {/* Account Management */}
        <section className="card" style={{ border: '1px solid var(--color-border)', gridColumn: '1 / -1' }}>
          <div className="card-header">
            <h3>⚙️ Account Actions</h3>
          </div>
          <div className="account-actions-grid">
            <div className="action-item">
              <p>Sign out of your current session on this device.</p>
              <button className="btn btn-secondary" onClick={logout}>
                🚪 Logout
              </button>
            </div>
            
            <div className="action-divider"></div>

            <div className="action-item">
              <p style={{ color: 'var(--color-danger)', fontWeight: '600' }}>Danger Zone</p>
              <p style={{ fontSize: '0.8125rem' }}>Permanently delete your account and all associated data.</p>
              <button 
                className="btn btn-danger" 
                onClick={handleDeleteAccount}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </section>
      </div>

      <style jsx>{`
        .flex-stack {
          display: flex;
          flex-direction: column;
        }
        .account-actions-grid {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          gap: 2rem;
          align-items: center;
          margin-top: 1rem;
        }
        .action-item {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .action-item p {
          color: var(--color-text-muted);
          font-size: 0.875rem;
        }
        .action-divider {
          width: 1px;
          height: 100%;
          background: var(--color-border);
        }
        @media (max-width: 640px) {
          .account-actions-grid {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }
          .action-divider {
            width: 100%;
            height: 1px;
          }
        }
      `}</style>
    </div>
  );
}
