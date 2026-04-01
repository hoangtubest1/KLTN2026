import React from 'react';
import { useNavigate } from 'react-router-dom';
import { resolveMediaUrl } from '../utils/mediaUrl';

const FieldCard = ({ facility }) => {
    const navigate = useNavigate();

    const handleViewDetails = () => {
        navigate(`/facility/${facility.id}`);
    };

    return (
        <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            {/* Facility Image */}
            <div className="relative h-48 bg-gradient-to-br from-blue-100 to-purple-100 overflow-hidden">
                {facility.image ? (
                    <img
                        src={resolveMediaUrl(facility.image)}
                        alt={facility.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = 'https://via.placeholder.com/400x300/22b84c/FFFFFF?text=S%C3%A2n';
                        }}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <img
                            src="https://via.placeholder.com/400x300/4F46E5/FFFFFF?text=Sân+Thể+Thao"
                            alt="Placeholder"
                            className="w-full h-full object-cover"
                        />
                    </div>
                )}
                {/* Badge */}
                <div className={`absolute top-3 left-3 ${facility.status === 'active' ? 'bg-green-500' : 'bg-red-500'} text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1`}>
                    <span>●</span>
                    <span>{facility.status === 'active' ? 'Đang hoạt động' : 'Ngừng hoạt động'}</span>
                </div>
            </div>

            {/* Facility Info */}
            <div className="p-5">
                <h3 className="text-lg font-bold text-gray-900 mb-3 line-clamp-1">
                    {facility.name}
                </h3>

                <div className="space-y-2 mb-4">
                    {/* Phone */}
                    <div className="flex items-start gap-2 text-sm text-gray-600">
                        <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <span>{facility.phone || 'Chưa có số điện thoại'}</span>
                    </div>

                    {/* Address */}
                    <div className="flex items-start gap-2 text-sm text-gray-600">
                        <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="line-clamp-2">{facility.address || 'Chưa có địa chỉ'}</span>
                    </div>
                </div>

                {/* View Details Button */}
                <button
                    onClick={handleViewDetails}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-2.5 px-4 rounded-lg font-semibold transition-all duration-300 shadow-md hover:shadow-lg"
                >
                    Chi tiết
                </button>
            </div>
        </div>
    );
};

export default FieldCard;
