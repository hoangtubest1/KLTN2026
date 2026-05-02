import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api';
import FieldCard from '../components/FieldCard';
import FieldsFilterSidebar from '../components/FieldsFilterSidebar';

const FieldsList = () => {
    const [facilities, setFacilities] = useState([]);
    const [sports, setSports] = useState([]);
    const [selectedSport, setSelectedSport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [facilityCounts, setFacilityCounts] = useState({ total: 0 });
    const [searchParams, setSearchParams] = useSearchParams();
    const [filters, setFilters] = useState({
        name: searchParams.get('name') || '',
        minPrice: '',
        maxPrice: '',
        sort: '',
        lat: null,
        lng: null
    });
    const [displayFilters, setDisplayFilters] = useState({
        name: searchParams.get('name') || '',
        minPrice: '',
        maxPrice: '',
        sort: ''
    });

    const debounceTimer = useRef(null);

    // Load sports once
    useEffect(() => {
        const fetchSports = async () => {
            try {
                const res = await api.get('/sports');
                setSports(res.data);
            } catch (error) {
                console.error('Error fetching sports:', error);
            }
        };
        fetchSports();
    }, []);

    // Load facility counts for sidebar (lightweight — only sport filter)
    useEffect(() => {
        const fetchCounts = async () => {
            try {
                const res = await api.get('/facilities');
                const counts = { total: res.data.length };
                res.data.forEach(f => {
                    const sid = f.sport?.id || f.sportId;
                    if (sid) counts[sid] = (counts[sid] || 0) + 1;
                });
                setFacilityCounts(counts);
            } catch { /* non-critical */ }
        };
        fetchCounts();
    }, []);

    // Read URL params on mount
    useEffect(() => {
        const sportParam = searchParams.get('sport');
        const nameParam = searchParams.get('name');
        const areaParam = searchParams.get('area');
        const sortParam = searchParams.get('sort');
        const minP = searchParams.get('minPrice');
        const maxP = searchParams.get('maxPrice');

        if (sportParam) setSelectedSport(Number(sportParam));
        if (nameParam || areaParam) {
            const term = nameParam || areaParam || '';
            setFilters(prev => ({ ...prev, name: term }));
            setDisplayFilters(prev => ({ ...prev, name: term }));
        }
        if (sortParam) {
            setFilters(prev => ({ ...prev, sort: sortParam }));
            setDisplayFilters(prev => ({ ...prev, sort: sortParam }));
        }
        if (minP) {
            setFilters(prev => ({ ...prev, minPrice: minP }));
            setDisplayFilters(prev => ({ ...prev, minPrice: minP }));
        }
        if (maxP) {
            setFilters(prev => ({ ...prev, maxPrice: maxP }));
            setDisplayFilters(prev => ({ ...prev, maxPrice: maxP }));
        }
    }, [searchParams]);

    // Single API call: search with all filters + ratings included
    const searchFacilities = useCallback(async (currentFilters, sportId) => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (sportId) params.append('sport', sportId);
            if (currentFilters.name) params.append('name', currentFilters.name);
            if (currentFilters.minPrice) params.append('minPrice', currentFilters.minPrice);
            if (currentFilters.maxPrice) params.append('maxPrice', currentFilters.maxPrice);
            if (currentFilters.sort) params.append('sort', currentFilters.sort);
            if (currentFilters.lat) params.append('lat', currentFilters.lat);
            if (currentFilters.lng) params.append('lng', currentFilters.lng);

            const res = await api.get(`/facilities/search?${params.toString()}`);
            setFacilities(res.data);
            setLoading(false);
        } catch (error) {
            console.error('Error searching facilities:', error);
            setLoading(false);
        }
    }, []);

    // Một effect: debounce toàn bộ bộ lọc (trước đây effect thứ 2 có `if (filters.name !== undefined) return`
    // luôn true vì name là string → không bao giờ gọi API khi đổi giá/sort).
    useEffect(() => {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => {
            searchFacilities(filters, selectedSport);
        }, 350);
        return () => clearTimeout(debounceTimer.current);
    }, [
        filters.name,
        filters.minPrice,
        filters.maxPrice,
        filters.sort,
        filters.lat,
        filters.lng,
        selectedSport,
        searchFacilities
    ]);

    const handleSportSelect = (sportId) => {
        setSelectedSport(sportId);
        // Update URL
        const next = new URLSearchParams(searchParams);
        if (sportId) next.set('sport', sportId); else next.delete('sport');
        setSearchParams(next, { replace: true });
    };

    const handleFilterChange = (newFilters) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
        setDisplayFilters(prev => ({ ...prev, ...newFilters }));

        // Sync to URL params
        const next = new URLSearchParams(searchParams);
        if (newFilters.name !== undefined) {
            if (newFilters.name) next.set('name', newFilters.name); else next.delete('name');
        }
        if (newFilters.sort !== undefined) {
            if (newFilters.sort) next.set('sort', newFilters.sort); else next.delete('sort');
        }
        if (newFilters.minPrice !== undefined) {
            if (newFilters.minPrice) next.set('minPrice', newFilters.minPrice); else next.delete('minPrice');
        }
        if (newFilters.maxPrice !== undefined) {
            if (newFilters.maxPrice) next.set('maxPrice', newFilters.maxPrice); else next.delete('maxPrice');
        }
        setSearchParams(next, { replace: true });
    };

    const handleClearAll = () => {
        setFilters({ name: '', minPrice: '', maxPrice: '', sort: '', lat: null, lng: null });
        setDisplayFilters({ name: '', minPrice: '', maxPrice: '', sort: '' });
        setSelectedSport(null);
        setSearchParams({}, { replace: true });
    };

    // Mobile filter state
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    // Active filter count for badge
    const activeFilterCount = [
        filters.name,
        filters.minPrice,
        filters.maxPrice,
        filters.sort,
        filters.lat,
        selectedSport
    ].filter(Boolean).length;

    // Label for active sort
    const sortLabels = { price_asc: 'Giá thấp → cao', price_desc: 'Giá cao → thấp', rating: 'Đánh giá cao nhất', distance: 'Gần nhất' };

    if (loading && facilities.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-gray-600 font-medium">Đang tìm kiếm sân bãi...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Page Header */}
                <div className="mb-8 text-center">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">Danh sách sân bãi</h1>
                    <div className="h-1 w-24 bg-gradient-to-r from-blue-600 to-purple-600 mx-auto rounded-full"></div>
                </div>

                {/* Active Filters Summary */}
                {activeFilterCount > 0 && (
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                        <span className="text-sm text-gray-500 font-medium">Bộ lọc đang áp dụng:</span>
                        {filters.name && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium border border-blue-200">
                                🔍 {filters.name}
                            </span>
                        )}
                        {selectedSport && (() => {
                            const sp = sports.find(s => s.id === selectedSport);
                            return sp && (
                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm font-medium border border-purple-200">
                                    {sp.emoji} {sp.nameVi}
                                </span>
                            );
                        })()}
                        {(filters.minPrice || filters.maxPrice) && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium border border-green-200">
                                💰 {filters.minPrice ? `${Number(filters.minPrice).toLocaleString('vi')}đ` : '0đ'} – {filters.maxPrice ? `${Number(filters.maxPrice).toLocaleString('vi')}đ` : '∞'}
                            </span>
                        )}
                        {filters.sort && sortLabels[filters.sort] && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-sm font-medium border border-orange-200">
                                ↕️ {sortLabels[filters.sort]}
                            </span>
                        )}
                        <button
                            onClick={handleClearAll}
                            className="inline-flex items-center gap-1 px-3 py-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full text-sm font-medium transition-colors"
                        >
                            ✕ Xóa tất cả
                        </button>
                    </div>
                )}

                {/* Mobile Filter Toggle */}
                <div className="lg:hidden mb-4">
                    <button
                        onClick={() => setShowMobileFilters(!showMobileFilters)}
                        className="w-full bg-white shadow-md rounded-lg px-4 py-3 flex items-center justify-between text-gray-700 font-medium"
                    >
                        <span className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                            </svg>
                            Bộ lọc tìm kiếm
                            {activeFilterCount > 0 && (
                                <span className="bg-blue-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">{activeFilterCount}</span>
                            )}
                        </span>
                        <svg className={`w-5 h-5 transition-transform ${showMobileFilters ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    {showMobileFilters && (
                        <div className="mt-2">
                            <FieldsFilterSidebar
                                sports={sports}
                                selectedSport={selectedSport}
                                onSportSelect={handleSportSelect}
                                facilityCounts={facilityCounts}
                                onFilterChange={handleFilterChange}
                                filters={displayFilters}
                            />
                        </div>
                    )}
                </div>

                {/* Main Content */}
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Sidebar - Hidden on mobile, shown on desktop */}
                    <aside className="hidden lg:block lg:w-80 flex-shrink-0">
                        <FieldsFilterSidebar
                            sports={sports}
                            selectedSport={selectedSport}
                            onSportSelect={handleSportSelect}
                            facilityCounts={facilityCounts}
                            onFilterChange={handleFilterChange}
                            filters={displayFilters}
                        />
                    </aside>

                    {/* Facilities Grid */}
                    <main className="flex-1">
                        {/* Result summary */}
                        <div className="mb-4 flex items-center justify-between">
                            <div className="text-gray-600 font-medium">
                                <span className="text-blue-600 font-bold">{facilities.length}</span> sân bãi
                                {filters.name && <span className="ml-1"> cho "<strong className="text-gray-800">{filters.name}</strong>"</span>}
                            </div>
                            {loading && <span className="text-xs text-gray-400 animate-pulse">Đang tải...</span>}
                        </div>

                        {facilities.length === 0 ? (
                            <div className="bg-white rounded-xl shadow-md p-12 text-center">
                                <div className="text-6xl mb-4">🏟️</div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Không tìm thấy sân bãi</h3>
                                <p className="text-gray-600 mb-4">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
                                {activeFilterCount > 0 && (
                                    <button onClick={handleClearAll} className="text-blue-600 hover:underline font-medium">
                                        Xóa bộ lọc hiện tại
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {facilities.map((facility) => (
                                    <FieldCard key={facility.id} facility={facility} />
                                ))}
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default FieldsList;
