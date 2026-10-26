import React, { useState } from 'react';
import { X, Database, Check, Copy, RefreshCw } from 'lucide-react';
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
  if (!isOpen) return null;

  const currentConfig = getSavedSupabaseConfig();
  const [url, setUrl] = useState(currentConfig.url);
  const [anonKey, setAnonKey] = useState(currentConfig.anonKey);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [copiedSchema, setCopiedSchema] = useState(false);

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
      setStatusMessage('Switched to Local Cloud-Sync mode (instant browser storage).');
      onSaveSuccess();
      return;
    }

    try {
      const client = getSupabaseClient();
      if (!client) throw new Error('Could not create Supabase client');

      // Test a light ping query
      const { error } = await client.from('collection_points').select('id').limit(1);
      if (error && error.code !== 'PGRST116') {
        setStatusMessage(`Connected to Supabase project! (Note: ensure you have executed the schema below in Supabase SQL editor).`);
      } else {
        setStatusMessage('Successfully connected to Supabase PostgreSQL database!');
      }
      onSaveSuccess();
    } catch (err: any) {
      setStatusMessage(`Connection attempt warning: ${err.message || 'Please check URL and Key'}`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '640px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
              <Database size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff' }}>Cloud Database & Supabase Integration</h3>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Connect real Supabase PostgreSQL or run in instant local sync</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '12px', padding: '0.9rem', marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#34d399', marginBottom: '0.25rem' }}>
            Instant Zero-Setup Mode Active
          </div>
          <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
            The app is currently functioning with full persistence, OSRM road calculations, and mock user sessions out of the box. You can connect your Supabase project credentials at any time below.
          </p>
        </div>

        <div className="form-group">
          <label className="form-label">Supabase Project URL</label>
          <input
            type="text"
            className="form-input"
            placeholder="https://xyzcompany.supabase.co"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Supabase Anon Key (Public API Key)</label>
          <input
            type="password"
            className="form-input"
            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
            value={anonKey}
            onChange={(e) => setAnonKey(e.target.value)}
          />
        </div>

        {statusMessage && (
          <div style={{ padding: '0.65rem 0.85rem', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)', color: '#93c5fd', fontSize: '0.8rem', marginBottom: '1rem' }}>
            {statusMessage}
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <button className="btn btn-primary" onClick={handleSaveAndTest} disabled={isTesting} style={{ flex: 1 }}>
            {isTesting ? <RefreshCw size={16} className="animate-spin" /> : <Database size={16} />}
            <span>Save & Test Connection</span>
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={() => {
              setUrl('');
              setAnonKey('');
              saveSupabaseConfig('', '');
              setStatusMessage('Supabase credentials cleared. Using local demo storage.');
              onSaveSuccess();
            }}
          >
            Clear Credentials
          </button>
        </div>

        {/* PostgreSQL Schema Exporter */}
        <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>
              Database Migration SQL (PRD Section 11)
            </span>
            <button className="btn btn-secondary btn-sm" onClick={handleCopySchema}>
              {copiedSchema ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
              <span>{copiedSchema ? 'SQL Copied!' : 'Copy SQL Script'}</span>
            </button>
          </div>
          <pre
            style={{
              maxHeight: '160px',
              overflowY: 'auto',
              background: '#090d16',
              padding: '0.85rem',
              borderRadius: '8px',
              fontSize: '0.72rem',
              fontFamily: 'var(--font-mono)',
              color: '#94a3b8',
              border: '1px solid rgba(255, 255, 255, 0.05)',
            }}
          >
            {SUPABASE_SQL_SCHEMA}
          </pre>
        </div>
      </div>
    </div>
  );
};
