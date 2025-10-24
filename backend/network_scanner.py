import nmap
import asyncio
import logging
from typing import List, Dict, Optional
import socket
import subprocess
import re
from datetime import datetime, timezone
import uuid

logger = logging.getLogger(__name__)


class NetworkScanner:
    """Network scanning utility for device discovery and inventory"""
    
    def __init__(self):
        self.nm = nmap.PortScanner()
    
    async def discover_network(self, network_range: str, scan_id: str, progress_callback=None) -> List[Dict]:
        """
        Perform initial network discovery without authentication.
        Returns list of discovered devices with basic info.
        
        Args:
            network_range: CIDR notation (e.g., "192.168.1.0/24")
            scan_id: Unique identifier for this scan
            progress_callback: Optional callback for progress updates
        """
        devices = []
        
        try:
            logger.info(f"Starting network scan for {network_range}")
            
            # Perform host discovery scan
            # -sn: Ping scan (no port scan)
            # -T4: Aggressive timing
            # --min-rate: Minimum packet rate
            self.nm.scan(hosts=network_range, arguments='-sn -T4 --min-rate 100')
            
            total_hosts = len(self.nm.all_hosts())
            processed = 0
            
            for host in self.nm.all_hosts():
                try:
                    device_info = {
                        'id': str(uuid.uuid4()),
                        'scan_id': scan_id,
                        'ip_address': host,
                        'mac_address': None,
                        'hostname': None,
                        'device_type': 'Unknown',
                        'os_info': None,
                        'hardware_specs': None,
                        'status': 'up' if self.nm[host].state() == 'up' else 'down',
                        'discovered_at': datetime.now(timezone.utc).isoformat(),
                        'authenticated': False,
                        'open_ports': [],
                    }
                    
                    # Get hostname
                    try:
                        device_info['hostname'] = self.nm[host].hostname()
                        if not device_info['hostname']:
                            # Try reverse DNS lookup
                            device_info['hostname'] = socket.gethostbyaddr(host)[0]
                    except Exception:
                        device_info['hostname'] = 'Unknown'
                    
                    # Get MAC address if available
                    if 'addresses' in self.nm[host]:
                        if 'mac' in self.nm[host]['addresses']:
                            device_info['mac_address'] = self.nm[host]['addresses']['mac']
                    
                    # Try to get MAC from ARP (Linux)
                    if not device_info['mac_address']:
                        device_info['mac_address'] = await self._get_mac_address(host)
                    
                    # Basic device type detection
                    device_info['device_type'] = self._detect_device_type(device_info)
                    
                    devices.append(device_info)
                    processed += 1
                    
                    if progress_callback:
                        progress = int((processed / total_hosts) * 100)
                        await progress_callback(progress)
                    
                except Exception as e:
                    logger.error(f"Error processing host {host}: {str(e)}")
            
            logger.info(f"Network scan completed. Found {len(devices)} devices")
            
        except Exception as e:
            logger.error(f"Network scan failed: {str(e)}")
            raise
        
        return devices
    
    async def detailed_scan(self, device: Dict, credentials: Optional[Dict] = None) -> Dict:
        """
        Perform detailed scan on a specific device with authentication.
        
        Args:
            device: Device information dictionary
            credentials: Optional authentication credentials
                {
                    'username': str,
                    'password': str,
                    'auth_type': 'ssh' | 'snmp' | 'wmi'
                }
        """
        ip_address = device['ip_address']
        detailed_info = device.copy()
        
        try:
            logger.info(f"Starting detailed scan for {ip_address}")
            
            # Perform OS detection and service scan
            # -O: OS detection
            # -sV: Version detection
            # --top-ports: Scan most common ports
            self.nm.scan(
                hosts=ip_address,
                arguments='-O -sV --top-ports 100 -T4',
                sudo=True
            )
            
            if ip_address in self.nm.all_hosts():
                host_data = self.nm[ip_address]
                
                # Get OS information
                if 'osmatch' in host_data:
                    os_matches = host_data['osmatch']
                    if os_matches:
                        detailed_info['os_info'] = {
                            'name': os_matches[0].get('name', 'Unknown'),
                            'accuracy': os_matches[0].get('accuracy', 0),
                            'type': os_matches[0].get('osclass', [{}])[0].get('type', 'Unknown'),
                            'vendor': os_matches[0].get('osclass', [{}])[0].get('vendor', 'Unknown'),
                            'os_family': os_matches[0].get('osclass', [{}])[0].get('osfamily', 'Unknown'),
                        }
                
                # Get open ports and services
                open_ports = []
                if 'tcp' in host_data:
                    for port, port_info in host_data['tcp'].items():
                        if port_info['state'] == 'open':
                            open_ports.append({
                                'port': port,
                                'service': port_info.get('name', 'unknown'),
                                'product': port_info.get('product', ''),
                                'version': port_info.get('version', ''),
                            })
                
                detailed_info['open_ports'] = open_ports
                
                # Update device type based on services
                detailed_info['device_type'] = self._detect_device_type_advanced(detailed_info)
            
            # If credentials provided, attempt authenticated scan
            if credentials:
                auth_info = await self._authenticated_scan(ip_address, credentials)
                if auth_info:
                    detailed_info.update(auth_info)
                    detailed_info['authenticated'] = True
            
            detailed_info['last_scanned'] = datetime.now(timezone.utc).isoformat()
            
        except Exception as e:
            logger.error(f"Detailed scan failed for {ip_address}: {str(e)}")
            detailed_info['scan_error'] = str(e)
        
        return detailed_info
    
    async def _get_mac_address(self, ip_address: str) -> Optional[str]:
        """Get MAC address using ARP"""
        try:
            # Use arp command
            result = subprocess.run(
                ['arp', '-n', ip_address],
                capture_output=True,
                text=True,
                timeout=5
            )
            
            if result.returncode == 0:
                # Parse MAC address from output
                match = re.search(r'([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})', result.stdout)
                if match:
                    return match.group(0)
        except Exception as e:
            logger.debug(f"Could not get MAC for {ip_address}: {str(e)}")
        
        return None
    
    def _detect_device_type(self, device_info: Dict) -> str:
        """Basic device type detection based on hostname and MAC"""
        hostname = device_info.get('hostname', '').lower()
        mac = device_info.get('mac_address', '')
        
        # Check hostname patterns
        if any(x in hostname for x in ['router', 'gateway', 'rt-', 'gw-']):
            return 'Router'
        elif any(x in hostname for x in ['switch', 'sw-']):
            return 'Switch'
        elif any(x in hostname for x in ['ap-', 'access-point', 'wifi']):
            return 'Access Point'
        elif any(x in hostname for x in ['server', 'srv-']):
            return 'Server'
        elif any(x in hostname for x in ['printer', 'print']):
            return 'Printer'
        elif any(x in hostname for x in ['camera', 'cam-', 'ipcam']):
            return 'IP Camera'
        
        # MAC address vendor lookup could be added here
        
        return 'Unknown Device'
    
    def _detect_device_type_advanced(self, device_info: Dict) -> str:
        """Advanced device type detection based on services and OS"""
        os_info = device_info.get('os_info', {})
        open_ports = device_info.get('open_ports', [])
        
        os_type = os_info.get('type', '').lower() if os_info else ''
        
        # Check OS type
        if 'router' in os_type or 'firewall' in os_type:
            return 'Router/Firewall'
        elif 'switch' in os_type:
            return 'Switch'
        elif 'access point' in os_type or 'wireless' in os_type:
            return 'Access Point'
        
        # Check services
        services = [p.get('service', '') for p in open_ports]
        
        if 'http' in services or 'https' in services:
            if any(s in services for s in ['ssh', 'telnet']):
                if 'printer' in services or 'ipp' in services:
                    return 'Network Printer'
                return 'Server'
        
        if 'smb' in services or 'microsoft-ds' in services:
            return 'Windows Computer'
        
        if 'ssh' in services and 'http' not in services:
            return 'Linux Server/Device'
        
        if 'rtsp' in services:
            return 'IP Camera'
        
        # Fallback to basic detection
        return self._detect_device_type(device_info)
    
    async def _authenticated_scan(self, ip_address: str, credentials: Dict) -> Optional[Dict]:
        """Perform authenticated scan to get hardware specs"""
        auth_type = credentials.get('auth_type', 'ssh')
        username = credentials.get('username')
        password = credentials.get('password')
        
        try:
            if auth_type == 'ssh':
                return await self._ssh_scan(ip_address, username, password)
            elif auth_type == 'snmp':
                return await self._snmp_scan(ip_address, credentials.get('community', username))
            elif auth_type in ['wmi', 'ad']:
                # WMI and AD use similar authentication
                return await self._wmi_scan(ip_address, username, password)
        except Exception as e:
            logger.error(f"Authenticated scan failed for {ip_address}: {str(e)}")
        
        return None
    
    async def _ssh_scan(self, ip_address: str, username: str, password: str) -> Optional[Dict]:
        """Get hardware info via SSH"""
        try:
            import paramiko
            
            client = paramiko.SSHClient()
            client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
            
            # Connect with timeout
            client.connect(
                ip_address,
                username=username,
                password=password,
                timeout=10,
                allow_agent=False,
                look_for_keys=False
            )
            
            hardware_info = {}
            
            # Get CPU info
            stdin, stdout, stderr = client.exec_command('lscpu 2>/dev/null || cat /proc/cpuinfo | head -20')
            cpu_output = stdout.read().decode('utf-8', errors='ignore')
            if cpu_output:
                hardware_info['cpu'] = cpu_output[:500]  # Limit size
            
            # Get memory info
            stdin, stdout, stderr = client.exec_command('free -h 2>/dev/null || cat /proc/meminfo | head -5')
            mem_output = stdout.read().decode('utf-8', errors='ignore')
            if mem_output:
                hardware_info['memory'] = mem_output[:500]
            
            # Get disk info
            stdin, stdout, stderr = client.exec_command('df -h 2>/dev/null')
            disk_output = stdout.read().decode('utf-8', errors='ignore')
            if disk_output:
                hardware_info['disk'] = disk_output[:1000]
            
            # Get OS release
            stdin, stdout, stderr = client.exec_command('cat /etc/os-release 2>/dev/null || uname -a')
            os_output = stdout.read().decode('utf-8', errors='ignore')
            if os_output:
                hardware_info['os_release'] = os_output[:500]
            
            client.close()
            
            return {'hardware_specs': hardware_info}
            
        except Exception as e:
            logger.error(f"SSH scan failed for {ip_address}: {str(e)}")
            return None
    
    async def _snmp_scan(self, ip_address: str, community: str) -> Optional[Dict]:
        """Get device info via SNMP"""
        try:
            from pysnmp.hlapi.v3arch.asyncio import getCmd, SnmpEngine, CommunityData, UdpTransportTarget, ContextData, ObjectType, ObjectIdentity
            
            hardware_info = {}
            
            # System description OID
            snmpEngine = SnmpEngine()
            
            # Get system description
            errorIndication, errorStatus, errorIndex, varBinds = await getCmd(
                snmpEngine,
                CommunityData(community),
                UdpTransportTarget((ip_address, 161), timeout=5, retries=1),
                ContextData(),
                ObjectType(ObjectIdentity('SNMPv2-MIB', 'sysDescr', 0))
            )
            
            if not errorIndication and not errorStatus:
                for varBind in varBinds:
                    hardware_info['system_description'] = str(varBind[1])
            
            return {'hardware_specs': hardware_info}
            
        except Exception as e:
            logger.error(f"SNMP scan failed for {ip_address}: {str(e)}")
            return None


# Utility function to validate network range
def validate_network_range(network_range: str) -> bool:
    """Validate if network range is in valid CIDR notation"""
    try:
        import ipaddress
        ipaddress.ip_network(network_range, strict=False)
        return True
    except ValueError:
        return False
