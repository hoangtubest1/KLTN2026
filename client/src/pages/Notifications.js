import React, { useState, useEffect } from 'react';
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

const typeLabels = {
  booking_confirmed: 'Đặt sân',
  booking_cancelled: 'Hủy sân',
  booking_completed: 'Hoàn thành',
  group_join: 'Tham gia Group',
  group_leave: 'Rời Group',
  group_kick: 'Bị kick',
  group_created: 'Tạo phòng',
  group_message: 'Tin nhắn',
  system: 'Hệ thống'
};

const Notifications = () => {
  const [tab, setTab] = useState('all'); // all | unread
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const {
    notifications,
    fetchNotifications,
    markAsRead,
    markAllRead,
    deleteNotification,
    unreadCount
  } = useNotification();

  useEffect(() => {
    loadNotifications(1);
  }, []);

  const loadNotifications = async (p) => {
    setLoading(true);
    const data = await fetchNotifications(p);
    if (data) {
      setPage(data.page);
      setTotalPages(data.totalPages);
    }
    setLoading(false);
  };

  const handleClick = (notif) => {
    if (!notif.isRead) markAsRead(notif.id);
    if (notif.link) navigate(notif.link);
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    deleteNotification(id);
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
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const filtered = tab === 'unread' ? notifications.filter(n => !n.isRead) : notifications;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">🔔 Thông báo</h1>
            <p className="text-sm text-gray-500 mt-1">
              {unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : 'Tất cả đã đọc'}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="px-4 py-2 text-sm font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"
            >
              ✓ Đọc tất cả
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
          <button
            onClick={() => setTab('all')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${tab === 'all' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Tất cả ({notifications.length})
          </button>
          <button
            onClick={() => setTab('unread')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${tab === 'unread' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Chưa đọc ({unreadCount})
          </button>
        </div>

        {/* List */}
        {loading && notifications.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-4 text-gray-500 text-sm">Đang tải...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
            <span className="text-5xl block mb-4">🔕</span>
            <h3 className="text-lg font-bold text-gray-600 mb-2">
              {tab === 'unread' ? 'Không có thông báo chưa đọc' : 'Chưa có thông báo nào'}
            </h3>
            <p className="text-gray-400 text-sm">Thông báo sẽ xuất hiện khi có hoạt động mới</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {filtered.map((notif, idx) => (
              <button
                key={notif.id}
                onClick={() => handleClick(notif)}
                className={`w-full text-left px-5 py-4 flex items-start gap-4 hover:bg-gray-50 transition-colors ${
                  idx < filtered.length - 1 ? 'border-b border-gray-50' : ''
                } ${!notif.isRead ? 'bg-indigo-50/40' : ''}`}
              >
                <span className="text-2xl mt-0.5 flex-shrink-0">
                  {typeIcons[notif.type] || '🔔'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className={`text-sm ${!notif.isRead ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>
                      {notif.title}
                    </p>
                    <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                      {typeLabels[notif.type] || notif.type}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed">{notif.message}</p>
                  <p className="text-xs text-gray-400 mt-1.5">{timeAgo(notif.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 mt-1">
                  {!notif.isRead && (
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                  )}
                  <button
                    onClick={(e) => handleDelete(e, notif.id)}
                    className="text-gray-300 hover:text-red-400 p-1 rounded-lg hover:bg-red-50 transition-colors"
                    title="Xóa"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Load more */}
        {page < totalPages && (
          <div className="text-center mt-6">
            <button
              onClick={() => loadNotifications(page + 1)}
              className="px-6 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Xem thêm
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
