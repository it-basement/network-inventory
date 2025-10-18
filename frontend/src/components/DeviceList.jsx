import React from 'react';
import { Monitor, Server, Wifi, Printer, Camera, HardDrive, Activity } from 'lucide-react';

const getDeviceIcon = (deviceType) => {
  const type = deviceType.toLowerCase();
  if (type.includes('router') || type.includes('gateway')) return Wifi;
  if (type.includes('server')) return Server;
  if (type.includes('printer')) return Printer;
  if (type.includes('camera')) return Camera;
  if (type.includes('switch')) return HardDrive;
  return Monitor;
};

const DeviceCard = ({ device, onClick }) => {
  const Icon = getDeviceIcon(device.device_type);
  
  return (
    <div
      onClick={() => onClick(device)}
      className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-5 hover:border-blue-500 transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-slate-700 rounded-lg group-hover:bg-blue-600 transition-colors">
            <Icon className="w-5 h-5 text-slate-300 group-hover:text-white" />
          </div>
          <div>
            <h3 className="text-white font-semibold">{device.hostname || 'Unknown'}</h3>
            <p className="text-sm text-slate-400">{device.ip_address}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {device.status === 'up' ? (
            <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-medium rounded">
              Online
            </span>
          ) : (
            <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs font-medium rounded">
              Offline
            </span>
          )}
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">Device Type:</span>
          <span className="text-slate-300">{device.device_type}</span>
        </div>
        
        {device.mac_address && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">MAC Address:</span>
            <span className="text-slate-300 font-mono text-xs">{device.mac_address}</span>
          </div>
        )}
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">Status:</span>
          <span className={`flex items-center space-x-1 ${
            device.authenticated ? 'text-green-400' : 'text-yellow-400'
          }`}>
            <Activity className="w-3 h-3" />
            <span>{device.authenticated ? 'Authenticated' : 'Basic Scan'}</span>
          </span>
        </div>
      </div>
    </div>
  );
};

const DeviceList = ({ devices, loading, onDeviceClick }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (devices.length === 0) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-12 text-center">
        <Server className="w-16 h-16 text-slate-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">No Devices Found</h3>
        <p className="text-slate-400">Start a network scan to discover devices on your network</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {devices.map((device) => (
        <DeviceCard key={device.id} device={device} onClick={onDeviceClick} />
      ))}
    </div>
  );
};

export default DeviceList;
