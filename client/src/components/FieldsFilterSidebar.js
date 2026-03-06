import React, { useState } from 'react';

const FieldsFilterSidebar = ({ sports, selectedSport, onSportSelect, facilityCounts, onFilterChange, filters }) => {
    const [searchText, setSearchText] = useState(filters?.name || '');
    const [minPrice, setMinPrice] = useState(filters?.minPrice || '');
    const [maxPrice, setMaxPrice] = useState(filters?.maxPrice || '');
    const [sortBy, setSortBy] = useState(filters?.sort || '');
    const [gpsLoading, setGpsLoading] = useState(false);
    const [gpsActive, setGpsActive] = useState(!!filters?.lat);

    const handleSearchSubmit = (e) => {
        e?.preventDefault();
        onFilterChange && onFilterChange({ name: searchText, minPrice, maxPrice, sort: sortBy });
    };

    const handleSortChange = (newSort) => {
        setSortBy(newSort);
        onFilterChange && onFilterChange({ name: searchText, minPrice, maxPrice, sort: newSort });
    };

    const handleNearMe = () => {
        if (!navigator.geolocation) {
            alert('Trình duyệt không hỗ trợ GPS');
            return;
        }
        setGpsLoading(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setGpsLoading(false);
                setGpsActive(true);
                setSortBy('distance');
                onFilterChange && onFilterChange({
                    name: searchText, minPrice, maxPrice,
                    sort: 'distance',
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                });
            },
            (error) => {
                setGpsLoading(false);
                alert('Không thể lấy vị trí. Vui lòng cho phép truy cập GPS.');
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const handleClearGps = () => {
        setGpsActive(false);
        setSortBy('');
        onFilterChange && onFilterChange({ name: searchText, minPrice, maxPrice, sort: '', lat: null, lng: null });
    };

    return (
        <div className="bg-white rounded-xl shadow-md overflow-hidden h-fit sticky top-24">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
                <h2 className="text-white font-bold text-lg">🔍 Tìm kiếm nâng cao</h2>
            </div>

            <div className="p-4 space-y-5">
                {/* Text Search */}
                <div>
                    <label className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-2 block">
                        Tìm kiếm
                    </label>
                    <form onSubmit={handleSearchSubmit}>
                        <div className="relative">
                            <input
                                type="text"
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                placeholder="Nhập tên sân hoặc địa chỉ..."
                                className="w-full px-4 py-2.5 pr-10 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
                            />
                            <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </button>
                        </div>
                    </form>
                </div>

                {/* Sport Filter */}
                <div>
                    <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-2">
                        Môn thể thao
                    </h3>

                    <button
                        onClick={() => onSportSelect(null)}
                        className={`w-full text-left px-3 py-2.5 mb-1 rounded-lg transition-all duration-200 font-medium flex items-center justify-between text-sm ${selectedSport === null
                            ? 'bg-blue-50 text-blue-600 border-2 border-blue-500'
                            : 'text-gray-700 hover:bg-gray-50 border-2 border-transparent'
                            }`}
                    >
                        <span className="flex items-center gap-2">
                            <span>🏆</span>
                            <span>Tất cả</span>
                        </span>
                        <span className={`text-xs font-bold ${selectedSport === null ? 'text-blue-600' : 'text-gray-400'}`}>
                            {facilityCounts.total || 0}
                        </span>
                    </button>

                    <ul className="space-y-0.5">
                        {sports.map((sport) => (
                            <li key={sport.id}>
                                <button
                                    onClick={() => onSportSelect(sport.id)}
                                    className={`w-full text-left px-3 py-2.5 rounded-lg transition-all duration-200 flex items-center justify-between text-sm ${selectedSport === sport.id
                                        ? 'bg-blue-50 text-blue-600 border-2 border-blue-500'
                                        : 'text-gray-700 hover:bg-gray-50 border-2 border-transparent'
                                        }`}
                                >
                                    <span className="flex items-center gap-2">
                                        <span className="text-lg">{sport.emoji || '⚽'}</span>
                                        <span className="font-medium">{sport.nameVi || sport.name}</span>
                                    </span>
                                    <span className={`text-xs font-bold ${selectedSport === sport.id ? 'text-blue-600' : 'text-gray-400'}`}>
                                        {facilityCounts[sport.id] || 0}
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-200"></div>

                {/* Price Range */}
                <div>
                    <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-2">
                        💰 Khoảng giá (VNĐ/giờ)
                    </h3>
                    <div className="flex gap-2 items-center">
                        <input
                            type="number"
                            value={minPrice}
                            onChange={(e) => setMinPrice(e.target.value)}
                            placeholder="Từ"
                            className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            step="10000"
                            min="0"
                        />
                        <span className="text-gray-400 font-bold">-</span>
                        <input
                            type="number"
                            value={maxPrice}
                            onChange={(e) => setMaxPrice(e.target.value)}
                            placeholder="Đến"
                            className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            step="10000"
                            min="0"
                        />
                    </div>
                </div>

                {/* Sort */}
                <div>
                    <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-2">
                        📊 Sắp xếp theo
                    </h3>
                    <select
                        value={sortBy}
                        onChange={(e) => handleSortChange(e.target.value)}
                        className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
                    >
                        <option value="">Mặc định</option>
                        <option value="price_asc">Giá thấp → cao</option>
                        <option value="price_desc">Giá cao → thấp</option>
                        <option value="name">Tên A → Z</option>
                        {gpsActive && <option value="distance">Gần nhất</option>}
                    </select>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-200"></div>

                {/* Nearby / GPS */}
                <div>
                    {!gpsActive ? (
                        <button
                            onClick={handleNearMe}
                            disabled={gpsLoading}
                            className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {gpsLoading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Đang lấy vị trí...
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    Tìm sân gần tôi
                                </>
                            )}
                        </button>
                    ) : (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm text-green-700 font-medium">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                Đang hiển thị khoảng cách
                            </div>
                            <button
                                onClick={handleClearGps}
                                className="w-full text-sm text-gray-500 hover:text-red-500 font-medium py-1 transition-colors"
                            >
                                ✕ Tắt tìm gần tôi
                            </button>
                        </div>
                    )}
                </div>

                {/* Apply Button */}
                <button
                    onClick={handleSearchSubmit}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Áp dụng bộ lọc
                </button>
            </div>
        </div>
    );
};

export default FieldsFilterSidebar;
