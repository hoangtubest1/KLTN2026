import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Sidebar = () => {
    const [sports, setSports] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchSports();
    }, []);

    const fetchSports = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/sports');
            setSports(response.data);
        } catch (error) {
            console.error('Error fetching sports:', error);
        }
    };

    const handleSportClick = (sportId) => {
        navigate(`/booking/${sportId}`);
        setIsOpen(false); // Close mobile sidebar after selection
    };

    return (
        <>
            {/* Mobile Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="xl:hidden fixed top-24 left-4 z-50 bg-blue-600 text-white p-3 rounded-lg shadow-lg hover:bg-blue-700 transition-colors"
                aria-label="Toggle sidebar"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {isOpen ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    )}
                </svg>
            </button>

            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="xl:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
          fixed xl:sticky top-20 left-0 h-[calc(100vh-5rem)] z-40
          w-64 bg-white shadow-xl
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full xl:translate-x-0'}
          overflow-y-auto
        `}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
                    <h2 className="text-white font-bold text-lg">Danh sách sân bãi</h2>
                </div>

                {/* Sports List */}
                <nav className="p-4">
                    <div className="mb-4">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">
                            Bộ lọc
                        </h3>

                        {/* All Sports Option */}
                        <Link
                            to="/"
                            className="block px-4 py-3 mb-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-all duration-200 font-medium"
                            onClick={() => setIsOpen(false)}
                        >
                            <span className="flex items-center gap-3">
                                <span className="text-xl">🏆</span>
                                <span>Tất cả môn</span>
                            </span>
                        </Link>
                    </div>

                    <div className="border-t border-gray-200 pt-4">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">
                            Môn thể thao
                        </h3>

                        {sports.length === 0 ? (
                            <div className="px-4 py-8 text-center text-gray-400">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                                <p className="text-sm">Đang tải...</p>
                            </div>
                        ) : (
                            <ul className="space-y-1">
                                {sports.map((sport) => (
                                    <li key={sport._id}>
                                        <button
                                            onClick={() => handleSportClick(sport._id)}
                                            className="w-full text-left px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-all duration-200 flex items-center gap-3 group"
                                        >
                                            <span className="text-2xl group-hover:scale-110 transition-transform">
                                                {sport.emoji || '⚽'}
                                            </span>
                                            <span className="font-medium">{sport.nameVi || sport.name}</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Additional Info */}
                    <div className="mt-6 p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-100">
                        <p className="text-xs text-gray-600 leading-relaxed">
                            💡 <span className="font-semibold">Mẹo:</span> Chọn môn thể thao để xem danh sách sân và đặt lịch nhanh chóng!
                        </p>
                    </div>
                </nav>
            </aside>
        </>
    );
};

export default Sidebar;
