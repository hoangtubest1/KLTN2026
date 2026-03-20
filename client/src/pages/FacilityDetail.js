import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api';
import ReviewSection from '../components/ReviewSection';

const FacilityDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [facility, setFacility] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchFacility();
    }, [id]);

    const fetchFacility = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/facilities/${id}`);
            setFacility(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching facility:', error);
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-gray-600 font-medium">Đang tải thông tin sân...</p>
                </div>
            </div>
        );
    }

    if (!facility) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl mb-4">😔</div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Không tìm thấy sân bãi</h2>
                    <Link to="/fields" className="text-blue-600 hover:underline font-medium">← Quay lại danh sách</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Back Button */}
                <button
                    onClick={() => navigate(-1)}
                    className="mb-6 flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors font-medium"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Quay lại
                </button>

                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    {/* Hero Image */}
                    <div className="relative h-64 sm:h-80 bg-gradient-to-br from-blue-400 to-purple-500">
                        {facility.image ? (
                            <img src={facility.image} alt={facility.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <div className="text-center text-white">
                                    <div className="text-8xl mb-2">🏟️</div>
                                    <p className="text-lg font-medium opacity-80">{facility.sport?.nameVi || 'Sân thể thao'}</p>
                                </div>
                            </div>
                        )}
                        {/* Status Badge */}
                        <div className={`absolute top-4 right-4 px-4 py-2 rounded-full text-sm font-bold ${facility.status === 'active'
                            ? 'bg-green-500 text-white'
                            : 'bg-red-500 text-white'
                            }`}>
                            {facility.status === 'active' ? '● Đang hoạt động' : '● Tạm đóng'}
                        </div>
                        {/* Sport Badge */}
                        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg">
                            <span className="font-semibold text-gray-900">
                                {facility.sport?.emoji || '⚽'} {facility.sport?.nameVi || facility.sport?.name}
                            </span>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 sm:p-8">
                        {/* Title & Price */}
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                            <h1 className="text-3xl font-bold text-gray-900">{facility.name}</h1>
                            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-5 py-3 rounded-xl text-center flex-shrink-0">
                                <p className="text-sm opacity-90">Giá / giờ</p>
                                <p className="text-2xl font-bold">{Number(facility.pricePerHour).toLocaleString('vi-VN')}đ</p>
                            </div>
                        </div>

                        {/* Info Grid - full width 2x2 */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                            {/* Address */}
                            <div className="bg-gray-50 rounded-xl p-4 flex items-start gap-3">
                                <div className="bg-blue-100 p-2 rounded-lg flex-shrink-0">
                                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 font-medium">Địa chỉ</p>
                                    <p className="text-gray-900 font-semibold">{facility.address}</p>
                                </div>
                            </div>

                            {/* Phone */}
                            <div className="bg-gray-50 rounded-xl p-4 flex items-start gap-3">
                                <div className="bg-green-100 p-2 rounded-lg flex-shrink-0">
                                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 font-medium">Số điện thoại</p>
                                    <p className="text-gray-900 font-semibold">{facility.phone}</p>
                                </div>
                            </div>

                            {/* Sport */}
                            <div className="bg-gray-50 rounded-xl p-4 flex items-start gap-3">
                                <div className="bg-purple-100 p-2 rounded-lg flex-shrink-0">
                                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 font-medium">Môn thể thao</p>
                                    <p className="text-gray-900 font-semibold">{facility.sport?.nameVi || facility.sport?.name}</p>
                                </div>
                            </div>

                            {/* Status */}
                            <div className="bg-gray-50 rounded-xl p-4 flex items-start gap-3">
                                <div className="bg-amber-100 p-2 rounded-lg flex-shrink-0">
                                    <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 font-medium">Trạng thái</p>
                                    <p className={`font-semibold ${facility.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                                        {facility.status === 'active' ? 'Đang hoạt động' : 'Tạm đóng'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Google Maps - full width below info */}
                        <div className="mb-8">
                            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                Bản đồ
                            </h2>
                            <div className="bg-gray-100 rounded-xl overflow-hidden shadow-inner" style={{ height: '320px' }}>
                                <iframe
                                    title="bản đồ"
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0 }}
                                    loading="lazy"
                                    allowFullScreen
                                    src={
                                        facility.mapEmbed
                                            ? (facility.mapEmbed.match(/src="([^"]+)"/) ? facility.mapEmbed.match(/src="([^"]+)"/)[1] : facility.mapEmbed)
                                            : `https://maps.google.com/maps?q=${encodeURIComponent(facility.address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`
                                    }
                                ></iframe>
                            </div>
                        </div>


                        {/* Description */}
                        {facility.description && (
                            <div className="mb-8">
                                <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Mô tả
                                </h2>
                                <div className="bg-blue-50 rounded-xl p-5 text-gray-700 leading-relaxed">
                                    {facility.description}
                                </div>
                            </div>
                        )}

                        {/* Booking Button */}
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={() => navigate(`/booking/${facility.sport?.id || facility.sportId}?facility=${facility.id}`)}
                                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl text-lg flex items-center justify-center gap-2"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Đặt Lịch Ngay
                            </button>
                            <a
                                href={`tel:${facility.phone}`}
                                className="flex-shrink-0 bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl text-lg flex items-center justify-center gap-2"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                Gọi Ngay
                            </a>
                        </div>
                    </div>
                </div>

                {/* Reviews Section */}
                <div className="bg-white rounded-2xl shadow-lg p-8">
                    <ReviewSection facilityId={facility.id} />
                </div>
            </div>
        </div>
    );
};

export default FacilityDetail;
