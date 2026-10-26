import type { 
  CollectionPoint, 
  Route, 
  RouteStop, 
  UserProfile, 
  UserAccount,
  CollectionZone, 
  CollectionSchedule, 
  ActivityLog, 
  AppNotification, 
  Depot, 
  SystemStats, 
  StopStatus,
  RouteStatus
} from '../types';
import { getSupabaseClient } from './supabaseClient';

const STORAGE_KEY_POINTS = 'smartwaste_collection_points';
const STORAGE_KEY_ROUTES = 'smartwaste_routes';
const STORAGE_KEY_USER = 'smartwaste_active_session';
const STORAGE_KEY_DEPOTS = 'smartwaste_depots';
const STORAGE_KEY_ZONES = 'smartwaste_zones';
const STORAGE_KEY_SCHEDULES = 'smartwaste_schedules';
const STORAGE_KEY_USERS_DB = 'smartwaste_users_registry';
const STORAGE_KEY_LOGS = 'smartwaste_activity_logs';
const STORAGE_KEY_NOTIFS = 'smartwaste_notifications';

// ==========================================
// 1. Initial Municipal Depots
// ==========================================
export const DEFAULT_DEPOTS: Depot[] = [
  {
    id: 'depot-central',
    name: 'Municipal Central Depot & Fleet Facility',
    address: '42 Sector 7, Central Civic Ring, City Center',
    latitude: 18.5204,
    longitude: 73.8567,
    contact_phone: '+1 (555) 019-2831',
  },
  {
    id: 'depot-north',
    name: 'North Zone Transfer Station & Composting Yard',
    address: '108 Industrial Expressway, North Zone',
    latitude: 18.5529,
    longitude: 73.8184,
    contact_phone: '+1 (555) 019-2832',
  },
  {
    id: 'depot-east',
    name: 'East Metro Waste Management Facility',
    address: '89 Bypass Road, Silicon Corridor',
    latitude: 18.5362,
    longitude: 73.8958,
    contact_phone: '+1 (555) 019-2833',
  },
];

// ==========================================
// 2. Initial Collection Zones
// ==========================================
export const INITIAL_ZONES: CollectionZone[] = [
  {
    id: 'zone-01',
    name: 'Downtown Central',
    code: 'ZN-CENTRAL',
    description: 'High-density commercial centers, municipal hall, and historic markets.',
    color: '#3b82f6',
    headquarters_address: '100 Municipal Square, Central Plaza',
    active_points_count: 4,
    created_at: '2026-01-15T08:00:00Z',
  },
  {
    id: 'zone-02',
    name: 'Central Commercial',
    code: 'ZN-COMMERCIAL',
    description: 'Business arcades, medical facilities, restaurants, and shopping corridors.',
    color: '#8b5cf6',
    headquarters_address: 'Plot 12, FC Road Junction',
    active_points_count: 2,
    created_at: '2026-01-16T08:00:00Z',
  },
  {
    id: 'zone-03',
    name: 'East Sector Tech Corridor',
    code: 'ZN-EAST',
    description: 'Software parks, riverside residential enclaves, and commercial loading docks.',
    color: '#10b981',
    headquarters_address: '89 Bypass Road, Silicon Valley East',
    active_points_count: 2,
    created_at: '2026-01-18T08:00:00Z',
  },
  {
    id: 'zone-04',
    name: 'North & West Residential',
    code: 'ZN-NORTHWEST',
    description: 'University campus, science centers, and residential housing developments.',
    color: '#f59e0b',
    headquarters_address: 'Gate 4, University Technology Ave',
    active_points_count: 2,
    created_at: '2026-01-20T08:00:00Z',
  },
];

// ==========================================
// 3. Initial Municipal Staff & RBAC Users
// ==========================================
export const INITIAL_USER_ACCOUNTS: UserAccount[] = [
  {
    id: 'usr-admin-01',
    email: (import.meta.env.VITE_ADMIN_EMAIL || 'admin@citywaste.gov').toLowerCase().trim(),
    password_hash: 'Admin@123', // Demo verified password
    full_name: 'Elena Rostova',
    role: 'admin',
    phone: '+1 (555) 839-2041',
    zone: 'All Operational Zones (HQ)',
    status: 'Active',
    created_at: '2026-01-01T00:00:00Z',
    last_login: new Date().toISOString(),
  },
  {
    id: 'usr-sup-01',
    email: 'supervisor@citywaste.gov',
    password_hash: 'Supervisor@123',
    full_name: 'David Zhao',
    role: 'supervisor',
    phone: '+1 (555) 741-9920',
    zone: 'Downtown & Commercial Division',
    status: 'Active',
    created_at: '2026-01-05T00:00:00Z',
    last_login: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'worker-01',
    email: 'marcus.worker@citywaste.gov',
    password_hash: 'Worker@123',
    full_name: 'Marcus Vance',
    role: 'worker',
    phone: '+1 (555) 482-1920',
    zone: 'Downtown Central',
    status: 'Active',
    created_at: '2026-01-10T00:00:00Z',
    last_login: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 'worker-02',
    email: 'priya.worker@citywaste.gov',
    password_hash: 'Worker@123',
    full_name: 'Priya Patel',
    role: 'worker',
    phone: '+1 (555) 391-9482',
    zone: 'East Sector Tech Corridor',
    status: 'Active',
    created_at: '2026-01-12T00:00:00Z',
    last_login: new Date(Date.now() - 14400000).toISOString(),
  },
];

// ==========================================
// 4. Initial Collection Schedules
// ==========================================
export const INITIAL_SCHEDULES: CollectionSchedule[] = [
  {
    id: 'sched-01',
    zone_id: 'zone-01',
    zone_name: 'Downtown Central',
    days_of_week: ['Mon', 'Wed', 'Fri'],
    time_window: '06:30 AM - 10:30 AM',
    frequency: 'Twice Weekly',
    assigned_vehicle: 'Compactor Truck #04 (12 Ton)',
    is_active: true,
    notes: 'Morning priority sweep before commercial pedestrian traffic peaks.',
    created_at: '2026-02-01T08:00:00Z',
  },
  {
    id: 'sched-02',
    zone_id: 'zone-02',
    zone_name: 'Central Commercial',
    days_of_week: ['Tue', 'Thu', 'Sat'],
    time_window: '07:00 AM - 11:30 AM',
    frequency: 'Twice Weekly',
    assigned_vehicle: 'Heavy Hauler #09 (16 Ton)',
    is_active: true,
    notes: 'Hospital non-bio waste and shopping arcade bins.',
    created_at: '2026-02-02T08:00:00Z',
  },
  {
    id: 'sched-03',
    zone_id: 'zone-03',
    zone_name: 'East Sector Tech Corridor',
    days_of_week: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    time_window: '08:00 AM - 12:00 PM',
    frequency: 'Daily',
    assigned_vehicle: 'Eco Electric Hauler #02 (8 Ton)',
    is_active: true,
    notes: 'Bulk recyclable packaging and cardboard collection.',
    created_at: '2026-02-05T08:00:00Z',
  },
];

// ==========================================
// 5. Initial Collection Points
// ==========================================
export const INITIAL_COLLECTION_POINTS: CollectionPoint[] = [
  {
    id: 'cp-01',
    name: 'City Hall Civic Plaza',
    area: 'Downtown Central',
    zone_id: 'zone-01',
    address_text: '100 Municipal Square, Main Promenade',
    latitude: 18.5195,
    longitude: 73.8553,
    waste_type: 'Recyclables',
    priority: 'High',
    notes: 'Large segregated smart bins outside civic center entrance.',
    is_active: true,
    bin_capacity_liters: 360,
    estimated_fill_percent: 85,
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
  {
    id: 'cp-02',
    name: 'Old Town Heritage Market',
    area: 'Downtown Central',
    zone_id: 'zone-01',
    address_text: '45 Laxmi Bazaar Road, Near Clock Tower',
    latitude: 18.5158,
    longitude: 73.8572,
    waste_type: 'Organic / Compost',
    priority: 'High',
    notes: 'High organic vegetable waste volume in morning hours.',
    is_active: true,
    bin_capacity_liters: 480,
    estimated_fill_percent: 92,
    created_at: new Date(Date.now() - 6 * 86400000).toISOString(),
  },
  {
    id: 'cp-03',
    name: 'Saras Garden Community Park',
    area: 'Downtown Central',
    zone_id: 'zone-01',
    address_text: 'Gate 2, Lakeside Walkway, Garden Colony',
    latitude: 18.5028,
    longitude: 73.8524,
    waste_type: 'Organic / Compost',
    priority: 'Medium',
    notes: 'Green park leaves & food packaging containers.',
    is_active: true,
    bin_capacity_liters: 240,
    estimated_fill_percent: 60,
    created_at: new Date(Date.now() - 6 * 86400000).toISOString(),
  },
  {
    id: 'cp-04',
    name: 'Shivaji Square Commercial Block',
    area: 'Central Commercial',
    zone_id: 'zone-02',
    address_text: 'Plot 12, FC Road Junction, Commercial Arcade',
    latitude: 18.5248,
    longitude: 73.8436,
    waste_type: 'General Waste',
    priority: 'High',
    notes: 'Street food hub and cafe packaging. Collect early.',
    is_active: true,
    bin_capacity_liters: 480,
    estimated_fill_percent: 78,
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 'cp-05',
    name: 'University Science Campus',
    area: 'North & West Residential',
    zone_id: 'zone-04',
    address_text: 'Gate 4, Department of Technology, University Ave',
    latitude: 18.5412,
    longitude: 73.8291,
    waste_type: 'Hazardous / E-Waste',
    priority: 'Medium',
    notes: 'Secure bin for laboratory packaging and battery recycling.',
    is_active: true,
    bin_capacity_liters: 240,
    estimated_fill_percent: 45,
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    id: 'cp-06',
    name: 'Koregaon Riverside Promenade',
    area: 'East Sector Tech Corridor',
    zone_id: 'zone-03',
    address_text: 'North Main Road, Lane 5 Riverfront',
    latitude: 18.5368,
    longitude: 73.8935,
    waste_type: 'Recyclables',
    priority: 'Medium',
    notes: 'Clean paper, plastic bottles and aluminum beverage cans.',
    is_active: true,
    bin_capacity_liters: 360,
    estimated_fill_percent: 65,
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'cp-07',
    name: 'Metro Central Train Station',
    area: 'Downtown Central',
    zone_id: 'zone-01',
    address_text: 'Station Concourse, North Bus Terminal',
    latitude: 18.5289,
    longitude: 73.8744,
    waste_type: 'General Waste',
    priority: 'High',
    notes: 'Heavy transit passenger footfall daily.',
    is_active: true,
    bin_capacity_liters: 600,
    estimated_fill_percent: 90,
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'cp-08',
    name: 'Aundh Residential Township',
    area: 'North & West Residential',
    zone_id: 'zone-04',
    address_text: 'Park Street 14, Near Community Center',
    latitude: 18.5582,
    longitude: 73.8075,
    waste_type: 'Organic / Compost',
    priority: 'Low',
    notes: 'Segregated residential compost collection bins.',
    is_active: true,
    bin_capacity_liters: 240,
    estimated_fill_percent: 40,
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'cp-09',
    name: 'Tech Park Cyber Towers',
    area: 'East Sector Tech Corridor',
    zone_id: 'zone-03',
    address_text: 'Tower B Loading Bay, Magarpatta Cyber City',
    latitude: 18.5147,
    longitude: 73.9288,
    waste_type: 'Commercial / Bulk',
    priority: 'Medium',
    notes: 'Cardboard cartons and packaging from IT campus.',
    is_active: true,
    bin_capacity_liters: 600,
    estimated_fill_percent: 70,
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'cp-10',
    name: 'District General Hospital',
    area: 'Central Commercial',
    zone_id: 'zone-02',
    address_text: 'Emergency Rear Alley, Health Avenue',
    latitude: 18.5222,
    longitude: 73.8681,
    waste_type: 'General Waste',
    priority: 'High',
    notes: 'Non-biomedical municipal waste bin station.',
    is_active: true,
    bin_capacity_liters: 480,
    estimated_fill_percent: 88,
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
];

// ==========================================
// 6. Initial Operational Routes
// ==========================================
export const INITIAL_ROUTES: Route[] = [
  {
    id: 'route-demo-01',
    route_name: 'Downtown Central Morning Sweep',
    route_date: new Date().toISOString().split('T')[0],
    zone: 'Downtown Central',
    depot_name: DEFAULT_DEPOTS[0].name,
    depot_latitude: DEFAULT_DEPOTS[0].latitude,
    depot_longitude: DEFAULT_DEPOTS[0].longitude,
    assigned_worker_id: 'worker-01',
    assigned_worker_name: 'Marcus Vance',
    total_distance_km: 8.4,
    estimated_duration_min: 42,
    status: 'In Progress',
    created_by: 'Elena Rostova',
    created_at: new Date(Date.now() - 4 * 3600000).toISOString(),
    route_geometry: [
      [18.5204, 73.8567],
      [18.5195, 73.8553],
      [18.5158, 73.8572],
      [18.5222, 73.8681],
      [18.5289, 73.8744],
    ],
    stops: [
      {
        id: 'stop-01-1',
        route_id: 'route-demo-01',
        collection_point_id: 'cp-01',
        stop_order: 1,
        status: 'Completed',
        completed_at: new Date(Date.now() - 2 * 3600000).toISOString(),
        updated_at: new Date(Date.now() - 2 * 3600000).toISOString(),
        notes: 'Emptied dual 360L bins. Zero contamination recorded.',
        point_name: 'City Hall Civic Plaza',
        point_area: 'Downtown Central',
        point_address: '100 Municipal Square, Main Promenade',
        latitude: 18.5195,
        longitude: 73.8553,
        waste_type: 'Recyclables',
        priority: 'High',
      },
      {
        id: 'stop-01-2',
        route_id: 'route-demo-01',
        collection_point_id: 'cp-02',
        stop_order: 2,
        status: 'In Progress',
        completed_at: null,
        updated_at: new Date(Date.now() - 30 * 60000).toISOString(),
        notes: 'Driver arrived on site. High organic volume loading underway.',
        point_name: 'Old Town Heritage Market',
        point_area: 'Downtown Central',
        point_address: '45 Laxmi Bazaar Road, Near Clock Tower',
        latitude: 18.5158,
        longitude: 73.8572,
        waste_type: 'Organic / Compost',
        priority: 'High',
      },
      {
        id: 'stop-01-3',
        route_id: 'route-demo-01',
        collection_point_id: 'cp-10',
        stop_order: 3,
        status: 'Pending',
        completed_at: null,
        updated_at: new Date().toISOString(),
        point_name: 'District General Hospital',
        point_area: 'Central Commercial',
        point_address: 'Emergency Rear Alley, Health Avenue',
        latitude: 18.5222,
        longitude: 73.8681,
        waste_type: 'General Waste',
        priority: 'High',
      },
      {
        id: 'stop-01-4',
        route_id: 'route-demo-01',
        collection_point_id: 'cp-07',
        stop_order: 4,
        status: 'Pending',
        completed_at: null,
        updated_at: new Date().toISOString(),
        point_name: 'Metro Central Train Station',
        point_area: 'Downtown Central',
        point_address: 'Station Concourse, North Bus Terminal',
        latitude: 18.5289,
        longitude: 73.8744,
        waste_type: 'General Waste',
        priority: 'High',
      },
    ],
  },
  {
    id: 'route-demo-02',
    route_name: 'East Sector Recyclables Express',
    route_date: new Date().toISOString().split('T')[0],
    zone: 'East Sector Tech Corridor',
    depot_name: DEFAULT_DEPOTS[2].name,
    depot_latitude: DEFAULT_DEPOTS[2].latitude,
    depot_longitude: DEFAULT_DEPOTS[2].longitude,
    assigned_worker_id: 'worker-02',
    assigned_worker_name: 'Priya Patel',
    total_distance_km: 11.2,
    estimated_duration_min: 55,
    status: 'Scheduled',
    created_by: 'David Zhao',
    created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    route_geometry: [
      [18.5362, 73.8958],
      [18.5368, 73.8935],
      [18.5147, 73.9288],
    ],
    stops: [
      {
        id: 'stop-02-1',
        route_id: 'route-demo-02',
        collection_point_id: 'cp-06',
        stop_order: 1,
        status: 'Pending',
        completed_at: null,
        updated_at: new Date().toISOString(),
        point_name: 'Koregaon Riverside Promenade',
        point_area: 'East Sector Tech Corridor',
        point_address: 'North Main Road, Lane 5 Riverfront',
        latitude: 18.5368,
        longitude: 73.8935,
        waste_type: 'Recyclables',
        priority: 'Medium',
      },
      {
        id: 'stop-02-2',
        route_id: 'route-demo-02',
        collection_point_id: 'cp-09',
        stop_order: 2,
        status: 'Pending',
        completed_at: null,
        updated_at: new Date().toISOString(),
        point_name: 'Tech Park Cyber Towers',
        point_area: 'East Sector Tech Corridor',
        point_address: 'Tower B Loading Bay, Magarpatta Cyber City',
        latitude: 18.5147,
        longitude: 73.9288,
        waste_type: 'Commercial / Bulk',
        priority: 'Medium',
      },
    ],
  },
];

// ==========================================
// 7. Initial Activity Logs
// ==========================================
export const INITIAL_LOGS: ActivityLog[] = [
  {
    id: 'log-01',
    timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
    user_name: 'Marcus Vance',
    user_email: 'marcus.worker@citywaste.gov',
    user_role: 'worker',
    action: 'Updated Stop Status',
    details: 'Changed status of stop "Old Town Heritage Market" to IN PROGRESS.',
    entity_type: 'stop',
    entity_id: 'stop-01-2',
  },
  {
    id: 'log-02',
    timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
    user_name: 'Marcus Vance',
    user_email: 'marcus.worker@citywaste.gov',
    user_role: 'worker',
    action: 'Completed Stop',
    details: 'Completed collection at "City Hall Civic Plaza". Emptied dual 360L bins.',
    entity_type: 'stop',
    entity_id: 'stop-01-1',
  },
  {
    id: 'log-03',
    timestamp: new Date(Date.now() - 4 * 3600000).toISOString(),
    user_name: 'Elena Rostova',
    user_email: (import.meta.env.VITE_ADMIN_EMAIL || 'admin@citywaste.gov').toLowerCase(),
    user_role: 'admin',
    action: 'Dispatched Route',
    details: 'Created and assigned route "Downtown Central Morning Sweep" (8.4 km) to Marcus Vance.',
    entity_type: 'route',
    entity_id: 'route-demo-01',
  },
  {
    id: 'log-04',
    timestamp: new Date(Date.now() - 5 * 3600000).toISOString(),
    user_name: 'David Zhao',
    user_email: 'supervisor@citywaste.gov',
    user_role: 'supervisor',
    action: 'Created Route',
    details: 'Generated suggested OSRM route for East Sector Tech Corridor.',
    entity_type: 'route',
    entity_id: 'route-demo-02',
  },
];

// ==========================================
// 8. Initial Notifications
// ==========================================
export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-01',
    title: 'High Fill Level Alert',
    message: 'Old Town Heritage Market bin fill is at 92%. Morning pickup underway.',
    timestamp: '25 mins ago',
    type: 'warning',
    read: false,
    link_tab: 'points',
  },
  {
    id: 'notif-02',
    title: 'Driver Stop Completed',
    message: 'Marcus Vance successfully verified stop #1 at City Hall Civic Plaza.',
    timestamp: '2 hours ago',
    type: 'success',
    read: false,
    link_tab: 'routes',
  },
  {
    id: 'notif-03',
    title: 'Schedule Dispatched',
    message: 'Downtown Central 3-day weekly collection schedule active.',
    timestamp: 'Yesterday',
    type: 'info',
    read: true,
    link_tab: 'schedules',
  },
];

// ==========================================
// Activity Logging Service
// ==========================================
export function logActivity(
  action: string,
  details: string,
  entity_type: ActivityLog['entity_type'],
  entity_id?: string
): ActivityLog {
  const user = getCurrentUser();
  const newLog: ActivityLog = {
    id: 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    timestamp: new Date().toISOString(),
    user_name: user ? user.full_name : 'System Automated Service',
    user_email: user ? user.email : 'system@citywaste.gov',
    user_role: user ? user.role : 'admin',
    action,
    details,
    entity_type,
    entity_id,
  };

  const logs = fetchActivityLogs();
  logs.unshift(newLog);
  if (logs.length > 200) logs.pop(); // keep last 200 logs
  localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(logs));
  return newLog;
}

export function fetchActivityLogs(): ActivityLog[] {
  const cached = localStorage.getItem(STORAGE_KEY_LOGS);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      // fallback
    }
  }
  localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(INITIAL_LOGS));
  return INITIAL_LOGS;
}

// ==========================================
// Notifications Service
// ==========================================
export function fetchNotifications(): AppNotification[] {
  const cached = localStorage.getItem(STORAGE_KEY_NOTIFS);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      // fallback
    }
  }
  localStorage.setItem(STORAGE_KEY_NOTIFS, JSON.stringify(INITIAL_NOTIFICATIONS));
  return INITIAL_NOTIFICATIONS;
}

export function markNotificationRead(id: string): AppNotification[] {
  const notifs = fetchNotifications().map((n) => (n.id === id ? { ...n, read: true } : n));
  localStorage.setItem(STORAGE_KEY_NOTIFS, JSON.stringify(notifs));
  return notifs;
}

export function clearAllNotifications(): AppNotification[] {
  const notifs = fetchNotifications().map((n) => ({ ...n, read: true }));
  localStorage.setItem(STORAGE_KEY_NOTIFS, JSON.stringify(notifs));
  return notifs;
}

// ==========================================
// Collection Zones CRUD
// ==========================================
export async function fetchZones(): Promise<CollectionZone[]> {
  const cached = localStorage.getItem(STORAGE_KEY_ZONES);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      // fallback
    }
  }
  localStorage.setItem(STORAGE_KEY_ZONES, JSON.stringify(INITIAL_ZONES));
  return INITIAL_ZONES;
}

export async function saveZone(zone: CollectionZone): Promise<CollectionZone[]> {
  const list = await fetchZones();
  const idx = list.findIndex((z) => z.id === zone.id);
  if (idx >= 0) {
    list[idx] = zone;
    logActivity('Updated Zone', `Modified zone profile for "${zone.name}" (${zone.code}).`, 'zone', zone.id);
  } else {
    list.unshift(zone);
    logActivity('Created Zone', `Added new operational collection zone "${zone.name}".`, 'zone', zone.id);
  }
  localStorage.setItem(STORAGE_KEY_ZONES, JSON.stringify(list));
  return list;
}

export async function deleteZone(id: string): Promise<CollectionZone[]> {
  let list = await fetchZones();
  const target = list.find((z) => z.id === id);
  list = list.filter((z) => z.id !== id);
  localStorage.setItem(STORAGE_KEY_ZONES, JSON.stringify(list));
  if (target) {
    logActivity('Deleted Zone', `Removed operational zone "${target.name}".`, 'zone', id);
  }
  return list;
}

// ==========================================
// Collection Schedules CRUD
// ==========================================
export async function fetchSchedules(): Promise<CollectionSchedule[]> {
  const cached = localStorage.getItem(STORAGE_KEY_SCHEDULES);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      // fallback
    }
  }
  localStorage.setItem(STORAGE_KEY_SCHEDULES, JSON.stringify(INITIAL_SCHEDULES));
  return INITIAL_SCHEDULES;
}

export async function saveSchedule(schedule: CollectionSchedule): Promise<CollectionSchedule[]> {
  const list = await fetchSchedules();
  const idx = list.findIndex((s) => s.id === schedule.id);
  if (idx >= 0) {
    list[idx] = schedule;
    logActivity('Updated Schedule', `Modified collection window for "${schedule.zone_name}".`, 'schedule', schedule.id);
  } else {
    list.unshift(schedule);
    logActivity('Created Schedule', `Configured weekly pickup schedule for zone "${schedule.zone_name}".`, 'schedule', schedule.id);
  }
  localStorage.setItem(STORAGE_KEY_SCHEDULES, JSON.stringify(list));
  return list;
}

export async function deleteSchedule(id: string): Promise<CollectionSchedule[]> {
  let list = await fetchSchedules();
  const target = list.find((s) => s.id === id);
  list = list.filter((s) => s.id !== id);
  localStorage.setItem(STORAGE_KEY_SCHEDULES, JSON.stringify(list));
  if (target) {
    logActivity('Deleted Schedule', `Removed schedule for "${target.zone_name}".`, 'schedule', id);
  }
  return list;
}

// ==========================================
// User Accounts & Staff Management CRUD
// ==========================================
export async function fetchUserAccounts(): Promise<UserAccount[]> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client.from('profiles').select('*');
      if (!error && data && data.length > 0) {
        return data as UserAccount[];
      }
    } catch (e) {
      console.warn('Supabase fetch users warning:', e);
    }
  }

  const cached = localStorage.getItem(STORAGE_KEY_USERS_DB);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      // fallback
    }
  }
  localStorage.setItem(STORAGE_KEY_USERS_DB, JSON.stringify(INITIAL_USER_ACCOUNTS));
  return INITIAL_USER_ACCOUNTS;
}

export async function saveUserAccount(account: UserAccount): Promise<UserAccount[]> {
  const client = getSupabaseClient();
  if (client) {
    try {
      await client.from('profiles').upsert([
        {
          id: account.id,
          full_name: account.full_name,
          email: account.email,
          role: account.role,
          phone: account.phone,
          zone: account.zone,
        },
      ]);
    } catch (e) {
      console.warn('Supabase save user warning:', e);
    }
  }

  const list = await fetchUserAccounts();
  const idx = list.findIndex((u) => u.id === account.id || u.email.toLowerCase() === account.email.toLowerCase());
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...account };
    logActivity('Updated User', `Modified role / profile of "${account.full_name}" to ${account.role.toUpperCase()}.`, 'user', account.id);
  } else {
    list.unshift(account);
    logActivity('Created User', `Enrolled new staff member "${account.full_name}" (${account.role.toUpperCase()}).`, 'user', account.id);
  }
  localStorage.setItem(STORAGE_KEY_USERS_DB, JSON.stringify(list));
  return list;
}

export async function deleteUserAccount(id: string): Promise<UserAccount[]> {
  let list = await fetchUserAccounts();
  const target = list.find((u) => u.id === id);
  list = list.filter((u) => u.id !== id);
  localStorage.setItem(STORAGE_KEY_USERS_DB, JSON.stringify(list));
  if (target) {
    logActivity('Deleted User', `Removed user account "${target.full_name}" (${target.email}).`, 'user', id);
  }
  return list;
}

// ==========================================
// Collection Points CRUD
// ==========================================
export async function fetchCollectionPoints(): Promise<CollectionPoint[]> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('collection_points')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        localStorage.setItem(STORAGE_KEY_POINTS, JSON.stringify(data));
        return data as CollectionPoint[];
      }
      if (!error && data && data.length === 0) {
        await client.from('collection_points').insert(INITIAL_COLLECTION_POINTS);
        localStorage.setItem(STORAGE_KEY_POINTS, JSON.stringify(INITIAL_COLLECTION_POINTS));
        return INITIAL_COLLECTION_POINTS;
      }
    } catch (e) {
      console.warn('Supabase fetch points warning:', e);
    }
  }

  const cached = localStorage.getItem(STORAGE_KEY_POINTS);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      // fallback
    }
  }
  localStorage.setItem(STORAGE_KEY_POINTS, JSON.stringify(INITIAL_COLLECTION_POINTS));
  return INITIAL_COLLECTION_POINTS;
}

export async function saveCollectionPoint(point: CollectionPoint): Promise<CollectionPoint[]> {
  const client = getSupabaseClient();
  if (client) {
    try {
      await client.from('collection_points').upsert([point]);
    } catch (e) {
      console.warn('Supabase save point warning:', e);
    }
  }

  const cached = localStorage.getItem(STORAGE_KEY_POINTS);
  let list: CollectionPoint[] = cached ? JSON.parse(cached) : [...INITIAL_COLLECTION_POINTS];
  const idx = list.findIndex((p) => p.id === point.id);
  if (idx >= 0) {
    list[idx] = point;
    logActivity('Updated Point', `Updated collection point "${point.name}" (${point.area}).`, 'point', point.id);
  } else {
    list.unshift(point);
    logActivity('Added Point', `Registered new collection point "${point.name}" with capacity ${point.bin_capacity_liters}L.`, 'point', point.id);
  }
  localStorage.setItem(STORAGE_KEY_POINTS, JSON.stringify(list));
  return list;
}

export async function deleteCollectionPoint(id: string): Promise<CollectionPoint[]> {
  const client = getSupabaseClient();
  if (client) {
    try {
      await client.from('collection_points').delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase delete point warning:', e);
    }
  }

  const cached = localStorage.getItem(STORAGE_KEY_POINTS);
  let list: CollectionPoint[] = cached ? JSON.parse(cached) : [...INITIAL_COLLECTION_POINTS];
  const target = list.find((p) => p.id === id);
  list = list.filter((p) => p.id !== id);
  localStorage.setItem(STORAGE_KEY_POINTS, JSON.stringify(list));
  if (target) {
    logActivity('Deleted Point', `Deleted collection point "${target.name}" (${target.area}).`, 'point', id);
  }
  return list;
}

// ==========================================
// Operational Routes CRUD
// ==========================================
export async function fetchRoutes(): Promise<Route[]> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data: routesData, error: routesErr } = await client
        .from('routes')
        .select('*')
        .order('created_at', { ascending: false });

      if (!routesErr && routesData && routesData.length > 0) {
        const { data: stopsData } = await client
          .from('route_stops')
          .select('*')
          .order('stop_order', { ascending: true });

        const formattedRoutes: Route[] = routesData.map((r: any) => ({
          ...r,
          stops: (stopsData || []).filter((s: any) => s.route_id === r.id) as RouteStop[],
        }));

        localStorage.setItem(STORAGE_KEY_ROUTES, JSON.stringify(formattedRoutes));
        return formattedRoutes;
      }

      if (!routesErr && routesData && routesData.length === 0) {
        for (const r of INITIAL_ROUTES) {
          const { stops, ...routeWithoutStops } = r;
          await client.from('routes').insert([routeWithoutStops]);
          if (stops && stops.length > 0) {
            await client.from('route_stops').insert(stops);
          }
        }
        localStorage.setItem(STORAGE_KEY_ROUTES, JSON.stringify(INITIAL_ROUTES));
        return INITIAL_ROUTES;
      }
    } catch (e) {
      console.warn('Supabase fetch routes warning:', e);
    }
  }

  const cached = localStorage.getItem(STORAGE_KEY_ROUTES);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      // fallback
    }
  }
  localStorage.setItem(STORAGE_KEY_ROUTES, JSON.stringify(INITIAL_ROUTES));
  return INITIAL_ROUTES;
}

export async function saveNewRoute(route: Route): Promise<Route[]> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { stops, ...routeWithoutStops } = route;
      await client.from('routes').insert([routeWithoutStops]);
      if (stops && stops.length > 0) {
        await client.from('route_stops').insert(stops);
      }
    } catch (e) {
      console.warn('Supabase save route warning:', e);
    }
  }

  const cached = localStorage.getItem(STORAGE_KEY_ROUTES);
  const list: Route[] = cached ? JSON.parse(cached) : [...INITIAL_ROUTES];
  list.unshift(route);
  localStorage.setItem(STORAGE_KEY_ROUTES, JSON.stringify(list));

  logActivity(
    'Dispatched Route',
    `Created route "${route.route_name}" (${route.total_distance_km || 0} km, ${route.stops.length} stops) assigned to ${route.assigned_worker_name || 'Unassigned'}.`,
    'route',
    route.id
  );

  return list;
}

export async function deleteRoute(id: string): Promise<Route[]> {
  const client = getSupabaseClient();
  if (client) {
    try {
      await client.from('route_stops').delete().eq('route_id', id);
      await client.from('routes').delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase delete route warning:', e);
    }
  }

  const cached = localStorage.getItem(STORAGE_KEY_ROUTES);
  let list: Route[] = cached ? JSON.parse(cached) : [...INITIAL_ROUTES];
  const target = list.find((r) => r.id === id);
  list = list.filter((r) => r.id !== id);
  localStorage.setItem(STORAGE_KEY_ROUTES, JSON.stringify(list));
  if (target) {
    logActivity('Deleted Route', `Cancelled and removed route "${target.route_name}".`, 'route', id);
  }
  return list;
}

export async function updateRouteStatus(routeId: string, status: RouteStatus): Promise<Route[]> {
  const client = getSupabaseClient();
  if (client) {
    try {
      await client.from('routes').update({ status }).eq('id', routeId);
    } catch (e) {
      console.warn('Supabase update route status warning:', e);
    }
  }

  const cached = localStorage.getItem(STORAGE_KEY_ROUTES);
  const list: Route[] = cached ? JSON.parse(cached) : [...INITIAL_ROUTES];
  const target = list.find((r) => r.id === routeId);
  if (target) {
    target.status = status;
    if (status === 'Completed') target.completed_at = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY_ROUTES, JSON.stringify(list));
    logActivity('Updated Route Status', `Route "${target.route_name}" status set to ${status.toUpperCase()}.`, 'route', routeId);
  }
  return list;
}

export async function updateStopStatus(
  routeId: string,
  stopId: string,
  newStatus: StopStatus,
  notes?: string
): Promise<Route[]> {
  const client = getSupabaseClient();
  const updatePayload: any = {
    status: newStatus,
    updated_at: new Date().toISOString(),
    completed_at: newStatus === 'Completed' ? new Date().toISOString() : null,
  };
  if (notes !== undefined) updatePayload.notes = notes;

  if (client) {
    try {
      await client.from('route_stops').update(updatePayload).eq('id', stopId);
    } catch (e) {
      console.warn('Supabase update stop status warning:', e);
    }
  }

  const cached = localStorage.getItem(STORAGE_KEY_ROUTES);
  const list: Route[] = cached ? JSON.parse(cached) : [...INITIAL_ROUTES];
  const targetRoute = list.find((r) => r.id === routeId);
  if (targetRoute) {
    const targetStop = targetRoute.stops.find((s) => s.id === stopId);
    if (targetStop) {
      targetStop.status = newStatus;
      targetStop.updated_at = updatePayload.updated_at;
      targetStop.completed_at = updatePayload.completed_at;
      if (notes !== undefined) targetStop.notes = notes;

      logActivity(
        newStatus === 'Completed' ? 'Completed Stop' : 'Updated Stop Status',
        `Stop "${targetStop.point_name}" marked as ${newStatus.toUpperCase()}${notes ? ` (Note: ${notes})` : ''}.`,
        'stop',
        stopId
      );
    }

    const allCompleted = targetRoute.stops.every((s) => s.status === 'Completed');
    const hasAnyStarted = targetRoute.stops.some((s) => s.status === 'In Progress' || s.status === 'Completed');
    targetRoute.status = allCompleted ? 'Completed' : hasAnyStarted ? 'In Progress' : 'Scheduled';
    if (allCompleted) targetRoute.completed_at = new Date().toISOString();

    if (client) {
      client.from('routes').update({ status: targetRoute.status }).eq('id', routeId);
    }

    localStorage.setItem(STORAGE_KEY_ROUTES, JSON.stringify(list));
  }
  return list;
}

// ==========================================
// Workers List Query (for assignment dropdown)
// ==========================================
export async function fetchWorkersFromDB(): Promise<UserProfile[]> {
  const users = await fetchUserAccounts();
  const workers = users.filter((u) => u.role === 'worker' && u.status !== 'Suspended');
  if (workers.length > 0) return workers;

  return [
    {
      id: 'worker-01',
      full_name: 'Marcus Vance',
      email: 'marcus.worker@citywaste.gov',
      role: 'worker',
      phone: '+1 (555) 482-1920',
      zone: 'Downtown Central',
      created_at: new Date().toISOString(),
    },
    {
      id: 'worker-02',
      full_name: 'Priya Patel',
      email: 'priya.worker@citywaste.gov',
      role: 'worker',
      phone: '+1 (555) 391-9482',
      zone: 'East Sector Tech Corridor',
      created_at: new Date().toISOString(),
    },
  ];
}

// ==========================================
// Active Session Storage
// ==========================================
export function getCurrentUser(): UserProfile | null {
  const data = localStorage.getItem(STORAGE_KEY_USER);
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      // fallback
    }
  }
  return null;
}

export function setCurrentUser(user: UserProfile | null): void {
  if (user) {
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEY_USER);
  }
}

export function clearActiveSession(): void {
  localStorage.removeItem(STORAGE_KEY_USER);
}

export function getDepots(): Depot[] {
  const data = localStorage.getItem(STORAGE_KEY_DEPOTS);
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      // fallback
    }
  }
  return DEFAULT_DEPOTS;
}

// ==========================================
// Operational System Statistics
// ==========================================
export function computeSystemStats(points: CollectionPoint[], routes: Route[]): SystemStats {
  let totalStops = 0;
  let completedStops = 0;
  let inProgressStops = 0;
  let pendingStops = 0;
  let totalPlannedKm = 0;
  let activeRoutes = 0;
  let completedRoutes = 0;

  routes.forEach((route) => {
    totalPlannedKm += route.total_distance_km || 0;
    if (route.status === 'In Progress') activeRoutes++;
    if (route.status === 'Completed') completedRoutes++;

    (route.stops || []).forEach((stop) => {
      totalStops++;
      if (stop.status === 'Completed') completedStops++;
      else if (stop.status === 'In Progress') inProgressStops++;
      else pendingStops++;
    });
  });

  const completionRate = totalStops > 0 ? Math.round((completedStops / totalStops) * 100) : 0;

  const workersSet = new Set(routes.map((r) => r.assigned_worker_id).filter(Boolean));

  return {
    totalPoints: points.length,
    totalRoutes: routes.length,
    activeRoutes,
    completedRoutes,
    totalStops,
    completedStops,
    inProgressStops,
    pendingStops,
    completionRate,
    totalPlannedKm: Number(totalPlannedKm.toFixed(1)),
    activeWorkersCount: workersSet.size,
    totalZonesCount: INITIAL_ZONES.length,
  };
}

// ==========================================
// CSV Export Utilities (Real Action Downloads)
// ==========================================
export function exportPointsToCSV(points: CollectionPoint[]): void {
  const headers = ['ID', 'Name', 'Area', 'Address', 'Latitude', 'Longitude', 'Waste Type', 'Priority', 'Capacity (L)', 'Fill Level %', 'Active'];
  const rows = points.map((p) => [
    p.id,
    `"${p.name.replace(/"/g, '""')}"`,
    `"${p.area.replace(/"/g, '""')}"`,
    `"${p.address_text.replace(/"/g, '""')}"`,
    p.latitude,
    p.longitude,
    p.waste_type,
    p.priority,
    p.bin_capacity_liters || '',
    p.estimated_fill_percent || '',
    p.is_active ? 'Yes' : 'No',
  ]);

  const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
  triggerFileDownload(csvContent, `Municipal_Collection_Points_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv;charset=utf-8;');
}

export function exportRoutesToCSV(routes: Route[]): void {
  const headers = ['Route ID', 'Route Name', 'Date', 'Zone', 'Status', 'Worker', 'Distance (km)', 'Est. Duration (min)', 'Total Stops', 'Completed Stops'];
  const rows = routes.map((r) => [
    r.id,
    `"${r.route_name.replace(/"/g, '""')}"`,
    r.route_date,
    `"${(r.zone || '').replace(/"/g, '""')}"`,
    r.status,
    `"${(r.assigned_worker_name || '').replace(/"/g, '""')}"`,
    r.total_distance_km || 0,
    r.estimated_duration_min || 0,
    r.stops.length,
    r.stops.filter((s) => s.status === 'Completed').length,
  ]);

  const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
  triggerFileDownload(csvContent, `Operational_Routes_Manifest_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv;charset=utf-8;');
}

export function exportAuditLogsToCSV(logs: ActivityLog[]): void {
  const headers = ['Timestamp', 'User Name', 'Email', 'Role', 'Action', 'Entity Type', 'Entity ID', 'Details'];
  const rows = logs.map((l) => [
    `"${l.timestamp}"`,
    `"${l.user_name.replace(/"/g, '""')}"`,
    `"${l.user_email}"`,
    l.user_role.toUpperCase(),
    `"${l.action.replace(/"/g, '""')}"`,
    l.entity_type,
    l.entity_id || '',
    `"${l.details.replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
  triggerFileDownload(csvContent, `Operations_Audit_Log_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv;charset=utf-8;');
}

function triggerFileDownload(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Reset Demo Data
export function resetDemoData(): void {
  localStorage.removeItem(STORAGE_KEY_POINTS);
  localStorage.removeItem(STORAGE_KEY_ROUTES);
  localStorage.removeItem(STORAGE_KEY_ZONES);
  localStorage.removeItem(STORAGE_KEY_SCHEDULES);
  localStorage.removeItem(STORAGE_KEY_LOGS);
  localStorage.removeItem(STORAGE_KEY_NOTIFS);
}
