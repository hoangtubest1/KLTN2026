import React, { useState, useEffect, useCallback } from 'react';
import api from '../api';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const BookingsList = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [cancellingId, setCancellingId] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Fetch bookings — pass date as query param so backend filters (not frontend)
  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterDate) params.append('date', filterDate);
      const response = await api.get(`/bookings?${params.toString()}`);
      setBookings(response.data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  }, [filterDate]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleCancel = async (bookingId) => {
    if (!window.confirm('Bạn có chắc muốn hủy lịch đặt này không?')) return;
    try {
      setCancellingId(bookingId);
      setMessage({ type: '', text: '' });
      await api.put(`/bookings/${bookingId}/cancel`);
      setMessage({ type: 'success', text: 'Hủy đặt sân thành công!' });
      fetchBookings();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Có lỗi xảy ra khi hủy đặt sân' });
    } finally {
      setCancellingId(null);
    }
  };

  const STATUS_MAP = {
    confirmed: { label: 'Đã Xác Nhận', cls: 'bg-green-100 text-green-700 border border-green-200' },
    pending: { label: 'Chờ Xác Nhận', cls: 'bg-yellow-100 text-yellow-700 border border-yellow-200' },
    pending_payment: { label: 'Chờ Thanh Toán', cls: 'bg-orange-100 text-orange-700 border border-orange-200' },
    cancelled: { label: 'Đã Hủy', cls: 'bg-red-100 text-red-700 border border-red-200' },
    completed: { label: 'Hoàn Thành', cls: 'bg-blue-100 text-blue-700 border border-blue-200' },
  };

  const cancellableStatuses = ['pending', 'pending_payment', 'confirmed'];

  // Client-side status filter (fast, data already loaded)
  const displayedBookings = statusFilter === 'all'
    ? bookings
    : bookings.filter(b => b.status === statusFilter);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">📅 Lịch Đặt Sân Của Tôi</h1>
          <p className="text-gray-500 text-sm">Quản lý toàn bộ lịch đặt sân thể thao của bạn</p>
        </div>

        {/* Alert message */}
        {message.text && (
          <div className={`mb-6 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 ${message.type === 'success'
            ? 'bg-green-50 text-green-800 border border-green-200'
            : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
            <span>{message.type === 'success' ? '✅' : '❌'}</span>
            {message.text}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6 flex flex-wrap gap-4 items-end">
          {/* Date filter */}
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Lọc theo ngày</label>
            <div className="flex gap-2">
              <input
                type="date"
                value={filterDate}
                onChange={e => setFilterDate(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {filterDate && (
                <button
                  onClick={() => setFilterDate('')}
                  className="px-3 py-2 text-xs text-gray-500 hover:text-red-500 border border-gray-200 rounded-lg transition-colors"
                  title="Xóa lọc ngày"
                >✕</button>
              )}
            </div>
          </div>

          {/* Status filter */}
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Trạng thái</label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="all">Tất cả</option>
              {Object.entries(STATUS_MAP).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
          </div>

          {/* Result count */}
          <div className="text-sm text-gray-500 pb-1">
            <span className="font-bold text-blue-600">{displayedBookings.length}</span> lịch đặt
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-sm font-medium">Đang tải lịch đặt...</p>
          </div>
        ) : displayedBookings.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
            <div className="text-5xl mb-3">📭</div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">Không có lịch đặt nào</h3>
            <p className="text-gray-400 text-sm">
              {filterDate
                ? `Không có lịch đặt nào vào ngày ${format(new Date(filterDate + 'T00:00:00'), 'dd/MM/yyyy')}`
                : 'Bạn chưa có lịch đặt nào. Hãy đặt sân ngay!'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedBookings.map(booking => {
              const statusInfo = STATUS_MAP[booking.status] || { label: booking.status, cls: 'bg-gray-100 text-gray-600' };
              const canCancel = cancellableStatuses.includes(booking.status);
              const bookingDate = booking.date
                ? format(new Date(booking.date + 'T00:00:00'), 'EEEE, dd/MM/yyyy', { locale: vi })
                : '';

              return (
                <div key={booking.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                  {/* Card header */}
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold text-sm">
                        {booking.sport?.emoji || '🏟️'} {booking.sport?.nameVi || booking.sport?.name || 'Thể thao'}
                      </span>
                      <span className="text-blue-200 text-xs">
                        #{String(booking.id).padStart(4, '0')}
                      </span>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusInfo.cls}`}>
                      {statusInfo.label}
                    </span>
                  </div>

                  {/* Card body */}
                  <div className="p-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                      {/* Facility */}
                      <div className="flex items-start gap-2.5">
                        <span className="mt-0.5 flex-shrink-0 w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center text-base">📍</span>
                        <div className="min-w-0">
                          <p className="text-xs text-gray-400 font-medium">Sân đặt</p>
                          <p className="text-gray-900 font-semibold text-sm truncate">{booking.facilityName}</p>
                          {booking.facilityAddress && (
                            <p className="text-xs text-gray-400 truncate">{booking.facilityAddress}</p>
                          )}
                        </div>
                      </div>

                      {/* Date & Time */}
                      <div className="flex items-start gap-2.5">
                        <span className="mt-0.5 flex-shrink-0 w-7 h-7 bg-green-50 rounded-lg flex items-center justify-center text-base">🗓️</span>
                        <div>
                          <p className="text-xs text-gray-400 font-medium">Thời gian</p>
                          <p className="text-gray-900 font-semibold text-sm">{bookingDate}</p>
                          <p className="text-xs text-gray-500 font-medium">
                            {(booking.startTime || '').slice(0, 5)} – {(booking.endTime || '').slice(0, 5)}
                          </p>
                        </div>
                      </div>

                      {/* Customer */}
                      <div className="flex items-start gap-2.5">
                        <span className="mt-0.5 flex-shrink-0 w-7 h-7 bg-purple-50 rounded-lg flex items-center justify-center text-base">👤</span>
                        <div>
                          <p className="text-xs text-gray-400 font-medium">Người đặt</p>
                          <p className="text-gray-900 font-semibold text-sm">{booking.customerName}</p>
                          <p className="text-xs text-gray-400">{booking.customerPhone}</p>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="flex items-start gap-2.5">
                        <span className="mt-0.5 flex-shrink-0 w-7 h-7 bg-yellow-50 rounded-lg flex items-center justify-center text-base">💰</span>
                        <div>
                          <p className="text-xs text-gray-400 font-medium">Tổng tiền</p>
                          <p className="text-blue-700 font-bold text-base">
                            {Number(booking.totalPrice || 0).toLocaleString('vi-VN')}đ
                          </p>
                          <p className="text-xs text-gray-400 capitalize">{booking.paymentMethod === 'vnpay' ? 'VNPay' : booking.paymentMethod === 'momo' ? 'MoMo' : 'Tại sân'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    {booking.notes && (
                      <div className="mb-4 bg-gray-50 rounded-lg px-3 py-2 text-xs text-gray-600">
                        <span className="font-semibold">Ghi chú: </span>{booking.notes}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
                      {booking.facilityPhone && (
                        <a
                          href={`tel:${booking.facilityPhone}`}
                          className="flex items-center gap-1.5 px-4 py-2 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-sm font-semibold transition-colors"
                        >
                          📞 Gọi sân
                        </a>
                      )}
                      {canCancel && (
                        <button
                          onClick={() => handleCancel(booking.id)}
                          disabled={cancellingId === booking.id}
                          className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-semibold transition-colors border border-red-200"
                        >
                          {cancellingId === booking.id ? (
                            <><span className="inline-block w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></span> Đang hủy...</>
                          ) : (
                            <>✕ Hủy đặt</>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingsList;
