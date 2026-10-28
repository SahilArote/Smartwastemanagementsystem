# 🚀 SmartRoute: Complete Project Stack, Architecture & CI/CD Deployment Guide

Ye document explain karta hai ki **SmartRoute (Cloud-Based Municipal Waste Route Planner & Operations Platform)** project ka **Tech Stack kya hai**, **Server aur Domain konsa hai**, **poora software architecture kaise setup kiya gaya**, aur **GitHub Actions ke zariye Zero-Downtime CI/CD pipeline kaise lagayi gayi**.

---

## 📌 Quick Summary: Server & Domain Details

| Parameter | Details | Description |
| :--- | :--- | :--- |
| 🚀 **Project Name** | **SmartRoute (Cloud-Based Waste Collection Route Planner)** | Software-only municipal waste collection & route optimization platform |
| 🌐 **Live Domain** | **`smartwastemanagement.nex-build.com`** | Production domain pointed via DNS `A` record |
| 🖥️ **Server Type** | **AWS Lightsail VPS (Cloud Virtual Private Server)** | High-performance dedicated Linux cloud instance |
| 🐧 **Operating System** | **Ubuntu 22.04 / 24.04 LTS** | Secure, production-hardened Ubuntu environment |
| ⚡ **Web Server** | **Nginx** | High-speed reverse proxy & SPA static web server with Gzip |
| 🔒 **SSL / HTTPS** | **Let's Encrypt (Certbot)** | Free automatic SSL encryption (HTTPS on Port 443) |
| ⚙️ **CI/CD Platform** | **GitHub Actions** | Automated CI build, test, SCP sync & atomic deployment |
| 📦 **Deployment Style** | **Zero-Downtime Atomic Symlink Switch** | 0ms switchover time (`ln -sfn`), no server downtime |
| ☁️ **Cloud Database** | **Supabase (PostgreSQL 15+)** | Managed PostgreSQL database with Row Level Security (RLS) |
| 💾 **Offline Mode** | **Browser LocalStorage Persistence** | Zero-setup instant demo mode with pre-seeded municipal data |
| 🐙 **Git Repository** | `SahilArote/Smartwastemanagementsystem` | Branch: `main` |

---

## 🛠️ 1. Project Ka Tech Stack Kya Hai?

SmartRoute ko ek **software-only, hardware-free municipal operations control-room** application ke roop me build kiya gaya hai, jisme kisi physical IoT sensor ya vehicle GPS hardware ki zaroorat nahi padti.

### 🎨 1. Frontend & Application Core
* **React 19 (`^19.3.1`)**: Latest React architecture with modern functional components, hooks, aur concurrent UI state updates.
* **TypeScript (`~6.0.3`)**: Strict type-safety, comprehensive domain entities (`CollectionPoint`, `Route`, `RouteStop`, `UserProfile`, `Zone`, `AuditLog`).
* **Vite 8 (`^8.3.4`)**: Lightning-fast build tool, Hot Module Replacement (HMR), production asset minification aur tree-shaking.
* **Vanilla CSS (Tailux CRM Design System)**:
  * Handcrafted modern control-room design with glassmorphism, refined color tokens, micro-animations, aur high-contrast visual hierarchy.
  * System-wide **Dark Mode & Light Mode** toggle (saved in localStorage).
  * Zero heavy external CSS frameworks (no Tailwind CSS bloat), leading to ultra-fast initial page loads.
* **Lucide React (`^1.61.0`)**: Crisp, lightweight SVG vector icons across all views and navigation.
* **Canvas-Confetti (`^1.9.4`)**: Driver motivation micro-interaction jab collection stops mark complete hote hain.

### 🗺️ 2. GIS Mapping & Route Optimization Engine
* **Leaflet.js (`^1.9.4`)**: Interactive geospatial map engine with custom colored DivIcon markers for bins, depots, and real-time route polylines.
* **Map Tile Provider**: CartoDB Voyager / OpenStreetMap vector raster tiles (100% Free & Open-Source, no paid Google Maps API keys required).
* **OSRM (Open Source Routing Machine) API**:
  * Public road-network routing API (`https://router.project-osrm.org`) jo actual driving paths, turn-by-turn road distance (km), aur travel duration (min) calculate karta hai.
  * **Intelligent Haversine Fallback**: Agar OSRM public API temporarily unreachable ho, to app automatic spherical Haversine formula with a 1.3x road-winding factor apply karti hai.
* **Nearest-Neighbour Heuristic Algorithm**:
  * Multi-stop collection order optimization engine.
  * Starting depot se sabhi selected bins tak shortest travel sequence calculate karta hai with urgent/high priority weighting.
* **Google Maps Navigation Deep-Link**:
  * Field drivers ke liye 1-tap browser intent (`https://www.google.com/maps/dir/?api=1&destination=lat,lng`) jo seedha truck driver ke mobile me turn-by-turn live GPS navigation khol deta hai.

### 👥 3. Role-Based Access Control (RBAC) & Application Modules
* **Administrator Portal**:
  * **Dashboard**: Real-time KPI summary (Total Bins, Saved Routes, Pending vs Completed Stops, Efficiency rate).
  * **Collection Points CRUD**: Bins management with address, waste type (Organic, Recyclable, Hazardous, General), priority, fill level, aur **1-click "Pick on Map"** coordinate picker.
  * **Route Planner**: Depot selection, interactive stop selection, algorithmic sequencing, polyline road preview, and driver assignment.
  * **Saved Routes & Manifests**: Route history inspector with printable dispatch manifests.
  * **Zones & Schedules**: Municipal collection zones and day-wise scheduling.
  * **Reports & Analytics**: Mileage summary, waste stream distribution, completion metrics, and **1-click CSV Export**.
  * **Activity Audit Trail**: Chronological event logs for administrative transparency.
  * **User Management**: Driver and staff role assignment.
* **Worker Field Terminal**:
  * Mobile-optimized interface for collection truck drivers.
  * Active assigned route display, sequenced stop cards, 1-tap status buttons (`Pending` → `In Progress` → `Completed`), driver notes, and direct Google Maps navigation.

### 🗄️ 4. Dual-Mode Database & Cloud Persistence
* **Instant Zero-Setup Mode**: Automatic browser `localStorage` pre-seeded with 10 realistic city collection points, 3 depots, 3 municipal profiles, and an active route. Allows 100% offline testing.
* **Supabase Cloud Sync (PostgreSQL 15+)**:
  * Cloud endpoint: `https://hmudloupninktylkavhm.supabase.co`
  * Tables: `profiles`, `collection_points`, `routes`, `route_stops`.
  * Row Level Security (RLS) enabled with live data synchronization across devices.

---

## 🏗️ 2. Kya Kya Hua Aur Kaise Kiya? (Complete Architectural Flow)

Ye flow explain karta hai ki developer ke system se live production domain tak application kaise build, transfer aur deploy hoti hai:

```
[Developer: Sahil Arote]
         │  git push origin main
         ▼
[GitHub Repository: SahilArote/Smartwastemanagementsystem]
         │  Triggers GitHub Actions Workflow (.github/workflows/deploy.yml)
         ▼
[GitHub Actions Cloud Runner (Ubuntu Latest)]
         ├── 1. Checkout repository code
         ├── 2. Setup Node.js 22 with npm cache
         ├── 3. npm install (Installs React, Vite, Leaflet, Lucide dependencies)
         ├── 4. Injects Secrets (VITE_SUPABASE_URL, VITE_ADMIN_EMAIL, etc.)
         └── 5. npm run build  ──▶ Generates optimized static bundle in 'dist/'
         │
         │  Secure SCP Transfer (Port 22 via SSH Key)
         ▼
[AWS Lightsail Ubuntu Server (/home/ubuntu/smartwaste)]
         ├── Temporary Staging: /home/ubuntu/smartwaste/temp_dist
         ├── Create Release Folder: /releases/frontend_YYYYMMDD_HHMMSS
         ├── 0ms Atomic Switch: ln -sfn /releases/frontend_... /frontend-current
         └── Retention Policy: Keeps latest 5 releases, purges older files
         │
         ▼
[Nginx Web Server]
         ├── Serves: /home/ubuntu/smartwaste/frontend-current
         ├── Handles SPA Routing: try_files $uri $uri/ /index.html
         ├── Gzip compression & 30-day static asset caching
         └── Let's Encrypt SSL (HTTPS: 443)
         │
         ▼
[Live Production Domain: https://smartwastemanagement.nex-build.com]
```

### Key Advantages of This Architecture:
1. **Server Pe Heavy Build Nahi Hota**: AWS Lightsail server par `npm run build` ya `node` compile run karne ki zaroorat nahi padti. Build GitHub ke powerful cloud runners pe hota hai, jisse VPS server ka RAM aur CPU hamesha free rehta hai.
2. **Zero Downtime**: Server par purani files delete karke nayi files copy karne se website 1-2 minute ke liye band ho jati thi. Yahan **Atomic Symlink (`ln -sfn`)** use kiya gaya hai jo **0 milliseconds** me live site switch kar deta hai.
3. **Instant Rollback Safety**: Agar naye code me koi issue aaye, to bas pichle timestamped folder par symlink point karke 1 second me instant rollback kiya ja sakta hai.

---

## ⚡ 3. CI/CD Kaise Lagaya? Actions Kaise Banaye?

GitHub Actions CI/CD pipeline file yahan save hai:
👉 [`.github/workflows/deploy.yml`](file:///.github/workflows/deploy.yml)

### Workflow File Ka Detailed Step-by-Step Breakdown:

```yaml
name: Frontend Zero-Downtime Deploy (Build in CI -> Sync Dist)

on:
  push:
    branches:
      - main  # 1. Jab bhi 'main' branch par push hoga, workflow auto trigger hoga

concurrency:
  group: frontend_production_deploy
  cancel-in-progress: false # 2. Agar ek deployment chal rahi hai, to doosri wait karegi (conflict nahi hoga)

jobs:
  build-and-deploy:
    name: Build in CI & Deploy Dist
    runs-on: ubuntu-latest
    timeout-minutes: 10

    steps:
      # Step 1: Source code clone karta hai
      - name: Checkout Code
        uses: actions/checkout@v4

      # Step 2: Node.js 22 environment setup karta hai with npm caching
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'

      # Step 3: Dependencies install karta hai
      - name: Install Dependencies in CI Runner
        run: npm install

      # Step 4: Environment variables inject karke production build banata hai
      - name: Build Production Dist Bundle with Server Environment
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
          VITE_ADMIN_EMAIL: ${{ secrets.VITE_ADMIN_EMAIL || 'admin@citywaste.gov' }}
          VITE_MAP_TILE_URL: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          VITE_MAP_ATTRIBUTION: "&copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a> contributors"
        run: npm run build

      # Step 5: Pre-built 'dist/' folder ko SCP ke zariye server ke temp folder me transfer karta hai
      - name: Transfer Pre-built Dist to Lightsail
        uses: appleboy/scp-action@v0.1.7
        with:
          host: ${{ secrets.LIGHTSAIL_HOST }}
          username: ${{ secrets.LIGHTSAIL_USERNAME || 'ubuntu' }}
          key: ${{ secrets.LIGHTSAIL_SSH_KEY }}
          port: ${{ secrets.LIGHTSAIL_PORT || 22 }}
          source: "dist/"
          target: "/home/ubuntu/smartwaste/temp_dist"
          strip_components: 1

      # Step 6: SSH execute karke Atomic Symlink switch aur auto-cleanup karta hai
      - name: Atomically Switch Live Symlink on Server
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.LIGHTSAIL_HOST }}
          username: ${{ secrets.LIGHTSAIL_USERNAME || 'ubuntu' }}
          key: ${{ secrets.LIGHTSAIL_SSH_KEY }}
          port: ${{ secrets.LIGHTSAIL_PORT || 22 }}
          script_stop: true
          script: |
            set -e
            APP_DIR="/home/ubuntu/smartwaste"
            RELEASES_DIR="$APP_DIR/releases"
            CURRENT_SYMLINK="$APP_DIR/frontend-current"
            TEMP_DIR="$APP_DIR/temp_dist"
            TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
            NEW_RELEASE="$RELEASES_DIR/frontend_$TIMESTAMP"

            mkdir -p "$RELEASES_DIR"

            # 1. Uploaded dist ko unique timestamped folder me move karo
            mv "$TEMP_DIR" "$NEW_RELEASE"

            # 2. 0ms Atomic Symlink Switch (Purana release hatakar turant naye par point karta hai)
            ln -sfn "$NEW_RELEASE" "$CURRENT_SYMLINK"

            # 3. Server disk space bachane ke liye sirf last 5 releases rakho, purane delete karo
            cd "$RELEASES_DIR"
            ls -dt frontend_* | tail -n +6 | xargs -r rm -rf

            echo "✅ [Smart Waste Management] Pre-built dist deployed successfully with Zero Downtime!"
```

---

## 🔑 4. GitHub Secrets Configuration

GitHub Actions ko server se securely connect karne ke liye GitHub Secrets configure kiye gaye hain:

> **Settings** → **Secrets and variables** → **Actions** → **Repository secrets**

| Secret Name | Value Example | Description |
| :--- | :--- | :--- |
| `LIGHTSAIL_HOST` | `13.235.xxx.xxx` | AWS Lightsail / EC2 Server ka Public IP address |
| `LIGHTSAIL_USERNAME` | `ubuntu` | Server login username (default `ubuntu`) |
| `LIGHTSAIL_SSH_KEY` | `-----BEGIN OPENSSH PRIVATE KEY----- ...` | AWS Lightsail ki private SSH key (`.pem` format) |
| `LIGHTSAIL_PORT` | `22` | SSH Port |
| `VITE_SUPABASE_URL` | `https://hmudloupninktylkavhm.supabase.co` | Supabase Cloud Database URL |
| `VITE_SUPABASE_ANON_KEY` | `sb_publishable_9hwu1k9DzAp7g8K5AeJsxQ...` | Supabase Public Client Key |
| `VITE_ADMIN_EMAIL` | `admin@citywaste.gov` | Primary municipal admin user email |

---

## 🖥️ 5. Server-Side Setup & Nginx Configuration

### Step A: Server Directories Setup (One-time run on VPS)
AWS Lightsail server me SSH login karke:
```bash
# Application root and releases folder
sudo mkdir -p /home/ubuntu/smartwaste/releases
sudo chown -R ubuntu:ubuntu /home/ubuntu/smartwaste
chmod -R 755 /home/ubuntu/smartwaste
```

### Step B: Nginx Virtual Host Configuration
`/etc/nginx/sites-available/smartwaste.conf` (or `/etc/nginx/conf.d/smartwaste.conf`):

```nginx
server {
    listen 80;
    server_name smartwastemanagement.nex-build.com;

    # Live release par point karne wala symlink
    root /home/ubuntu/smartwaste/frontend-current;
    index index.html;

    # Gzip Compression (Fast load on mobile 4G/5G)
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;

    # Single Page Application (SPA) routing fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Static Assets Cache (30 Days caching for JS/CSS/Images)
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }
}
```

Enable site and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/smartwaste.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Step C: Free SSL Certificate (HTTPS)
Let's Encrypt Certbot se automated SSL certificate:
```bash
sudo apt update && sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d smartwastemanagement.nex-build.com
```
*Yeh command Nginx config ko auto-update karke HTTPS (Port 443) enable kar deti hai.*

---

## 🔄 6. Zero-Downtime Atomic Symlink Folder Structure

Server par disk layout is tarah organize rehta hai:

```
/home/ubuntu/smartwaste/
│
├── releases/
│   ├── frontend_20261026_210000/    # Release 1
│   ├── frontend_20261026_211500/    # Release 2
│   ├── frontend_20261026_213000/    # Release 3
│   ├── frontend_20261026_214500/    # Release 4
│   └── frontend_20261026_220000/    # Release 5 (Latest active release)
│
├── frontend-current  ─────────────▶ Points to /releases/frontend_20261026_220000
│
└── temp_dist/                       # Upload transient scratch space
```

### Instant Rollback (Agar kabhi emergency me pichle version par jana ho):
```bash
# Bas symlink ko pichle release par point kar do:
ln -sfn /home/ubuntu/smartwaste/releases/frontend_20261026_214500 /home/ubuntu/smartwaste/frontend-current
sudo systemctl reload nginx
```

---

## 📊 7. Summary Checklist

- [x] **Project Name**: SmartRoute (Cloud-Based Municipal Waste Route Planner & Operations Platform)
- [x] **Project Type**: Software-only web application (Zero IoT sensors, zero hardware required)
- [x] **Frontend Stack**: React 19 + TypeScript + Vite 8 + Vanilla CSS (Tailux CRM design system) + Lucide Icons
- [x] **GIS & Maps**: Leaflet.js + CartoDB / OpenStreetMap raster tiles (100% Free & Open-Source)
- [x] **Routing Engine**: Nearest-Neighbour heuristic algorithm + OSRM Road Driving API + Haversine fallback
- [x] **Driver Navigation**: Google Maps deep-link navigation for field collection crews
- [x] **Database**: Supabase PostgreSQL Cloud DB + Dual-mode LocalStorage persistence
- [x] **Domain**: `smartwastemanagement.nex-build.com` (HTTPS Let's Encrypt SSL)
- [x] **Server**: AWS Lightsail Ubuntu VPS
- [x] **Web Server**: Nginx with SPA routing, Gzip, and SSL Certbot
- [x] **CI/CD**: GitHub Actions (`.github/workflows/deploy.yml`)
- [x] **Zero Downtime**: Atomic symlink switchover (`ln -sfn`) with 5-release retention and instant rollback safety
- [x] **Secrets**: `LIGHTSAIL_HOST`, `LIGHTSAIL_SSH_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
