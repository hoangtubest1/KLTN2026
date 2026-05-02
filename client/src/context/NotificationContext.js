import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import api from '../api';

const NotificationContext = createContext(null);

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [toast, setToast] = useState(null);
  const { user, isAuthenticated } = useAuth();
  const socketRef = useSocket();
  const socket = socketRef?.current;

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get('/notifications/unread-count');
      setUnreadCount(res.data?.count || 0);
    } catch (_) {}
  }, [isAuthenticated]);

  // Fetch notifications list
  const fetchNotifications = useCallback(async (page = 1) => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get(`/notifications?page=${page}&limit=20`);
      if (page === 1) {
        setNotifications(res.data?.notifications || []);
      } else {
        setNotifications(prev => [...prev, ...(res.data?.notifications || [])]);
      }
      return res.data;
    } catch (_) {
      return null;
    }
  }, [isAuthenticated]);

  // Mark single as read
  const markAsRead = useCallback(async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (_) {}
  }, []);

  // Mark all as read
  const markAllRead = useCallback(async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (_) {}
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (id) => {
    try {
      const notif = notifications.find(n => n.id === id);
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (notif && !notif.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (_) {}
  }, [notifications]);

  // Join user room for realtime + fetch initial count
  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      setUnreadCount(0);
      setNotifications([]);
      return;
    }

    fetchUnreadCount();

    if (socket) {
      socket.emit('join-user', { userId: user.id });

      const handleNewNotification = (notification) => {
        setUnreadCount(prev => prev + 1);
        setNotifications(prev => [notification, ...prev]);

        // Show toast
        setToast(notification);
        setTimeout(() => setToast(null), 5000);
      };

      socket.on('new-notification', handleNewNotification);

      return () => {
        socket.emit('leave-user', { userId: user.id });
        socket.off('new-notification', handleNewNotification);
      };
    }
  }, [isAuthenticated, user?.id, socket, fetchUnreadCount]);

  return (
    <NotificationContext.Provider value={{
      unreadCount,
      notifications,
      toast,
      setToast,
      fetchUnreadCount,
      fetchNotifications,
      markAsRead,
      markAllRead,
      deleteNotification
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
