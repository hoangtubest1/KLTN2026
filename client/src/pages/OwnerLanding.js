import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const OwnerLanding = () => {
  const { user } = useAuth();

  return (
    <section className="min-h-[80vh] bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="text-center mb-10">
          <span className="inline-flex items-center rounded-full bg-orange-100 text-orange-700 text-xs font-semibold px-3 py-1 mb-4">
            🏟️ Dành cho chủ sân
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Quản lý sân bãi dễ dàng với TÌM SÂN
          </h1>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto">
            Đăng ký tài khoản chủ sân để quản lý sân bãi, theo dõi lịch đặt, xem thống kê doanh thu và nhiều hơn nữa.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
          {[
            { icon: '🏟️', title: 'Quản lý sân', desc: 'Thêm, sửa, xóa thông tin sân bãi của bạn' },
            { icon: '📅', title: 'Quản lý đặt sân', desc: 'Xem và duyệt lịch đặt sân từ khách hàng' },
            { icon: '⭐', title: 'Quản lý bình luận', desc: 'Theo dõi đánh giá từ người dùng' },
            { icon: '📈', title: 'Thống kê doanh thu', desc: 'Biểu đồ doanh thu theo ngày, tháng, năm' },
            { icon: '📥', title: 'Xuất báo cáo', desc: 'Xuất dữ liệu booking ra file CSV/Excel' },
            { icon: '🤖', title: 'Chatbot AI', desc: 'Trợ lý AI hỗ trợ thống kê nhanh' },
          ].map((f, i) => (
            <div key={i} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-bold text-gray-900 mb-1">{f.title}</h3>
              <p className="text-sm text-gray-500">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="bg-white rounded-2xl border border-blue-100 shadow-lg p-8 text-center">
          {user?.role === 'owner' && user?.ownerStatus === 'approved' ? (
            <>
              <div className="text-4xl mb-3">✅</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Tài khoản đã được duyệt!</h2>
              <p className="text-gray-500 mb-5">Bạn có thể truy cập dashboard để quản lý sân bãi.</p>
              <Link
                to="/owner-dashboard"
                className="inline-block px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg"
              >
                🏟️ Vào Dashboard Chủ Sân
              </Link>
            </>
          ) : user?.role === 'owner' && user?.ownerStatus === 'pending' ? (
            <>
              <div className="text-4xl mb-3">⏳</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Đang chờ duyệt</h2>
              <p className="text-gray-500">Tài khoản chủ sân của bạn đang được admin xem xét. Vui lòng chờ.</p>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Bắt đầu ngay hôm nay!</h2>
              <p className="text-gray-500 mb-6">Đăng ký tài khoản chủ sân miễn phí và bắt đầu quản lý sân bãi của bạn.</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  to="/register-owner"
                  className="inline-block px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg"
                >
                  📝 Đăng ký Chủ Sân
                </Link>
                <a
                  href="tel:+84123456789"
                  className="inline-block px-8 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all"
                >
                  📞 Liên hệ tư vấn
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default OwnerLanding;
