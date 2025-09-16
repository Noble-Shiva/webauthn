import React, { useState, useEffect } from 'react';
import { register, setLoggerCallback } from '../api/auth';
import { useLogger } from '../context/LoggerContext';

const Register = () => {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const { addLog } = useLogger();

  useEffect(() => {
    // Set up the logger callback for the auth module
    setLoggerCallback((type, message, data) => addLog(type, message, data));
    return () => setLoggerCallback(null);
  }, [addLog]);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!username) {
      setMessage({ text: 'Please enter a username', type: 'error' });
      addLog('error', 'Registration failed - Empty username');
      return;
    }

    try {
      setLoading(true);
      addLog('info', 'Starting registration process', { username });
      await register(username);
      setMessage({ text: 'Registration successful!', type: 'success' });
      addLog('success', 'Registration completed successfully', { username });
      setUsername('');
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Registration failed';
      setMessage({ text: errorMessage, type: 'error' });
      addLog('error', 'Registration failed', { 
        error: errorMessage,
        details: error.response?.data
      });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold mb-2 text-gray-800">
            Create Account
          </h2>
          <p className="text-gray-600">
            Register with your biometric authenticator
          </p>
        </div>

        <form onSubmit={handleRegister}>
          {message.text && (
            <div className={`p-4 mb-6 rounded-lg border ${
              message.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-700'
                : 'bg-green-50 border-green-200 text-green-700'
            } flex items-center`}>
              <span className={`mr-2 text-xl ${
                message.type === 'error' ? '🚫' : '✅'
              }`}>
              </span>
              {message.text}
            </div>
          )}

          <div className="mb-6">
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              id="username"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-all duration-300 ${
              loading
                ? 'bg-blue-300 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600 shadow-md hover:shadow-lg'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Registering...
              </span>
            ) : (
              'Register with WebAuthn'
            )}
          </button>

          <div className="mt-6 text-center">
            <div className="flex items-center justify-center space-x-2 text-gray-500">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm">
                Passwordless Authentication
              </span>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
