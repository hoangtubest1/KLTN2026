import React, { useState, useEffect, useCallback } from 'react';
import api from '../api';

const getTrendColor = (trend) => {
  if (trend === 'hot') return 'text-red-600 bg-red-50 border-red-200';
  if (trend === 'normal') return 'text-blue-600 bg-blue-50 border-blue-200';
  return 'text-gray-500 bg-gray-50 border-gray-200';
};

const getTrendLabel = (trend) => {
  if (trend === 'hot') return '🔥 Cao';
  if (trend === 'normal') return '📊 Bình thường';
  return '📉 Thấp';
};

const fmt = (n) => new Intl.NumberFormat('vi-VN').format(n || 0);

const OwnerPrediction = () => {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPrediction = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/owner/booking-prediction');
      setPrediction(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải dữ liệu dự báo');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPrediction(); }, [fetchPrediction]);

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
        <div className="text-5xl mb-4">📊</div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">Không thể tải dự báo</h3>
        <p className="text-red-500 text-sm mb-4">{error}</p>
        <button onClick={fetchPrediction} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all">
          🔄 Thử lại
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-500 mx-auto"></div>
        <p className="text-sm text-gray-400 mt-4">Đang phân tích dữ liệu booking...</p>
      </div>
    );
  }

  if (!prediction) return null;

  const totalPredicted = prediction.predictions?.reduce((s, p) => s + p.predictedBookings, 0) || 0;
  const totalPredictedRevenue = prediction.predictions?.reduce((s, p) => s + p.predictedRevenue, 0) || 0;
  const totalActual = prediction.predictions?.reduce((s, p) => s + p.actualBookings, 0) || 0;
  const historyTotal = prediction.history?.reduce((s, h) => s + h.bookings, 0) || 0;
  const historyRevenue = prediction.history?.reduce((s, h) => s + h.revenue, 0) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            📈 Dự Báo Lượng Đặt Sân
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Phân tích xu hướng và dự báo 7 ngày tới • {prediction.totalFacilities || 0} sân
          </p>
        </div>
        <button onClick={fetchPrediction} disabled={loading}
          className="px-4 py-2 bg-green-50 text-green-600 rounded-lg text-sm font-semibold hover:bg-green-100 transition-all disabled:opacity-50">
          🔄 Cập nhật
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-lg">📅</span>
            <span className="text-xs text-gray-500">Dự báo 7 ngày</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalPredicted}</p>
          <p className="text-xs text-gray-400 mt-1">booking dự kiến</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-lg">💰</span>
            <span className="text-xs text-gray-500">Doanh thu dự kiến</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{fmt(totalPredictedRevenue)}đ</p>
          <p className="text-xs text-gray-400 mt-1">7 ngày tới</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-lg">✅</span>
            <span className="text-xs text-gray-500">Đã đặt trước</span>
          </div>
          <p className="text-2xl font-bold text-purple-600">{totalActual}</p>
          <p className="text-xs text-gray-400 mt-1">booking thực tế</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-lg">📊</span>
            <span className="text-xs text-gray-500">14 ngày qua</span>
          </div>
          <p className="text-2xl font-bold text-orange-600">{historyTotal}</p>
          <p className="text-xs text-gray-400 mt-1">{fmt(historyRevenue)}đ doanh thu</p>
        </div>
      </div>

      {/* 7-Day Prediction Cards */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">🔮 Dự báo chi tiết 7 ngày tới</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {prediction.predictions?.map((p, idx) => {
              const isToday = idx === 0;
              return (
                <div key={idx} className={`rounded-xl p-4 text-center border transition-all hover:shadow-md ${
                  isToday ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200' 
                  : p.isWeekend ? 'bg-orange-50 border-orange-200' 
                  : 'bg-gray-50 border-gray-100'
                }`}>
                  <p className={`text-xs font-bold ${isToday ? 'text-blue-600' : p.isWeekend ? 'text-orange-600' : 'text-gray-500'}`}>
                    {isToday ? '🔴 Hôm nay' : p.dayName}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{p.date.slice(5)}</p>

                  <div className="my-3">
                    <p className="text-3xl font-bold text-gray-900">
                      {isToday ? p.actualBookings : p.predictedBookings}
                    </p>
                    <p className="text-[10px] text-gray-400">{isToday ? 'booking thực' : 'dự báo'}</p>
                  </div>

                  {!isToday && p.actualBookings > 0 && (
                    <p className="text-[10px] text-green-600 font-semibold">Đã có: {p.actualBookings}</p>
                  )}

                  <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 border ${getTrendColor(p.trend)}`}>
                    {getTrendLabel(p.trend)}
                  </span>

                  <p className="text-[10px] text-gray-400 mt-2 font-medium">~{fmt(p.predictedRevenue)}đ</p>
                  
                  {p.confidence && (
                    <p className="text-[9px] text-gray-300 mt-0.5">Độ tin cậy: {p.confidence}</p>
                  )}
                </div>
              );
            })}
          </div>

          {prediction.predictions?.every(p => p.predictedBookings === 0) && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <p className="text-sm text-blue-700 flex items-center gap-2">
                💡 Chưa đủ dữ liệu lịch sử để dự báo chính xác. Dự báo sẽ chính xác hơn sau 2-3 tuần hoạt động.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Historical Chart (14 days) */}
      {prediction.history?.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-900">📊 Lịch sử 14 ngày qua</h3>
          </div>
          <div className="p-4">
            {/* Mini bar chart */}
            <div className="flex items-end gap-1 h-40 mb-4 px-2">
              {prediction.history.map((h, i) => {
                const maxBookings = Math.max(...prediction.history.map(x => x.bookings), 1);
                const pct = (h.bookings / maxBookings * 100);
                const isWeekend = ['Chủ Nhật', 'Thứ Bảy'].includes(h.dayName);
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                    {/* Tooltip */}
                    <div className="absolute -top-14 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                      {h.date.slice(5)} • {h.bookings} booking • {fmt(h.revenue)}đ
                    </div>
                    <span className="text-[10px] font-bold text-gray-500">{h.bookings > 0 ? h.bookings : ''}</span>
                    <div className={`w-full rounded-t-md transition-all duration-500 hover:opacity-80 ${isWeekend ? 'bg-orange-400' : 'bg-blue-500'}`}
                      style={{ height: `${pct}%`, minHeight: h.bookings > 0 ? '4px' : '1px' }}>
                    </div>
                    <span className={`text-[9px] ${isWeekend ? 'text-orange-600 font-bold' : 'text-gray-400'}`}>
                      {h.date.slice(8)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Detailed list */}
            <div className="space-y-1.5 mt-4">
              {prediction.history.map((h, i) => {
                const maxBookings = Math.max(...prediction.history.map(x => x.bookings), 1);
                const pct = (h.bookings / maxBookings * 100);
                const isWeekend = ['Chủ Nhật', 'Thứ Bảy'].includes(h.dayName);
                return (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className={`w-16 text-right ${isWeekend ? 'text-orange-600 font-semibold' : 'text-gray-500'}`}>
                      {h.date.slice(5)}
                    </span>
                    <span className="w-10 text-gray-400 text-[10px]">{h.dayName.slice(0, 2)}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${isWeekend ? 'bg-orange-400' : 'bg-blue-500'}`}
                        style={{ width: `${pct}%`, minWidth: h.bookings > 0 ? '8px' : '0' }}>
                      </div>
                    </div>
                    <span className="w-6 font-semibold text-gray-700">{h.bookings}</span>
                    <span className="w-24 text-right text-gray-400">{fmt(h.revenue)}đ</span>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 justify-center text-xs text-gray-400">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-blue-500"></div>
                <span>Ngày thường</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-orange-400"></div>
                <span>Cuối tuần</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerPrediction;
