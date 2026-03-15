import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const PaymentResult = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);

  useEffect(() => {
    const success = searchParams.get('success') === '1';
    const responseCode = searchParams.get('vnp_ResponseCode');
    const txnRef = searchParams.get('vnp_TxnRef');
    const amount = searchParams.get('vnp_Amount');
    const message = searchParams.get('message');
    const method = searchParams.get('method') || 'vnpay';

    setResult({ success, responseCode, txnRef, amount, message, method });
  }, [searchParams]);

  if (!result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600 font-medium">Đang xử lý kết quả thanh toán...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className={`px-8 py-8 text-center ${
          result.success
            ? 'bg-gradient-to-r from-green-500 to-emerald-600'
            : 'bg-gradient-to-r from-red-500 to-rose-600'
        }`}>
          <div className="w-20 h-20 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
            {result.success ? (
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">
            {result.success ? 'Thanh toán thành công!' : 'Thanh toán thất bại'}
          </h1>
          <p className="text-white/80 text-sm">
            {result.success
              ? 'Đơn đặt sân của bạn đã được xác nhận'
              : 'Giao dịch không thành công, vui lòng thử lại'}
          </p>
        </div>

        {/* Details */}
        <div className="px-8 py-6">
          {result.txnRef && (
            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-500 text-sm">Mã giao dịch</span>
                <span className="font-mono font-semibold text-gray-800 text-sm">{result.txnRef}</span>
              </div>
              {result.amount && (
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-500 text-sm">Số tiền</span>
                  <span className="font-bold text-blue-700 text-lg">
                    {Number(result.amount).toLocaleString('vi-VN')}đ
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-500 text-sm">Trạng thái</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  result.success
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {result.success ? '✅ Đã thanh toán' : '❌ Thất bại'}
                </span>
              </div>
              {result.responseCode && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-500 text-sm">Mã phản hồi VNPay</span>
                  <span className="font-mono text-sm text-gray-600">{result.responseCode}</span>
                </div>
              )}
            </div>
          )}

          {result.success && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
              <p className="text-green-800 text-sm font-medium">
                📧 Email xác nhận đã được gửi đến hộp thư của bạn.
              </p>
            </div>
          )}

          {!result.success && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              <p className="text-amber-800 text-sm font-medium">
                💡 Bạn có thể thử lại hoặc chọn thanh toán tại sân.
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="space-y-3">
            <button
              onClick={() => navigate('/bookings')}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3.5 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              📋 Xem lịch đặt sân
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl transition-all duration-200"
            >
              🏠 Về trang chủ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentResult;
