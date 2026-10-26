import React, { useState, useMemo } from 'react';
import { 
  Search, 
  FileDown, 
  User, 
  CheckCircle2, 
  Route as RouteIcon, 
  MapPin, 
  Layers, 
  CalendarClock
} from 'lucide-react';
import type { ActivityLog } from '../types';
import { fetchActivityLogs, exportAuditLogsToCSV } from '../services/storage';

interface ActivityAuditViewProps {
  showToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const ActivityAuditView: React.FC<ActivityAuditViewProps> = ({ showToast }) => {
  const [logs] = useState<ActivityLog[]>(fetchActivityLogs());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntity, setSelectedEntity] = useState('All');

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch = 
        log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.user_email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesEntity = selectedEntity === 'All' || log.entity_type === selectedEntity;
      return matchesSearch && matchesEntity;
    });
  }, [logs, searchQuery, selectedEntity]);

  const handleExportCSV = () => {
    exportAuditLogsToCSV(filteredLogs);
    showToast(`Exported ${filteredLogs.length} audit logs to CSV`, 'success');
  };

  const getEntityIcon = (type: ActivityLog['entity_type']) => {
    switch (type) {
      case 'stop': return <CheckCircle2 size={16} color="var(--accent-emerald)" />;
      case 'route': return <RouteIcon size={16} color="var(--primary)" />;
      case 'point': return <MapPin size={16} color="var(--accent-blue)" />;
      case 'zone': return <Layers size={16} color="var(--accent-purple)" />;
      case 'schedule': return <CalendarClock size={16} color="var(--accent-amber)" />;
      default: return <User size={16} color="var(--text-muted)" />;
    }
  };

  return (
    <div className="page-container">
      {/* Header Banner */}
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Activity Audit Trail</h1>
          <p className="page-subtitle">
            Immutable system audit logs documenting operational actions, driver verifications, and dispatches
          </p>
        </div>

        <div className="page-actions-group">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleExportCSV}
          >
            <FileDown size={14} />
            <span>Export Audit Trail</span>
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="tailux-card">
        {/* Table Toolbar */}
        <div className="table-toolbar">
          <div className="search-input-box">
            <Search size={15} className="search-input-icon" />
            <input
              type="text"
              placeholder="Search by action, user name, or details..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="table-filters-group">
            <select
              className="form-select"
              style={{ width: 'auto', fontSize: '0.8rem', padding: '0.45rem 0.8rem' }}
              value={selectedEntity}
              onChange={(e) => setSelectedEntity(e.target.value)}
            >
              <option value="All">All Entity Types</option>
              <option value="stop">Stop Completions</option>
              <option value="route">Route Dispatches</option>
              <option value="point">Collection Points</option>
              <option value="zone">Zones</option>
              <option value="schedule">Schedules</option>
              <option value="user">User Auth</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="table-responsive">
          <table className="tailux-table">
            <thead>
              <tr>
                <th style={{ width: '180px' }}>Timestamp</th>
                <th>Operator / Staff</th>
                <th>Action</th>
                <th>Event Details</th>
                <th>Category</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No audit records match your search filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.76rem', color: 'var(--text-dim)' }}>
                        {new Date(log.timestamp).toLocaleDateString()}
                      </div>
                      <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-main)' }}>
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </div>
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{log.user_name}</span>
                        <span className={`badge ${
                          log.user_role === 'admin' ? 'badge-rose' :
                          log.user_role === 'supervisor' ? 'badge-purple' :
                          'badge-blue'
                        }`} style={{ fontSize: '0.62rem' }}>
                          {log.user_role.toUpperCase()}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {log.user_email}
                      </div>
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, color: 'var(--text-main)' }}>
                        {getEntityIcon(log.entity_type)}
                        <span>{log.action}</span>
                      </div>
                    </td>

                    <td>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-body)', lineHeight: 1.35 }}>
                        {log.details}
                      </div>
                    </td>

                    <td>
                      <span className="badge badge-purple" style={{ fontSize: '0.68rem', textTransform: 'capitalize' }}>
                        {log.entity_type}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
