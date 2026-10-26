import React, { useState } from 'react';
import { Truck, Mail, Lock, AlertCircle, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { signInUser, signUpUser } from '../services/auth';
import type { UserProfile, Role } from '../types';

interface SignInViewProps {
  onLoginSuccess: (user: UserProfile) => void;
  showToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const SignInView: React.FC<SignInViewProps> = ({ onLoginSuccess, showToast }) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<Role>('worker');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      if (mode === 'signin') {
        const result = await signInUser(email, password);
        if (result.success && result.user) {
          showToast(`Welcome back, ${result.user.full_name}!`, 'success');
          onLoginSuccess(result.user);
        } else {
          setErrorMessage(result.error || 'Invalid email or password.');
        }
      } else {
        const result = await signUpUser(email, password, fullName, role);
        if (result.success && result.user) {
          showToast(result.message || 'Account created successfully!', 'success');
          onLoginSuccess(result.user);
        } else {
          setErrorMessage(result.error || 'Registration failed.');
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected authentication error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectQuickAccount = (accEmail: string, pass: string) => {
    setEmail(accEmail);
    setPassword(pass);
    setErrorMessage(null);
  };

  return (
    <div className="auth-viewport">
      <div className="auth-decorative-glow" />

      <div className="auth-card-container">
        {/* Brand Header */}
        <div className="auth-header-box">
          <div className="auth-logo-badge">
            <Truck size={30} />
          </div>
          <h1 className="auth-title">SmartRoute CRM</h1>
          <p className="auth-subtitle">
            Municipal Waste Operations & Route Planning Platform
          </p>
        </div>

        {/* Authentication Card */}
        <div className="auth-form-card">
          {/* Sign In / Sign Up Mode Tabs */}
          <div style={{
            display: 'flex',
            background: 'var(--bg-subtle)',
            padding: '4px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem',
            border: '1px solid var(--border-color)',
          }}>
            <button
              type="button"
              onClick={() => { setMode('signin'); setErrorMessage(null); }}
              style={{
                flex: 1,
                padding: '0.55rem',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: mode === 'signin' ? 'var(--bg-card)' : 'transparent',
                color: mode === 'signin' ? 'var(--text-main)' : 'var(--text-muted)',
                fontWeight: mode === 'signin' ? 600 : 500,
                fontSize: '0.84rem',
                cursor: 'pointer',
                boxShadow: mode === 'signin' ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setErrorMessage(null); }}
              style={{
                flex: 1,
                padding: '0.55rem',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: mode === 'signup' ? 'var(--bg-card)' : 'transparent',
                color: mode === 'signup' ? 'var(--text-main)' : 'var(--text-muted)',
                fontWeight: mode === 'signup' ? 600 : 500,
                fontSize: '0.84rem',
                cursor: 'pointer',
                boxShadow: mode === 'signup' ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              Register Account
            </button>
          </div>

          {errorMessage && (
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.65rem',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--accent-rose-light)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              color: 'var(--accent-rose-text)',
              fontSize: '0.82rem',
              marginBottom: '1.25rem',
            }}>
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <>
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label">
                    Full Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. Marcus Vance"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label">
                    Operational Role <span className="required">*</span>
                  </label>
                  <select
                    className="form-select"
                    value={role}
                    onChange={(e) => setRole(e.target.value as Role)}
                  >
                    <option value="worker">Collection Worker / Driver</option>
                    <option value="supervisor">Operations Supervisor</option>
                    <option value="admin">Municipal Administrator</option>
                  </select>
                </div>
              </>
            )}

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label">
                Official Email Address <span className="required">*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '0.85rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-dim)',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  type="email"
                  required
                  className="form-input"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="name@citywaste.gov"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">
                Password <span className="required">*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '0.85rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-dim)',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  type="password"
                  required
                  minLength={6}
                  className="form-input"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.75rem', fontSize: '0.9rem' }}
            >
              {isLoading ? (
                'Verifying Credentials...'
              ) : (
                <>
                  <span>{mode === 'signin' ? 'Sign In to Dashboard' : 'Create Authorized Account'}</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Real Seeded Accounts Guide for Testing */}
          <div style={{
            marginTop: '1.75rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid var(--border-color)',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.72rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'var(--text-dim)',
              marginBottom: '0.75rem',
              letterSpacing: '0.04em',
            }}>
              <ShieldCheck size={14} color="var(--primary)" />
              <span>Verified System Accounts</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleSelectQuickAccount('admin@citywaste.gov', 'Admin@123')}
                style={{
                  justifyContent: 'space-between',
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.76rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle2 size={13} color="var(--accent-emerald)" />
                  <span style={{ fontWeight: 600 }}>Administrator</span>
                  <span style={{ color: 'var(--text-muted)' }}>admin@citywaste.gov</span>
                </div>
                <span className="badge badge-rose" style={{ fontSize: '0.62rem' }}>ADMIN</span>
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleSelectQuickAccount('supervisor@citywaste.gov', 'Supervisor@123')}
                style={{
                  justifyContent: 'space-between',
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.76rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle2 size={13} color="var(--accent-emerald)" />
                  <span style={{ fontWeight: 600 }}>Operations Supervisor</span>
                  <span style={{ color: 'var(--text-muted)' }}>supervisor@citywaste.gov</span>
                </div>
                <span className="badge badge-purple" style={{ fontSize: '0.62rem' }}>SUPERVISOR</span>
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleSelectQuickAccount('marcus.worker@citywaste.gov', 'Worker@123')}
                style={{
                  justifyContent: 'space-between',
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.76rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle2 size={13} color="var(--accent-emerald)" />
                  <span style={{ fontWeight: 600 }}>Collection Driver</span>
                  <span style={{ color: 'var(--text-muted)' }}>marcus.worker@citywaste.gov</span>
                </div>
                <span className="badge badge-blue" style={{ fontSize: '0.62rem' }}>WORKER</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
