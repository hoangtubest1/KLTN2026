// API config - trỏ đến backend Express
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Đổi thành IP máy tính khi test qua LAN
const API_BASE_URL = 'http://192.168.102.7:5000/api';

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
