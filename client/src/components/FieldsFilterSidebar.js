import React from 'react';

const FieldsFilterSidebar = ({ sports, selectedSport, onSportSelect, facilityCounts }) => {
    return (
        <div className="bg-white rounded-xl shadow-md overflow-hidden h-fit sticky top-24">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
                <h2 className="text-white font-bold text-lg">Danh sách sân bãi</h2>
            </div>

            {/* Sports Filter */}
            <div className="p-4">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">
                    Bộ lọc
                </h3>

                {/* All Sports Option */}
                <button
                    onClick={() => onSportSelect(null)}
                    className={`w-full text-left px-4 py-3 mb-2 rounded-lg transition-all duration-200 font-medium flex items-center justify-between ${selectedSport === null
                            ? 'bg-blue-50 text-blue-600 border-2 border-blue-500'
                            : 'text-gray-700 hover:bg-gray-50 border-2 border-transparent'
                        }`}
                >
                    <span className="flex items-center gap-3">
                        <span className="text-xl">🏆</span>
                        <span>Tất cả</span>
                    </span>
                    <span className={`text-sm font-bold ${selectedSport === null ? 'text-blue-600' : 'text-gray-400'}`}>
                        {facilityCounts.total || 0}
                    </span>
                </button>

                <div className="border-t border-gray-200 pt-4 mt-2">
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
                                        onClick={() => onSportSelect(sport._id)}
                                        className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center justify-between ${selectedSport === sport._id
                                                ? 'bg-blue-50 text-blue-600 border-2 border-blue-500'
                                                : 'text-gray-700 hover:bg-gray-50 border-2 border-transparent'
                                            }`}
                                    >
                                        <span className="flex items-center gap-3">
                                            <span className="text-2xl">{sport.emoji || '⚽'}</span>
                                            <span className="font-medium">{sport.nameVi || sport.name}</span>
                                        </span>
                                        <span className={`text-sm font-bold ${selectedSport === sport._id ? 'text-blue-600' : 'text-gray-400'}`}>
                                            {facilityCounts[sport._id] || 0}
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FieldsFilterSidebar;
