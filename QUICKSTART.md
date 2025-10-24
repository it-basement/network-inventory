# 🚀 Quick Start Guide

## Docker Deployment (Easiest!)

### On Your Server (Only need Docker!)

```bash
# 1. Install Docker (one-time)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo apt-get install docker-compose-plugin

# 2. Get your code
git clone <your-github-repo>
cd network-scanner

# 3. Edit docker-compose.yml
# Change this line:
# - REACT_APP_BACKEND_URL=http://localhost:8001
# To your server IP:
# - REACT_APP_BACKEND_URL=http://YOUR_SERVER_IP:8001

# 4. Start everything
docker-compose up -d

# Done! ✅
```

### Access Application
- Open browser: `http://YOUR_SERVER_IP`
- Backend API: `http://YOUR_SERVER_IP:8001/api`

---

## What's Included in Docker?

✅ Everything you need:
- Python 3.11 + all libraries
- Node.js + Yarn
- Nginx web server
- MongoDB database
- nmap scanner
- All configured and ready!

❌ You DON'T need to install:
- Python
- Node.js
- Nginx
- MongoDB
- Any dependencies

---

## Common Commands

```bash
# Check status
docker-compose ps

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Restart
docker-compose restart

# Stop
docker-compose down

# Update after code changes
docker-compose down
docker-compose build
docker-compose up -d
```

---

## Usage

### Scan Your Network
1. Enter network range: `192.168.1.0/24`
2. Click "Start Scan"
3. Wait 2-5 minutes
4. See all discovered devices!

### Bulk Credentials (For Domain)
1. Click "Bulk Credentials" button
2. Select "Windows Devices"
3. Choose "Active Directory"
4. Enter: `domain\administrator` + password
5. Click "Apply Credentials & Scan"
6. All Windows devices scanned at once! ✨

### View Results
- Click any device card
- See authentication status
- Check hardware specs
- View error messages if auth failed

---

## Troubleshooting

**Can't access application?**
```bash
# Check containers running
docker-compose ps

# Should see 3 containers: frontend, backend, mongodb
```

**502 Error?**
```bash
# Check backend logs
docker-compose logs backend

# Restart backend
docker-compose restart backend
```

**Scan not working?**
- Check network range format: `192.168.1.0/24`
- Make sure Docker has network access
- View backend logs: `docker-compose logs backend`

---

## File Structure

```
/app/
├── docker-compose.yml    ← Main deployment file
├── backend/
│   ├── Dockerfile       ← Backend container config
│   ├── server.py        ← API server
│   └── network_scanner.py
├── frontend/
│   ├── Dockerfile       ← Frontend container config
│   └── src/             ← React app
└── DEPLOYMENT.md        ← Detailed guide
```

---

## Next Steps

1. **Save to GitHub**: Click "Save to GitHub" in Emergent
2. **Clone on Server**: `git clone <your-repo>`
3. **Deploy**: `docker-compose up -d`
4. **Done!** 🎉

---

Need help? Check DEPLOYMENT.md for detailed instructions!
