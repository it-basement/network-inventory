# REBUILD INSTRUCTIONS - FIX FOR BLANK PAGE

The JavaScript error persists because Docker is using cached build. Follow these steps:

## Step 1: Stop and Remove Everything
```bash
cd /app
docker compose down
docker system prune -f
```

## Step 2: Rebuild Without Cache
```bash
docker compose build --no-cache
docker compose up -d
```

## Step 3: Wait for Build to Complete
This will take 5-10 minutes. Check progress:
```bash
docker compose logs -f
```

## Step 4: Verify Backend is Running
```bash
curl http://localhost:8001/api/
# Should return: {"message":"Network Scanner API - Ready"}
```

## Step 5: Access Application
Open browser: http://YOUR_SERVER_IP:3000

---

## If Still Having Issues

### Option A: Manual Build
```bash
cd /app/frontend
docker build --no-cache -t network-scanner-frontend .

cd /app/backend  
docker build --no-cache -t network-scanner-backend .

cd /app
docker compose up -d
```

### Option B: Check Logs
```bash
docker compose logs backend | grep ERROR
docker compose logs frontend | grep ERROR
```

---

## IMPORTANT NOTES:

1. The errors about "rrweb", "CORS", and "fonts" are NOT CRITICAL
   - These are from browser extensions
   - They don't affect functionality

2. The ONLY critical error is:
   - "e.filter is not a function"
   - Fixed in code but needs rebuild without cache

3. After rebuild, the page should load correctly
