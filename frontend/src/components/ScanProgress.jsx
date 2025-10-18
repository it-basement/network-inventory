import React from 'react';
import { Loader2 } from 'lucide-react';

const ScanProgress = ({ progress }) => {
  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6 mb-6">
      <div className="flex items-center space-x-3 mb-3">
        <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
        <h3 className="text-lg font-semibold text-white">Scanning Network...</h3>
      </div>
      
      <div className="relative w-full h-3 bg-slate-700 rounded-full overflow-hidden">
        <div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      <p className="mt-2 text-sm text-slate-400">
        Progress: {progress}%
      </p>
    </div>
  );
};

export default ScanProgress;
