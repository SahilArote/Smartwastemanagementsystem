import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  CalendarClock, 
  Plus, 
  Edit3, 
  Trash2, 
  Building2, 
  Truck, 
  X
} from 'lucide-react';
import type { CollectionZone, CollectionSchedule, Depot } from '../types';
import { 
  fetchZones, 
  saveZone, 
  deleteZone, 
  fetchSchedules, 
  saveSchedule, 
  deleteSchedule, 
  getDepots 
} from '../services/storage';

interface ZonesAndSchedulesViewProps {
  showToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const ZonesAndSchedulesView: React.FC<ZonesAndSchedulesViewProps> = ({ showToast }) => {
  const [activeTab, setActiveTab] = useState<'zones' | 'schedules'>('zones');
  const [zones, setZones] = useState<CollectionZone[]>([]);
  const [schedules, setSchedules] = useState<CollectionSchedule[]>([]);
  const [depots] = useState<Depot[]>(getDepots());

  // Zone Modal State
  const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<CollectionZone | null>(null);
  const [zoneForm, setZoneForm] = useState({
    name: '',
    code: '',
    description: '',
    color: '#3b82f6',
    headquarters_address: '',
  });

  // Schedule Modal State
  const [isSchedModalOpen, setIsSchedModalOpen] = useState(false);
  const [editingSched, setEditingSched] = useState<CollectionSchedule | null>(null);
  const [schedForm, setSchedForm] = useState({
    zone_name: 'Downtown Central',
    days_of_week: ['Mon', 'Wed', 'Fri'],
    time_window: '06:30 AM - 10:30 AM',
    frequency: 'Twice Weekly' as CollectionSchedule['frequency'],
    assigned_vehicle: 'Compactor Truck #04 (12 Ton)',
    is_active: true,
    notes: '',
  });

  useEffect(() => {
    let isMounted = true;
    Promise.all([fetchZones(), fetchSchedules()]).then(([loadedZones, loadedSchedules]) => {
      if (isMounted) {
        setZones(loadedZones);
        setSchedules(loadedSchedules);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Zone Handlers
  const handleOpenAddZone = () => {
    setEditingZone(null);
    setZoneForm({
      name: '',
      code: '',
      description: '',
      color: '#3b82f6',
      headquarters_address: '',
    });
    setIsZoneModalOpen(true);
  };

  const handleOpenEditZone = (z: CollectionZone) => {
    setEditingZone(z);
    setZoneForm({
      name: z.name,
      code: z.code,
      description: z.description,
      color: z.color,
      headquarters_address: z.headquarters_address,
    });
    setIsZoneModalOpen(true);
  };

  const handleZoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!zoneForm.name.trim() || !zoneForm.code.trim()) {
      showToast('Zone name and code are required.', 'error');
      return;
    }

    if (editingZone) {
      const updated: CollectionZone = {
        ...editingZone,
        ...zoneForm,
      };
      const res = await saveZone(updated);
      setZones([...res]);
      showToast(`Zone "${updated.name}" updated`, 'success');
    } else {
      const newZone: CollectionZone = {
        id: 'zone-' + Date.now().toString(36),
        ...zoneForm,
        created_at: new Date().toISOString(),
      };
      const res = await saveZone(newZone);
      setZones([...res]);
      showToast(`Zone "${newZone.name}" created`, 'success');
    }
    setIsZoneModalOpen(false);
  };

  const handleDeleteZone = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this municipal zone?')) {
      const res = await deleteZone(id);
      setZones([...res]);
      showToast('Zone removed from registry', 'info');
    }
  };

  // Schedule Handlers
  const handleOpenAddSched = () => {
    setEditingSched(null);
    setSchedForm({
      zone_name: zones[0]?.name || 'Downtown Central',
      days_of_week: ['Mon', 'Wed', 'Fri'],
      time_window: '06:30 AM - 10:30 AM',
      frequency: 'Twice Weekly',
      assigned_vehicle: 'Compactor Truck #04 (12 Ton)',
      is_active: true,
      notes: '',
    });
    setIsSchedModalOpen(true);
  };

  const handleOpenEditSched = (s: CollectionSchedule) => {
    setEditingSched(s);
    setSchedForm({
      zone_name: s.zone_name,
      days_of_week: s.days_of_week,
      time_window: s.time_window,
      frequency: s.frequency,
      assigned_vehicle: s.assigned_vehicle,
      is_active: s.is_active,
      notes: s.notes || '',
    });
    setIsSchedModalOpen(true);
  };

  const handleSchedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSched) {
      const updated: CollectionSchedule = {
        ...editingSched,
        ...schedForm,
      };
      const res = await saveSchedule(updated);
      setSchedules([...res]);
      showToast(`Schedule for "${updated.zone_name}" updated`, 'success');
    } else {
      const newSched: CollectionSchedule = {
        id: 'sched-' + Date.now().toString(36),
        zone_id: 'zone-01',
        ...schedForm,
        created_at: new Date().toISOString(),
      };
      const res = await saveSchedule(newSched);
      setSchedules([...res]);
      showToast('Collection schedule created', 'success');
    }
    setIsSchedModalOpen(false);
  };

  const handleDeleteSched = async (id: string) => {
    if (window.confirm('Delete this collection schedule?')) {
      const res = await deleteSchedule(id);
      setSchedules([...res]);
      showToast('Schedule removed', 'info');
    }
  };

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Zones, Facilities & Shifts</h1>
          <p className="page-subtitle">
            Configure municipal collection districts, transfer depots, and recurring shift timetables
          </p>
        </div>

        <div className="page-actions-group">
          {activeTab === 'zones' ? (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleOpenAddZone}
            >
              <Plus size={14} />
              <span>Create Collection Zone</span>
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleOpenAddSched}
            >
              <Plus size={14} />
              <span>Configure New Schedule</span>
            </button>
          )}
        </div>
      </div>

      {/* Mode Navigation Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border-color)',
        marginBottom: '1.5rem',
        gap: '0.5rem',
      }}>
        <button
          type="button"
          onClick={() => setActiveTab('zones')}
          style={{
            padding: '0.65rem 1rem',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'zones' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'zones' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: activeTab === 'zones' ? 700 : 500,
            fontSize: '0.86rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
          }}
        >
          <Layers size={16} />
          <span>Operational Zones ({zones.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('schedules')}
          style={{
            padding: '0.65rem 1rem',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'schedules' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'schedules' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: activeTab === 'schedules' ? 700 : 500,
            fontSize: '0.86rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
          }}
        >
          <CalendarClock size={16} />
          <span>Recurring Pickup Schedules ({schedules.length})</span>
        </button>
      </div>

      {/* Tab 1: Collection Zones & Depots */}
      {activeTab === 'zones' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          {/* Zones Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {zones.map((zone) => (
              <div key={zone.id} className="tailux-card">
                <div className="card-header" style={{ borderLeft: `4px solid ${zone.color}` }}>
                  <div>
                    <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span>{zone.name}</span>
                      <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>{zone.code}</span>
                    </h3>
                    <p className="card-description">{zone.headquarters_address}</p>
                  </div>

                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleOpenEditZone(zone)}
                      title="Edit Zone"
                    >
                      <Edit3 size={13} />
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger-outline btn-sm"
                      onClick={() => handleDeleteZone(zone.id)}
                      title="Delete Zone"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <div className="card-body">
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-body)', marginBottom: '1rem', lineHeight: 1.4 }}>
                    {zone.description}
                  </p>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-subtle)',
                    fontSize: '0.78rem',
                  }}>
                    <span style={{ color: 'var(--text-muted)' }}>Receptacle Points:</span>
                    <strong style={{ color: 'var(--text-main)' }}>{zone.active_points_count || 3} Active Points</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Transfer Station Depots Section */}
          <div className="tailux-card">
            <div className="card-header">
              <div>
                <h2 className="card-title">Municipal Fleet Transfer Depots</h2>
                <p className="card-description">Fixed facility launchpoints and composting yards</p>
              </div>
            </div>

            <div className="table-responsive">
              <table className="tailux-table">
                <thead>
                  <tr>
                    <th>Facility Name</th>
                    <th>Street Address</th>
                    <th>Coordinates</th>
                    <th>Dispatch Line</th>
                  </tr>
                </thead>
                <tbody>
                  {depots.map((depot) => (
                    <tr key={depot.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ width: 30, height: 30, borderRadius: 'var(--radius-sm)', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Building2 size={16} />
                          </div>
                          <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{depot.name}</span>
                        </div>
                      </td>
                      <td>{depot.address}</td>
                      <td>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.76rem' }}>
                          {depot.latitude.toFixed(4)}, {depot.longitude.toFixed(4)}
                        </span>
                      </td>
                      <td>{depot.contact_phone || '+1 (555) 019-2831'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Collection Schedules */}
      {activeTab === 'schedules' && (
        <div className="tailux-card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Weekly Collection Shift Timetables</h2>
              <p className="card-description">Assigned municipal compactor vehicles and collection hours</p>
            </div>
          </div>

          <div className="table-responsive">
            <table className="tailux-table">
              <thead>
                <tr>
                  <th>Jurisdiction Zone</th>
                  <th>Pickup Days</th>
                  <th>Operating Window</th>
                  <th>Assigned Vehicle</th>
                  <th>Cadence</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((sched) => (
                  <tr key={sched.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{sched.zone_name}</div>
                      {sched.notes && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{sched.notes}</div>
                      )}
                    </td>

                    <td>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        {sched.days_of_week.map((d) => (
                          <span key={d} className="badge badge-blue" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
                            {d}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td>
                      <span style={{ fontWeight: 500, fontSize: '0.82rem' }}>{sched.time_window}</span>
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Truck size={14} color="var(--primary)" />
                        <span style={{ fontSize: '0.82rem' }}>{sched.assigned_vehicle}</span>
                      </div>
                    </td>

                    <td>
                      <span className="badge badge-purple" style={{ fontSize: '0.68rem' }}>
                        {sched.frequency}
                      </span>
                    </td>

                    <td>
                      <span className={`badge ${sched.is_active ? 'badge-completed' : 'badge-pending'}`} style={{ fontSize: '0.68rem' }}>
                        {sched.is_active ? 'Active' : 'Paused'}
                      </span>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.35rem' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleOpenEditSched(sched)}
                          title="Edit Schedule"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger-outline btn-sm"
                          onClick={() => handleDeleteSched(sched.id)}
                          title="Delete Schedule"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Zone Edit Modal */}
      {isZoneModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsZoneModalOpen(false)}>
          <div 
            className="modal-card" 
            style={{ maxWidth: 520 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 className="modal-title">{editingZone ? 'Edit Zone' : 'Create Operational Zone'}</h3>
              <button 
                type="button" 
                className="btn btn-flat btn-icon-only"
                onClick={() => setIsZoneModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleZoneSubmit}>
              <div className="modal-body">
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Zone Name <span className="required">*</span></label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. South Sector Riverside"
                    value={zoneForm.name}
                    onChange={(e) => setZoneForm({ ...zoneForm, name: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Zone Code <span className="required">*</span></label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. ZN-SOUTH"
                    value={zoneForm.code}
                    onChange={(e) => setZoneForm({ ...zoneForm, code: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Headquarters / Main Facility Address</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 50 Riverside Boulevard"
                    value={zoneForm.headquarters_address}
                    onChange={(e) => setZoneForm({ ...zoneForm, headquarters_address: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label">District Description</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Area coverage, key landmarks, commercial density..."
                    value={zoneForm.description}
                    onChange={(e) => setZoneForm({ ...zoneForm, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsZoneModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingZone ? 'Save Zone Changes' : 'Create Zone'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Edit Modal */}
      {isSchedModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsSchedModalOpen(false)}>
          <div 
            className="modal-card" 
            style={{ maxWidth: 520 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 className="modal-title">{editingSched ? 'Edit Schedule' : 'Create Pickup Schedule'}</h3>
              <button 
                type="button" 
                className="btn btn-flat btn-icon-only"
                onClick={() => setIsSchedModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSchedSubmit}>
              <div className="modal-body">
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Zone</label>
                  <select
                    className="form-select"
                    value={schedForm.zone_name}
                    onChange={(e) => setSchedForm({ ...schedForm, zone_name: e.target.value })}
                  >
                    {zones.map((z) => (
                      <option key={z.id} value={z.name}>{z.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Operating Window (Hours)</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. 06:30 AM - 10:30 AM"
                    value={schedForm.time_window}
                    onChange={(e) => setSchedForm({ ...schedForm, time_window: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Assigned Vehicle</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. Compactor Truck #04 (12 Ton)"
                    value={schedForm.assigned_vehicle}
                    onChange={(e) => setSchedForm({ ...schedForm, assigned_vehicle: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Frequency</label>
                  <select
                    className="form-select"
                    value={schedForm.frequency}
                    onChange={(e) => setSchedForm({ ...schedForm, frequency: e.target.value as any })}
                  >
                    <option value="Daily">Daily</option>
                    <option value="Twice Weekly">Twice Weekly</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Bi-Weekly">Bi-Weekly</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsSchedModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingSched ? 'Save Schedule' : 'Create Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
