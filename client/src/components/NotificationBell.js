import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';

const typeIcons = {
  booking_confirmed: '✅',
  booking_cancelled: '❌',
  booking_completed: '🏆',
  group_join: '👋',
  group_leave: '🚪',
  group_kick: '⚠️',
  group_created: '🎉',
  group_message: '💬',
  system: '🔔'
};

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const {
    unreadCount,
    notifications,
    fetchNotifications,
    markAsRead,
    markAllRead
  } = useNotification();

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (!isOpen) {
      fetchNotifications(1);
    }
    setIsOpen(!isOpen);
  };

  const handleClickNotification = (notif) => {
    if (!notif.isRead) markAsRead(notif.id);
    setIsOpen(false);
    if (notif.link) navigate(notif.link);
  };

  const timeAgo = (dateStr) => {
    const now = new Date();
    const d = new Date(dateStr);
    const diffMs = now - d;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Vừa xong';
    if (diffMin < 60) return `${diffMin} phút trước`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} giờ trước`;
    const diffDay = Math.floor(diffHour / 24);
    if (diffDay < 7) return `${diffDay} ngày trước`;
    return d.toLocaleDateString('vi-VN');
  };

  const recentNotifs = notifications.slice(0, 8);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={handleToggle}
        className="relative text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-all"
        title="Thông báo"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>

        {/* Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[10px] font-bold text-white px-1"
            style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
          style={{ maxHeight: '480px' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100"
            style={{ background: 'linear-gradient(135deg, #eef2ff, #f5f3ff)' }}
          >
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
              🔔 Thông báo
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold text-white bg-red-500 px-1.5 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold transition-colors"
              >
                Đọc tất cả
              </button>
            )}
          </div>

          {/* List */}
          <div className="overflow-y-auto" style={{ maxHeight: '380px' }}>
            {recentNotifs.length === 0 ? (
              <div className="p-8 text-center">
                <span className="text-4xl block mb-2">🔕</span>
                <p className="text-gray-400 text-sm">Chưa có thông báo</p>
              </div>
            ) : (
              recentNotifs.map(notif => (
                <button
                  key={notif.id}
                  onClick={() => handleClickNotification(notif)}
                  className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors border-b border-gray-50 ${
                    !notif.isRead ? 'bg-indigo-50/50' : ''
                  }`}
                >
                  <span className="text-lg mt-0.5 flex-shrink-0">
                    {typeIcons[notif.type] || '🔔'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-snug ${!notif.isRead ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                      {notif.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{timeAgo(notif.createdAt)}</p>
                  </div>
                  {!notif.isRead && (
                    <span className="w-2 h-2 rounded-full bg-indigo-500 mt-2 flex-shrink-0"></span>
                  )}
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          {recentNotifs.length > 0 && (
            <div className="border-t border-gray-100">
              <button
                onClick={() => { setIsOpen(false); navigate('/notifications'); }}
                className="w-full py-3 text-center text-sm font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors"
              >
                Xem tất cả thông báo →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
