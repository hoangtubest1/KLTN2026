import React, { useState, useEffect } from 'react';
import axios from 'axios';
import FieldCard from '../components/FieldCard';
import FieldsFilterSidebar from '../components/FieldsFilterSidebar';

const FieldsList = () => {
    const [facilities, setFacilities] = useState([]);
    const [sports, setSports] = useState([]);
    const [selectedSport, setSelectedSport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [facilityCounts, setFacilityCounts] = useState({ total: 0 });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [facilitiesRes, sportsRes] = await Promise.all([
                axios.get('http://localhost:5000/api/facilities'),
                axios.get('http://localhost:5000/api/sports')
            ]);

            setFacilities(facilitiesRes.data);
            setSports(sportsRes.data);

            // Calculate facility counts per sport
            const counts = { total: facilitiesRes.data.length };
            facilitiesRes.data.forEach(facility => {
                const sportId = facility.sportId?._id || facility.sportId;
                if (sportId) {
                    counts[sportId] = (counts[sportId] || 0) + 1;
                }
            });
            setFacilityCounts(counts);

            setLoading(false);
        } catch (error) {
            console.error('Error fetching data:', error);
            setLoading(false);
        }
    };

    const handleSportSelect = (sportId) => {
        setSelectedSport(sportId);
    };

    // Filter facilities based on selected sport
    const filteredFacilities = selectedSport
        ? facilities.filter(facility => {
            const facilitySpotId = facility.sportId?._id || facility.sportId;
            return facilitySpotId === selectedSport;
        })
        : facilities;

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-gray-600 font-medium">Đang tải dữ liệu...</p>
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

                {/* Main Content */}
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Sidebar - Hidden on mobile, shown on desktop */}
                    <aside className="hidden lg:block lg:w-80 flex-shrink-0">
                        <FieldsFilterSidebar
                            sports={sports}
                            selectedSport={selectedSport}
                            onSportSelect={handleSportSelect}
                            facilityCounts={facilityCounts}
                        />
                    </aside>

                    {/* Mobile Filter Dropdown */}
                    <div className="lg:hidden mb-4">
                        <select
                            value={selectedSport || ''}
                            onChange={(e) => handleSportSelect(e.target.value || null)}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white font-medium"
                        >
                            <option value="">🏆 Tất cả ({facilityCounts.total || 0})</option>
                            {sports.map((sport) => (
                                <option key={sport._id} value={sport._id}>
                                    {sport.emoji || '⚽'} {sport.nameVi || sport.name} ({facilityCounts[sport._id] || 0})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Facilities Grid */}
                    <main className="flex-1">
                        {filteredFacilities.length === 0 ? (
                            <div className="bg-white rounded-xl shadow-md p-12 text-center">
                                <div className="text-6xl mb-4">🏟️</div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Không tìm thấy sân bãi</h3>
                                <p className="text-gray-600">Hiện tại chưa có sân bãi nào cho môn thể thao này.</p>
                            </div>
                        ) : (
                            <>
                                <div className="mb-4 text-gray-600 font-medium">
                                    Tìm thấy <span className="text-blue-600 font-bold">{filteredFacilities.length}</span> sân bãi
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {filteredFacilities.map((facility) => (
                                        <FieldCard key={facility._id} facility={facility} />
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
