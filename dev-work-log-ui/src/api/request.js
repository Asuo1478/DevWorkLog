import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || '/api/v1';

const request = axios.create({
  baseURL,
  timeout: 10000,
});

// Request interceptor for auth token
request.interceptors.request.use(
  (config) => {
    const auth = JSON.parse(localStorage.getItem('auth') || '{}');
    if (auth.token) {
      config.headers['Authorization'] = `Bearer ${auth.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
request.interceptors.response.use(
  (response) => {
    const res = response.data;
    if (res.code !== 200) {
      // Handle errors globally
      console.error('API Error:', res.msg);
      return Promise.reject(new Error(res.msg || 'Error'));
    }
    return res;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

export default request;
