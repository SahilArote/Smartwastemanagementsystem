export type Role = 'admin' | 'worker';

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
  created_at: string;
}

export interface CollectionPoint {
  id: string;
  name: string;
  area: string;
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
  stops: RouteStop[];
}

export interface Depot {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
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
  totalStops: number;
  completedStops: number;
  inProgressStops: number;
  pendingStops: number;
  completionRate: number;
  totalPlannedKm: number;
}
