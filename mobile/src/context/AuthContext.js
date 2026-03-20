import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import api from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Load token từ SecureStore khi khởi động
        SecureStore.getItemAsync('token').then(async (t) => {
            if (t) {
                setToken(t);
                try {
                    const res = await api.get('/auth/me');
                    setUser(res.data);
                } catch {
                    await SecureStore.deleteItemAsync('token');
                }
            }
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    const login = async (email, password) => {
        const res = await api.post('/auth/login', { email, password });
        const { token: t, user: u } = res.data;
        await SecureStore.setItemAsync('token', t);
        setToken(t);
        setUser(u);
        return u;
    };

    const logout = async () => {
        await SecureStore.deleteItemAsync('token');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, logout, isAuthenticated: !!token }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
