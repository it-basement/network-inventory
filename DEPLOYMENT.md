# Network Scanner & Inventory - Deployment Guide

## Docker Deployment (Recommended) 🐳

### What You Need On Your Server
**ONLY Docker and Docker Compose!**
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt-get install docker-compose-plugin
```

### Deploy the Application

**1. Copy your code to server:**
```bash
# Either clone from GitHub or copy files
git clone <your-repo-url>
cd <repo-name>
```

**2. Update Frontend Environment:**
Edit `docker-compose.yml` and change this line:
```yaml
- REACT_APP_BACKEND_URL=http://YOUR_SERVER_IP:8001
```
Replace `YOUR_SERVER_IP` with your actual server IP address.

**3. Start Everything:**
```bash
docker-compose up -d
```

That's it! ✅

**What's Included in Docker:**
- ✅ Python 3.11
- ✅ Node.js & Yarn
- ✅ Nginx
- ✅ nmap
- ✅ MongoDB
- ✅ All dependencies
- ✅ Everything configured

### Access Your Application
- **Frontend**: http://YOUR_SERVER_IP
- **Backend API**: http://YOUR_SERVER_IP:8001/api

### Docker Commands

**Check status:**
```bash
docker-compose ps
```

**View logs:**
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

**Stop application:**
```bash
docker-compose down
```

**Restart application:**
```bash
docker-compose restart
```

**Update after code changes:**
```bash
docker-compose down
docker-compose build
docker-compose up -d
```

### Production Recommendations

**1. Use Environment Variables:**
Create `.env` file in project root:
```env
# Server Configuration
SERVER_IP=your.server.ip
FRONTEND_PORT=80
BACKEND_PORT=8001

# Database
MONGO_URL=mongodb://mongodb:27017
DB_NAME=network_scanner

# Security (generate strong passwords)
MONGO_ROOT_PASSWORD=your_strong_password
```

**2. Enable HTTPS (SSL):**
Add Certbot/Let's Encrypt to nginx container:
```bash
# Add to docker-compose.yml
volumes:
  - ./ssl:/etc/nginx/ssl
```

**3. Data Persistence:**
MongoDB data is automatically saved in Docker volume `mongodb_data`

**4. Firewall Configuration:**
```bash
# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 8001/tcp  # Backend API
```

---

## Manual Deployment (Without Docker)

If you prefer manual installation:

```bash
# 1. Install dependencies
sudo apt-get update
sudo apt-get install -y nmap mongodb python3-pip nodejs yarn nginx

# 2. Backend
cd backend
pip3 install -r requirements.txt
python3 -m uvicorn server:app --host 0.0.0.0 --port 8001 &

# 3. Frontend
cd frontend
yarn install
yarn build
sudo cp -r build/* /var/www/html/

# 4. Configure Nginx
sudo cp nginx.conf /etc/nginx/sites-available/network-scanner
sudo ln -s /etc/nginx/sites-available/network-scanner /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## Troubleshooting

**Container won't start:**
```bash
docker-compose logs backend
```

**Network scanning not working:**
- Ensure Docker has `privileged: true` and `NET_ADMIN` capability
- Check if nmap is installed: `docker-compose exec backend which nmap`

**Frontend can't reach backend:**
- Verify `REACT_APP_BACKEND_URL` in docker-compose.yml
- Check CORS settings in backend

**Database connection issues:**
```bash
docker-compose exec mongodb mongosh
# Should connect successfully
```

---

## Performance Tips

**1. Limit Scan Ranges:**
- Scan smaller network ranges (/28 or /29)
- Large scans (/16 or /8) can take hours

**2. Resource Limits:**
Add to docker-compose.yml:
```yaml
deploy:
  resources:
    limits:
      cpus: '2'
      memory: 2G
```

**3. Backup Database:**
```bash
docker-compose exec mongodb mongodump --out=/backup
docker cp network-scanner-db:/backup ./backup
```

---

## Summary

✅ **Docker = Everything Included**
- No need to install Python, Node, nginx, etc.
- Just install Docker and run `docker-compose up -d`
- All dependencies are in the containers

✅ **Easy Updates**
- Pull new code
- Run `docker-compose build && docker-compose up -d`
- Done!

✅ **Easy Backup**
- Database stored in Docker volume
- Easy to backup and restore

**Recommended:** Use Docker deployment for easiest setup! 🚀
