import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';

// Available start times (5:00 – 21:00, every half hour)
const START_TIMES = [];
for (let h = 5; h <= 21; h++) {
  START_TIMES.push(`${String(h).padStart(2, '0')}:00`);
  if (h < 21) START_TIMES.push(`${String(h).padStart(2, '0')}:30`);
}

// Duration options in hours
const DURATIONS = [0.5, 1, 1.5, 2, 2.5, 3, 4, 5];

const addTimeStr = (timeStr, hours) => {
  const [h, m] = timeStr.split(':').map(Number);
  const totalMin = h * 60 + m + Math.round(hours * 60);
  const endH = Math.floor(totalMin / 60);
  const endM = totalMin % 60;
  return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
};

const timeToFloat = (timeStr) => {
  const [h, m] = timeStr.split(':').map(Number);
  return h + m / 60;
};

const Booking = () => {
  const { sportId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const facilityIdParam = searchParams.get('facility');

  const [sport, setSport] = useState(null);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Booking form state
  // Always compute "today" from a live clock so past-hour logic is real-time
  const [now, setNow] = useState(new Date());
  const today = format(now, 'yyyy-MM-dd');
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedStart, setSelectedStart] = useState('07:00');
  const [selectedDuration, setSelectedDuration] = useState(1);
  const [selectedFacilityId, setSelectedFacilityId] = useState(facilityIdParam || '');
  const [selectedCourtNum, setSelectedCourtNum] = useState(1);
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('vnpay');
  const [paymentPlan, setPaymentPlan] = useState('pay_50');

  // Conflict check
  const [bookedSlots, setBookedSlots] = useState([]);
  const [conflictMsg, setConflictMsg] = useState('');

  const selectedEnd = addTimeStr(selectedStart, selectedDuration);
  const selectedFacility = facilities.find(f => String(f.id) === String(selectedFacilityId));
  const pricePerHour = selectedFacility ? Number(selectedFacility.pricePerHour) : 0;
  const totalPrice = pricePerHour * selectedDuration;

  useEffect(() => { if (sportId) fetchData(); }, [sportId]);
  useEffect(() => { if (selectedDate && sportId) fetchBookedSlots(); }, [selectedDate, sportId]);
  useEffect(() => {
    if (!facilityIdParam && facilities.length > 0 && !selectedFacilityId)
      setSelectedFacilityId(String(facilities[0].id));
  }, [facilities]);
  useEffect(() => { setSelectedCourtNum(1); }, [selectedFacilityId]);
  useEffect(() => { checkConflict(); }, [selectedDate, selectedStart, selectedDuration, selectedFacilityId, selectedCourtNum, bookedSlots]);

  // Refresh "now" every minute so past-hour checks stay accurate
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  // Helper: is a given time string (HH:mm) in the past for the selected date?
  const isTimePast = (timeStr) => {
    if (selectedDate > today) return false;
    if (selectedDate < today) return true;
    return timeToFloat(timeStr) <= (now.getHours() + now.getMinutes() / 60);
  };

  // Auto-select the first available (non-past) start time when the date is today
  useEffect(() => {
    if (selectedDate === today) {
      const nextValid = START_TIMES.find(t => !isTimePast(t));
      if (nextValid && isTimePast(selectedStart)) {
        setSelectedStart(nextValid);
      }
    }
  }, [selectedDate, now]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sportRes, facilityRes] = await Promise.all([
        api.get(`/sports/${sportId}`),
        api.get(`/facilities/sport/${sportId}`)
      ]);
      setSport(sportRes.data);
      setFacilities(facilityRes.data);
      if (facilityIdParam) setSelectedFacilityId(facilityIdParam);
      else if (facilityRes.data.length > 0) setSelectedFacilityId(String(facilityRes.data[0].id));
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookedSlots = async () => {
    try {
      const res = await api.get(`/bookings?date=${selectedDate}&sportId=${sportId}`);
      setBookedSlots(res.data || []);
    } catch (err) { console.error(err); }
  };

  const checkConflict = () => {
    if (!selectedFacility || !selectedDate || !selectedStart) { setConflictMsg(''); return; }
    const fullName = `${selectedFacility.name} - Sân ${selectedCourtNum}`;
    const startF = timeToFloat(selectedStart);
    const endF = timeToFloat(selectedEnd);
    const conflict = bookedSlots.find(b => {
      if (b.facilityName !== fullName || b.status === 'cancelled' || b.status === 'pending_payment') return false;
      const bStart = timeToFloat((b.startTime || '00:00').substring(0, 5));
      const bEnd = timeToFloat((b.endTime || '00:00').substring(0, 5));
      return startF < bEnd && endF > bStart;
    });
    setConflictMsg(conflict ? `⚠️ Sân này đã có lịch đặt từ ${(conflict.startTime || '').substring(0, 5)} – ${(conflict.endTime || '').substring(0, 5)}` : '');
  };

  const isPastTimeSelected = () => isTimePast(selectedStart);

  const handleSubmit = async () => {
    if (!selectedFacility) return setMessage({ type: 'error', text: 'Vui lòng chọn sân' });
    if (!selectedDate) return setMessage({ type: 'error', text: 'Vui lòng chọn ngày' });
    if (isPastTimeSelected()) return setMessage({ type: 'error', text: 'Thời gian đã qua, vui lòng chọn thời gian khác' });
    if (conflictMsg) return setMessage({ type: 'error', text: 'Sân đã được đặt trong khung giờ này' });

    setSubmitting(true);
    setMessage({ type: '', text: '' });

    const bookingData = {
      sportId: Number(sportId),
      facilityName: `${selectedFacility.name} - Sân ${selectedCourtNum}`,
      facilityAddress: selectedFacility.address,
      facilityPhone: selectedFacility.phone,
      customerName: user?.name || '',
      customerPhone: user?.phone || '',
      customerEmail: user?.email || '',
      date: selectedDate,
      startTime: selectedStart,
      endTime: selectedEnd,
      duration: selectedDuration,
      totalPrice,
      notes,
    };

    try {
      const amountToPay = paymentPlan === 'pay_50' ? Math.round(totalPrice / 2) : totalPrice;
      const paymentData = {
        ...bookingData,
        paymentPlan,
        amountToPay,
      };

      if (paymentMethod === 'vnpay') {
        const res = await api.post('/payment/create_payment_url', paymentData);
        window.location.href = res.data.paymentUrl;
      } else if (paymentMethod === 'momo') {
        const res = await api.post('/payment/create_momo_url', paymentData);
        window.location.href = res.data.paymentUrl;
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600 font-medium">Đang tải...</p>
        </div>
      </div>
    );
  }

  const courtCount = selectedFacility?.courtCount || 1;
  const courts = Array.from({ length: courtCount }, (_, i) => i + 1);

  // ── Schedule grid helpers ──────────────────────────────────
  const HOURS = Array.from({ length: 17 }, (_, i) => 5 + i); // 05–21

  const getBookingForHour = (h) => {
    if (!selectedFacility) return null;
    const fullName = `${selectedFacility.name} - Sân ${selectedCourtNum}`;
    return bookedSlots.find(b => {
      if (b.facilityName !== fullName || b.status === 'cancelled' || b.status === 'pending_payment') return false;
      const bS = timeToFloat((b.startTime || '00:00').substring(0, 5));
      const bE = timeToFloat((b.endTime || '00:00').substring(0, 5));
      return h < bE && h + 1 > bS;
    }) || null;
  };

  const isHourSelected = (h) => {
    const selS = timeToFloat(selectedStart);
    const selE = timeToFloat(selectedEnd);
    return h < selE && h + 1 > selS;
  };

  const isHourPast = (h) => {
    if (!selectedDate || selectedDate > today) return false;
    if (selectedDate < today) return true;
    return h < (now.getHours() + now.getMinutes() / 60);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 pb-8">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">

          {/* ── LEFT: Booking Form ── */}
          <div>
            {/* Header */}
            <div className="mb-6">
              <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-blue-600 font-medium flex items-center gap-1 mb-3 text-sm transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Quay lại
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl">🏟️</div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Đặt Sân</h1>
                  <p className="text-gray-500 text-sm">{sport?.nameVi || sport?.name}</p>
                </div>
              </div>
            </div>

            {/* Message */}
            {message.text && (
              <div className={`mb-4 p-4 rounded-xl font-medium text-sm flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                <span>{message.type === 'success' ? '✅' : '❌'}</span>
                {message.text}
              </div>
            )}

            {/* Form Card */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
                <h2 className="text-white font-bold text-lg">Thông tin đặt sân</h2>
              </div>

              <div className="p-6 space-y-5">
                {/* 1. Facility */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">🏟️ Sân đặt</label>
                  {facilities.length === 0 ? (
                    <p className="text-red-500 text-sm">Không có sân nào cho môn này.</p>
                  ) : facilityIdParam ? (
                    <div className="w-full px-4 py-3 border-2 border-blue-300 bg-blue-50 rounded-xl flex items-center gap-3">
                      <span className="text-blue-600 text-lg">📍</span>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{selectedFacility?.name}</p>
                        <p className="text-xs text-gray-500 truncate">{selectedFacility?.address}</p>
                      </div>
                      <span className="ml-auto text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium whitespace-nowrap flex-shrink-0">Đã chọn</span>
                    </div>
                  ) : (
                    <select
                      value={selectedFacilityId}
                      onChange={e => setSelectedFacilityId(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 text-gray-800 font-medium"
                    >
                      {facilities.map(f => (
                        <option key={f.id} value={String(f.id)}>{f.name} — {f.address}</option>
                      ))}
                    </select>
                  )}
                </div>

                {/* 2. Court number */}
                {courtCount > 1 && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">🏓 Chọn sân con</label>
                    <div className="flex flex-wrap gap-2">
                      {courts.map(c => (
                        <button
                          key={c}
                          onClick={() => setSelectedCourtNum(c)}
                          className={`px-5 py-2 rounded-xl font-semibold text-sm transition-all border-2 ${selectedCourtNum === c ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'}`}
                        >
                          Sân {c}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Date */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">📅 Chọn ngày</label>
                  <input
                    type="date"
                    value={selectedDate}
                    min={today}
                    onChange={e => setSelectedDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 text-gray-800 font-medium"
                  />
                  {selectedDate && (
                    <p className="text-xs text-gray-400 mt-1 ml-1">
                      {format(parseISO(selectedDate), 'EEEE, dd MMMM yyyy', { locale: vi })}
                    </p>
                  )}
                </div>

                {/* 4. Start + Duration */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">⏰ Giờ bắt đầu</label>
                    <select
                      value={selectedStart}
                      onChange={e => setSelectedStart(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 text-gray-800 font-medium"
                    >
                      {START_TIMES.map(t => {
                        const past = isTimePast(t);
                        return (
                          <option key={t} value={t} disabled={past} style={past ? { color: '#aaa' } : {}}>
                            {t}{past ? ' (đã qua)' : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">⏱️ Số giờ chơi</label>
                    <select
                      value={selectedDuration}
                      onChange={e => setSelectedDuration(Number(e.target.value))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 text-gray-800 font-medium"
                    >
                      {DURATIONS.map(d => <option key={d} value={d}>{d === 0.5 ? '30 phút' : d === 1 ? '1 giờ' : `${d} giờ`}</option>)}
                    </select>
                  </div>
                </div>

                {/* Price table */}
                {selectedFacility && (
                  <div className="rounded-xl border border-gray-200 overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 flex justify-between text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-200">
                      <span>Khung giờ</span>
                      <span>Giá/Giờ</span>
                    </div>
                    {(selectedFacility.pricingSchedule && selectedFacility.pricingSchedule.length > 0) ? (
                      selectedFacility.pricingSchedule.map((tier, idx) => {
                        // Check if current selectedStart falls in this tier
                        const tF = (t) => { const [h, m] = t.split(':').map(Number); return h + m / 60; };
                        const selF = tF(selectedStart);
                        const inTier = selF >= tF(tier.startTime) && selF < tF(tier.endTime);
                        return (
                          <div
                            key={idx}
                            className={`flex items-center justify-between px-4 py-3 border-b border-gray-100 last:border-0 text-sm ${inTier ? 'bg-blue-500 text-white font-bold' : 'text-gray-700'}`}
                          >
                            <span className={inTier ? 'text-blue-100' : 'text-gray-500'}>
                              {tier.startTime} – {tier.endTime}
                            </span>
                            <span className={`font-semibold ${inTier ? 'text-white' : 'text-blue-700'}`}>
                              {Number(tier.price).toLocaleString('vi-VN')}đ
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <div className="flex items-center justify-between px-4 py-3 text-sm text-gray-700">
                        <span className="text-gray-500">Cả ngày</span>
                        <span className="font-semibold text-blue-700">{pricePerHour.toLocaleString('vi-VN')}đ</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Warnings */}
                {conflictMsg && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-amber-800 text-sm font-medium">{conflictMsg}</div>
                )}
                {isPastTimeSelected() && (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm font-medium">⚠️ Khung giờ này đã qua, vui lòng chọn giờ khác.</div>
                )}

                {/* 5. Notes */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">📝 Ghi chú (tùy chọn)</label>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={2}
                    placeholder="Yêu cầu đặc biệt, số lượng người chơi..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 text-gray-800 text-sm resize-none"
                  />
                </div>

                {/* 6. Payment Plan */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">💰 Gói thanh toán</label>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <button
                      type="button"
                      onClick={() => setPaymentPlan('pay_50')}
                      className={`relative p-4 rounded-xl border-2 transition-all duration-200 text-left ${paymentPlan === 'pay_50'
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                    >
                      {paymentPlan === 'pay_50' && (
                        <span className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                      )}
                      <span className="text-2xl block mb-1">💵</span>
                      <span className="font-semibold text-gray-800 text-sm block">Trả trước 50%</span>
                      <span className="text-xs text-gray-500">50% còn lại thanh toán tại sân</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentPlan('pay_100')}
                      className={`relative p-4 rounded-xl border-2 transition-all duration-200 text-left ${paymentPlan === 'pay_100'
                          ? 'border-green-500 bg-green-50 shadow-md'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                    >
                      {paymentPlan === 'pay_100' && (
                        <span className="absolute top-2 right-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                      )}
                      <span className="text-2xl block mb-1">✅</span>
                      <span className="font-semibold text-gray-800 text-sm block">Thanh toán 100%</span>
                      <span className="text-xs text-gray-500">Thanh toán toàn bộ trước</span>
                    </button>
                  </div>

                  {/* 7. Payment Gateway */}
                  <label className="block text-sm font-semibold text-gray-700 mb-3">💳 Phương thức thanh toán</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('vnpay')}
                      className={`relative p-4 rounded-xl border-2 transition-all duration-200 text-left ${paymentMethod === 'vnpay'
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                    >
                      {paymentMethod === 'vnpay' && (
                        <span className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                      )}
                      <span className="text-2xl block mb-1">💳</span>
                      <span className="font-semibold text-gray-800 text-sm block">VNPay</span>
                      <span className="text-xs text-gray-500">ATM / Visa / QR</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('momo')}
                      className={`relative p-4 rounded-xl border-2 transition-all duration-200 text-left ${paymentMethod === 'momo'
                          ? 'border-pink-500 bg-pink-50 shadow-md'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                    >
                      {paymentMethod === 'momo' && (
                        <span className="absolute top-2 right-2 w-5 h-5 bg-pink-500 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                      )}
                      <span className="text-2xl block mb-1">📱</span>
                      <span className="font-semibold text-gray-800 text-sm block">MoMo</span>
                      <span className="text-xs text-gray-500">Ví điện tử</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Footer: Price + Submit */}
              <div className="border-t border-gray-100 bg-gray-50 px-6 py-5">
                {user && (
                  <div className="flex items-center gap-3 mb-4 text-sm text-gray-600">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {user.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div>
                      <span className="font-semibold text-gray-800">{user.name}</span>
                      <span className="mx-1.5 text-gray-400">·</span>
                      <span>{user.phone || user.email}</span>
                    </div>
                  </div>
                )}

                {selectedFacility && (
                  <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1.5">
                      <span>{pricePerHour.toLocaleString('vi-VN')}đ/giờ × {selectedDuration === 0.5 ? '0.5 giờ' : `${selectedDuration} giờ`}</span>
                      <span className="font-medium">{totalPrice.toLocaleString('vi-VN')}đ</span>
                    </div>
                    {paymentPlan === 'pay_50' && (
                      <>
                        <div className="flex justify-between text-sm text-blue-600 mb-1.5">
                          <span>💵 Thanh toán trước (50%)</span>
                          <span className="font-semibold">{Math.round(totalPrice / 2).toLocaleString('vi-VN')}đ</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-400 mb-1.5">
                          <span>🏟️ Thanh toán tại sân (50%)</span>
                          <span>{(totalPrice - Math.round(totalPrice / 2)).toLocaleString('vi-VN')}đ</span>
                        </div>
                      </>
                    )}
                    <div className="border-t border-gray-100 pt-2 mt-2 flex justify-between items-center">
                      <span className="font-bold text-gray-800">Thanh toán ngay</span>
                      <span className="text-2xl font-bold text-blue-700">
                        {(paymentPlan === 'pay_50' ? Math.round(totalPrice / 2) : totalPrice).toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={submitting || !!conflictMsg || isPastTimeSelected() || !selectedFacility}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-bold py-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl disabled:cursor-not-allowed text-lg"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                      </svg>
                      Đang xử lý...
                    </span>
                  ) : '🏟️ Xác Nhận Đặt Sân'}
                </button>
              </div>
            </div>
          </div>{/* /left column */}

          {/* ── RIGHT: Schedule Grid ── */}
          <div className="lg:sticky lg:top-6">
            <div className="bg-white rounded-2xl shadow-lg p-4">
              {/* Header */}
              <h3 className="font-bold text-gray-800 text-base mb-0.5">
                Khung giờ{selectedDate ? ` — ${new Date(selectedDate + 'T00:00:00').toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}` : ''}
              </h3>
              {selectedFacility && (
                <p className="text-xs text-gray-400 mb-3">
                  {selectedFacility.name}{courtCount > 1 ? ` · Sân ${selectedCourtNum}` : ''}
                </p>
              )}

              {/* Legend */}
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500 mb-3 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded border border-blue-300 bg-blue-50 flex-shrink-0"></span>Trống</div>
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded border border-yellow-400 bg-yellow-100 flex-shrink-0"></span>Chờ XN</div>
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded border border-pink-400 bg-pink-100 flex-shrink-0"></span>Đã XN</div>
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-indigo-500 flex-shrink-0"></span>Bạn chọn</div>
              </div>

              {/* Time grid */}
              {!selectedFacility ? (
                <p className="text-center text-gray-400 text-sm py-6">Vui lòng chọn sân</p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {HOURS.map(h => {
                    const label = `${String(h).padStart(2, '0')}:00`;
                    const booking = getBookingForHour(h);
                    const sel = isHourSelected(h);
                    const past = isHourPast(h);

                    let cls = 'relative rounded-xl border-2 py-3 text-center text-sm font-bold transition-all select-none ';
                    let icon = null;

                    if (booking) {
                      if (booking.status === 'confirmed') {
                        cls += 'bg-pink-50 border-pink-300 text-pink-700';
                      } else {
                        cls += 'bg-yellow-50 border-yellow-300 text-yellow-700';
                      }
                      icon = <span className="absolute top-0.5 right-1 text-[10px]">📌</span>;
                    } else if (sel && !past) {
                      cls += 'bg-indigo-500 border-indigo-500 text-white shadow-md';
                    } else if (past) {
                      cls += 'bg-gray-50 border-gray-200 text-gray-300';
                    } else {
                      cls += 'bg-blue-50 border-blue-200 text-blue-700 hover:border-blue-400 hover:bg-blue-100 cursor-pointer';
                    }

                    const tooltip = booking
                      ? `${booking.customerName} (${(booking.startTime || '').slice(0, 5)}–${(booking.endTime || '').slice(0, 5)})`
                      : label;

                    return (
                      <div key={h} className={cls} title={tooltip}>
                        {icon}
                        {label}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>{/* /right column */}

        </div>{/* /grid */}
      </div>{/* /container */}
    </div>
  );
};

export default Booking;
