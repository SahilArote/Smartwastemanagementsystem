import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  MapPin, 
  CheckCircle, 
  X, 
  Crosshair 
} from 'lucide-react';
import type { CollectionPoint, Priority, WasteType } from '../types';
import { MapView } from './MapView';
import { getDepots } from '../services/storage';

interface CollectionPointsViewProps {
  points: CollectionPoint[];
  onAddPoint: (point: CollectionPoint) => void;
  onUpdatePoint: (point: CollectionPoint) => void;
  onDeletePoint: (id: string) => void;
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

export const CollectionPointsView: React.FC<CollectionPointsViewProps> = ({
  points,
  onAddPoint,
  onUpdatePoint,
  onDeletePoint,
  showToast,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterArea, setFilterArea] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const [filterWasteType, setFilterWasteType] = useState('All');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPoint, setEditingPoint] = useState<CollectionPoint | null>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    area: '',
    address_text: '',
    latitude: '18.5204',
    longitude: '73.8567',
    waste_type: 'General Waste' as WasteType,
    priority: 'Medium' as Priority,
    bin_capacity_liters: 240,
    estimated_fill_percent: 60,
    notes: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [pickOnMapActive, setPickOnMapActive] = useState(false);
  const [tempMarker, setTempMarker] = useState<{ lat: number; lng: number } | null>(null);

  const depots = getDepots();
  const primaryDepot = depots[0];

  // Distinct Areas
  const availableAreas = ['All', ...Array.from(new Set(points.map((p) => p.area)))];

  // Filtered Points
  const filteredPoints = points.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.address_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.area.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesArea = filterArea === 'All' || p.area === filterArea;
    const matchesPriority = filterPriority === 'All' || p.priority === filterPriority;
    const matchesWaste = filterWasteType === 'All' || p.waste_type === filterWasteType;

    return matchesSearch && matchesArea && matchesPriority && matchesWaste;
  });

  const handleOpenAdd = () => {
    setEditingPoint(null);
    setFormData({
      name: '',
      area: availableAreas[1] || 'Downtown Central',
      address_text: '',
      latitude: '18.5204',
      longitude: '73.8567',
      waste_type: 'General Waste',
      priority: 'Medium',
      bin_capacity_liters: 240,
      estimated_fill_percent: 50,
      notes: '',
    });
    setTempMarker({ lat: 18.5204, lng: 73.8567 });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: CollectionPoint) => {
    setEditingPoint(p);
    setFormData({
      name: p.name,
      area: p.area,
      address_text: p.address_text,
      latitude: String(p.latitude),
      longitude: String(p.longitude),
      waste_type: p.waste_type,
      priority: p.priority,
      bin_capacity_liters: p.bin_capacity_liters || 240,
      estimated_fill_percent: p.estimated_fill_percent || 50,
      notes: p.notes || '',
    });
    setTempMarker({ lat: p.latitude, lng: p.longitude });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleMapCoordinatePick = (lat: number, lng: number) => {
    setFormData((prev) => ({
      ...prev,
      latitude: String(lat),
      longitude: String(lng),
    }));
    setTempMarker({ lat, lng });
    showToast(`Coordinates selected: ${lat}, ${lng}`, 'info');
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Location name is required';
    if (!formData.area.trim()) errors.area = 'Area/District is required';
    if (!formData.address_text.trim()) errors.address_text = 'Address line is required';

    const lat = parseFloat(formData.latitude);
    const lng = parseFloat(formData.longitude);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      errors.latitude = 'Latitude must be between -90 and 90';
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      errors.longitude = 'Longitude must be between -180 and 180';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const lat = parseFloat(formData.latitude);
    const lng = parseFloat(formData.longitude);

    if (editingPoint) {
      const updated: CollectionPoint = {
        ...editingPoint,
        name: formData.name.trim(),
        area: formData.area.trim(),
        address_text: formData.address_text.trim(),
        latitude: lat,
        longitude: lng,
        waste_type: formData.waste_type,
        priority: formData.priority,
        bin_capacity_liters: Number(formData.bin_capacity_liters),
        estimated_fill_percent: Number(formData.estimated_fill_percent),
        notes: formData.notes.trim(),
      };
      onUpdatePoint(updated);
      showToast('Collection point updated successfully', 'success');
    } else {
      const newPoint: CollectionPoint = {
        id: `cp-${Date.now().toString().slice(-6)}`,
        name: formData.name.trim(),
        area: formData.area.trim(),
        address_text: formData.address_text.trim(),
        latitude: lat,
        longitude: lng,
        waste_type: formData.waste_type,
        priority: formData.priority,
        is_active: true,
        bin_capacity_liters: Number(formData.bin_capacity_liters),
        estimated_fill_percent: Number(formData.estimated_fill_percent),
        notes: formData.notes.trim(),
        created_at: new Date().toISOString(),
      };
      onAddPoint(newPoint);
      showToast('New collection point added', 'success');
    }

    setIsModalOpen(false);
    setPickOnMapActive(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      onDeletePoint(id);
      showToast('Collection point removed', 'info');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header and Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff' }}>Waste Collection Points</h2>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            Manage municipal disposal bins, coordinates, priorities and waste categories
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAdd} id="btn-add-point">
          <Plus size={16} />
          <span>Add New Collection Point</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-card" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
        <div style={{ flex: '1 1 240px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search point name, address, or area..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '2.4rem' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div>
            <select
              className="form-select"
              value={filterArea}
              onChange={(e) => setFilterArea(e.target.value)}
            >
              <option value="All">All Areas ({points.length})</option>
              {availableAreas.filter((a) => a !== 'All').map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              className="form-select"
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
            >
              <option value="All">All Priorities</option>
              <option value="High">High Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="Low">Low Priority</option>
            </select>
          </div>

          <div>
            <select
              className="form-select"
              value={filterWasteType}
              onChange={(e) => setFilterWasteType(e.target.value)}
            >
              <option value="All">All Waste Types</option>
              {WASTE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Split View: Table + Live Interactive Map */}
      <div className="split-view-container">
        {/* Collection Points Table */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>
              Showing {filteredPoints.length} of {points.length} Points
            </span>
          </div>

          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Point Details</th>
                  <th>Area</th>
                  <th>Waste Type</th>
                  <th>Priority</th>
                  <th>Fill %</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPoints.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                      No matching collection points found.
                    </td>
                  </tr>
                ) : (
                  filteredPoints.map((point) => (
                    <tr key={point.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: '#ffffff' }}>{point.name}</div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                          📍 {point.address_text}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                          {point.latitude.toFixed(4)}, {point.longitude.toFixed(4)}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>{point.area}</span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.78rem', color: '#38bdf8' }}>{point.waste_type}</span>
                      </td>
                      <td>
                        <span className={`badge badge-${point.priority.toLowerCase()}`}>
                          {point.priority}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{point.estimated_fill_percent || 50}%</span>
                          <div style={{ width: 40, height: 5, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
                            <div
                              style={{
                                width: `${point.estimated_fill_percent || 50}%`,
                                height: '100%',
                                background: (point.estimated_fill_percent || 50) > 80 ? '#ef4444' : '#10b981',
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleOpenEdit(point)}
                            title="Edit Point"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDelete(point.id, point.name)}
                            title="Delete Point"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Interactive Map Preview */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>Map Visualization (FR-04)</h3>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Click any marker to inspect point details</p>
            </div>
          </div>

          <MapView
            depot={primaryDepot}
            collectionPoints={filteredPoints}
            height="500px"
          />
        </div>
      </div>

      {/* Add / Edit Point Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '680px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: 36, height: 36, borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                  <MapPin size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff' }}>
                    {editingPoint ? 'Edit Collection Point' : 'Add New Collection Point'}
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Define location, coordinates, and collection characteristics</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setPickOnMapActive(false);
                }}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Point / Facility Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. City Hall Plaza West Bin"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                  {formErrors.name && <span style={{ color: '#f87171', fontSize: '0.75rem' }}>{formErrors.name}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Zone / Area Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Downtown Central"
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                  />
                  {formErrors.area && <span style={{ color: '#f87171', fontSize: '0.75rem' }}>{formErrors.area}</span>}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Full Street Address *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 100 Municipal Square, Main Promenade"
                  value={formData.address_text}
                  onChange={(e) => setFormData({ ...formData, address_text: e.target.value })}
                />
                {formErrors.address_text && <span style={{ color: '#f87171', fontSize: '0.75rem' }}>{formErrors.address_text}</span>}
              </div>

              {/* Coordinates Section with Map Click Integration */}
              <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-subtle)', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label className="form-label" style={{ margin: 0 }}>
                    Geographic Coordinates (WGS84) *
                  </label>
                  <button
                    type="button"
                    className={`btn btn-sm ${pickOnMapActive ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setPickOnMapActive(!pickOnMapActive)}
                  >
                    <Crosshair size={13} />
                    <span>{pickOnMapActive ? 'Click Map Enabled' : 'Pick on Map'}</span>
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Latitude (-90 to 90)</label>
                    <input
                      type="number"
                      step="0.000001"
                      className="form-input"
                      value={formData.latitude}
                      onChange={(e) => {
                        setFormData({ ...formData, latitude: e.target.value });
                        const lat = parseFloat(e.target.value);
                        const lng = parseFloat(formData.longitude);
                        if (!isNaN(lat) && !isNaN(lng)) setTempMarker({ lat, lng });
                      }}
                    />
                    {formErrors.latitude && <span style={{ color: '#f87171', fontSize: '0.75rem' }}>{formErrors.latitude}</span>}
                  </div>

                  <div>
                    <label style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Longitude (-180 to 180)</label>
                    <input
                      type="number"
                      step="0.000001"
                      className="form-input"
                      value={formData.longitude}
                      onChange={(e) => {
                        setFormData({ ...formData, longitude: e.target.value });
                        const lat = parseFloat(formData.latitude);
                        const lng = parseFloat(e.target.value);
                        if (!isNaN(lat) && !isNaN(lng)) setTempMarker({ lat, lng });
                      }}
                    />
                    {formErrors.longitude && <span style={{ color: '#f87171', fontSize: '0.75rem' }}>{formErrors.longitude}</span>}
                  </div>
                </div>

                {/* Embedded Mini Coordinate Picker Map */}
                <div style={{ marginTop: '0.75rem' }}>
                  <MapView
                    center={[parseFloat(formData.latitude) || 18.5204, parseFloat(formData.longitude) || 73.8567]}
                    zoom={14}
                    height="200px"
                    pickMode={true}
                    temporaryMarker={tempMarker}
                    onMapClick={handleMapCoordinatePick}
                  />
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '4px', textAlign: 'center' }}>
                    Tip: Click anywhere on the map above to instantly pinpoint coordinates.
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Waste Category</label>
                  <select
                    className="form-select"
                    value={formData.waste_type}
                    onChange={(e) => setFormData({ ...formData, waste_type: e.target.value as WasteType })}
                  >
                    {WASTE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Priority Level</label>
                  <select
                    className="form-select"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as Priority })}
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>
                        {p} Priority
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Bin Capacity (Liters)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.bin_capacity_liters}
                    onChange={(e) => setFormData({ ...formData, bin_capacity_liters: Number(e.target.value) })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Estimated Fill Level (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="form-input"
                    value={formData.estimated_fill_percent}
                    onChange={(e) => setFormData({ ...formData, estimated_fill_percent: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Notes & Instructions (Optional)</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  placeholder="e.g. Access through service alley behind building"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" id="btn-save-point">
                  <CheckCircle size={16} />
                  <span>{editingPoint ? 'Update Point' : 'Save Point'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
