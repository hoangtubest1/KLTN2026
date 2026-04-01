import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { resolveMediaUrl } from '../utils/mediaUrl';
import { format, parseISO, parse } from 'date-fns';
import { vi } from 'date-fns/locale';

const timeToFloat = (timeStr) => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h + m / 60;
};

const Booking = () => {
  const { sportId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const facilityId = searchParams.get('facility');
  const dateStr = searchParams.get('date');
  const startStr = searchParams.get('start');
  const endStr = searchParams.get('end');

  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Form states
  const [notes, setNotes] = useState('');
  const [paymentPlan, setPaymentPlan] = useState('pay_100');
  const [paymentMethod, setPaymentMethod] = useState('vnpay');
  
  // Coupon states
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponMessage, setCouponMessage] = useState({ type: '', text: '' });

  const selectedFacility = facilities.find(f => String(f.id) === String(facilityId));

  // Computed details
  const duration = (timeToFloat(endStr) - timeToFloat(startStr)) || 1;
  const pricePerHour = selectedFacility ? Number(selectedFacility.pricePerHour) : 0;
  const totalPrice = pricePerHour * duration;

  useEffect(() => {
    if (sportId) fetchData();
  }, [sportId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/facilities/sport/${sportId}`);
      setFacilities(res.data);
    } catch (err) {
      console.error('Error fetching facility:', err);
      setMessage({ type: 'error', text: 'Không thể tải thông tin sân. Vui lòng thử lại.' });
    } finally {
      setLoading(false);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponMessage({ type: 'error', text: 'Vui lòng nhập mã giảm giá' });
      return;
    }

    setCouponLoading(true);
    setCouponMessage({ type: '', text: '' });

    try {
      const res = await api.post('/coupons/validate', {
        code: couponCode.trim().toUpperCase(),
        totalPrice: totalPrice
      });

      setAppliedCoupon(res.data);
      setDiscountAmount(res.data.discountAmount);
      setCouponMessage({ type: 'success', text: res.data.message });
      setCouponCode(res.data.couponCode); // Format string
    } catch (err) {
      setAppliedCoupon(null);
      setDiscountAmount(0);
      setCouponMessage({ type: 'error', text: err.response?.data?.message || 'Lỗi kiểm tra mã giảm giá' });
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setCouponCode('');
    setAppliedCoupon(null);
    setDiscountAmount(0);
    setCouponMessage({ type: '', text: '' });
  };

  const handleSubmit = async () => {
    if (!selectedFacility || !dateStr || !startStr || !endStr) {
      return setMessage({ type: 'error', text: 'Thiếu thông tin đặt sân. Vui lòng quay lại chọn lại.' });
    }

    setSubmitting(true);
    setMessage({ type: '', text: '' });

    const finalTotalPrice = Math.max(0, totalPrice - discountAmount);
    const amountToPay = paymentPlan === 'pay_50' ? Math.round(finalTotalPrice / 2) : finalTotalPrice;
    
    const bookingData = {
      sportId: Number(sportId),
      facilityName: `${selectedFacility.name}`, // Bỏ số sân con đi cho đơn giản theo UI mới, hoặc mặc định Sân 1
      facilityAddress: selectedFacility.address,
      facilityPhone: selectedFacility.phone,
      customerName: user?.name || '',
      customerPhone: user?.phone || '',
      customerEmail: user?.email || '',
      date: dateStr,
      startTime: startStr,
      endTime: endStr,
      duration,
      totalPrice,
      notes,
      paymentPlan,
      amountToPay: paymentMethod === 'cash' ? 0 : amountToPay,
      paymentMethod,
      couponCode: appliedCoupon ? appliedCoupon.couponCode : null,
      discountAmount: discountAmount
    };

    try {
      if (paymentMethod === 'cash') {
        await api.post('/bookings', bookingData);
        navigate('/profile/bookings', { state: { success: true, message: 'Đặt sân thành công, chờ xác nhận!' } });
      } else if (paymentMethod === 'vnpay') {
        const res = await api.post('/payment/create_payment_url', bookingData);
        window.location.href = res.data.paymentUrl;
      } else if (paymentMethod === 'momo') {
        const res = await api.post('/payment/create_momo_url', bookingData);
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          <p className="mt-4 text-gray-500 font-medium">Đang tải biểu mẫu thanh toán...</p>
        </div>
      </div>
    );
  }

  // Formatting date for display
  let displayDate = dateStr;
  try {
    const d = parseISO(dateStr);
    displayDate = format(d, 'EEEE, dd/MM/yyyy', { locale: vi });
  } catch (e) {}

  const finalTotalPrice = Math.max(0, totalPrice - discountAmount);
  const finalAmountToPay = paymentMethod === 'cash' ? 0 : (paymentPlan === 'pay_50' ? Math.round(finalTotalPrice / 2) : finalTotalPrice);
  const remainingAmount = finalTotalPrice - finalAmountToPay;

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-12 pt-6 font-sans">
      <div className="max-w-[1100px] mx-auto px-4">
        
        {/* Header Back Button & Title */}
        <div className="mb-6">
          <button onClick={() => navigate(-1)} className="text-gray-600 hover:text-green-600 font-medium flex items-center gap-2 mb-4 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Quay lại
          </button>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Thanh toán đặt sân</h1>
        </div>

        {message.text && (
          <div className={`mb-6 p-4 rounded-xl font-medium flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
            <span className="text-xl">{message.type === 'success' ? '✅' : '⚠️'}</span>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 items-start">
          
          {/* LEO CỘT TRÁI */}
          <div className="space-y-6">
            
            {/* 1. Thông tin đặt sân */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-5">Thông tin đặt sân</h2>
              <div className="flex flex-col sm:flex-row gap-5 items-start">
                <div className="w-full sm:w-[180px] h-[120px] rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                  {selectedFacility?.image ? (
                    <img src={resolveMediaUrl(selectedFacility.image)} alt="Sân" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">Không có ảnh</div>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{selectedFacility?.name || 'Sân chưa xác định'}</h3>
                  <div className="flex items-center text-gray-500 text-sm mb-2 gap-2">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                    <span>{selectedFacility?.address || 'Chưa cập nhật'}</span>
                  </div>
                  <div className="flex items-center text-gray-500 text-sm mb-3 gap-2 capitalize">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    <span>{displayDate}</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 font-semibold text-sm rounded-lg border border-green-100">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    {startStr} - {endStr}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Thông tin người đặt */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-5">Thông tin người đặt</h2>
              <div className="space-y-5 flex flex-col">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <input type="text" value={user?.name || ''} readOnly className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-800 font-medium focus:outline-none" placeholder="Nhập họ và tên" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                    Số điện thoại <span className="text-red-500">*</span>
                  </label>
                  <input type="text" value={user?.phone || ''} readOnly className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-800 font-medium focus:outline-none" placeholder="Nhập số điện thoại" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                    Ghi chú
                  </label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} rows="3" className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none transition-shadow" placeholder="Ghi chú thêm (không bắt buộc)" />
                </div>
              </div>
            </div>

            {/* Phương thức thanh toán && Tỷ lệ */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              
              <div className="flex justify-between items-end mb-5">
                <h2 className="text-lg font-bold text-gray-900">Phương thức thanh toán</h2>
                
                {/* Tỉ lệ thanh toán đặt góc phải (Chỉ hữu ích cho thanh toán online) */}
                <div className="flex bg-gray-100 p-1 rounded-lg">
                  <button onClick={() => setPaymentPlan('pay_100')} className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${paymentPlan === 'pay_100' ? 'bg-white shadow text-green-700' : 'text-gray-500 hover:text-gray-700'}`}>100%</button>
                  <button onClick={() => setPaymentPlan('pay_50')} className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${paymentPlan === 'pay_50' ? 'bg-white shadow text-green-700' : 'text-gray-500 hover:text-gray-700'}`}>Cọc 50%</button>
                </div>
              </div>

              <div className="space-y-3">
                {/* Option: Tiền mặt */}
                <label onClick={() => setPaymentMethod('cash')} className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === 'cash' ? 'border-green-500 bg-green-50/50 ring-1 ring-green-500' : 'border-gray-200 hover:border-green-300'}`}>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-4 flex-shrink-0 ${paymentMethod === 'cash' ? 'border-green-500' : 'border-gray-300'}`}>
                    {paymentMethod === 'cash' && <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>}
                  </div>
                  <div className="p-2 bg-green-100 text-green-600 rounded-lg mr-4 flex-shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 text-sm">Thanh toán tại sân</div>
                    <div className="text-gray-500 text-xs mt-0.5">Thanh toán trực tiếp khi đến sân</div>
                  </div>
                  {paymentMethod === 'cash' && (
                    <svg className="w-5 h-5 text-green-500 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  )}
                </label>

                {/* Option: MoMo */}
                <label onClick={() => setPaymentMethod('momo')} className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === 'momo' ? 'border-green-500 bg-green-50/50 ring-1 ring-green-500' : 'border-gray-200 hover:border-green-300'}`}>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-4 flex-shrink-0 ${paymentMethod === 'momo' ? 'border-green-500' : 'border-gray-300'}`}>
                    {paymentMethod === 'momo' && <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>}
                  </div>
                  <div className="p-2 bg-pink-100 text-pink-600 rounded-lg mr-4 flex-shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 text-sm">Thanh toán MoMo</div>
                    <div className="text-gray-500 text-xs mt-0.5">Thanh toán qua ví điện tử MoMo</div>
                  </div>
                  {paymentMethod === 'momo' && (
                    <svg className="w-5 h-5 text-green-500 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  )}
                </label>

                {/* Option: VNPay */}
                <label onClick={() => setPaymentMethod('vnpay')} className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === 'vnpay' ? 'border-green-500 bg-green-50/50 ring-1 ring-green-500' : 'border-gray-200 hover:border-green-300'}`}>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-4 flex-shrink-0 ${paymentMethod === 'vnpay' ? 'border-green-500' : 'border-gray-300'}`}>
                    {paymentMethod === 'vnpay' && <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>}
                  </div>
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-lg mr-4 flex-shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 text-sm">Thanh toán VNPay</div>
                    <div className="text-gray-500 text-xs mt-0.5">Thanh toán qua cổng VNPay</div>
                  </div>
                  {paymentMethod === 'vnpay' && (
                    <svg className="w-5 h-5 text-green-500 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  )}
                </label>
              </div>

            </div>
          </div>

          {/* CỘT PHẢI (Sticky) */}
          <div className="lg:sticky lg:top-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-5 border-b border-gray-100 pb-4">Tóm tắt đơn hàng</h2>
              
              <div className="flex gap-4 items-center mb-6">
                <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                  {selectedFacility?.image && (
                    <img src={resolveMediaUrl(selectedFacility.image)} alt="Sân mini" className="w-full h-full object-cover" />
                  )}
                </div>
                <div>
                  <div className="font-bold text-gray-900 text-sm line-clamp-1">{selectedFacility?.name}</div>
                  <div className="text-xs text-gray-500 mt-1">Sân {(selectedFacility?.courtCount || 1) >= 5 ? 5 : 7} người</div>
                </div>
              </div>

              <div className="flex justify-between items-center text-sm font-medium text-gray-700 mb-6 border-b border-gray-100 pb-4">
                <span>{startStr} - {endStr}</span>
                <span>{totalPrice.toLocaleString('vi-VN')}đ</span>
              </div>

              {/* Promo Code section */}
              <div className="mb-6 border-b border-gray-100 pb-6">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg>
                  Mã giảm giá
                </label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    disabled={appliedCoupon || couponLoading}
                    placeholder="NHẬP MÃ GIẢM GIÁ" 
                    className="flex-1 uppercase font-medium text-sm px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500 disabled:bg-gray-100 disabled:text-gray-500" 
                  />
                  {appliedCoupon ? (
                    <button 
                      onClick={removeCoupon}
                      className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors border border-red-200"
                    >
                      Bỏ mã
                    </button>
                  ) : (
                    <button 
                      onClick={handleApplyCoupon}
                      disabled={couponLoading || !couponCode}
                      className="bg-[#10b981] hover:bg-[#059669] disabled:bg-gray-300 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
                    >
                      {couponLoading ? 'Đang kiểm tra...' : 'Áp dụng'}
                    </button>
                  )}
                </div>
                {couponMessage.text && (
                  <div className={`mt-2 text-sm font-medium ${couponMessage.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                    {couponMessage.type === 'success' ? '✓ ' : '⚠ '}
                    {couponMessage.text}
                  </div>
                )}
              </div>

              {/* Totals */}
              <div className="space-y-3 text-sm mb-6">
                <div className="flex justify-between text-gray-500">
                  <span>Tạm tính</span>
                  <span className="font-semibold text-gray-900">{totalPrice.toLocaleString('vi-VN')}đ</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-[#10b981]">
                    <span>Giảm giá ({appliedCoupon.code})</span>
                    <span className="font-semibold">- {discountAmount.toLocaleString('vi-VN')}đ</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-500">
                  <span>Phí dịch vụ</span>
                  <span className="font-semibold text-green-600">Miễn phí</span>
                </div>
                {paymentMethod !== 'cash' && paymentPlan === 'pay_50' && (
                  <div className="flex justify-between text-gray-500 border-t border-dashed border-gray-200 pt-3">
                    <span>Thanh toán trước (50%)</span>
                    <span className="font-semibold text-gray-900">{finalAmountToPay.toLocaleString('vi-VN')}đ</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-lg font-bold text-gray-900 pt-3 border-t border-gray-100">
                  <span>Tổng {paymentMethod !== 'cash' && paymentPlan === 'pay_50' ? 'cần TT' : 'cộng'}</span>
                  <span className="text-[#10b981] text-xl">{finalAmountToPay.toLocaleString('vi-VN')}đ</span>
                </div>
              </div>

              <button 
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full bg-[#10b981] hover:bg-[#059669] disabled:bg-gray-400 text-white font-bold py-3.5 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                    Đang xử lý...
                  </>
                ) : 'Xác nhận thanh toán'}
              </button>
              
              <p className="text-center text-[11px] text-gray-400 mt-4 leading-relaxed">
                Bằng việc đặt sân, bạn đồng ý với <a href="#" className="text-green-600 font-medium hover:underline">điều khoản dịch vụ</a>
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Booking;
