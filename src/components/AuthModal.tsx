import React, { useState } from 'react';
import { X, Lock, Mail, User, LogOut, ShieldCheck } from 'lucide-react';
import type { UserProfile } from '../types';
import { signInWithSupabase, signUpWithSupabase, signOutSupabase, getAdminEmail } from '../services/auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onUserChange: (user: UserProfile) => void;
  showToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserChange,
  showToast,
}) => {
  if (!isOpen) return null;

  const adminEmail = getAdminEmail();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    if (mode === 'signin') {
      const result = await signInWithSupabase(email, password);
      if (result.success && result.user) {
        onUserChange(result.user);
        showToast(`Signed in as ${result.user.full_name} (${result.user.role.toUpperCase()})`, 'success');
        onClose();
      } else {
        setErrorMessage(result.error || 'Invalid credentials or user not registered yet. Try Sign Up.');
      }
    } else {
      if (!fullName.trim()) {
        setErrorMessage('Full name is required.');
        setLoading(false);
        return;
      }
      const result = await signUpWithSupabase(email, password, fullName);
      if (result.success && result.user) {
        onUserChange(result.user);
        showToast(result.message || 'Account created in Supabase!', 'success');
        onClose();
      } else {
        setErrorMessage(result.error || 'Registration failed.');
      }
    }
    setLoading(false);
  };

  const handleSignOut = async () => {
    const defaultUser = await signOutSupabase();
    onUserChange(defaultUser);
    showToast('Signed out of Supabase session', 'info');
    onClose();
  };

  const handleQuickFill = (targetEmail: string, name: string) => {
    setEmail(targetEmail);
    setPassword('WasteAdmin123!');
    setFullName(name);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '440px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: '8px', background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa' }}>
              <Lock size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff' }}>
                Supabase Authentication
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Automatic RBAC Role Assignment
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Current Active Account Box */}
        {currentUser.email ? (
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '0.85rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase' }}>Active Account</div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#ffffff' }}>{currentUser.full_name}</div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{currentUser.email}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className={`badge ${currentUser.role === 'admin' ? 'badge-low' : 'badge-inprogress'}`}>
                  {currentUser.role.toUpperCase()}
                </span>
                <button
                  onClick={handleSignOut}
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px', fontSize: '0.7rem' }}
                >
                  <LogOut size={12} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {/* Automatic Role Notice */}
        <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '8px', padding: '0.65rem 0.85rem', marginBottom: '1rem', fontSize: '0.75rem', color: '#cbd5e1' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#34d399', fontWeight: 600, marginBottom: '2px' }}>
            <ShieldCheck size={14} />
            <span>Automatic Role Assignment Active</span>
          </div>
          Accounts matching <strong style={{ color: '#ffffff' }}>{adminEmail}</strong> are automatically <strong>Admin</strong>. All other emails are automatically <strong>Worker</strong>.
        </div>

        {/* Sign In / Sign Up Mode Switcher */}
        <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '3px', marginBottom: '1rem' }}>
          <button
            type="button"
            onClick={() => { setMode('signin'); setErrorMessage(null); }}
            style={{
              flex: 1,
              padding: '0.45rem',
              borderRadius: '6px',
              border: 'none',
              background: mode === 'signin' ? '#10b981' : 'transparent',
              color: mode === 'signin' ? '#ffffff' : '#94a3b8',
              fontWeight: 600,
              fontSize: '0.8rem',
              cursor: 'pointer',
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setErrorMessage(null); }}
            style={{
              flex: 1,
              padding: '0.45rem',
              borderRadius: '6px',
              border: 'none',
              background: mode === 'signup' ? '#10b981' : 'transparent',
              color: mode === 'signup' ? '#ffffff' : '#94a3b8',
              fontWeight: 600,
              fontSize: '0.8rem',
              cursor: 'pointer',
            }}
          >
            Sign Up
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. Sarah Jenkins"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  style={{ paddingLeft: '2.2rem' }}
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input
                type="email"
                required
                className="form-input"
                placeholder="name@citywaste.gov"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: '2.2rem' }}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input
                type="password"
                required
                minLength={6}
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '2.2rem' }}
              />
            </div>
          </div>

          {errorMessage && (
            <div style={{ padding: '0.55rem 0.75rem', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', fontSize: '0.78rem', marginBottom: '1rem' }}>
              {errorMessage}
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', marginBottom: '1rem' }}>
            {loading ? 'Authenticating...' : mode === 'signin' ? 'Sign In to Supabase' : 'Create Supabase Account'}
          </button>
        </form>

        {/* Quick Fill Helpers for Testing */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.85rem' }}>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.4rem', textAlign: 'center' }}>
            Quick-Fill Credentials (Demo)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleQuickFill(adminEmail, 'Municipal Admin')}
              style={{ fontSize: '0.72rem' }}
            >
              Fill Admin Email
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleQuickFill('marcus.worker@citywaste.gov', 'Marcus Vance')}
              style={{ fontSize: '0.72rem' }}
            >
              Fill Worker Email
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
