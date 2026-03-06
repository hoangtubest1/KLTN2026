import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center px-4">
            <div className="text-center max-w-md">
                <div className="text-8xl mb-6 animate-bounce">🏟️</div>
                <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
                <h2 className="text-2xl font-semibold text-gray-700 mb-4">Trang không tồn tại</h2>
                <p className="text-gray-500 mb-8">
                    Xin lỗi, trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        to="/"
                        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                        🏠 Về Trang Chủ
                    </Link>
                    <Link
                        to="/fields"
                        className="bg-white text-gray-700 font-semibold py-3 px-6 rounded-xl hover:bg-gray-50 transition-all duration-300 shadow-md border border-gray-200"
                    >
                        🔍 Tìm Sân
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default NotFound;
