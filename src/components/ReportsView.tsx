import React from 'react';
import { 
  PieChart, 
  Download, 
  Printer, 
  MapPin, 
  Truck, 
  Clock, 
  TrendingUp,
  Percent
} from 'lucide-react';
import type { CollectionPoint, Route, SystemStats } from '../types';

interface ReportsViewProps {
  stats: SystemStats;
  points: CollectionPoint[];
  routes: Route[];
  showToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  stats,
  points,
  routes,
  showToast,
}) => {
  // Aggregate waste categories
  const wasteDistribution: Record<string, number> = {};
  points.forEach((p) => {
    wasteDistribution[p.waste_type] = (wasteDistribution[p.waste_type] || 0) + 1;
  });

  // Aggregate area statistics
  const areaDistribution: Record<string, { total: number; high: number }> = {};
  points.forEach((p) => {
    if (!areaDistribution[p.area]) {
      areaDistribution[p.area] = { total: 0, high: 0 };
    }
    areaDistribution[p.area].total++;
    if (p.priority === 'High') {
      areaDistribution[p.area].high++;
    }
  });

  // Export CSV
  const handleExportCSV = () => {
    let csv = 'Route Name,Date,Assigned Worker,Total Distance (km),Status,Total Stops,Completed Stops\n';
    routes.forEach((r) => {
      const completed = r.stops.filter((s) => s.status === 'Completed').length;
      csv += `"${r.route_name}","${r.route_date}","${r.assigned_worker_name || 'Unassigned'}",${r.total_distance_km || 0},"${r.status}",${r.stops.length},${completed}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `municipal_waste_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Operational report exported to CSV', 'success');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff' }}>
            Operational Reports & Metrics (FR-11)
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            Planned route distances, completion ratios, and municipal waste category distribution
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => window.print()}>
            <Printer size={15} />
            <span>Print Report</span>
          </button>
          <button className="btn btn-primary btn-sm" onClick={handleExportCSV}>
            <Download size={15} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="dashboard-metrics-grid">
        <div className="metric-card">
          <div className="metric-icon-wrap green">
            <Truck size={24} />
          </div>
          <div className="metric-info">
            <h4>Total Planned Distance</h4>
            <div className="metric-value">{stats.totalPlannedKm} km</div>
            <div className="metric-subtext">Across {stats.totalRoutes} route plans</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-wrap cyan">
            <Percent size={24} />
          </div>
          <div className="metric-info">
            <h4>Stop Completion Rate</h4>
            <div className="metric-value">{stats.completionRate}%</div>
            <div className="metric-subtext">{stats.completedStops} of {stats.totalStops} completed</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-wrap amber">
            <Clock size={24} />
          </div>
          <div className="metric-info">
            <h4>Pending Stops</h4>
            <div className="metric-value">{stats.pendingStops}</div>
            <div className="metric-subtext">Scheduled for collection</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-wrap purple">
            <TrendingUp size={24} />
          </div>
          <div className="metric-info">
            <h4>In-Progress Stops</h4>
            <div className="metric-value">{stats.inProgressStops}</div>
            <div className="metric-subtext">Live active pickups</div>
          </div>
        </div>
      </div>

      {/* Distribution Grids */}
      <div className="split-view-container">
        {/* Waste Category Breakdown */}
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <PieChart size={18} color="#06b6d4" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff' }}>
              Waste Stream Distribution
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {Object.entries(wasteDistribution).map(([type, count]) => {
              const pct = Math.round((count / points.length) * 100);
              return (
                <div key={type}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                    <span style={{ color: '#cbd5e1' }}>{type}</span>
                    <span style={{ fontWeight: 600, color: '#ffffff' }}>
                      {count} bins ({pct}%)
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '999px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${pct}%`,
                        height: '100%',
                        background:
                          type.includes('Hazardous')
                            ? '#ef4444'
                            : type.includes('Recyclable')
                            ? '#06b6d4'
                            : type.includes('Organic')
                            ? '#10b981'
                            : '#f59e0b',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Area / District Coverage */}
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <MapPin size={18} color="#10b981" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff' }}>
              Municipal Zone Coverage
            </h3>
          </div>

          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Municipal Zone</th>
                  <th>Total Bins</th>
                  <th>Urgent (High)</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(areaDistribution).map(([area, data]) => (
                  <tr key={area}>
                    <td style={{ fontWeight: 600, color: '#ffffff' }}>{area}</td>
                    <td>{data.total}</td>
                    <td>
                      <span className={`badge ${data.high > 0 ? 'badge-high' : 'badge-low'}`}>
                        {data.high} High
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
