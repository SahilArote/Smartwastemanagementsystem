# 🔑 API Keys & Environment Configuration Guide

This document outlines all external APIs, credentials, and access keys associated with the **Cloud-Based Waste Collection Route Planner**, including their requirements, default behaviors, and step-by-step instructions for acquiring them.

---

## ⚡ Quick Summary: Are Any Keys Mandatory?

> [!NOTE]
> **No paid or mandatory API keys are required to run and test the prototype.**  
> The project is specifically engineered with **Instant Zero-Setup Mode**:
> 1. **Routing**: Uses the public Open Source Routing Machine (OSRM) engine (no API key needed) with built-in Haversine straight-line fallback.
> 2. **Map Tiles**: Uses OpenStreetMap-compatible CartoDB Voyager tiles (no API key needed).
> 3. **Database**: Operates with browser-persisted Local Storage out of the box. Connecting a **Supabase PostgreSQL** cloud backend is **optional**.

---

## 📋 Comprehensive API Keys Breakdown

| Service / API | Environment Variable / Key | Is Required? | Cost / Tier | Default Fallback Behavior |
| :--- | :--- | :--- | :--- | :--- |
| **OSRM Routing Engine** | *None required* | ❌ **No** | 100% Free / Public | If public OSRM server is busy or offline, the app automatically switches to straight-line Haversine route estimation with road-winding multiplier. |
| **Map Tile Provider** (CartoDB / OpenStreetMap) | *None required* | ❌ **No** | 100% Free / Public | Renders OpenStreetMap vector raster tiles with no credentials needed. |
| **Google Maps Navigation** (Field Drivers) | *None required* | ❌ **No** | Free standard deep-link | Uses standard browser intent URLs (`https://www.google.com/maps/dir/?api=1&destination=lat,lng`) which require no developer key. |
| **Supabase PostgreSQL** | `VITE_SUPABASE_URL` | 🟡 **Optional** (Cloud mode only) | Free Tier (500MB DB) | Falls back to persistent browser Local Storage. |
| **Supabase Public Key** | `VITE_SUPABASE_ANON_KEY` | 🟡 **Optional** (Cloud mode only) | Free Tier | Falls back to persistent browser Local Storage. |

---

## ☁️ Optional: Setting up Supabase Cloud Database

If you wish to deploy the project to production (e.g. on Vercel) with a multi-user PostgreSQL database, follow these steps to obtain your Supabase API keys:

### Step 1: Create a Supabase Project
1. Go to [https://supabase.com](https://supabase.com) and create a free account.
2. Click **New Project**.
3. Choose an organization, project name (e.g. `smartwaste-planner`), and set a database password.
4. Select your closest hosting region.

### Step 2: Retrieve your Project URL & Anon Key
1. In your Supabase Project Dashboard, click the **Project Settings** (gear icon) on the left sidebar.
2. Navigate to **API** under Configuration.
3. Locate the following two values:
   - **Project URL**: e.g., `https://abcdefghijklm.supabase.co`
   - **Project API Keys** → `anon` `public`: A long JWT token beginning with `eyJhbGciOi...`

> [!CAUTION]
> **Never** expose the `service_role` secret key in client-side code or `.env` files. Only use the public `anon` key.

### Step 3: Run the Database Migration SQL
1. In your Supabase Dashboard, click **SQL Editor** from the left menu.
2. Click **New Query**.
3. Copy the SQL script provided in the app (click the **"Cloud Sync"** button in the app navbar and click **"Copy SQL Script"**), or paste the script below:

```sql
-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'worker')),
  phone TEXT,
  zone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Collection Points Table
CREATE TABLE IF NOT EXISTS collection_points (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  area TEXT NOT NULL,
  address_text TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  waste_type TEXT NOT NULL,
  priority TEXT NOT NULL,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  bin_capacity_liters INTEGER DEFAULT 240,
  estimated_fill_percent INTEGER DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Routes Table
CREATE TABLE IF NOT EXISTS routes (
  id TEXT PRIMARY KEY,
  route_name TEXT NOT NULL,
  route_date DATE NOT NULL,
  depot_name TEXT NOT NULL,
  depot_latitude DOUBLE PRECISION NOT NULL,
  depot_longitude DOUBLE PRECISION NOT NULL,
  assigned_worker_id TEXT,
  assigned_worker_name TEXT,
  total_distance_km DOUBLE PRECISION,
  estimated_duration_min INTEGER,
  route_geometry JSONB,
  status TEXT NOT NULL DEFAULT 'Scheduled',
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Route Stops Table
CREATE TABLE IF NOT EXISTS route_stops (
  id TEXT PRIMARY KEY,
  route_id TEXT NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  collection_point_id TEXT NOT NULL,
  stop_order INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending',
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

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_stops ENABLE ROW LEVEL SECURITY;

-- Allow Public/Demo Read-Write Policies
CREATE POLICY "Allow all profiles" ON profiles FOR ALL USING (true);
CREATE POLICY "Allow all collection_points" ON collection_points FOR ALL USING (true);
CREATE POLICY "Allow all routes" ON routes FOR ALL USING (true);
CREATE POLICY "Allow all route_stops" ON route_stops FOR ALL USING (true);
```

### Step 4: Configure the Credentials
You can provide your credentials in either of two ways:

#### Option A: Inside the Web Application (No code rebuild required)
1. In the top navigation bar of the application, click the **"Cloud Sync"** / **"Supabase Live"** button.
2. Enter your **Supabase Project URL** and **Anon Key**.
3. Click **"Save & Test Connection"**.

#### Option B: Via `.env` File
Create a `.env` file in the project root directory:
```env
VITE_SUPABASE_URL=https://abcdefghijklm.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🗺️ Alternative / Enterprise Production Providers (Future Roadmap)

If you plan to scale the system for enterprise municipal deployments with hundreds of vehicles and live traffic updates:

| Provider | Purpose | Environment Variable | Documentation Link |
| :--- | :--- | :--- | :--- |
| **Mapbox Directions API** | High-precision road routing with live commercial traffic | `VITE_MAPBOX_ACCESS_TOKEN` | [Mapbox Docs](https://docs.mapbox.com/api/navigation/directions/) |
| **OpenRouteService** | Open-source alternative road routing | `VITE_ORS_API_KEY` | [OpenRouteService](https://openrouteservice.org/dev/#/api-docs) |
| **Google Maps Directions API** | Google road networks & turn-by-turn routing | `VITE_GOOGLE_MAPS_KEY` | [Google Maps Platform](https://developers.google.com/maps/documentation/directions) |
| **Stadia Maps / MapTiler** | High-DPI custom vector tiles for maps | `VITE_MAP_TILE_KEY` | [Stadia Maps](https://stadiamaps.com/) |

---

## 🔒 Security Best Practices

1. **Keep Secrets Out of Version Control**:
   - The `.env` file is included in `.gitignore` by default. Never commit live production credentials to public Git repositories.
2. **Use Row Level Security (RLS)**:
   - When deploying to production with real municipal staff, enable strict RLS policies in Supabase so workers can only update their assigned routes, and only administrators can delete collection points.
