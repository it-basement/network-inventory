import React, { useState } from 'react';
import { X, Key, Users, Server, Network as NetworkIcon } from 'lucide-react';

const BulkCredentials = ({ devices, onClose, onApply }) => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
    auth_type: 'ssh'
  });
  const [deviceFilter, setDeviceFilter] = useState('all');
  const [applying, setApplying] = useState(false);

  // Calculate how many devices will be affected
  const getAffectedDeviceCount = () => {
    if (deviceFilter === 'all') return devices.length;
    if (deviceFilter === 'unauthenticated') return devices.filter(d => !d.authenticated).length;
    if (deviceFilter === 'windows') {
      return devices.filter(d => 
        d.os_info?.os_family?.toLowerCase().includes('windows') ||
        d.os_info?.name?.toLowerCase().includes('windows') ||
        d.device_type?.toLowerCase().includes('windows')
      ).length;
    }
    if (deviceFilter === 'linux') {
      return devices.filter(d => 
        d.os_info?.os_family?.toLowerCase().includes('linux') ||
        d.os_info?.name?.toLowerCase().includes('linux') ||
        d.device_type?.toLowerCase().includes('linux')
      ).length;
    }
    if (deviceFilter === 'network') {
      return devices.filter(d => 
        d.device_type?.toLowerCase().includes('router') ||
        d.device_type?.toLowerCase().includes('switch') ||
        d.device_type?.toLowerCase().includes('firewall')
      ).length;
    }
    return 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const affectedCount = getAffectedDeviceCount();
    if (affectedCount === 0) {
      alert('No devices match the selected filter.');
      return;
    }
    
    if (!window.confirm(`Apply these credentials to ${affectedCount} device(s)?`)) {
      return;
    }
    
    setApplying(true);
    try {
      await onApply(credentials, deviceFilter);
      onClose();
    } catch (error) {
      alert('Error applying credentials: ' + error.message);
    } finally {
      setApplying(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div 
        className="bg-slate-800 border border-slate-700 rounded-xl max-w-2xl w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Key className="w-6 h-6 text-blue-500" />
            <h2 className="text-2xl font-bold text-white">Bulk Credentials</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-slate-300 mb-6">
            Apply the same credentials to multiple devices at once. Perfect for domain environments or network devices with shared credentials.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Device Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Apply To
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDeviceFilter('all')}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    deviceFilter === 'all'
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-slate-600 hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Server className="w-5 h-5 text-blue-400" />
                    <div>
                      <p className="text-white font-medium">All Devices</p>
                      <p className="text-sm text-slate-400">{devices.length} devices</p>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setDeviceFilter('unauthenticated')}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    deviceFilter === 'unauthenticated'
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-slate-600 hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Key className="w-5 h-5 text-yellow-400" />
                    <div>
                      <p className="text-white font-medium">Not Authenticated</p>
                      <p className="text-sm text-slate-400">
                        {devices.filter(d => !d.authenticated).length} devices
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setDeviceFilter('windows')}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    deviceFilter === 'windows'
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-slate-600 hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Users className="w-5 h-5 text-green-400" />
                    <div>
                      <p className="text-white font-medium">Windows Devices</p>
                      <p className="text-sm text-slate-400">
                        {devices.filter(d => 
                          d.os_info?.os_family?.toLowerCase().includes('windows') ||
                          d.os_info?.name?.toLowerCase().includes('windows')
                        ).length} devices
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setDeviceFilter('linux')}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    deviceFilter === 'linux'
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-slate-600 hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Server className="w-5 h-5 text-orange-400" />
                    <div>
                      <p className="text-white font-medium">Linux Devices</p>
                      <p className="text-sm text-slate-400">
                        {devices.filter(d => 
                          d.os_info?.os_family?.toLowerCase().includes('linux') ||
                          d.os_info?.name?.toLowerCase().includes('linux')
                        ).length} devices
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setDeviceFilter('network')}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    deviceFilter === 'network'
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-slate-600 hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <NetworkIcon className="w-5 h-5 text-purple-400" />
                    <div>
                      <p className="text-white font-medium">Network Devices</p>
                      <p className="text-sm text-slate-400">
                        {devices.filter(d => 
                          d.device_type?.toLowerCase().includes('router') ||
                          d.device_type?.toLowerCase().includes('switch') ||
                          d.device_type?.toLowerCase().includes('firewall')
                        ).length} devices
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Authentication Type */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Authentication Type
              </label>
              <select
                value={credentials.auth_type}
                onChange={(e) => setCredentials({ ...credentials, auth_type: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ssh">SSH (Linux/Unix)</option>
                <option value="ad">Active Directory (Windows Domain)</option>
                <option value="wmi">WMI (Windows Local)</option>
                <option value="snmp">SNMP (Network Devices)</option>
              </select>
              {credentials.auth_type === 'ad' && (
                <p className="mt-2 text-sm text-slate-400">
                  Use domain admin credentials (e.g., domain\username or username@domain.com)
                </p>
              )}
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Username {credentials.auth_type === 'snmp' && '(Community String)'}
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
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <input
                type="password"
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                placeholder="••••••••"
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Summary */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <p className="text-blue-300 text-sm">
                <strong>Ready to scan:</strong> {getAffectedDeviceCount()} device(s) will be scanned with these credentials.
              </p>
            </div>

            {/* Actions */}
            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={applying}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {applying ? 'Applying...' : 'Apply Credentials & Scan'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BulkCredentials;
