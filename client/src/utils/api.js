import axios from 'axios';

// Use relative routes in production (Vercel rewrites handle backend)
const api = axios.create({
  baseURL: '/api',
  timeout: 15000
});

export default api;