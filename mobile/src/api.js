// API config - trỏ đến backend Express
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Production backend trên Railway
const API_BASE_URL = 'https://kltn2026-production.up.railway.app/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Content-Type': 'application/json' },
    timeout: 10000,
});

// Attach token tự động
api.interceptors.request.use(async (config) => {
    try {
        const token = await SecureStore.getItemAsync('token');
        if (token) config.headers.Authorization = `Bearer ${token}`;
    } catch (_) { }
    return config;
});

export default api;
export { SecureStore };
