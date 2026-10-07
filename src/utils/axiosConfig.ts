import axios from 'axios';

// Add a request interceptor
axios.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const user = localStorage.getItem('user');
    
    if (user) {
      const { token } = JSON.parse(user);
      
      // If token exists, add it to the headers
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor
axios.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized errors
    if (error.response && error.response.status === 401) {
      const message = String(error.response.data?.message || '').toLowerCase();
      const isTokenFailure = 
        message.includes('token') || 
        message.includes('jwt') || 
        message.includes('expired') ||
        message.includes('user not found') ||
        message.includes('not authorized') ||
        error.config?.url?.includes('/api/auth/me');

      // Only wipe session and redirect to login if the auth token itself is expired/invalid
      if (isTokenFailure) {
        localStorage.removeItem('user');
        if (!window.location.pathname.includes('/auth/login')) {
          window.location.href = '/auth/login';
        }
      }
    }
    
    return Promise.reject(error);
  }
);