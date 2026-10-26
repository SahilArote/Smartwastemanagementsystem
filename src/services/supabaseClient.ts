import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEY_URL = 'smartwaste_supabase_url';
const STORAGE_KEY_KEY = 'smartwaste_supabase_anon_key';

let cachedClient: SupabaseClient | null = null;

export function getSavedSupabaseConfig(): { url: string; anonKey: string } {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey =
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    '';

  const localUrl = localStorage.getItem(STORAGE_KEY_URL) || envUrl;
  const localKey = localStorage.getItem(STORAGE_KEY_KEY) || envKey;

  return { url: localUrl, anonKey: localKey };
}

export function saveSupabaseConfig(url: string, anonKey: string): void {
  if (url && anonKey) {
    localStorage.setItem(STORAGE_KEY_URL, url.trim());
    localStorage.setItem(STORAGE_KEY_KEY, anonKey.trim());
    cachedClient = null; // reset cached client
  } else {
    localStorage.removeItem(STORAGE_KEY_URL);
    localStorage.removeItem(STORAGE_KEY_KEY);
    cachedClient = null;
  }
}

export function getSupabaseClient(): SupabaseClient | null {
  if (cachedClient) return cachedClient;

  const { url, anonKey } = getSavedSupabaseConfig();
  if (url && anonKey) {
    try {
      cachedClient = createClient(url, anonKey);
      return cachedClient;
    } catch (e) {
      console.error('Failed to initialize Supabase client:', e);
      return null;
    }
  }
  return null;
}

export const SUPABASE_SQL_SCHEMA = `-- ==========================================
-- Cloud-Based Waste Collection Route Planner
-- PostgreSQL / Supabase Migration Schema
-- ==========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'worker')),
  phone TEXT,
  zone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Collection Points Table
CREATE TABLE IF NOT EXISTS collection_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  area TEXT NOT NULL,
  address_text TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  waste_type TEXT NOT NULL CHECK (waste_type IN ('General Waste', 'Recyclables', 'Organic / Compost', 'Hazardous / E-Waste', 'Commercial / Bulk')),
  priority TEXT NOT NULL CHECK (priority IN ('High', 'Medium', 'Low')),
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  bin_capacity_liters INTEGER DEFAULT 240,
  estimated_fill_percent INTEGER DEFAULT 50,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Routes Table
CREATE TABLE IF NOT EXISTS routes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_name TEXT NOT NULL,
  route_date DATE NOT NULL,
  depot_name TEXT NOT NULL,
  depot_latitude DOUBLE PRECISION NOT NULL,
  depot_longitude DOUBLE PRECISION NOT NULL,
  assigned_worker_id UUID REFERENCES auth.users(id),
  total_distance_km DOUBLE PRECISION,
  estimated_duration_min INTEGER,
  route_geometry JSONB,
  status TEXT NOT NULL DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'In Progress', 'Completed')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Route Stops Table (Foreign Key to routes & snapshot of point)
CREATE TABLE IF NOT EXISTS route_stops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  collection_point_id UUID NOT NULL REFERENCES collection_points(id) ON DELETE RESTRICT,
  stop_order INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Completed')),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  point_name TEXT NOT NULL,
  point_area TEXT NOT NULL,
  point_address TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  waste_type TEXT NOT NULL,
  priority TEXT NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_stops ENABLE ROW LEVEL SECURITY;

-- Allow authenticated read/write access for demonstration
CREATE POLICY "Public read profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Public read collection_points" ON collection_points FOR ALL USING (true);
CREATE POLICY "Public read routes" ON routes FOR ALL USING (true);
CREATE POLICY "Public read route_stops" ON route_stops FOR ALL USING (true);
`;
