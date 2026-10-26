import type { CollectionPoint, Route, RouteStop, UserProfile, Depot, SystemStats, StopStatus } from '../types';
import { getSupabaseClient } from './supabaseClient';

const STORAGE_KEY_POINTS = 'smartwaste_collection_points';
const STORAGE_KEY_ROUTES = 'smartwaste_routes';
const STORAGE_KEY_USER = 'smartwaste_current_user';
const STORAGE_KEY_DEPOTS = 'smartwaste_depots';

export const DEFAULT_DEPOTS: Depot[] = [
  {
    id: 'depot-central',
    name: 'Municipal Central Depot & Fleet Facility',
    address: '42 Sector 7, Central Civic Ring, City Center',
    latitude: 18.5204,
    longitude: 73.8567,
  },
  {
    id: 'depot-north',
    name: 'North Zone Transfer Station & Composting Yard',
    address: '108 Industrial Expressway, North Zone',
    latitude: 18.5529,
    longitude: 73.8184,
  },
  {
    id: 'depot-east',
    name: 'East Metro Waste Management Facility',
    address: '89 Bypass Road, Silicon Corridor',
    latitude: 18.5362,
    longitude: 73.8958,
  },
];

export const INITIAL_COLLECTION_POINTS: CollectionPoint[] = [
  {
    id: 'cp-01',
    name: 'City Hall Civic Plaza',
    area: 'Downtown Central',
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
    area: 'South Sector',
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
    area: 'North Sector',
    address_text: 'Gate 4, Department of Technology, University Ave',
    latitude: 18.5412,
    longitude: 73.8291,
    waste_type: 'Hazardous / E-Waste',
    priority: 'Medium',
    notes: 'Secure bin for laboratory e-waste and paper.',
    is_active: true,
    bin_capacity_liters: 240,
    estimated_fill_percent: 45,
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    id: 'cp-06',
    name: 'Koregaon Riverside Promenade',
    area: 'East Sector',
    address_text: 'North Main Road, Lane 5 Riverfront',
    latitude: 18.5368,
    longitude: 73.8935,
    waste_type: 'Recyclables',
    priority: 'Medium',
    notes: 'Clean paper, plastic bottles and aluminum cans.',
    is_active: true,
    bin_capacity_liters: 360,
    estimated_fill_percent: 65,
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'cp-07',
    name: 'Metro Central Train Station',
    area: 'Downtown Central',
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
    area: 'West Sector',
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
    area: 'East Sector',
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

export const INITIAL_ROUTES: Route[] = [
  {
    id: 'route-demo-01',
    route_name: 'Downtown Commercial Morning Sweep',
    route_date: new Date().toISOString().split('T')[0],
    depot_name: DEFAULT_DEPOTS[0].name,
    depot_latitude: DEFAULT_DEPOTS[0].latitude,
    depot_longitude: DEFAULT_DEPOTS[0].longitude,
    assigned_worker_id: 'worker-01',
    assigned_worker_name: 'Marcus Vance',
    total_distance_km: 8.4,
    estimated_duration_min: 42,
    status: 'In Progress',
    created_by: 'admin-01',
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
];

/**
 * Fetch all Collection Points from Supabase Database
 * Auto-seeds database if empty so data lives in the database.
 */
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

      // If database table is empty, seed initial data to Supabase
      if (!error && data && data.length === 0) {
        await client.from('collection_points').insert(INITIAL_COLLECTION_POINTS);
        localStorage.setItem(STORAGE_KEY_POINTS, JSON.stringify(INITIAL_COLLECTION_POINTS));
        return INITIAL_COLLECTION_POINTS;
      }
    } catch (e) {
      console.warn('Supabase fetch points warning:', e);
    }
  }

  // Local storage fallback
  const cached = localStorage.getItem(STORAGE_KEY_POINTS);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      // fallback
    }
  }
  return INITIAL_COLLECTION_POINTS;
}

/**
 * Save or Update Collection Point in Supabase Database
 */
export async function saveCollectionPoint(point: CollectionPoint): Promise<CollectionPoint[]> {
  const client = getSupabaseClient();
  if (client) {
    try {
      await client.from('collection_points').upsert([point]);
    } catch (e) {
      console.warn('Supabase save point warning:', e);
    }
  }

  // Update local cache
  const cached = localStorage.getItem(STORAGE_KEY_POINTS);
  let list: CollectionPoint[] = cached ? JSON.parse(cached) : [...INITIAL_COLLECTION_POINTS];
  const idx = list.findIndex((p) => p.id === point.id);
  if (idx >= 0) list[idx] = point;
  else list.unshift(point);
  localStorage.setItem(STORAGE_KEY_POINTS, JSON.stringify(list));
  return list;
}

/**
 * Delete Collection Point from Supabase Database
 */
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
  list = list.filter((p) => p.id !== id);
  localStorage.setItem(STORAGE_KEY_POINTS, JSON.stringify(list));
  return list;
}

/**
 * Fetch all Routes with their nested Route Stops from Supabase Database
 */
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

      // If database routes table is empty, seed initial route to Supabase
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
  return INITIAL_ROUTES;
}

/**
 * Save New Route & Stops into Supabase Database
 */
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
  return list;
}

/**
 * Update Stop Status in Supabase Database
 */
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
    }

    const allCompleted = targetRoute.stops.every((s) => s.status === 'Completed');
    const hasAnyStarted = targetRoute.stops.some((s) => s.status === 'In Progress' || s.status === 'Completed');
    targetRoute.status = allCompleted ? 'Completed' : hasAnyStarted ? 'In Progress' : 'Scheduled';

    if (client) {
      client.from('routes').update({ status: targetRoute.status }).eq('id', routeId);
    }

    localStorage.setItem(STORAGE_KEY_ROUTES, JSON.stringify(list));
  }
  return list;
}

/**
 * Fetch registered workers from Supabase profiles table
 */
export async function fetchWorkersFromDB(): Promise<UserProfile[]> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('profiles')
        .select('*')
        .eq('role', 'worker');

      if (!error && data && data.length > 0) {
        return data as UserProfile[];
      }
    } catch (e) {
      console.warn('Supabase fetch workers warning:', e);
    }
  }

  return [
    {
      id: 'worker-01',
      full_name: 'Marcus Vance',
      email: 'm.vance@citywaste.gov',
      role: 'worker',
      phone: '+1 (555) 482-1920',
      zone: 'Sector A • Downtown',
      created_at: new Date().toISOString(),
    },
    {
      id: 'worker-02',
      full_name: 'Priya Patel',
      email: 'p.patel@citywaste.gov',
      role: 'worker',
      phone: '+1 (555) 391-9482',
      zone: 'Sector B • Metro Ridge',
      created_at: new Date().toISOString(),
    },
  ];
}

// User Profile Storage
export function getCurrentUser(): UserProfile {
  const data = localStorage.getItem(STORAGE_KEY_USER);
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      // fallback
    }
  }
  const defaultAdmin: UserProfile = {
    id: 'admin-01',
    full_name: 'City Operations Administrator',
    email: import.meta.env.VITE_ADMIN_EMAIL || 'admin@citywaste.gov',
    role: 'admin',
    zone: 'Headquarters / All Zones',
    created_at: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(defaultAdmin));
  return defaultAdmin;
}

export function setCurrentUser(user: UserProfile): void {
  localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
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

export function computeSystemStats(points: CollectionPoint[], routes: Route[]): SystemStats {
  let totalStops = 0;
  let completedStops = 0;
  let inProgressStops = 0;
  let pendingStops = 0;
  let totalPlannedKm = 0;

  routes.forEach((route) => {
    totalPlannedKm += route.total_distance_km || 0;
    (route.stops || []).forEach((stop) => {
      totalStops++;
      if (stop.status === 'Completed') completedStops++;
      else if (stop.status === 'In Progress') inProgressStops++;
      else pendingStops++;
    });
  });

  const completionRate = totalStops > 0 ? Math.round((completedStops / totalStops) * 100) : 0;

  return {
    totalPoints: points.length,
    totalRoutes: routes.length,
    activeRoutes: routes.filter((r) => r.status === 'In Progress').length,
    totalStops,
    completedStops,
    inProgressStops,
    pendingStops,
    completionRate,
    totalPlannedKm: Number(totalPlannedKm.toFixed(1)),
  };
}

export function resetDemoData(): void {
  localStorage.removeItem(STORAGE_KEY_POINTS);
  localStorage.removeItem(STORAGE_KEY_ROUTES);
}
