export type Role = 'admin' | 'supervisor' | 'worker';

export type WasteType = 
  | 'General Waste'
  | 'Recyclables'
  | 'Organic / Compost'
  | 'Hazardous / E-Waste'
  | 'Commercial / Bulk';

export type Priority = 'High' | 'Medium' | 'Low';

export type StopStatus = 'Pending' | 'In Progress' | 'Completed';

export type RouteStatus = 'Scheduled' | 'In Progress' | 'Completed';

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role: Role;
  phone?: string;
  zone?: string;
  avatar_url?: string;
  created_at: string;
}

export interface UserAccount extends UserProfile {
  password_hash?: string;
  status: 'Active' | 'Suspended';
  last_login?: string;
}

export interface CollectionZone {
  id: string;
  name: string;
  code: string;
  description: string;
  color: string;
  headquarters_address: string;
  active_points_count?: number;
  created_at: string;
}

export interface CollectionSchedule {
  id: string;
  zone_id: string;
  zone_name: string;
  days_of_week: string[]; // e.g. ['Mon', 'Wed', 'Fri']
  time_window: string; // e.g. '07:00 AM - 11:30 AM'
  frequency: 'Daily' | 'Twice Weekly' | 'Weekly' | 'Bi-Weekly';
  assigned_vehicle: string;
  is_active: boolean;
  notes?: string;
  created_at: string;
}

export interface CollectionPoint {
  id: string;
  name: string;
  area: string;
  zone_id?: string;
  address_text: string;
  latitude: number;
  longitude: number;
  waste_type: WasteType;
  priority: Priority;
  notes?: string;
  is_active: boolean;
  bin_capacity_liters?: number;
  estimated_fill_percent?: number;
  created_by?: string;
  created_at: string;
  updated_at?: string;
}

export interface RouteStop {
  id: string;
  route_id: string;
  collection_point_id: string;
  stop_order: number;
  status: StopStatus;
  completed_at?: string | null;
  updated_at: string;
  notes?: string;
  // Snapshot fields to preserve historical accuracy even if collection point is modified later
  point_name: string;
  point_area: string;
  point_address: string;
  latitude: number;
  longitude: number;
  waste_type: WasteType;
  priority: Priority;
}

export interface Route {
  id: string;
  route_name: string;
  route_date: string; // YYYY-MM-DD
  zone?: string;
  depot_name: string;
  depot_latitude: number;
  depot_longitude: number;
  assigned_worker_id: string;
  assigned_worker_name?: string;
  total_distance_km: number | null;
  estimated_duration_min?: number;
  route_geometry?: [number, number][]; // Array of [lat, lng] for rendering polyline
  status: RouteStatus;
  created_by: string;
  created_at: string;
  completed_at?: string | null;
  notes?: string;
  stops: RouteStop[];
}

export interface Depot {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  contact_phone?: string;
}

export interface RoutingResult {
  coordinates: [number, number][]; // [lat, lng]
  distanceKm: number;
  durationMinutes: number;
  isFallback: boolean;
  error?: string;
}

export interface SystemStats {
  totalPoints: number;
  totalRoutes: number;
  activeRoutes: number;
  completedRoutes: number;
  totalStops: number;
  completedStops: number;
  inProgressStops: number;
  pendingStops: number;
  completionRate: number;
  totalPlannedKm: number;
  activeWorkersCount: number;
  totalZonesCount: number;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  user_name: string;
  user_email: string;
  user_role: Role;
  action: string;
  details: string;
  entity_type: 'point' | 'route' | 'stop' | 'user' | 'zone' | 'schedule' | 'system';
  entity_id?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'info' | 'warning' | 'success' | 'alert';
  read: boolean;
  link_tab?: string;
}
