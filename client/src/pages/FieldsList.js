import React, { useState, useEffect, useCallback } from 'react';
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
    const [searchParams] = useSearchParams();
    const [filters, setFilters] = useState({
        name: searchParams.get('name') || '',
        minPrice: '',
        maxPrice: '',
        sort: '',
        lat: null,
        lng: null
    });

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

    // Read URL params on mount
    useEffect(() => {
        const sportParam = searchParams.get('sport');
        const nameParam = searchParams.get('name');
        const areaParam = searchParams.get('area');

        if (sportParam) setSelectedSport(Number(sportParam));
        if (nameParam || areaParam) {
            setFilters(prev => ({
                ...prev,
                name: nameParam || '',
                area: areaParam || ''
            }));
        }
    }, [searchParams]);

    // Search facilities whenever filters or sport change
    const searchFacilities = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();

            if (selectedSport) params.append('sport', selectedSport);
            if (filters.name) params.append('name', filters.name);
            if (filters.area) params.append('area', filters.area);
            if (filters.minPrice) params.append('minPrice', filters.minPrice);
            if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
            if (filters.sort) params.append('sort', filters.sort);
            if (filters.lat) params.append('lat', filters.lat);
            if (filters.lng) params.append('lng', filters.lng);

            const res = await api.get(`/facilities/search?${params.toString()}`);
            setFacilities(res.data);

            // Calculate counts (fetch all for sidebar counts)
            const allRes = await api.get('/facilities');
            const counts = { total: allRes.data.length };
            allRes.data.forEach(facility => {
                const sportId = facility.sport?.id || facility.sportId;
                if (sportId) {
                    counts[sportId] = (counts[sportId] || 0) + 1;
                }
            });
            setFacilityCounts(counts);

            setLoading(false);
        } catch (error) {
            console.error('Error searching facilities:', error);
            setLoading(false);
        }
    }, [selectedSport, filters]);

    useEffect(() => {
        searchFacilities();
    }, [searchFacilities]);

    const handleSportSelect = (sportId) => {
        setSelectedSport(sportId);
    };

    const handleFilterChange = (newFilters) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
    };

    // Mobile filter state
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-gray-600 font-medium">Đang tìm kiếm...</p>
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
                                filters={filters}
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
                            filters={filters}
                        />
                    </aside>

                    {/* Facilities Grid */}
                    <main className="flex-1">
                        {facilities.length === 0 ? (
                            <div className="bg-white rounded-xl shadow-md p-12 text-center">
                                <div className="text-6xl mb-4">🏟️</div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Không tìm thấy sân bãi</h3>
                                <p className="text-gray-600">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
                            </div>
                        ) : (
                            <>
                                <div className="mb-4 text-gray-600 font-medium">
                                    Tìm thấy <span className="text-blue-600 font-bold">{facilities.length}</span> sân bãi
                                    {filters.sort === 'distance' && filters.lat && (
                                        <span className="ml-2 text-green-600 text-sm">📍 Sắp xếp theo khoảng cách</span>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {facilities.map((facility) => (
                                        <FieldCard key={facility.id} facility={facility} />
                                    ))}
                                </div>
                            </>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default FieldsList;
