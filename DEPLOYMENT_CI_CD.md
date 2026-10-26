# 🚀 Zero-Downtime CI/CD Deployment Guide (AWS Lightsail / VPS)

This project is configured with an automated **Zero-Downtime CI/CD pipeline** via GitHub Actions located in [`.github/workflows/deploy.yml`](file:///.github/workflows/deploy.yml).

Every commit pushed to the `main` branch automatically:
1. Spins up an Ubuntu runner with **Node.js 22**.
2. Installs clean dependencies via `npm install`.
3. Injects production environment variables securely from GitHub Repository Secrets.
4. Builds the optimized production bundle (`dist/`).
5. Transfers the pre-built `dist/` directory directly to your server using SCP.
6. Performs an **atomic 0ms symlink switch** (`ln -sfn`) on the live server, preventing downtime or partial file reads.
7. Automatically cleans up older releases, keeping the latest 5 versions to avoid running out of disk space.

---

## 🔑 1. GitHub Repository Secrets Configuration

Navigate to your GitHub repository:  
**Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Add the following secrets:

| Secret Name | Description | Example / Default |
| :--- | :--- | :--- |
| `LIGHTSAIL_HOST` | Public IP or DNS of your AWS Lightsail / EC2 instance | `13.235.xxx.xxx` |
| `LIGHTSAIL_USERNAME` | SSH user account on the server | `ec2-user` (Amazon Linux) or `ubuntu` (Ubuntu) |
| `LIGHTSAIL_SSH_KEY` | Private SSH Key (`.pem` file contents including `-----BEGIN ... -----`) | Paste the full private key |
| `LIGHTSAIL_PORT` | SSH Port | `22` |
| `VITE_SUPABASE_URL` | *(Optional)* Supabase Project URL | `https://xxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | *(Optional)* Supabase Public Anon Key | `eyJhbGciOi...` |
| `VITE_ADMIN_EMAIL` | *(Optional)* System Administrator email | `admin@citywaste.gov` |

---

## 🖥️ 2. Server-Side Setup (One-Time)

Connect to your AWS Lightsail or VPS server via SSH and initialize the target directory:

```bash
# 1. Create the application release directory
mkdir -p /home/ubuntu/smartwaste/releases

# 2. Grant proper permissions
chmod -R 755 /home/ubuntu/smartwaste
```

---

## 🌐 3. Nginx Web Server Configuration

To serve the atomic symlinked release with proper client-side Single-Page App (SPA) routing, point your Nginx `root` to `/home/ubuntu/smartwaste/frontend-current`:

Edit your Nginx site configuration (e.g., `/etc/nginx/conf.d/smartwaste.conf` or `/etc/nginx/sites-available/default`):

```nginx
server {
    listen 80;
    server_name your-domain.com; # or your server IP

    # Point directly to the live symlink
    root /home/ubuntu/smartwaste/frontend-current;
    index index.html;

    # Gzip Compression for fast delivery
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Single Page App fallback routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }
}
```

Test and reload Nginx:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🔄 4. How the Zero-Downtime Atomic Switch Works

```
/home/ubuntu/smartwaste/
├── releases/
│   ├── frontend_20261026_213000/
│   ├── frontend_20261026_214500/
│   └── frontend_20261026_220000/  <-- New Release
├── frontend-current  ----------------> Points to latest release (0ms switch)
└── temp_dist/                         <-- Transient upload staging area
```

When new code is pushed:
1. Files upload to `temp_dist`.
2. It is moved to `releases/frontend_<TIMESTAMP>`.
3. `ln -sfn "$NEW_RELEASE" "$CURRENT_SYMLINK"` swaps the live site instantaneously. Users never experience a broken or half-updated state.
4. Older releases beyond the last 5 are deleted automatically.
