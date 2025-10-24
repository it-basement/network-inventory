# Network Scanner & Inventory System

A full-stack network scanning and inventory discovery application with enterprise features.

## Features

✨ **Network Discovery**
- Automatic device discovery on any network
- Discovers routers, switches, servers, workstations, IoT devices
- ICMP ping scanning for host detection
- Advanced OS and hardware fingerprinting

🔐 **Authentication & Scanning**
- SSH authentication (Linux/Unix)
- Active Directory domain authentication
- WMI/SMB (Windows local)
- SNMP (Network devices)
- **Bulk credential management** - Apply credentials to multiple devices at once

📊 **Inventory Management**
- IP address, MAC address, hostname
- Device type detection
- Operating system information
- Hardware specifications (CPU, memory, disk)
- Open ports and services
- Real-time device status

🎯 **Enterprise Features**
- Bulk credential application by device type
- Filter devices by Windows, Linux, Network devices
- Active Directory integration for domain environments
- Scan result visibility with error reporting
- Auto-refresh after authentication scans

## Tech Stack

**Backend:**
- FastAPI (Python 3.11)
- MongoDB (Database)
- python-nmap (Network scanning)
- paramiko (SSH)
- pysnmp (SNMP)
- scapy (Packet manipulation)

**Frontend:**
- React 19
- Tailwind CSS
- Axios
- Lucide React (Icons)
- React Router

## Quick Start with Docker 🐳

### Prerequisites
- Docker
- Docker Compose

### Installation

1. **Clone the repository:**
```bash
git clone <your-repo>
cd network-scanner
```

2. **Update configuration:**
Edit `docker-compose.yml` and set your server IP:
```yaml
- REACT_APP_BACKEND_URL=http://YOUR_SERVER_IP:8001
```

3. **Start the application:**
```bash
docker-compose up -d
```

4. **Access the application:**
- Frontend: http://YOUR_SERVER_IP
- Backend API: http://YOUR_SERVER_IP:8001/api

### Docker Commands

```bash
# View logs
docker-compose logs -f

# Stop application
docker-compose down

# Restart
docker-compose restart

# Rebuild after changes
docker-compose build && docker-compose up -d
```

## Manual Installation

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed manual installation instructions.

## Usage Guide

### 1. Network Discovery Scan
1. Enter network range in CIDR notation (e.g., `192.168.1.0/24`)
2. Click "Start Scan"
3. Wait for scan completion
4. View discovered devices in the grid

### 2. Individual Device Authentication
1. Click on any device card
2. Click "Provide Credentials for Detailed Scan"
3. Select authentication type
4. Enter credentials
5. Click "Start Detailed Scan"
6. Wait 5 seconds and check results in device details

### 3. Bulk Credentials (Recommended for Domain Environments)
1. Click "Bulk Credentials" button in header
2. Select target device group:
   - **All Devices** - Every discovered device
   - **Not Authenticated** - Only unauthenticated devices
   - **Windows Devices** - All Windows systems (use AD credentials)
   - **Linux Devices** - All Linux/Unix systems
   - **Network Devices** - Routers, switches, firewalls
3. Choose authentication type (e.g., "Active Directory")
4. Enter credentials (e.g., `domain\administrator`)
5. Click "Apply Credentials & Scan"
6. Wait and refresh to see results

### 4. View Scan Results
- Open device details to see:
  - Authentication status (Yes/No)
  - Last scanned timestamp
  - Hardware specifications
  - OS information
  - Open ports and services
  - Error messages if authentication failed

## Authentication Types

| Type | Use Case | Example |
|------|----------|---------|
| **SSH** | Linux/Unix servers | Standard username/password |
| **Active Directory** | Windows domain computers | `domain\admin` or `admin@domain.com` |
| **WMI** | Windows local accounts | Local administrator |
| **SNMP** | Network devices | Community string (default: public) |

## API Endpoints

- `POST /api/scan/discover` - Start network discovery scan
- `GET /api/scan/status/{scan_id}` - Get scan progress
- `GET /api/devices` - List all discovered devices
- `GET /api/devices/{device_id}` - Get device details
- `POST /api/scan/detailed` - Start authenticated device scan
- `DELETE /api/devices/{device_id}` - Delete device
- `GET /api/scans` - Get scan history

## Security Notes

⚠️ **Important Security Considerations:**

1. **Network Access**: The scanner requires network access to scan devices
2. **Credentials**: Store credentials securely
3. **Docker Privileges**: Backend container requires `NET_ADMIN` and `NET_RAW` capabilities
4. **Firewall**: Configure firewall rules to limit access
5. **HTTPS**: Enable HTTPS in production

## License

MIT License
