import React, { useState, useEffect, useCallback } from 'react';
import api from '../api';

const getWeatherIcon = (iconCode) => {
  const map = {
    '01d': '☀️', '01n': '🌙', '02d': '⛅', '02n': '☁️',
    '03d': '☁️', '03n': '☁️', '04d': '☁️', '04n': '☁️',
    '09d': '🌧️', '09n': '🌧️', '10d': '🌦️', '10n': '🌧️',
    '11d': '⛈️', '11n': '⛈️', '13d': '🌨️', '13n': '🌨️',
    '50d': '🌫️', '50n': '🌫️'
  };
  return map[iconCode] || '🌤️';
};

const getWeatherBg = (main) => {
  if (!main) return 'from-blue-400 to-blue-600';
  const m = main.toLowerCase();
  if (m.includes('rain') || m.includes('drizzle')) return 'from-gray-500 to-blue-700';
  if (m.includes('thunder')) return 'from-gray-700 to-purple-800';
  if (m.includes('cloud')) return 'from-gray-400 to-blue-500';
  if (m.includes('clear')) return 'from-yellow-400 to-orange-500';
  if (m.includes('snow')) return 'from-blue-200 to-gray-400';
  return 'from-blue-400 to-cyan-500';
};

const OwnerWeather = () => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchWeather = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/owner/weather');
      setWeather(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải dữ liệu thời tiết');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchWeather(); }, [fetchWeather]);

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
        <div className="text-5xl mb-4">🌧️</div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">Không thể tải thời tiết</h3>
        <p className="text-red-500 text-sm mb-2">{error}</p>
        <p className="text-xs text-gray-400 mb-4">Kiểm tra OPENWEATHER_API_KEY trong server/.env</p>
        <button onClick={fetchWeather} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all">
          🔄 Thử lại
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto"></div>
        <p className="text-sm text-gray-400 mt-4">Đang tải dữ liệu thời tiết...</p>
      </div>
    );
  }

  if (!weather) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            🌤️ Dự Báo Thời Tiết
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Theo dõi thời tiết tại khu vực sân bãi của bạn
          </p>
        </div>
        <button onClick={fetchWeather} disabled={loading}
          className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-semibold hover:bg-blue-100 transition-all disabled:opacity-50">
          🔄 Cập nhật
        </button>
      </div>

      {/* Current Weather - Hero Card */}
      <div className={`bg-gradient-to-br ${getWeatherBg(weather.current?.main)} rounded-2xl p-8 text-white shadow-lg relative overflow-hidden`}>
        <div className="absolute top-0 right-0 text-[120px] opacity-20 -mr-4 -mt-4 select-none">
          {getWeatherIcon(weather.current?.icon)}
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium opacity-80">📍 {weather.current?.city || weather.location?.city}</span>
          </div>
          <div className="flex items-end gap-4 mb-4">
            <span className="text-7xl font-bold leading-none">{weather.current?.temp}°</span>
            <div className="mb-2">
              <p className="text-lg capitalize">{weather.current?.description}</p>
              <p className="text-sm opacity-80">Cảm giác như {weather.current?.feelsLike}°C</p>
            </div>
          </div>
          <div className="flex gap-6 text-sm">
            <div className="flex items-center gap-1.5">
              <span className="text-lg">💧</span>
              <div>
                <p className="opacity-70 text-xs">Độ ẩm</p>
                <p className="font-semibold">{weather.current?.humidity}%</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg">💨</span>
              <div>
                <p className="opacity-70 text-xs">Gió</p>
                <p className="font-semibold">{weather.current?.windSpeed} m/s</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5-Day Forecast */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">📅 Dự báo 5 ngày tới</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {weather.forecast?.slice(0, 5).map((day, idx) => {
              const date = new Date(day.date);
              const dayLabel = date.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' });
              const isRainy = day.rainProb > 50;

              return (
                <div key={idx} className={`rounded-xl p-5 text-center transition-all hover:shadow-md border ${isRainy ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-100'}`}>
                  <p className="text-xs font-semibold text-gray-500 mb-2">{dayLabel}</p>
                  <div className="text-4xl mb-3">{getWeatherIcon(day.icon)}</div>
                  <p className="text-2xl font-bold text-gray-900">{day.temp}°C</p>
                  <p className="text-xs text-gray-500 capitalize mt-1 mb-3">{day.description}</p>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">🌧️ Mưa</span>
                      <span className={`font-bold ${day.rainProb > 50 ? 'text-blue-600' : 'text-green-600'}`}>{day.rainProb}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full transition-all ${day.rainProb > 50 ? 'bg-blue-500' : 'bg-green-500'}`}
                        style={{ width: `${day.rainProb}%` }}></div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">💧 Ẩm</span>
                      <span className="font-medium text-gray-600">{day.humidity}%</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">💨 Gió</span>
                      <span className="font-medium text-gray-600">{day.windSpeed} m/s</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Weather Impact Analysis */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">📊 Ảnh Hưởng Thời Tiết Đến Kinh Doanh</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {weather.forecast?.slice(0, 5).map((day, idx) => {
              const date = new Date(day.date);
              const dayLabel = date.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' });
              const isRainy = day.rainProb > 50;
              const isHot = day.temp > 35;
              const isNice = !isRainy && day.temp >= 25 && day.temp <= 33;

              let impact, impactColor, impactIcon, advice;
              if (isRainy) {
                impact = 'Giảm 20-40%';
                impactColor = 'text-red-600 bg-red-50 border-red-200';
                impactIcon = '📉';
                advice = 'Khả năng mưa cao. Chuẩn bị phương án che mưa hoặc khuyến mãi giờ mưa.';
              } else if (isHot) {
                impact = 'Giảm nhẹ 10-20%';
                impactColor = 'text-orange-600 bg-orange-50 border-orange-200';
                impactIcon = '🌡️';
                advice = 'Nắng nóng, khách có thể chuyển sang khung giờ chiều tối. Chuẩn bị nước uống.';
              } else if (isNice) {
                impact = 'Tốt - Tăng 10-20%';
                impactColor = 'text-green-600 bg-green-50 border-green-200';
                impactIcon = '📈';
                advice = 'Thời tiết lý tưởng cho hoạt động thể thao ngoài trời!';
              } else {
                impact = 'Bình thường';
                impactColor = 'text-blue-600 bg-blue-50 border-blue-200';
                impactIcon = '➡️';
                advice = 'Thời tiết ổn định, lượng khách dự kiến bình thường.';
              }

              return (
                <div key={idx} className={`rounded-xl p-4 border ${impactColor}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold">{dayLabel}</span>
                    <span className="text-lg">{impactIcon}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{getWeatherIcon(day.icon)}</span>
                    <span className="text-lg font-bold">{day.temp}°C</span>
                    <span className="text-xs opacity-70">🌧️{day.rainProb}%</span>
                  </div>
                  <p className="text-sm font-semibold mb-1">Dự kiến: {impact}</p>
                  <p className="text-xs opacity-80">{advice}</p>
                </div>
              );
            })}
          </div>

          {/* Overall Warning */}
          {weather.forecast?.some(d => d.rainProb > 60) && (
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="text-sm font-bold text-amber-800">Cảnh báo mưa trong tuần</p>
                <p className="text-sm text-amber-700 mt-1">
                  Một số ngày tới có khả năng mưa cao ({weather.forecast.filter(d => d.rainProb > 60).length} ngày).
                  Lượng đặt sân ngoài trời có thể giảm 20-40%.
                </p>
                <div className="mt-3 flex gap-2 flex-wrap">
                  <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">💡 Chuẩn bị mái che</span>
                  <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">🏷️ Khuyến mãi giờ mưa</span>
                  <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">📱 Thông báo khách</span>
                </div>
              </div>
            </div>
          )}

          {weather.forecast?.every(d => d.rainProb <= 30) && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
              <span className="text-2xl">✅</span>
              <div>
                <p className="text-sm font-bold text-green-800">Thời tiết thuận lợi</p>
                <p className="text-sm text-green-700 mt-1">
                  Dự báo không mưa trong 5 ngày tới. Đây là thời điểm tốt để tăng cường marketing và thu hút khách hàng!
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OwnerWeather;
