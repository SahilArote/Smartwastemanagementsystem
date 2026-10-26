import React, { useState, useMemo } from 'react';
import { 
  Download, 
  Calendar, 
  Filter, 
  CheckCircle2, 
  TrendingUp, 
  Compass, 
  Truck
} from 'lucide-react';
import type { Route } from '../types';
import { exportRoutesToCSV } from '../services/storage';

interface ReportsViewProps {
  routes: Route[];
  showToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

const getDefaultStartDate = () => new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
const getDefaultEndDate = () => new Date().toISOString().split('T')[0];

export const ReportsView: React.FC<ReportsViewProps> = ({
  routes,
  showToast,
}) => {
  const [selectedZone, setSelectedZone] = useState('All');
  const [startDate, setStartDate] = useState<string>(getDefaultStartDate);
  const [endDate, setEndDate] = useState<string>(getDefaultEndDate);

  // Filter routes by date range and zone
  const filteredRoutes = useMemo(() => {
    return routes.filter((r) => {
      const isDateInRange = r.route_date >= startDate && r.route_date <= endDate;
      const isZoneMatch = selectedZone === 'All' || r.zone === selectedZone || r.stops.some((s) => s.point_area === selectedZone);
      return isDateInRange && isZoneMatch;
    });
  }, [routes, startDate, endDate, selectedZone]);

  // Aggregate metrics from filtered routes
  const metrics = useMemo(() => {
    let totalStops = 0;
    let completedStops = 0;
    let totalKm = 0;
    const workerMap: Record<string, { name: string; routesCount: number; stopsCompleted: number; totalKm: number }> = {};
    const wasteStreamMap: Record<string, number> = {};

    filteredRoutes.forEach((route) => {
      totalKm += route.total_distance_km || 0;
      const wId = route.assigned_worker_id || 'unassigned';
      const wName = route.assigned_worker_name || 'Unassigned Staff';

      if (!workerMap[wId]) {
        workerMap[wId] = { name: wName, routesCount: 0, stopsCompleted: 0, totalKm: 0 };
      }
      workerMap[wId].routesCount += 1;
      workerMap[wId].totalKm += route.total_distance_km || 0;

      route.stops.forEach((stop) => {
        totalStops += 1;
        if (stop.status === 'Completed') {
          completedStops += 1;
          workerMap[wId].stopsCompleted += 1;
        }

        const wt = stop.waste_type || 'General Waste';
        wasteStreamMap[wt] = (wasteStreamMap[wt] || 0) + 1;
      });
    });

    const completionRate = totalStops > 0 ? Math.round((completedStops / totalStops) * 100) : 0;
    const workersList = Object.values(workerMap);

    return {
      totalRoutesCount: filteredRoutes.length,
      totalStops,
      completedStops,
      completionRate,
      totalKm: Number(totalKm.toFixed(1)),
      workersList,
      wasteStreamMap,
    };
  }, [filteredRoutes]);

  const handleExportCSV = () => {
    if (filteredRoutes.length === 0) {
      showToast('No operational data found for selected filter range', 'error');
      return;
    }
    exportRoutesToCSV(filteredRoutes);
    showToast(`Exported ${filteredRoutes.length} route manifests to CSV`, 'success');
  };

  return (
    <div className="page-container">
      {/* Header Banner */}
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Operational Intelligence & Reports</h1>
          <p className="page-subtitle">
            Audited municipal performance analytics, fleet mileage, driver productivity, and stream breakdown
          </p>
        </div>

        <div className="page-actions-group">
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleExportCSV}
          >
            <Download size={14} />
            <span>Download CSV Report</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar Card */}
      <div className="tailux-card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-body" style={{ padding: '1rem 1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={16} color="var(--primary)" />
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)' }}>Period:</span>
              <input
                type="date"
                className="form-input"
                style={{ width: 'auto', padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>to</span>
              <input
                type="date"
                className="form-input"
                style={{ width: 'auto', padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Filter size={16} color="var(--primary)" />
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)' }}>Zone Filter:</span>
              <select
                className="form-select"
                style={{ width: 'auto', padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
              >
                <option value="All">All Municipal Districts</option>
                <option value="Downtown Central">Downtown Central</option>
                <option value="Central Commercial">Central Commercial</option>
                <option value="East Sector Tech Corridor">East Sector Tech Corridor</option>
                <option value="North & West Residential">North & West Residential</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Overview Metrics */}
      <div className="stat-cards-grid">
        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-label">Dispatched Manifests</span>
            <div className="metric-icon-box indigo">
              <Truck size={20} />
            </div>
          </div>
          <div className="metric-value">{metrics.totalRoutesCount}</div>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>In selected window</span>
        </div>

        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-label">Stops Collected</span>
            <div className="metric-icon-box emerald">
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div className="metric-value">{metrics.completedStops} <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}>/ {metrics.totalStops}</span></div>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Verified completion</span>
        </div>

        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-label">Fleet Completion Rate</span>
            <div className="metric-icon-box amber">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="metric-value">{metrics.completionRate}%</div>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Overall efficiency</span>
        </div>

        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-label">Planned Fleet Mileage</span>
            <div className="metric-icon-box blue">
              <Compass size={20} />
            </div>
          </div>
          <div className="metric-value">{metrics.totalKm} <span style={{ fontSize: '1rem', fontWeight: 500 }}>km</span></div>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Road travel distance</span>
        </div>
      </div>

      {/* Two Column Section: Driver Productivity & Waste Streams Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem', marginBottom: '1.75rem' }}>
        {/* Driver Productivity Table */}
        <div className="tailux-card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Driver Operational Productivity</h2>
              <p className="card-description">Collections verified per driver in this window</p>
            </div>
          </div>

          <div className="table-responsive">
            <table className="tailux-table">
              <thead>
                <tr>
                  <th>Driver Name</th>
                  <th>Routes</th>
                  <th>Stops Completed</th>
                  <th>Distance Covered</th>
                </tr>
              </thead>
              <tbody>
                {metrics.workersList.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No driver records found for this period.
                    </td>
                  </tr>
                ) : (
                  metrics.workersList.map((worker) => (
                    <tr key={worker.name}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{worker.name}</div>
                      </td>
                      <td>{worker.routesCount} manifests</td>
                      <td>
                        <span className="badge badge-emerald">
                          {worker.stopsCompleted} stops
                        </span>
                      </td>
                      <td>{worker.totalKm.toFixed(1)} km</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Waste Stream Volume Distribution */}
        <div className="tailux-card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Waste Stream Distribution</h2>
              <p className="card-description">Collection volume distribution by stream classification</p>
            </div>
          </div>

          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {Object.entries(metrics.wasteStreamMap).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  No collection streams recorded in this date range.
                </div>
              ) : (
                Object.entries(metrics.wasteStreamMap).map(([stream, count]) => {
                  const pct = metrics.totalStops > 0 ? Math.round((count / metrics.totalStops) * 100) : 0;
                  return (
                    <div key={stream}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.84rem', color: 'var(--text-main)' }}>{stream}</span>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{count} stops ({pct}%)</span>
                      </div>
                      <div style={{
                        height: 7,
                        borderRadius: 'var(--radius-full)',
                        background: 'var(--border-color)',
                        overflow: 'hidden',
                      }}>
                        <div style={{
                          width: `${pct}%`,
                          height: '100%',
                          background: stream.includes('Organic') ? 'var(--accent-amber)' :
                                      stream.includes('Recycle') ? 'var(--accent-emerald)' :
                                      stream.includes('Hazardous') ? 'var(--accent-rose)' :
                                      'var(--primary)',
                        }} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
