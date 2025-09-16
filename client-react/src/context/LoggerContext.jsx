import React, { createContext, useContext, useState, useCallback } from 'react';

const LoggerContext = createContext();

export const LoggerProvider = ({ children }) => {
  const [logs, setLogs] = useState([]);

  const addLog = useCallback((type, message, data = null) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { timestamp, type, message, data }]);
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return (
    <LoggerContext.Provider value={{ logs, addLog, clearLogs }}>
      {children}
    </LoggerContext.Provider>
  );
};

export const useLogger = () => {
  const context = useContext(LoggerContext);
  if (!context) {
    throw new Error('useLogger must be used within a LoggerProvider');
  }
  return context;
};
