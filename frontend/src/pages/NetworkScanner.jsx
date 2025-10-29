import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Network, RefreshCw, Search, Server, Lock, AlertCircle, CheckCircle, Key } from 'lucide-react';
import ScanForm from '../components/ScanForm';
import DeviceList from '../components/DeviceList';
import DeviceDetail from '../components/DeviceDetail';
import ScanProgress from '../components/ScanProgress';
import BulkCredentials from '../components/BulkCredentials';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const NetworkScanner = () => {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanId, setScanId] = useState(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ total: 0, authenticated: 0, online: 0 });
  const [filter, setFilter] = useState('all');
  const [showBulkCredentials, setShowBulkCredentials] = useState(false);

  // Fetch devices on component mount
  useEffect(() => {
    fetchDevices();
  }, []);

  // Update stats when devices change
  useEffect(() => {
    const total = devices.length;
    const authenticated = devices.filter(d => d.authenticated).length;
    const online = devices.filter(d => d.status === 'up').length;
    setStats({ total, authenticated, online });
  }, [devices]);

  // Poll scan progress
  useEffect(() => {
    if (scanning && scanId) {
      const interval = setInterval(async () => {
        try {
          const response = await axios.get(`${API}/scan/status/${scanId}`);
          const { status, progress, total_devices } = response.data;
          
          setScanProgress(progress);
          
          if (status === 'completed' || status === 'failed') {
            setScanning(false);
            setScanId(null);
            setScanProgress(0);
            fetchDevices();
            clearInterval(interval);
          }
        } catch (error) {
          console.error('Error checking scan status:', error);
        }
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [scanning, scanId]);

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/devices`);
      setDevices(response.data);
    } catch (error) {
      console.error('Error fetching devices:', error);
    } finally {
      setLoading(false);
    }
  };

  const startScan = async (networkRange) => {
    try {
      const response = await axios.post(`${API}/scan/discover`, {
        network_range: networkRange
      });
      
      setScanId(response.data.scan_id);
      setScanning(true);
      setScanProgress(0);
    } catch (error) {
      console.error('Error starting scan:', error);
      alert('Error starting scan: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleDeviceClick = (device) => {
    setSelectedDevice(device);
  };

  const handleCloseDetail = () => {
    setSelectedDevice(null);
  };

  const handleDetailedScan = async (deviceId, credentials) => {
    try {
      await axios.post(`${API}/scan/detailed`, {
        device_id: deviceId,
        credentials
      });
      
      // Wait a bit and refresh the device
      setTimeout(() => {
        fetchDevices();
      }, 5000);
    } catch (error) {
      console.error('Error starting detailed scan:', error);
      throw error;
    }
  };

  const handleDeleteDevice = async (deviceId) => {
    if (!window.confirm('Are you sure you want to delete this device?')) {
      return;
    }
    
    try {
      await axios.delete(`${API}/devices/${deviceId}`);
      fetchDevices();
      setSelectedDevice(null);
    } catch (error) {
      console.error('Error deleting device:', error);
      alert('Error deleting device');
    }
  };

  const handleBulkCredentials = async (credentials, deviceFilter) => {
    try {
      // Filter devices based on selection
      let targetDevices = devices;
      
      if (deviceFilter === 'windows') {
        targetDevices = devices.filter(d => 
          d.os_info?.os_family?.toLowerCase().includes('windows') ||
          d.os_info?.name?.toLowerCase().includes('windows') ||
          d.device_type?.toLowerCase().includes('windows')
        );
      } else if (deviceFilter === 'linux') {
        targetDevices = devices.filter(d => 
          d.os_info?.os_family?.toLowerCase().includes('linux') ||
          d.os_info?.name?.toLowerCase().includes('linux') ||
          d.device_type?.toLowerCase().includes('linux')
        );
      } else if (deviceFilter === 'network') {
        targetDevices = devices.filter(d => 
          d.device_type?.toLowerCase().includes('router') ||
          d.device_type?.toLowerCase().includes('switch') ||
          d.device_type?.toLowerCase().includes('firewall')
        );
      } else if (deviceFilter === 'unauthenticated') {
        targetDevices = devices.filter(d => !d.authenticated);
      }
      
      // Start detailed scan for all target devices
      const scanPromises = targetDevices.map(device => 
        axios.post(`${API}/scan/detailed`, {
          device_id: device.id,
          credentials
        }).catch(err => {
          console.error(`Failed to scan ${device.ip_address}:`, err);
          return null;
        })
      );
      
      await Promise.all(scanPromises);
      
      alert(`Detailed scan started for ${targetDevices.length} device(s). Please wait a few moments and refresh to see results.`);
      
      // Refresh devices after a delay
      setTimeout(() => {
        fetchDevices();
      }, 5000);
      
    } catch (error) {
      console.error('Error starting bulk scans:', error);
      alert('Error starting bulk scans');
    }
  };

  const filteredDevices = Array.isArray(devices) ? devices.filter(device => {
    if (filter === 'all') return true;
    if (filter === 'authenticated') return device.authenticated;
    if (filter === 'unauthenticated') return !device.authenticated;
    if (filter === 'online') return device.status === 'up';
    return true;
  }) : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Network className="w-8 h-8 text-blue-500" />
              <h1 className="text-2xl font-bold text-white">Network Scanner & Inventory</h1>
            </div>
            <button
              onClick={fetchDevices}
              disabled={loading || scanning}
              className="flex items-center space-x-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => setShowBulkCredentials(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Key className="w-4 h-4" />
              <span>Bulk Credentials</span>
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Total Devices</p>
                <p className="text-3xl font-bold text-white mt-2">{stats.total}</p>
              </div>
              <Server className="w-12 h-12 text-blue-500 opacity-20" />
            </div>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Authenticated</p>
                <p className="text-3xl font-bold text-white mt-2">{stats.authenticated}</p>
              </div>
              <Lock className="w-12 h-12 text-green-500 opacity-20" />
            </div>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Online Devices</p>
                <p className="text-3xl font-bold text-white mt-2">{stats.online}</p>
              </div>
              <CheckCircle className="w-12 h-12 text-emerald-500 opacity-20" />
            </div>
          </div>
        </div>

        {/* Scan Form */}
        <div className="mb-8">
          <ScanForm onScan={startScan} scanning={scanning} />
        </div>

        {/* Scan Progress */}
        {scanning && <ScanProgress progress={scanProgress} />}

        {/* Filter Tabs */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 mb-6 p-2">
          <div className="flex space-x-2">
            {[
              { value: 'all', label: 'All Devices' },
              { value: 'online', label: 'Online' },
              { value: 'authenticated', label: 'Authenticated' },
              { value: 'unauthenticated', label: 'Not Authenticated' },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === value
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Device List */}
        <DeviceList
          devices={filteredDevices}
          loading={loading}
          onDeviceClick={handleDeviceClick}
        />
      </div>

      {/* Device Detail Modal */}
      {selectedDevice && (
        <DeviceDetail
          device={selectedDevice}
          onClose={handleCloseDetail}
          onDetailedScan={handleDetailedScan}
          onDelete={handleDeleteDevice}
          onRefresh={fetchDevices}
        />
      )}

      {/* Bulk Credentials Modal */}
      {showBulkCredentials && (
        <BulkCredentials
          devices={devices}
          onClose={() => setShowBulkCredentials(false)}
          onApply={handleBulkCredentials}
        />
      )}
    </div>
  );
};

export default NetworkScanner;
