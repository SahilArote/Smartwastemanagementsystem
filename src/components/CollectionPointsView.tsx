import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  FileDown, 
  Edit3, 
  Trash2, 
  MapPin, 
  X, 
  ChevronLeft,
  ChevronRight,
  ArrowUpDown
} from 'lucide-react';
import type { CollectionPoint, WasteType, Priority } from '../types';
import { exportPointsToCSV } from '../services/storage';

interface CollectionPointsViewProps {
  points: CollectionPoint[];
  onAddPoint: (point: CollectionPoint) => Promise<void>;
  onUpdatePoint: (point: CollectionPoint) => Promise<void>;
  onDeletePoint: (id: string) => Promise<void>;
  showToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

const WASTE_TYPES: WasteType[] = [
  'General Waste',
  'Recyclables',
  'Organic / Compost',
  'Hazardous / E-Waste',
  'Commercial / Bulk',
];

const PRIORITIES: Priority[] = ['High', 'Medium', 'Low'];

const ZONES = [
  'All Zones',
  'Downtown Central',
  'Central Commercial',
  'East Sector Tech Corridor',
  'North & West Residential',
];

export const CollectionPointsView: React.FC<CollectionPointsViewProps> = ({
  points,
  onAddPoint,
  onUpdatePoint,
  onDeletePoint,
  showToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedZone, setSelectedZone] = useState('All Zones');
  const [selectedWasteType, setSelectedWasteType] = useState('All Types');
  const [selectedPriority, setSelectedPriority] = useState('All Priorities');
  const [sortBy, setSortBy] = useState<'name' | 'area' | 'fill' | 'priority'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPoint, setEditingPoint] = useState<CollectionPoint | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    area: 'Downtown Central',
    address_text: '',
    latitude: 18.5204,
    longitude: 73.8567,
    waste_type: 'General Waste' as WasteType,
    priority: 'Medium' as Priority,
    bin_capacity_liters: 360,
    estimated_fill_percent: 50,
    notes: '',
  });

  const handleOpenAdd = () => {
    setEditingPoint(null);
    setFormData({
      name: '',
      area: 'Downtown Central',
      address_text: '',
      latitude: 18.5204,
      longitude: 73.8567,
      waste_type: 'General Waste',
      priority: 'Medium',
      bin_capacity_liters: 360,
      estimated_fill_percent: 50,
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (point: CollectionPoint) => {
    setEditingPoint(point);
    setFormData({
      name: point.name,
      area: point.area,
      address_text: point.address_text,
      latitude: point.latitude,
      longitude: point.longitude,
      waste_type: point.waste_type,
      priority: point.priority,
      bin_capacity_liters: point.bin_capacity_liters || 360,
      estimated_fill_percent: point.estimated_fill_percent || 50,
      notes: point.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.address_text.trim()) {
      showToast('Point name and address are required.', 'error');
      return;
    }

    if (editingPoint) {
      const updated: CollectionPoint = {
        ...editingPoint,
        ...formData,
        updated_at: new Date().toISOString(),
      };
      await onUpdatePoint(updated);
      showToast(`Collection point "${updated.name}" updated`, 'success');
    } else {
      const newPoint: CollectionPoint = {
        id: 'cp-' + Date.now().toString(36),
        ...formData,
        is_active: true,
        created_at: new Date().toISOString(),
      };
      await onAddPoint(newPoint);
      showToast(`Collection point "${newPoint.name}" created`, 'success');
    }
    setIsModalOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (deletingId) {
      await onDeletePoint(deletingId);
      showToast('Collection point removed from registry', 'info');
      setIsDeleteConfirmOpen(false);
      setDeletingId(null);
    }
  };

  // Filtered & Sorted Points
  const filteredPoints = useMemo(() => {
    return points
      .filter((p) => {
        const matchesQuery = 
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.address_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.area.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesZone = selectedZone === 'All Zones' || p.area === selectedZone;
        const matchesType = selectedWasteType === 'All Types' || p.waste_type === selectedWasteType;
        const matchesPriority = selectedPriority === 'All Priorities' || p.priority === selectedPriority;
        return matchesQuery && matchesZone && matchesType && matchesPriority;
      })
      .sort((a, b) => {
        const valA: any = sortBy === 'fill' ? (a.estimated_fill_percent || 0) : (a as any)[sortBy];
        const valB: any = sortBy === 'fill' ? (b.estimated_fill_percent || 0) : (b as any)[sortBy];
        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [points, searchQuery, selectedZone, selectedWasteType, selectedPriority, sortBy, sortOrder]);

  // Paginated Points
  const totalPages = Math.ceil(filteredPoints.length / itemsPerPage) || 1;
  const paginatedPoints = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredPoints.slice(start, start + itemsPerPage);
  }, [filteredPoints, currentPage]);

  return (
    <div className="page-container">
      {/* Header Banner */}
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Collection Points Directory</h1>
          <p className="page-subtitle">
            Manage municipal waste receptacles, bin fill sensors, and jurisdictional coverage
          </p>
        </div>

        <div className="page-actions-group">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => exportPointsToCSV(filteredPoints)}
            title="Export filtered collection points to CSV"
          >
            <FileDown size={14} />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleOpenAdd}
          >
            <Plus size={14} />
            <span>Register New Point</span>
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="tailux-card">
        {/* Table Toolbar & Filters */}
        <div className="table-toolbar">
          <div className="search-input-box">
            <Search size={15} className="search-input-icon" />
            <input
              type="text"
              placeholder="Search points by name, street, or area..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            />
          </div>

          <div className="table-filters-group">
            {/* Zone Filter */}
            <select
              className="form-select"
              style={{ width: 'auto', fontSize: '0.8rem', padding: '0.45rem 0.8rem' }}
              value={selectedZone}
              onChange={(e) => { setSelectedZone(e.target.value); setCurrentPage(1); }}
            >
              {ZONES.map((z) => (
                <option key={z} value={z}>{z}</option>
              ))}
            </select>

            {/* Waste Type Filter */}
            <select
              className="form-select"
              style={{ width: 'auto', fontSize: '0.8rem', padding: '0.45rem 0.8rem' }}
              value={selectedWasteType}
              onChange={(e) => { setSelectedWasteType(e.target.value); setCurrentPage(1); }}
            >
              <option value="All Types">All Waste Types</option>
              {WASTE_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>

            {/* Priority Filter */}
            <select
              className="form-select"
              style={{ width: 'auto', fontSize: '0.8rem', padding: '0.45rem 0.8rem' }}
              value={selectedPriority}
              onChange={(e) => { setSelectedPriority(e.target.value); setCurrentPage(1); }}
            >
              <option value="All Priorities">All Priorities</option>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>{p} Priority</option>
              ))}
            </select>

            {/* Sort Dropdown */}
            <select
              className="form-select"
              style={{ width: 'auto', fontSize: '0.8rem', padding: '0.45rem 0.8rem' }}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <option value="name">Sort by Name</option>
              <option value="area">Sort by Area</option>
              <option value="fill">Sort by Fill %</option>
              <option value="priority">Sort by Priority</option>
            </select>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))}
              title={`Sort order: ${sortOrder.toUpperCase()}`}
            >
              <ArrowUpDown size={13} />
              <span>{sortOrder.toUpperCase()}</span>
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="table-responsive">
          <table className="tailux-table">
            <thead>
              <tr>
                <th style={{ width: '28%' }}>Point Details & Address</th>
                <th>Zone / Sector</th>
                <th>Waste Classification</th>
                <th>Priority</th>
                <th>Fill Level</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedPoints.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No collection points matched your search criteria.
                  </td>
                </tr>
              ) : (
                paginatedPoints.map((point) => {
                  const fill = point.estimated_fill_percent || 0;
                  const isHighFill = fill >= 80;

                  return (
                    <tr key={point.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                          <div style={{
                            width: 32,
                            height: 32,
                            borderRadius: 'var(--radius-sm)',
                            background: isHighFill ? 'var(--accent-rose-light)' : 'var(--primary-light)',
                            color: isHighFill ? 'var(--accent-rose-text)' : 'var(--primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            marginTop: '2px',
                          }}>
                            <MapPin size={16} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.86rem' }}>
                              {point.name}
                            </div>
                            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                              {point.address_text}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                              Coord: {point.latitude.toFixed(4)}, {point.longitude.toFixed(4)} • {point.bin_capacity_liters || 240}L Capacity
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span style={{ fontWeight: 500, fontSize: '0.82rem' }}>{point.area}</span>
                      </td>

                      <td>
                        <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>
                          {point.waste_type}
                        </span>
                      </td>

                      <td>
                        <span className={`badge ${
                          point.priority === 'High' ? 'badge-rose' :
                          point.priority === 'Medium' ? 'badge-amber' :
                          'badge-emerald'
                        }`}>
                          {point.priority}
                        </span>
                      </td>

                      <td style={{ minWidth: 140 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{
                            flex: 1,
                            height: 7,
                            borderRadius: 'var(--radius-full)',
                            background: 'var(--border-color)',
                            overflow: 'hidden',
                          }}>
                            <div style={{
                              width: `${fill}%`,
                              height: '100%',
                              background: isHighFill ? 'var(--accent-rose)' : fill > 50 ? 'var(--accent-amber)' : 'var(--accent-emerald)',
                              transition: 'width 0.3s ease',
                            }} />
                          </div>
                          <span style={{ fontSize: '0.76rem', fontWeight: 700, color: isHighFill ? 'var(--accent-rose)' : 'var(--text-main)' }}>
                            {fill}%
                          </span>
                        </div>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.35rem' }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleOpenEdit(point)}
                            title="Edit Point"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger-outline btn-sm"
                            onClick={() => {
                              setDeletingId(point.id);
                              setIsDeleteConfirmOpen(true);
                            }}
                            title="Delete Point"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="table-pagination">
          <div>
            Showing <strong>{filteredPoints.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}</strong> to <strong>{Math.min(currentPage * itemsPerPage, filteredPoints.length)}</strong> of <strong>{filteredPoints.length}</strong> collection points
          </div>

          <div className="pagination-controls">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              <ChevronLeft size={14} />
              <span>Previous</span>
            </button>
            <span style={{ padding: '0 0.5rem', fontWeight: 600 }}>
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              <span>Next</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit Point Modal */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div 
            className="modal-card" 
            style={{ maxWidth: 620 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 className="modal-title">
                {editingPoint ? 'Edit Collection Location' : 'Register New Collection Location'}
              </h3>
              <button 
                type="button" 
                className="btn btn-flat btn-icon-only"
                onClick={() => setIsModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">
                      Location / Facility Name <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      placeholder="e.g. City Hall Civic Promenade"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">
                      Street Address <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      placeholder="e.g. 100 Municipal Square, Central Plaza"
                      value={formData.address_text}
                      onChange={(e) => setFormData({ ...formData, address_text: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Jurisdictional Zone</label>
                    <select
                      className="form-select"
                      value={formData.area}
                      onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    >
                      {ZONES.filter((z) => z !== 'All Zones').map((z) => (
                        <option key={z} value={z}>{z}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Waste Stream Type</label>
                    <select
                      className="form-select"
                      value={formData.waste_type}
                      onChange={(e) => setFormData({ ...formData, waste_type: e.target.value as WasteType })}
                    >
                      {WASTE_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Collection Priority</label>
                    <select
                      className="form-select"
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value as Priority })}
                    >
                      {PRIORITIES.map((p) => (
                        <option key={p} value={p}>{p} Priority</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Receptacle Capacity (Liters)</label>
                    <input
                      type="number"
                      min={120}
                      max={1200}
                      step={60}
                      className="form-input"
                      value={formData.bin_capacity_liters}
                      onChange={(e) => setFormData({ ...formData, bin_capacity_liters: Number(e.target.value) })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Latitude Coordinate</label>
                    <input
                      type="number"
                      step="0.0001"
                      required
                      className="form-input"
                      value={formData.latitude}
                      onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) || 0 })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Longitude Coordinate</label>
                    <input
                      type="number"
                      step="0.0001"
                      required
                      className="form-input"
                      value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) || 0 })}
                    />
                  </div>

                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Estimated Fill Level ({formData.estimated_fill_percent}%)</label>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={formData.estimated_fill_percent}
                      onChange={(e) => setFormData({ ...formData, estimated_fill_percent: Number(e.target.value) })}
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Operational Notes (Optional)</label>
                    <textarea
                      className="form-textarea"
                      placeholder="Access restrictions, gate keys, or specific driver instructions..."
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingPoint ? 'Save Changes' : 'Register Location'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {isDeleteConfirmOpen && (
        <div className="modal-backdrop" onClick={() => setIsDeleteConfirmOpen(false)}>
          <div 
            className="modal-card" 
            style={{ maxWidth: 420 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 className="modal-title" style={{ color: 'var(--accent-rose)' }}>
                Confirm Removal
              </h3>
              <button 
                type="button" 
                className="btn btn-flat btn-icon-only"
                onClick={() => setIsDeleteConfirmOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <p style={{ fontSize: '0.86rem', color: 'var(--text-body)' }}>
                Are you sure you want to permanently remove this collection point from the municipal database? 
                This action will be recorded in the system audit log.
              </p>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setIsDeleteConfirmOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={handleConfirmDelete}
              >
                Yes, Delete Location
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
