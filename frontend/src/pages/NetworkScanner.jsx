import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import axios from 'axios';
import {
  Network, RefreshCw, Server, Lock, CheckCircle, Key, Loader2, AlertCircle
} from 'lucide-react';
import ScanForm from '../components/ScanForm';
import DeviceList from '../components/DeviceList';
import DeviceDetail from '../components/DeviceDetail';
import ScanProgress from '../components/ScanProgress';
import BulkCredentials from '../components/BulkCredentials';

// Safe backend URL with fallback
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
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

  // Refs for cleanup
  const abortControllerRef = useRef(null);
  const pollIntervalRef = useRef(null);

  // ALWAYS safe array – used everywhere
  const safeDevices = Array.isArray(devices) ? devices : [];

  // === STATS: 100% safe from non-array ===
  useEffect(() => {
    const total = safeDevices.length;
    const authenticated = safeDevices.filter(d => d.authenticated).length;
    const online = safeDevices.filter(d => d.status === 'up').length;
    setStats({ total, authenticated, online });
  }, [safeDevices]);

  // === Cleanup on unmount ===
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  // === Poll scan progress ===
  useEffect(() => {
    if (!scanning || !scanId) {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      return;
    }

    pollIntervalRef.current = setInterval(async () => {
      if (!abortControllerRef.current) return;

      try {
        const { data } = await axios.get(`${API}/scan/status/${scanId}`, {
          signal: abortControllerRef.current.signal
        });

        setScanProgress(data.progress ?? 0);

        if (data.status === 'completed' || data.status === 'failed') {
          setScanning(false);
          setScanId(null);
          setScanProgress(0);
          await fetchDevices();
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
        }
      } catch (error) {
        if (axios.isCancel(error)) return;
        console.error('Scan status poll error:', error);
      }
    }, 2000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [scanning, scanId]);

  // === Fetch devices – always returns array ===
  const fetchDevices = useCallback(async () => {
    setLoading(true);
    abortControllerRef.current = new AbortController();

    try {
      const { data } = await axios.get(`${API}/devices`, {
        signal: abortControllerRef.current.signal,
      });
      setDevices(Array.isArray(data) ? data : []);
    } catch (error) {
      if (axios.isCancel(error)) return;
      console.error('Failed to fetch devices:', error);
      setDevices([]); // Always safe
    } finally {
      setLoading(false);
    }
  }, []);

  // === Start network scan ===
  const startScan = async (networkRange) => {
    if (!networkRange?.trim()) {
      alert('Please enter a valid network range (e.g., 192.168.1.0/24)');
      return;
    }

    abortControllerRef.current = new AbortController();

    try {
      const { data } = await axios.post(
        `${API}/scan/discover`,
        { network_range: networkRange },
        { signal: abortControllerRef.current.signal }
      );

      setScanId(data.scan_id);
      setScanning(true);
      setScanProgress(0);
    } catch (error) {
      if (axios.isCancel(error)) return;
      const msg = error.response?.data?.detail || error.message;
      alert(`Scan failed: ${msg}`);
    }
  };

  const handleDeviceClick = (device) => setSelectedDevice(device);
  const handleCloseDetail = () => setSelectedDevice(null);

  // === Detailed scan with polling ===
  const handleDetailedScan = async (deviceId, credentials) => {
    const controller = new AbortController();
    try {
      await axios.post(
        `${API}/scan/detailed`,
        { device_id: deviceId, credentials },
        { signal: controller.signal }
      );

      let attempts = 0;
      const maxAttempts = 15;
      const poll = setInterval(async () => {
        if (attempts++ >= maxAttempts) {
          clearInterval(poll);
          fetchDevices();
          return;
        }
        await fetchDevices();
        const dev = safeDevices.find(d => d.id === deviceId);
        if (dev?.last_scan_status === 'completed') {
          clearInterval(poll);
          fetchDevices();
        }
      }, 3000);
    } catch (error) {
      if (axios.isCancel(error)) return;
      throw error;
    }
  };

  // === Delete device ===
  const handleDeleteDevice = async (deviceId) => {
    if (!window.confirm('Delete this device permanently?')) return;

    const controller = new AbortController();
    try {
      await axios.delete(`${API}/devices/${deviceId}`, { signal: controller.signal });
      await fetchDevices();
      setSelectedDevice(null);
    } catch (error) {
      if (axios.isCancel(error)) return;
      alert('Failed to delete device');
    }
  };

  // === Bulk credentials ===
  const handleBulkCredentials = async (credentials, deviceFilter) => {
    if (!credentials || Object.keys(credentials).length === 0) {
      alert('Please provide credentials');
      return;
    }

    let targetDevices = safeDevices;

    if (deviceFilter === 'windows') {
      targetDevices = safeDevices.filter(d =>
        /windows/i.test(d.os_info?.os_family || d.os_info?.name || d.device_type || '')
      );
    } else if (deviceFilter === 'linux') {
      targetDevices = safeDevices.filter(d =>
        /linux/i.test(d.os_info?.os_family || d.os_info?.name || d.device_type || '')
      );
    } else if (deviceFilter === 'network') {
      targetDevices = safeDevices.filter(d =>
        /router|switch|firewall/i.test(d.device_type || '')
      );
    } else if (deviceFilter === 'unauthenticated') {
      targetDevices = safeDevices.filter(d => !d.authenticated);
    }

    if (targetDevices.length === 0) {
      alert('No devices match the selected filter.');
      return;
    }

    if (!window.confirm(`Start detailed scan on ${targetDevices.length} device(s)?`)) return;

    const results = { success: 0, failed: 0 };
    const controller = new AbortController();

    const promises = targetDevices.map(async (device) => {
      try {
        await axios.post(
          `${API}/scan/detailed`,
          { device_id: device.id, credentials },
          { signal: controller.signal }
        );
        results.success++;
      } catch (error) {
        if (!axios.isCancel(error)) {
          console.error(`Scan failed for ${device.ip_address}:`, error);
          results.failed++;
        }
      }
    });

    await Promise.allSettled(promises);

    alert(
      `Bulk scan complete!\nSuccess: ${results.success}\nFailed: ${results.failed}\nRefresh in a few seconds to see results.`
    );

    setTimeout(fetchDevices, 5000);
  };

  // === Filtered devices (safe) ===
  const filteredDevices = useMemo(() => {
    return safeDevices.filter(device => {
      if (filter === 'all') return true;
      if (filter === 'authenticated') return device.authenticated;
      if (filter === 'unauthenticated') return !device.authenticated;
      if (filter === 'online') return device.status === 'up';
      return true;
    });
  }, [safeDevices, filter]);

  // === Loading skeleton ===
  const StatsSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700 animate-pulse"
        >
          <div className="h-5 w-32 bg-slate-700 rounded mb-3"></div>
          <div className="h-10 w-20 bg-slate-600 rounded"></div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center space-x-3">
              <Network className="w-8 h-8 text-blue-500" />
              <h1 className="text-2xl font-bold text-white">Network Scanner & Inventory</h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchDevices}
                disabled={loading || scanning}
                aria-label="Refresh device list"
                className="flex items-center space-x-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
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
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Stats */}
        {loading ? <StatsSkeleton /> : (
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
                  <p className="text-3xl font-bold text-green-400 mt-2">{stats.authenticated}</p>
                </div>
                <Lock className="w-12 h-12 text-green-500 opacity-20" />
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium">Online Now</p>
                  <p className="text-3xl font-bold text-emerald-400 mt-2">{stats.online}</p>
                </div>
                <CheckCircle className="w-12 h-12 text-emerald-500 opacity-20" />
              </div>
            </div>
          </div>
        )}

        {/* Scan Form */}
        <div className="mb-8">
          <ScanForm onScan={startScan} scanning={scanning} />
        </div>

        {/* Scan Progress */}
        {scanning && <ScanProgress progress={scanProgress} />}

        {/* Filter Tabs */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 mb-6 p-2">
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'all', label: 'All Devices' },
              { value: 'online', label: 'Online' },
              { value: 'authenticated', label: 'Authenticated' },
              { value: 'unauthenticated', label: 'Not Authenticated' },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
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
        {safeDevices.length === 0 && !loading ? (
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 mx-auto text-slate-500 mb-4" />
            <p className="text-slate-400">No devices found. Start a scan to discover your network.</p>
          </div>
        ) : (
          <DeviceList
            devices={filteredDevices}
            loading={loading}
            onDeviceClick={handleDeviceClick}
          />
        )}
      </div>

      {/* Modals */}
      {selectedDevice && (
        <DeviceDetail
          device={selectedDevice}
          onClose={handleCloseDetail}
          onDetailedScan={handleDetailedScan}
          onDelete={handleDeleteDevice}
          onRefresh={fetchDevices}
        />
      )}

      {showBulkCredentials && (
        <BulkCredentials
          devices={safeDevices}
          onClose={() => setShowBulkCredentials(false)}
          onApply={handleBulkCredentials}
        />
      )}
    </div>
  );
};

export default NetworkScanner;
