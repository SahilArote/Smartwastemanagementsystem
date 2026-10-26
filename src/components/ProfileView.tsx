import React from 'react';
import { ShieldCheck, Building, Calendar, CheckCircle2 } from 'lucide-react';
import type { UserProfile } from '../types';

interface ProfileViewProps {
  currentUser: UserProfile;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ currentUser }) => {
  const isAdmin = currentUser.role === 'admin';
  const isSupervisor = currentUser.role === 'supervisor';

  const permissions = isAdmin
    ? [
        'Full System Administrative Access',
        'Create, Edit & Delete Collection Points',
        'Configure Municipal Zones & Depots',
        'Plan & Algorithmically Dispatch Routes',
        'Manage Personnel Accounts & Assign Roles',
        'Review Comprehensive Operational Audit Logs',
        'Export All Analytical CSV Manifests',
      ]
    : isSupervisor
    ? [
        'Operational Supervisor Access',
        'Review & Monitor Collection Points',
        'Generate Suggested Road Routes with OSRM',
        'Assign Field Work to Registered Drivers',
        'Inspect Operational Dashboard Metrics',
        'Export Route Data & Reports',
      ]
    : [
        'Field Driver & Collection Worker Access',
        'Access Personal Assigned Route Dispatches',
        'Turn-by-Turn Receptacle Inspection',
        'Verify Stop Completion & Record Field Notes',
        'Real-time Google Maps Navigation Intent',
      ];

  return (
    <div className="page-container" style={{ maxWidth: 860 }}>
      <div className="page-header-row">
        <div>
          <h1 className="page-title">User Profile & Division</h1>
          <p className="page-subtitle">
            Authenticated session credentials, role privileges, and assigned municipal sector
          </p>
        </div>
      </div>

      <div className="tailux-card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-body" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div className="user-avatar" style={{ width: 72, height: 72, fontSize: '1.5rem', boxShadow: 'var(--shadow-md)' }}>
              {currentUser.full_name ? currentUser.full_name.substring(0, 2).toUpperCase() : 'US'}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {currentUser.full_name}
                </h2>
                <span className={`badge ${isAdmin ? 'badge-rose' : isSupervisor ? 'badge-purple' : 'badge-blue'}`} style={{ fontSize: '0.74rem' }}>
                  {currentUser.role.toUpperCase()}
                </span>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                {currentUser.email}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.65rem', fontSize: '0.78rem', color: 'var(--text-dim)', flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Building size={14} />
                  {currentUser.zone || 'Headquarters'}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Calendar size={14} />
                  Joined {new Date(currentUser.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Permissions Card */}
      <div className="tailux-card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={18} color="var(--primary)" />
            <h3 className="card-title">Authorized System Capabilities</h3>
          </div>
        </div>

        <div className="card-body">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {permissions.map((perm) => (
              <div key={perm} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.84rem', color: 'var(--text-body)' }}>
                <CheckCircle2 size={16} color="var(--accent-emerald)" />
                <span>{perm}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
