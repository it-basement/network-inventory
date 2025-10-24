import React, { useState } from 'react';
import { X, Lock, Trash2, Info, HardDrive, Cpu, Activity } from 'lucide-react';

const DeviceDetail = ({ device, onClose, onDetailedScan, onDelete, onRefresh }) => {
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
    auth_type: 'ssh'
  });
  const [scanning, setScanning] = useState(false);

  const handleSubmitAuth = async (e) => {
    e.preventDefault();
    setScanning(true);
    
    try {
      await onDetailedScan(device.id, credentials);
      alert('Detailed scan started. Refreshing in 5 seconds to see results...');
      setShowAuthForm(false);
      setCredentials({ username: '', password: '', auth_type: 'ssh' });
      
      // Auto-refresh after scan
      setTimeout(() => {
        onRefresh();
      }, 5000);
    } catch (error) {
      alert('Error starting detailed scan: ' + (error.response?.data?.detail || error.message));
    } finally {
      setScanning(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div 
        className="bg-slate-800 border border-slate-700 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Device Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
              <Info className="w-5 h-5 text-blue-500" />
              <span>Basic Information</span>
            </h3>
            <div className="bg-slate-900/50 rounded-lg p-4 space-y-3">
              <InfoRow label="Hostname" value={device.hostname || 'Unknown'} />
              <InfoRow label="IP Address" value={device.ip_address} />
              <InfoRow label="MAC Address" value={device.mac_address || 'N/A'} />
              <InfoRow label="Device Type" value={device.device_type} />
              <InfoRow 
                label="Status" 
                value={
                  <span className={`px-2 py-1 rounded text-sm font-medium ${
                    device.status === 'up' 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {device.status === 'up' ? 'Online' : 'Offline'}
                  </span>
                } 
              />
              <InfoRow 
                label="Authenticated" 
                value={
                  <span className={`px-2 py-1 rounded text-sm font-medium ${
                    device.authenticated 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {device.authenticated ? 'Yes' : 'No'}
                  </span>
                } 
              />
              {device.last_scanned && (
                <InfoRow label="Last Scanned" value={new Date(device.last_scanned).toLocaleString()} />
              )}
            </div>
          </div>

          {/* Scan Error Message */}
          {device.scan_error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-red-400 mb-2 flex items-center space-x-2">
                <Info className="w-5 h-5" />
                <span>Authentication Failed</span>
              </h3>
              <p className="text-red-300 text-sm">
                {device.scan_error}
              </p>
              <p className="text-red-400 text-xs mt-2">
                This usually means the credentials were incorrect or the service is not available.
              </p>
            </div>
          )}

          {/* OS Information */}
          {device.os_info && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                <Activity className="w-5 h-5 text-green-500" />
                <span>Operating System</span>
              </h3>
              <div className="bg-slate-900/50 rounded-lg p-4 space-y-3">
                <InfoRow label="OS Name" value={device.os_info.name || 'Unknown'} />
                <InfoRow label="Vendor" value={device.os_info.vendor || 'Unknown'} />
                <InfoRow label="OS Family" value={device.os_info.os_family || 'Unknown'} />
                <InfoRow label="Detection Accuracy" value={`${device.os_info.accuracy || 0}%`} />
              </div>
            </div>
          )}

          {/* Hardware Specs */}
          {device.hardware_specs && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                <Cpu className="w-5 h-5 text-purple-500" />
                <span>Hardware Specifications</span>
              </h3>
              <div className="bg-slate-900/50 rounded-lg p-4 space-y-3">
                {device.hardware_specs.cpu && (
                  <div>
                    <p className="text-sm font-medium text-slate-400 mb-1">CPU</p>
                    <pre className="text-xs text-slate-300 whitespace-pre-wrap bg-slate-800 p-2 rounded">
                      {device.hardware_specs.cpu}
                    </pre>
                  </div>
                )}
                {device.hardware_specs.memory && (
                  <div>
                    <p className="text-sm font-medium text-slate-400 mb-1">Memory</p>
                    <pre className="text-xs text-slate-300 whitespace-pre-wrap bg-slate-800 p-2 rounded">
                      {device.hardware_specs.memory}
                    </pre>
                  </div>
                )}
                {device.hardware_specs.disk && (
                  <div>
                    <p className="text-sm font-medium text-slate-400 mb-1">Disk</p>
                    <pre className="text-xs text-slate-300 whitespace-pre-wrap bg-slate-800 p-2 rounded max-h-40 overflow-y-auto">
                      {device.hardware_specs.disk}
                    </pre>
                  </div>
                )}
                {device.hardware_specs.system_description && (
                  <InfoRow label="System Description" value={device.hardware_specs.system_description} />
                )}
              </div>
            </div>
          )}

          {/* Open Ports */}
          {device.open_ports && device.open_ports.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                <HardDrive className="w-5 h-5 text-orange-500" />
                <span>Open Ports & Services</span>
              </h3>
              <div className="bg-slate-900/50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {device.open_ports.map((port, index) => (
                    <div key={index} className="bg-slate-800 rounded p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-white font-medium">Port {port.port}</span>
                        <span className="text-xs text-green-400">{port.service}</span>
                      </div>
                      {port.product && (
                        <p className="text-sm text-slate-400">
                          {port.product} {port.version}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Authentication Section */}
          {!device.authenticated && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                <Lock className="w-5 h-5 text-yellow-500" />
                <span>Get Detailed Information</span>
              </h3>
              
              {!showAuthForm ? (
                <button
                  onClick={() => setShowAuthForm(true)}
                  className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>Provide Credentials for Detailed Scan</span>
                </button>
              ) : (
                <form onSubmit={handleSubmitAuth} className="bg-slate-900/50 rounded-lg p-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Authentication Type
                    </label>
                    <select
                      value={credentials.auth_type}
                      onChange={(e) => setCredentials({ ...credentials, auth_type: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="ssh">SSH (Linux/Unix)</option>
                      <option value="ad">Active Directory (Windows Domain)</option>
                      <option value="wmi">WMI (Windows Local)</option>
                      <option value="snmp">SNMP (Network Devices)</option>
                    </select>
                    {credentials.auth_type === 'ad' && (
                      <p className="mt-2 text-xs text-slate-400">
                        Use domain credentials: domain\username or username@domain.com
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Username {credentials.auth_type === 'snmp' && '(Community String)'}
                      {credentials.auth_type === 'ad' && '(Domain Account)'}
                    </label>
                    <input
                      type="text"
                      value={credentials.username}
                      onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                      placeholder={
                        credentials.auth_type === 'snmp' 
                          ? 'public' 
                          : credentials.auth_type === 'ad'
                          ? 'domain\\administrator'
                          : 'username'
                      }
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Password
                    </label>
                    <input
                      type="password"
                      value={credentials.password}
                      onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      disabled={scanning}
                      className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {scanning ? 'Scanning...' : 'Start Detailed Scan'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAuthForm(false)}
                      className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="pt-4 border-t border-slate-700">
            <button
              onClick={() => onDelete(device.id)}
              className="w-full px-4 py-3 bg-red-600/20 hover:bg-red-600/30 text-red-400 font-medium rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Device</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const InfoRow = ({ label, value }) => (
  <div className="flex items-center justify-between py-2 border-b border-slate-700 last:border-0">
    <span className="text-sm font-medium text-slate-400">{label}</span>
    <span className="text-sm text-white">{value}</span>
  </div>
);

export default DeviceDetail;
