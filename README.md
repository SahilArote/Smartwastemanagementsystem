# 🚛 SmartRoute • Cloud-Based Waste Collection Route Planner

A modern, responsive, software-only municipal waste management and collection route optimization web application built in accordance with **PRD v1.0**.

Designed specifically for city administrators and waste collection drivers without requiring any physical IoT hardware, vehicle GPS trackers, or smart sensors.

---

## 🌟 Key Highlights & PRD Compliance

| Requirement ID | Feature | Implementation Details |
| :--- | :--- | :--- |
| **FR-01** | **Authentication & Roles** | Role switcher for **Administrator** (e.g. Sarah Jenkins) and **Collection Worker** (e.g. Marcus Vance, Priya Patel) with role-enforced viewports. |
| **FR-02** | **Dashboard Summary** | Real-time counts of collection points, saved routes, pending vs in-progress vs completed stops, and live completion rates. |
| **FR-03 & FR-04** | **Collection Points & Map** | Full CRUD for municipal bins with coordinates, waste categories, priorities, fill levels, interactive map view, and a 1-click **"Pick on Map"** coordinate selector. |
| **FR-05 & FR-06** | **Route Planner & Ordering** | Admin selects starting depot and bins; calculates the visit order using the **Nearest-Neighbour heuristic** algorithm with priority tie-breaker weighting. |
| **FR-07** | **Road Route & Distance** | Integrates with **OSRM Driving API** for real road network geometry and road distance/duration; automatic fallback to straight-line estimation if OSRM is offline. |
| **FR-08** | **Route Persistence** | Save route name, scheduled date, ordered stops snapshot, total road distance, and assigned driver. |
| **FR-09 & FR-10** | **Worker Field Terminal** | Dedicated mobile-optimized worker interface displaying assigned routes, step sequence, 1-tap status updates (`Pending` → `In Progress` → `Completed`), driver notes, and **Google Maps GPS Navigation links**. |
| **FR-11** | **Operational Reports** | Aggregates planned road distance, completion ratios, municipal zone coverage, waste stream breakdown, and 1-click **CSV Export** / Print sheet. |
| **FR-12** | **Responsive Design** | High-contrast municipal control-room dark aesthetic; stacks map and lists vertically on mobile viewports. |

---

## 🛠️ Technology Stack

- **Frontend**: React 19 + TypeScript + Vite 8
- **Styling**: Vanilla Modern CSS Design System (Control room palette, glassmorphism, responsive tokens)
- **Mapping**: Leaflet.js + CartoDB Voyager tiles (OpenStreetMap compatible)
- **Routing Engine**: OSRM (Open Source Routing Machine) API with Haversine fallback
- **Storage & Cloud**: Dual-mode persistence:
  - **Instant Zero-Setup Mode**: Automatic local browser storage pre-seeded with 10 realistic city collection points, 3 depots, 3 user profiles, and an active route.
  - **Supabase PostgreSQL Sync**: Optional live cloud connection with 1-click SQL schema export and table synchronization.
- **Icons**: Lucide React

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** v18+ (tested on Node v24)
- **npm** v9+

### 2. Run Locally
The dev server is pre-configured and can be launched immediately:

```bash
# Install dependencies (already installed in workspace)
npm install

# Start Vite development server
npm run dev
```

Open your browser at:
👉 **`http://127.0.0.1:5173/`**

---

## 🧪 PRD Demo Walkthrough (Section 18)

Follow these steps to demonstrate the full end-to-end workflow:

1. **Dashboard Overview**:
   - Check the 4 KPI cards: Total Collection Points (10), Saved Routes (1), Pending Stops, Completed Stops.
   - Inspect the interactive municipal grid map.

2. **Manage Collection Points (Admin)**:
   - Go to the **Collection Points** tab.
   - Click **Add New Collection Point**.
   - Enter name, area, waste type, and priority.
   - Click on the embedded mini-map to auto-populate exact latitude and longitude coordinates.
   - Click **Save Point**.

3. **Plan an Optimized Route**:
   - Go to the **Route Planner** tab.
   - Choose the starting depot (e.g. *Municipal Central Depot*).
   - Select collection points from the checklist.
   - Click **Generate Route**.
   - Notice the live OSRM road geometry polyline, turn-by-turn road distance in kilometers, estimated travel time, and sequenced stop badges.
   - Reorder any stops using the up/down sequence arrows if desired.
   - Click **Save & Assign Route** to assign it to worker Marcus Vance.

4. **Execute Collection as Worker**:
   - Switch role to **Worker** (or click **Worker Portal** tab).
   - See the active route assigned to Marcus Vance.
   - Click **Navigate (GPS)** on any stop to open Google Maps turn-by-turn navigation.
   - Click **Complete Collection** on a stop: watch the celebratory confetti and progress bar update!

5. **Verify Real-Time Synchronization**:
   - Return to the **Dashboard** or **Saved Routes** tab: the stop status is updated in real time.
   - Go to the **Reports** tab to view total planned kilometers, completion metrics, and click **Export CSV**.

---

## ☁️ Optional Supabase Setup

The application works completely offline or in local demo mode without requiring remote credentials. To connect to your Supabase project:

1. Click the **"Cloud Sync"** button in the top navigation bar.
2. Click **Copy SQL Script** and paste it into the **SQL Editor** of your Supabase dashboard to create the tables (`profiles`, `collection_points`, `routes`, `route_stops`).
3. Enter your **Supabase URL** and **Anon Key** in the modal.
4. Click **Save & Test Connection**.

---

## 📁 Project Architecture

```
Cloud Based Waste Route Planner/
├── index.html                   # Entry HTML with Google Fonts & Leaflet styles
├── package.json
├── src/
│   ├── types/
│   │   └── index.ts             # PRD domain entities & TypeScript definitions
│   ├── services/
│   │   ├── routing.ts           # Nearest-Neighbour heuristic & OSRM road API
│   │   ├── storage.ts           # Storage repository, demo seeding & metrics
│   │   └── supabaseClient.ts    # Supabase PostgreSQL client & migration SQL
│   ├── components/
│   │   ├── Navbar.tsx           # Navigation bar with role & profile quick-switcher
│   │   ├── MapView.tsx          # Leaflet interactive map with custom DivIcon markers
│   │   ├── DashboardView.tsx    # Municipal operations dashboard & KPI metrics
│   │   ├── CollectionPointsView.tsx # CRUD table & click-on-map coordinate picker
│   │   ├── RoutePlannerView.tsx # Algorithmic route planner with road routing
│   │   ├── SavedRoutesView.tsx  # Route manifest inspector & printable sheets
│   │   ├── WorkerPortalView.tsx # Mobile-optimized field terminal for truck drivers
│   │   ├── ReportsView.tsx      # Waste analytics, coverage tables & CSV export
│   │   ├── SupabaseConfigModal.tsx # Cloud credentials & PostgreSQL migration schema
│   │   └── Toast.tsx            # Real-time notification banners
│   ├── index.css                # Polished municipal operations styling tokens
│   ├── App.tsx                  # Main application state orchestrator
│   └── main.tsx
└── tsconfig.json
```
