import React from 'react';
import { Link } from 'react-router-dom';

const OwnerLanding = () => {
  return (
    <section className="min-h-[70vh] bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="bg-white rounded-2xl border border-blue-100 shadow-md p-6 sm:p-10">
          <p className="inline-flex items-center rounded-full bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1">
            Dành cho chủ sân
          </p>
          <h1 className="mt-4 text-2xl sm:text-3xl font-bold text-slate-900">
            Trang dành cho chủ sân đang được hoàn thiện
          </h1>
          <p className="mt-4 text-slate-600 leading-relaxed">
            Bạn vẫn có thể liên hệ đội ngũ TìmSân để nhận tư vấn mở sân, quản lý lịch đặt và tích hợp thanh toán.
          </p>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a
              href="tel:+84123456789"
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 text-white font-semibold px-4 py-3 hover:bg-blue-700 transition-colors"
            >
              Gọi 0123 456 789
            </a>
            <a
              href="mailto:info@timsan.com?subject=Tu%20van%20cho%20chu%20san"
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 text-slate-700 font-semibold px-4 py-3 hover:bg-slate-50 transition-colors"
            >
              Gửi email tư vấn
            </a>
          </div>

          <div className="mt-8 pt-5 border-t border-slate-200">
            <Link
              to="/fields"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Xem danh sách sân hiện có ->
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default OwnerLanding;
