import axios from 'axios';
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';

const API_URL = 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Utility to add logging to functions that don't have direct logger access
let globalLoggerCallback = null;
export const setLoggerCallback = (callback) => {
  globalLoggerCallback = callback;
};

const log = (type, message, data) => {
  if (globalLoggerCallback) {
    globalLoggerCallback(type, message, data);
  }
};

export const register = async (username) => {
  try {
    log('info', 'Starting WebAuthn registration', { username });
    
    // Get registration options from the server
    const { data: options } = await api.post('/auth/register/start', { username });
    log('info', 'Received registration options', {
      challenge: options.challenge,
      rp: { name: options.rp.name, id: options.rp.id },
      user: { name: options.user.name, id: options.user.id },
      authenticatorSelection: options.authenticatorSelection,
      timestamp: new Date().toISOString()
    });
    
    // Pass options to SimpleWebAuthn browser library
    log('info', 'Creating credentials with authenticator');
    const attResp = await startRegistration(options);
    log('info', 'Credentials created successfully', {
      id: attResp.id,
      type: attResp.type,
      authenticatorData: attResp.response.authenticatorData,
      transports: attResp.response.transports,
      timestamp: new Date().toISOString()
    });
    
    // Send response to server for verification
    const { data } = await api.post('/auth/register/complete', {
      username,
      response: attResp,
    });
    
    log('success', 'Registration completed successfully', {
      verified: data.verified,
      timestamp: new Date().toISOString()
    });
    
    return data;
  } catch (error) {
    log('error', 'Registration failed', {
      error: error.message,
      details: error.response?.data,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
};

export const login = async (username) => {
  try {
    log('info', 'Starting WebAuthn authentication', { username });
    
    // Get authentication options from the server
    const { data: options } = await api.post('/auth/login/start', { username });
    log('info', 'Received authentication options', {
      challenge: options.challenge,
      allowCredentials: options.allowCredentials?.map(cred => ({
        id: cred.id,
        type: cred.type,
        transports: cred.transports
      })),
      timeout: options.timeout,
      userVerification: options.userVerification,
      timestamp: new Date().toISOString()
    });
    
    // Pass options to SimpleWebAuthn browser library
    log('info', 'Verifying credentials with authenticator');
    const attResp = await startAuthentication(options);
    log('info', 'Authenticator verified credentials', {
      id: attResp.id,
      type: attResp.type,
      authenticatorData: attResp.response.authenticatorData,
      clientDataJSON: attResp.response.clientDataJSON,
      timestamp: new Date().toISOString()
    });
    
    // Send response to server for verification
    const { data } = await api.post('/auth/login/complete', {
      username,
      response: attResp,
    });
    
    log('success', 'Authentication completed successfully', {
      verified: data.verified,
      user: data.user,
      timestamp: new Date().toISOString()
    });
    
    return data;
  } catch (error) {
    log('error', 'Authentication failed', {
      error: error.message,
      details: error.response?.data,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
};
