from fastapi import FastAPI, APIRouter, HTTPException, BackgroundTasks
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import asyncio
from network_scanner import NetworkScanner, validate_network_range


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Global scanner instance
scanner = NetworkScanner()

# Store active scans in memory
active_scans: Dict[str, Dict[str, Any]] = {}


# Define Models
class ScanRequest(BaseModel):
    network_range: str
    
class ScanResponse(BaseModel):
    scan_id: str
    status: str
    message: str

class ScanStatus(BaseModel):
    scan_id: str
    status: str
    progress: int
    total_devices: int
    message: str

class DeviceCredentials(BaseModel):
    username: str
    password: str
    auth_type: str = 'ssh'  # ssh, snmp, wmi

class DetailedScanRequest(BaseModel):
    device_id: str
    credentials: DeviceCredentials

class Device(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str
    scan_id: str
    ip_address: str
    mac_address: Optional[str] = None
    hostname: Optional[str] = None
    device_type: str = 'Unknown'
    os_info: Optional[Dict] = None
    hardware_specs: Optional[Dict] = None
    status: str = 'up'
    discovered_at: str
    authenticated: bool = False
    open_ports: List[Dict] = []
    last_scanned: Optional[str] = None
    scan_error: Optional[str] = None


# Network Scanning Endpoints
@api_router.post("/scan/discover", response_model=ScanResponse)
async def start_network_scan(request: ScanRequest, background_tasks: BackgroundTasks):
    """Start a network discovery scan"""
    
    # Validate network range
    if not validate_network_range(request.network_range):
        raise HTTPException(status_code=400, detail="Invalid network range. Use CIDR notation (e.g., 192.168.1.0/24)")
    
    # Generate scan ID
    scan_id = str(uuid.uuid4())
    
    # Initialize scan status
    active_scans[scan_id] = {
        'status': 'running',
        'progress': 0,
        'total_devices': 0,
        'devices': [],
        'network_range': request.network_range,
        'started_at': datetime.now(timezone.utc).isoformat()
    }
    
    # Start scan in background
    background_tasks.add_task(perform_network_scan, scan_id, request.network_range)
    
    return ScanResponse(
        scan_id=scan_id,
        status='started',
        message=f'Network scan started for {request.network_range}'
    )

async def perform_network_scan(scan_id: str, network_range: str):
    """Background task for network scanning"""
    try:
        async def update_progress(progress: int):
            if scan_id in active_scans:
                active_scans[scan_id]['progress'] = progress
        
        # Perform the scan
        devices = await scanner.discover_network(network_range, scan_id, update_progress)
        
        # Save devices to database
        if devices:
            for device in devices:
                await db.devices.update_one(
                    {'id': device['id']},
                    {'$set': device},
                    upsert=True
                )
        
        # Update scan status
        active_scans[scan_id]['status'] = 'completed'
        active_scans[scan_id]['progress'] = 100
        active_scans[scan_id]['total_devices'] = len(devices)
        active_scans[scan_id]['devices'] = devices
        active_scans[scan_id]['completed_at'] = datetime.now(timezone.utc).isoformat()
        
        # Save scan record
        await db.scans.insert_one({
            'scan_id': scan_id,
            'network_range': network_range,
            'total_devices': len(devices),
            'status': 'completed',
            'started_at': active_scans[scan_id]['started_at'],
            'completed_at': active_scans[scan_id]['completed_at']
        })
        
    except Exception as e:
        logging.error(f"Scan failed: {str(e)}")
        active_scans[scan_id]['status'] = 'failed'
        active_scans[scan_id]['error'] = str(e)

@api_router.get("/scan/status/{scan_id}", response_model=ScanStatus)
async def get_scan_status(scan_id: str):
    """Get the status of a running or completed scan"""
    
    if scan_id not in active_scans:
        raise HTTPException(status_code=404, detail="Scan not found")
    
    scan_data = active_scans[scan_id]
    
    return ScanStatus(
        scan_id=scan_id,
        status=scan_data['status'],
        progress=scan_data['progress'],
        total_devices=scan_data['total_devices'],
        message=scan_data.get('error', 'Scan in progress' if scan_data['status'] == 'running' else 'Scan completed')
    )

@api_router.get("/devices", response_model=List[Device])
async def get_devices(scan_id: Optional[str] = None):
    """Get all discovered devices, optionally filtered by scan_id"""
    
    query = {}
    if scan_id:
        query['scan_id'] = scan_id
    
    devices = await db.devices.find(query, {"_id": 0}).sort('ip_address', 1).to_list(1000)
    return devices

@api_router.get("/devices/{device_id}", response_model=Device)
async def get_device(device_id: str):
    """Get details of a specific device"""
    
    device = await db.devices.find_one({'id': device_id}, {"_id": 0})
    
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    return device

@api_router.post("/scan/detailed")
async def start_detailed_scan(request: DetailedScanRequest, background_tasks: BackgroundTasks):
    """Start a detailed scan for a specific device with credentials"""
    
    # Get device from database
    device = await db.devices.find_one({'id': request.device_id}, {"_id": 0})
    
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    # Start detailed scan in background
    background_tasks.add_task(
        perform_detailed_scan,
        device,
        request.credentials.model_dump()
    )
    
    return {
        'message': f'Detailed scan started for {device["ip_address"]}',
        'device_id': request.device_id
    }

async def perform_detailed_scan(device: Dict, credentials: Dict):
    """Background task for detailed device scanning"""
    try:
        # Perform detailed scan
        detailed_info = await scanner.detailed_scan(device, credentials)
        
        # Update device in database
        await db.devices.update_one(
            {'id': device['id']},
            {'$set': detailed_info}
        )
        
    except Exception as e:
        logging.error(f"Detailed scan failed: {str(e)}")
        await db.devices.update_one(
            {'id': device['id']},
            {'$set': {'scan_error': str(e)}}
        )

@api_router.delete("/devices/{device_id}")
async def delete_device(device_id: str):
    """Delete a device from the database"""
    
    result = await db.devices.delete_one({'id': device_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Device not found")
    
    return {'message': 'Device deleted successfully'}

@api_router.get("/scans")
async def get_scan_history():
    """Get scan history"""
    
    scans = await db.scans.find({}, {"_id": 0}).sort('started_at', -1).to_list(100)
    return scans

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Network Scanner API - Ready"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()