import React, { useState } from 'react';
import { Search, Wifi } from 'lucide-react';

const ScanForm = ({ onScan, scanning }) => {
  const [networkRange, setNetworkRange] = useState('192.168.1.0/24');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (networkRange.trim()) {
      onScan(networkRange.trim());
    }
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Wifi className="w-5 h-5 text-blue-500" />
        <h2 className="text-xl font-semibold text-white">Network Discovery Scan</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="networkRange" className="block text-sm font-medium text-slate-300 mb-2">
            Network Range (CIDR Notation)
          </label>
          <div className="flex space-x-3">
            <input
              type="text"
              id="networkRange"
              value={networkRange}
              onChange={(e) => setNetworkRange(e.target.value)}
              placeholder="e.g., 192.168.1.0/24"
              disabled={scanning}
              className="flex-1 px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              type="submit"
              disabled={scanning || !networkRange.trim()}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Search className="w-5 h-5" />
              <span>{scanning ? 'Scanning...' : 'Start Scan'}</span>
            </button>
          </div>
          <p className="mt-2 text-sm text-slate-400">
            Example: 192.168.1.0/24 (scans 192.168.1.1 to 192.168.1.254)
          </p>
        </div>
      </form>
    </div>
  );
};

export default ScanForm;
