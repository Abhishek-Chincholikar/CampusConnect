// Dynamic Runtime Environment Base URL Resolver
const getProductionBackendDomain = () => {
  const host = window.location.hostname;
  
  // If previewing locally on your laptop, use development port pathways
  if (host === 'localhost' || host === '127.0.0.1' || host.startsWith('192.168.')) {
    return 'http://localhost:5000/api';
  }
  
  // ONLINE DEPLOYED ENVIRONMENT:
  // Converts your frontend URL (e.g., https://campusconnect-client.onrender.com)
  // to your real online live backend url stream directly.
  // Replace the string below with your absolute Render backend live URL if known!
  return window.location.origin.replace('-frontend', '-backend').replace('client', 'server') + '/api';
};

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || getProductionBackendDomain();