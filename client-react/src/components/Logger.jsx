import React from 'react';

const LogEntry = ({ timestamp, type, message, data }) => {
  const getTypeColor = () => {
    switch (type) {
      case 'success':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      case 'info':
        return 'text-blue-400';
      default:
        return 'text-white';
    }
  };

  return (
    <div className="font-mono text-sm border-b border-gray-800/50 pb-2">
      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
        <span className="text-gray-500 text-xs">{timestamp}</span>
        <span className={`${getTypeColor()} text-xs px-2 py-0.5 rounded-full bg-gray-800/50 inline-flex items-center`}>
          {type.toUpperCase()}
        </span>
        <span className="text-white">{message}</span>
      </div>
      {data && (
        <pre className="mt-2 p-3 rounded bg-gray-900 text-gray-300 text-xs overflow-x-auto">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
};

const Logger = ({ logs }) => {
  return (
    <div className="bg-gray-950 text-white rounded-lg shadow-xl overflow-hidden">
      <div className="sticky top-0 bg-gray-950 p-4 border-b border-gray-800">
        <h2 className="text-xl font-bold mb-2">Developer Console</h2>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center">
            <span className="w-2 h-2 rounded-full bg-green-500 mr-1"></span>
            <span className="text-xs text-gray-400">Success</span>
          </div>
          <div className="flex items-center">
            <span className="w-2 h-2 rounded-full bg-red-500 mr-1"></span>
            <span className="text-xs text-gray-400">Error</span>
          </div>
          <div className="flex items-center">
            <span className="w-2 h-2 rounded-full bg-blue-500 mr-1"></span>
            <span className="text-xs text-gray-400">Info</span>
          </div>
        </div>
      </div>
      <div className="h-[calc(100vh-20rem)] lg:h-[40rem] overflow-y-auto p-4 space-y-2">
        {logs.length === 0 ? (
          <div className="text-gray-500 text-center py-4">
            No logs yet. Start by registering or logging in.
          </div>
        ) : (
          logs.map((log, index) => (
            <LogEntry key={index} {...log} />
          ))
        )}
      </div>
    </div>
  );
};

export default Logger;
