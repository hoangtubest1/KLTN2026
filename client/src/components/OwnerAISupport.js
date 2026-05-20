import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../api';

// ── Weather icon mapping ──
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

const getTrendColor = (trend) => {
  if (trend === 'hot') return 'text-red-600 bg-red-50';
  if (trend === 'normal') return 'text-blue-600 bg-blue-50';
  return 'text-gray-500 bg-gray-50';
};

const getTrendLabel = (trend) => {
  if (trend === 'hot') return '🔥 Cao';
  if (trend === 'normal') return '📊 Bình thường';
  return '📉 Thấp';
};

const OwnerAISupport = () => {
  // Weather state
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState('');

  // Prediction state
  const [prediction, setPrediction] = useState(null);
  const [predictionLoading, setPredictionLoading] = useState(true);

  // Chat state
  const [messages, setMessages] = useState([
    { role: 'bot', content: '🤖 Xin chào Chủ Sân! Tôi là **Trợ lý AI** của Timsan247.\n\nTôi có thể hỗ trợ bạn:\n• 📊 Phân tích doanh thu sân bãi\n• 📅 Tình hình booking & xu hướng\n• ⭐ Phân tích đánh giá khách hàng\n• 💡 Tư vấn cải thiện dịch vụ\n• 🌤️ Ảnh hưởng thời tiết đến kinh doanh\n\nBạn cần hỗ trợ gì?' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => { scrollToBottom(); }, [messages]);

  // Fetch weather
  const fetchWeather = useCallback(async () => {
    setWeatherLoading(true);
    setWeatherError('');
    try {
      const res = await api.get('/owner/weather');
      setWeather(res.data);
    } catch (err) {
      setWeatherError(err.response?.data?.message || 'Không thể tải thời tiết');
    } finally {
      setWeatherLoading(false);
    }
  }, []);

  // Fetch prediction
  const fetchPrediction = useCallback(async () => {
    setPredictionLoading(true);
    try {
      const res = await api.get('/owner/booking-prediction');
      setPrediction(res.data);
    } catch (err) {
      console.error('Prediction error:', err);
    } finally {
      setPredictionLoading(false);
    }
  }, []);

  useEffect(() => { fetchWeather(); fetchPrediction(); }, [fetchWeather, fetchPrediction]);

  // Chat
  const suggestions = [
    { label: '📊 Phân tích doanh thu', text: 'Phân tích doanh thu các sân của tôi trong 30 ngày qua' },
    { label: '⭐ Phân tích đánh giá', text: 'Phân tích đánh giá của khách hàng và gợi ý cải thiện' },
    { label: '📈 Giờ cao điểm', text: 'Khung giờ nào được đặt nhiều nhất? Tôi nên tối ưu giá thế nào?' },
    { label: '🌧️ Ảnh hưởng thời tiết', text: 'Thời tiết ảnh hưởng thế nào đến lượng đặt sân? Tôi cần làm gì khi trời mưa?' },
  ];

  const sendMessage = async (text) => {
    const msg = (text || chatInput).trim();
    if (!msg || chatLoading) return;

    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setChatInput('');
    setChatLoading(true);

    try {
      const history = messages.slice(-10).map(m => ({ role: m.role === 'bot' ? 'bot' : 'user', content: m.content }));
      const res = await api.post('/owner/ai-chat', { message: msg, history });
      setMessages(prev => [...prev, { role: 'bot', content: res.data.reply, source: res.data.source }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'bot', content: '⚠️ Có lỗi xảy ra. Vui lòng thử lại.', isError: true }]);
    } finally {
      setChatLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  // Simple markdown renderer
  const renderMd = (text) => {
    if (!text) return '';
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/^### (.+)$/gm, '<h4 class="text-sm font-bold text-gray-800 mt-3 mb-1">$1</h4>')
      .replace(/^## (.+)$/gm, '<h3 class="text-base font-bold text-gray-900 mt-4 mb-2">$1</h3>')
      .replace(/^# (.+)$/gm, '<h2 class="text-lg font-bold text-gray-900 mt-4 mb-2">$1</h2>')
      .replace(/^[•\-] (.+)$/gm, '<li class="ml-4 text-sm leading-relaxed">$1</li>')
      .replace(/(<li[^>]*>.*?<\/li>\n?)+/gs, (m) => `<ul class="list-disc my-1">${m}</ul>`)
      .replace(/\n/g, '<br/>');
  };

  const fmt = (n) => new Intl.NumberFormat('vi-VN').format(n || 0);

  return (
    <div className="space-y-6">
      {/* ═══ WEATHER FORECAST ═══ */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            🌤️ Dự Báo Thời Tiết
            {weather?.current?.city && <span className="text-sm font-normal text-gray-500">- {weather.current.city}</span>}
          </h3>
          <button onClick={fetchWeather} disabled={weatherLoading} className="text-xs text-blue-600 hover:text-blue-700 font-medium">
            {weatherLoading ? '⏳' : '🔄'} Cập nhật
          </button>
        </div>

        {weatherError ? (
          <div className="p-6 text-center">
            <p className="text-red-500 text-sm">{weatherError}</p>
            <p className="text-xs text-gray-400 mt-2">Kiểm tra OPENWEATHER_API_KEY trong server/.env</p>
          </div>
        ) : weatherLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-sm text-gray-400 mt-3">Đang tải dữ liệu thời tiết...</p>
          </div>
        ) : weather ? (
          <div className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {/* Current Weather */}
              <div className={`bg-gradient-to-br ${getWeatherBg(weather.current?.main)} rounded-xl p-4 text-white col-span-1`}>
                <p className="text-xs opacity-80 mb-1">Hiện tại</p>
                <div className="text-4xl mb-2">{getWeatherIcon(weather.current?.icon)}</div>
                <p className="text-2xl font-bold">{weather.current?.temp}°C</p>
                <p className="text-xs opacity-90 capitalize mt-1">{weather.current?.description}</p>
                <div className="flex items-center gap-2 mt-2 text-xs opacity-80">
                  <span>💧 {weather.current?.humidity}%</span>
                  <span>💨 {weather.current?.windSpeed}m/s</span>
                </div>
              </div>

              {/* Forecast Days */}
              {weather.forecast?.slice(0, 4).map((day, idx) => {
                const date = new Date(day.date);
                const dayLabel = date.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' });
                return (
                  <div key={idx} className="bg-gray-50 rounded-xl p-4 text-center hover:bg-gray-100 transition-colors">
                    <p className="text-xs font-medium text-gray-500 mb-2">{dayLabel}</p>
                    <div className="text-3xl mb-2">{getWeatherIcon(day.icon)}</div>
                    <p className="text-lg font-bold text-gray-900">{day.temp}°C</p>
                    <p className="text-xs text-gray-500 capitalize mt-1">{day.description}</p>
                    <div className="mt-2 flex items-center justify-center gap-1">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${day.rainProb > 50 ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                        🌧️ {day.rainProb}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Weather impact note */}
            {weather.forecast?.some(d => d.rainProb > 60) && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2">
                <span className="text-lg">⚠️</span>
                <div>
                  <p className="text-sm font-semibold text-amber-800">Cảnh báo mưa</p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Một số ngày tới có khả năng mưa cao. Lượng đặt sân ngoài trời có thể giảm 20-40%. 
                    Hãy chuẩn bị phương án che mưa hoặc khuyến mãi giờ mưa.
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* ═══ BOOKING PREDICTION ═══ */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">📈 Dự Báo Lượng Đặt Sân</h3>
          <button onClick={fetchPrediction} disabled={predictionLoading} className="text-xs text-blue-600 hover:text-blue-700 font-medium">
            {predictionLoading ? '⏳' : '🔄'} Cập nhật
          </button>
        </div>

        {predictionLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
            <p className="text-sm text-gray-400 mt-3">Đang phân tích dữ liệu...</p>
          </div>
        ) : prediction ? (
          <div className="p-4">
            {/* 7-day prediction cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 mb-4">
              {prediction.predictions?.map((p, idx) => {
                const isToday = idx === 0;
                return (
                  <div key={idx} className={`rounded-xl p-3 text-center border transition-all hover:shadow-md ${isToday ? 'bg-blue-50 border-blue-200' : p.isWeekend ? 'bg-orange-50 border-orange-100' : 'bg-gray-50 border-gray-100'}`}>
                    <p className={`text-xs font-bold ${isToday ? 'text-blue-600' : 'text-gray-500'}`}>
                      {isToday ? '🔴 Hôm nay' : p.dayName}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{p.date.slice(5)}</p>

                    <div className="my-2">
                      <p className="text-2xl font-bold text-gray-900">
                        {isToday ? p.actualBookings : p.predictedBookings}
                      </p>
                      <p className="text-[10px] text-gray-400">{isToday ? 'booking thực' : 'dự báo'}</p>
                    </div>

                    {!isToday && p.actualBookings > 0 && (
                      <p className="text-[10px] text-green-600 font-medium">Đã có: {p.actualBookings}</p>
                    )}

                    <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${getTrendColor(p.trend)}`}>
                      {getTrendLabel(p.trend)}
                    </span>

                    <p className="text-[10px] text-gray-400 mt-1">~{fmt(p.predictedRevenue)}đ</p>
                  </div>
                );
              })}
            </div>

            {/* Historical chart (last 14 days) */}
            {prediction.history?.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-bold text-gray-700 mb-3">📊 Lịch sử 14 ngày qua</h4>
                <div className="space-y-1.5">
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
                        <span className="w-20 text-right text-gray-400">{fmt(h.revenue)}đ</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {prediction.predictions?.every(p => p.predictedBookings === 0) && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="text-sm text-blue-700">
                  💡 Chưa đủ dữ liệu lịch sử để dự báo chính xác. Dự báo sẽ chính xác hơn sau 2-3 tuần hoạt động.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 text-center text-gray-400 text-sm">Không có dữ liệu dự báo</div>
        )}
      </div>

      {/* ═══ AI CHAT ═══ */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg flex items-center justify-center text-sm" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
              🤖
            </span>
            AI Hỗ Trợ Chủ Sân
          </h3>
          <button onClick={() => setMessages([{ role: 'bot', content: '🤖 Đã xóa lịch sử. Bạn muốn hỏi gì?' }])}
            className="text-xs text-gray-400 hover:text-red-500 font-medium transition-colors">
            🗑️ Xóa chat
          </button>
        </div>

        {/* Messages */}
        <div className="h-80 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex items-start gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs ${
                  msg.role === 'user' ? 'bg-blue-600 text-white' : msg.isError ? 'bg-red-100 text-red-600' : 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white'
                }`}>
                  {msg.role === 'user' ? '👤' : '🤖'}
                </div>
                <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-md'
                    : msg.isError
                      ? 'bg-red-50 text-red-700 border border-red-200 rounded-bl-md'
                      : 'bg-white text-gray-800 border border-gray-100 shadow-sm rounded-bl-md'
                }`}>
                  {msg.role === 'user' ? (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <div dangerouslySetInnerHTML={{ __html: renderMd(msg.content) }} />
                  )}
                </div>
              </div>
            </div>
          ))}

          {chatLoading && (
            <div className="flex justify-start">
              <div className="flex items-start gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-xs text-white">🤖</div>
                <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-bl-md px-4 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                    <span className="text-xs text-gray-400 ml-1">Đang phân tích...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions */}
        {messages.length <= 2 && (
          <div className="px-4 py-2 border-t border-gray-100 flex flex-wrap gap-1.5 bg-white">
            {suggestions.map((s, i) => (
              <button key={i} onClick={() => sendMessage(s.text)} disabled={chatLoading}
                className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full text-[11px] font-medium hover:bg-emerald-100 transition-all disabled:opacity-50">
                {s.label}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="p-3 border-t border-gray-100 flex items-end gap-2 bg-white">
          <textarea
            ref={inputRef}
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Hỏi về doanh thu, đánh giá, thời tiết..."
            disabled={chatLoading}
            rows={1}
            className="flex-1 resize-none px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent disabled:opacity-50 placeholder-gray-400"
            style={{ minHeight: '42px', maxHeight: '100px' }}
            onInput={(e) => { e.target.style.height = '42px'; e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px'; }}
          />
          <button onClick={() => sendMessage()} disabled={!chatInput.trim() || chatLoading}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white transition-all disabled:opacity-40 hover:shadow-lg active:scale-95"
            style={{ background: chatInput.trim() && !chatLoading ? 'linear-gradient(135deg, #10b981, #059669)' : '#d1d5db' }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default OwnerAISupport;
