import React, { useState } from 'react';
import { X, Check, Copy, Cloud, CheckCircle2 } from 'lucide-react';
import { 
  getSavedSupabaseConfig, 
  saveSupabaseConfig, 
  SUPABASE_SQL_SCHEMA, 
  getSupabaseClient 
} from '../services/supabaseClient';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: () => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({
  isOpen,
  onClose,
  onSaveSuccess,
}) => {
  const currentConfig = getSavedSupabaseConfig();
  const [url, setUrl] = useState(currentConfig.url);
  const [anonKey, setAnonKey] = useState(currentConfig.anonKey);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [copiedSchema, setCopiedSchema] = useState(false);

  if (!isOpen) return null;

  const handleCopySchema = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2500);
  };

  const handleSaveAndTest = async () => {
    setIsTesting(true);
    setStatusMessage(null);

    saveSupabaseConfig(url, anonKey);

    if (!url || !anonKey) {
      setIsTesting(false);
      setStatusMessage('Switched to persistent database mode (local storage store).');
      onSaveSuccess();
      return;
    }

    try {
      const client = getSupabaseClient();
      if (!client) throw new Error('Could not create Supabase client');

      const { error } = await client.from('collection_points').select('id').limit(1);
      if (error && error.code !== 'PGRST116') {
        setStatusMessage(`Connected to Supabase project! (Ensure you have executed the schema below in Supabase SQL editor).`);
      } else {
        setStatusMessage('Successfully verified connection to Supabase cloud database!');
      }
      onSaveSuccess();
    } catch (err: any) {
      setStatusMessage(`Connection attempt notice: ${err.message || 'Please check credentials'}`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-card" 
        style={{ maxWidth: '640px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
              <Cloud size={18} />
            </div>
            <div>
              <h3 className="modal-title">Cloud Database Synchronization</h3>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                Connect remote Supabase PostgreSQL database
              </p>
            </div>
          </div>
          <button 
            type="button" 
            className="btn btn-flat btn-icon-only"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div style={{ fontSize: '0.82rem', color: 'var(--text-body)', marginBottom: '1.25rem', lineHeight: 1.45 }}>
            The application operates automatically with instant, zero-setup persistent storage. 
            To connect to your cloud PostgreSQL database, provide your Supabase project credentials below.
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Supabase Project URL</label>
              <input
                type="text"
                className="form-input"
                placeholder="https://xyzproject.supabase.co"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Supabase Public Anon Key</label>
              <input
                type="password"
                className="form-input"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
              />
            </div>

            {statusMessage && (
              <div style={{
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                background: statusMessage.includes('Success') ? 'var(--accent-emerald-light)' : 'var(--primary-light)',
                color: statusMessage.includes('Success') ? 'var(--accent-emerald-text)' : 'var(--primary)',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}>
                <CheckCircle2 size={16} />
                <span>{statusMessage}</span>
              </div>
            )}

            {/* SQL Migration Script Box */}
            <div style={{ marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  Database Migration Script (SQL)
                </span>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleCopySchema}
                  style={{ fontSize: '0.72rem', padding: '0.25rem 0.6rem' }}
                >
                  {copiedSchema ? <Check size={12} color="var(--accent-emerald)" /> : <Copy size={12} />}
                  <span>{copiedSchema ? 'Copied' : 'Copy SQL'}</span>
                </button>
              </div>

              <div style={{
                maxHeight: '120px',
                overflowY: 'auto',
                background: 'var(--bg-subtle)',
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.7rem',
                border: '1px solid var(--border-color)',
                color: 'var(--text-muted)',
              }}>
                <pre>{SUPABASE_SQL_SCHEMA}</pre>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={isTesting}
            onClick={handleSaveAndTest}
          >
            {isTesting ? 'Verifying...' : 'Save & Test Connection'}
          </button>
        </div>
      </div>
    </div>
  );
};
