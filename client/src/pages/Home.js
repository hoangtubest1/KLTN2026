import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import heroBackground from '../assets/hero-background.png';
import heroBackground2 from '../assets/hero-background2.png';
import heroBackground3 from '../assets/hero-background3.png';

// Haversine distance (km) between two GPS points
const haversineDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const Home = () => {
  const [sports, setSports] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nearbyFilter, setNearbyFilter] = useState('all');
  const [topFilter, setTopFilter] = useState('all');
  const [userLocation, setUserLocation] = useState(null); // { lat, lng }
  const [searchData, setSearchData] = useState({
    sport: '',
    fieldName: '',
    area: ''
  });
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      bg: heroBackground,
      overlay: 'from-black/60 via-black/50 to-black/60',
      title: 'HỆ THỐNG HỖ TRỢ TÌM KIẾM SÂN BÃI NHANH',
      subtitle: 'Dữ liệu được cập nhật thường xuyên giúp cho người dùng tìm được sân một cách nhanh nhất',
    },
    {
      bg: heroBackground2,
      overlay: 'from-green-900/60 via-green-800/40 to-green-900/60',
      title: 'ĐẶT SÂN THỂ THAO NHANH CHÓNG & TIỆN LỢI',
      subtitle: 'Hàng trăm sân bóng đá, cầu lông, tennis, pickleball sẵn sàng phục vụ bạn mỗi ngày',
    },
    {
      bg: heroBackground3,
      overlay: 'from-indigo-900/70 via-blue-900/50 to-indigo-900/70',
      title: 'TRẢI NGHIỆM ĐẶT SÂN ĐỈNH CAO',
      subtitle: 'Đặt sân chỉ trong vài giây — nhanh chóng, tiện lợi, không cần chờ đợi',
    },
  ];

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  useEffect(() => {
    fetchSports();
    // Request user geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setUserLocation({ lat: 10.7769, lng: 106.7009 }), // fallback: trung tâm TP.HCM
        { timeout: 8000 }
      );
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  const fetchSports = async () => {
    try {
      const [sportsRes, facilsRes] = await Promise.all([
        api.get('/sports'),
        api.get('/facilities'),
      ]);
      setSports(sportsRes.data);
      setFacilities(facilsRes.data);
      if (sportsRes.data.length > 0) {
        setSearchData(prev => ({ ...prev, sport: sportsRes.data[0].id }));
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchData.sport) params.append('sport', searchData.sport);
    if (searchData.fieldName) params.append('name', searchData.fieldName);
    if (searchData.area) params.append('area', searchData.area);

    navigate(`/fields?${params.toString()}`);
  };

  const handleChange = (e) => {
    setSearchData({
      ...searchData,
      [e.target.name]: e.target.value
    });
  };

  const getSportColor = (sportName) => {
    const colors = {
      'football': '#22c55e', 'badminton': '#3b82f6',
      'pickleball': '#f59e0b', 'tennis': '#ef4444',
      'basketball': '#f97316', 'volleyball': '#8b5cf6',
    };
    return colors[sportName?.toLowerCase()] || '#6b7280';
  };

  const getFilteredFacilities = (filterSportId) => {
    if (filterSportId === 'all') return facilities;
    return facilities.filter(f => f.sportId === filterSportId || f.sport?.id === filterSportId);
  };

  // Facility Card Component
  const FacilityCard = ({ facility }) => {
    const dist = userLocation
      ? haversineDistance(userLocation.lat, userLocation.lng, facility.latitude, facility.longitude)
      : null;
    const distLabel = dist !== null ? `${dist.toFixed(1)} km` : '--';
    const avg = facility.avgRating ? parseFloat(facility.avgRating) : 0;
    const count = parseInt(facility.reviewCount) || 0;

    const StarRating = ({ value, count }) => {
      const stars = [1, 2, 3, 4, 5];
      return (
        <div className="flex items-center gap-0.5">
          {stars.map(s => (
            <svg key={s} className={`w-3 h-3 ${s <= Math.round(value) ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
          {count > 0
            ? <span className="text-xs text-gray-500 ml-1">{avg.toFixed(1)} ({count})</span>
            : <span className="text-xs text-gray-400 ml-1">Chưa có</span>
          }
        </div>
      );
    };

    return (
      <div
        onClick={() => navigate(`/facility/${facility.id}`)}
        className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer border border-gray-100 hover:border-blue-200 overflow-hidden group h-full flex flex-col"
      >
        {/* Image */}
        <div className="h-36 bg-gradient-to-br from-green-400 to-emerald-600 relative overflow-hidden flex-shrink-0">
          {facility.image ? (
            <img src={facility.image} alt={facility.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-white text-5xl opacity-60">🏟️</span>
            </div>
          )}
          <div className="absolute top-2 left-2">
            <span className="text-xs font-semibold text-white px-2 py-0.5 rounded-full"
              style={{ background: getSportColor(facility.sport?.name) }}>
              {facility.sport?.nameVi || facility.sport?.name || 'Thể thao'}
            </span>
          </div>
          <div className="absolute top-2 right-2 text-xs text-white bg-black/40 px-1.5 py-0.5 rounded">
            Mở cửa: 05:00 - 22:00
          </div>
        </div>
        {/* Info */}
        <div className="p-3 flex-1 flex flex-col">
          <h3 className="font-bold text-gray-900 text-sm mb-1 group-hover:text-blue-600 transition-colors truncate">{facility.name}</h3>
          <div className="flex items-center text-xs mb-1.5">
            <i className="mdi mdi-map-marker-outline mr-1" style={{ fontSize: '13px', color: '#e53e3e' }}></i>
            <span className="truncate text-gray-500">{facility.address || 'Hà Nội'}</span>
          </div>
          <div className="flex items-center justify-between mt-auto">
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <svg className="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Cách {distLabel}</span>
            </div>
            <StarRating value={avg} count={count} />
          </div>
        </div>
      </div>
    );
  };

  // Sport filter tabs
  const FilterTabs = ({ activeFilter, onChange }) => (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        onClick={() => onChange('all')}
        className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${activeFilter === 'all' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
          }`}
      >Tất cả</button>
      {sports.map(s => (
        <button
          key={s.id}
          onClick={() => onChange(s.id)}
          className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${activeFilter === s.id ? 'text-white border-transparent' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
            }`}
          style={activeFilter === s.id ? { background: getSportColor(s.name), borderColor: getSportColor(s.name) } : {}}
        >{s.nameVi || s.name}</button>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600 font-medium">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      {/* Hero Slider Section */}
      <div className="relative overflow-hidden" style={{ height: '480px' }}>
        {/* Slides */}
        {slides.map((slide, index) => (
          <div
            key={index}
            className="absolute inset-0 transition-opacity duration-700 ease-in-out"
            style={{
              backgroundImage: `url(${slide.bg})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              opacity: currentSlide === index ? 1 : 0,
              zIndex: currentSlide === index ? 1 : 0,
            }}
          >
            {/* Overlay */}
            <div className={`absolute inset-0 bg-gradient-to-r ${slide.overlay} pointer-events-none`}></div>

            {/* Animated dot pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <div className="absolute inset-0" style={{
                backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                backgroundSize: '40px 40px'
              }}></div>
            </div>
          </div>
        ))}

        {/* Content overlay */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-center">
          <div className="text-center">
            {/* Rating Stars */}
            <div className="flex justify-center gap-1 mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg
                  key={star}
                  className={`w-6 h-6 ${star <= 3 ? 'text-yellow-400' : 'text-gray-400'}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>

            {/* Hero Title - dynamic per slide */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight transition-all duration-500">
              {slides[currentSlide].title}
            </h1>

            <p className="text-base md:text-lg text-white/90 mb-10 max-w-3xl mx-auto transition-all duration-500">
              {slides[currentSlide].subtitle}
            </p>

            {/* Search Form */}
            <form onSubmit={handleSearch} className="max-w-5xl mx-auto">
              <div className="bg-white rounded-xl p-2 shadow-2xl">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                  <select
                    name="sport"
                    value={searchData.sport}
                    onChange={handleChange}
                    className="px-4 py-3 rounded-lg bg-white text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all border border-gray-200"
                  >
                    <option value="">Lọc theo loại sân</option>
                    {sports.map((sport) => (
                      <option key={sport.id} value={sport.id}>
                        {sport.nameVi || sport.name}
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    name="fieldName"
                    value={searchData.fieldName}
                    onChange={handleChange}
                    placeholder="Nhập tên sân hoặc địa chỉ d..."
                    className="px-4 py-3 rounded-lg bg-white text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all border border-gray-200"
                  />

                  <input
                    type="text"
                    name="area"
                    value={searchData.area}
                    onChange={handleChange}
                    placeholder="Nhập khu vực"
                    className="px-4 py-3 rounded-lg bg-white text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all border border-gray-200"
                  />

                  <button
                    type="submit"
                    className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold rounded-lg hover:from-yellow-600 hover:to-orange-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Tìm kiếm
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Prev / Next arrows */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/40 text-white rounded-full p-3 transition-all duration-300 backdrop-blur-sm"
          aria-label="Previous slide"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/40 text-white rounded-full p-3 transition-all duration-300 backdrop-blur-sm"
          aria-label="Next slide"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Dot indicators */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`rounded-full transition-all duration-300 ${currentSlide === index
                ? 'bg-white w-6 h-3'
                : 'bg-white/50 w-3 h-3'
                }`}
              aria-label={`Slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0 z-10">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 60L60 52C120 45 240 30 360 22C480 15 600 15 720 18C840 22 960 30 1080 34C1200 38 1320 38 1380 38L1440 38V60H1380C1320 60 1200 60 1080 60C960 60 840 60 720 60C600 60 480 60 360 60C240 60 120 60 60 60H0Z" fill="#f8fafc" />
          </svg>
        </div>
      </div>

      {/* Facility Sections */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Section 1: Sân tập gần bạn */}
        <div className="mb-12">
          <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Sân tập gần bạn</h2>
              <p className="text-sm text-blue-500 mt-0.5">Khu vực được đề xuất gần vị trí của bạn</p>
            </div>
            <FilterTabs activeFilter={nearbyFilter} onChange={setNearbyFilter} />
          </div>
          {getFilteredFacilities(nearbyFilter).length === 0 ? (
            <div className="text-center py-10 text-gray-400">Chưa có sân nào. Hãy thêm sân trong trang quản lý.</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {getFilteredFacilities(nearbyFilter).slice(0, 8).map(f => <FacilityCard key={f.id} facility={f} />)}
            </div>
          )}
          <div className="text-center mt-4">
            <button onClick={() => navigate('/fields')} className="text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline">Xem tất cả →</button>
          </div>
        </div>

        {/* Section 2: Đề xuất cho bạn */}
        <div className="mb-12">
          <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Đề xuất cho bạn</h2>
              <p className="text-sm text-green-500 mt-0.5">Sân tập được người chơi đánh giá cao và gần bạn nhất</p>
            </div>
          </div>
          {facilities.length === 0 ? (
            <div className="text-center py-10 text-gray-400">Chưa có sân nào.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...facilities].reverse().slice(0, 6).map(f => (
                <div
                  key={f.id}
                  onClick={() => navigate(`/facility/${f.id}`)}
                  className="flex gap-3 bg-white rounded-xl p-3 shadow-sm hover:shadow-md transition-all cursor-pointer border border-gray-100 hover:border-blue-200"
                >
                  <div className="w-28 h-20 rounded-lg bg-gradient-to-br from-green-400 to-emerald-600 flex-shrink-0 overflow-hidden relative">
                    {f.image ? (
                      <img src={f.image} alt={f.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl text-white opacity-60">🏟️</div>
                    )}
                    <div className="absolute bottom-1 left-1">
                      <span className="text-xs font-semibold text-white px-1.5 py-0.5 rounded"
                        style={{ background: getSportColor(f.sport?.name) }}>
                        {f.sport?.nameVi || f.sport?.name || 'Thể thao'}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 mb-0.5">{f.address || 'Hà Nội'}</p>
                    <h3 className="font-bold text-gray-900 text-sm mb-1 truncate hover:text-blue-600">{f.name}</h3>
                    <p className="text-xs text-gray-400">Mở cửa: 05:00 - 22:00</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span>Cách 0.0 km</span>
                      <span className="flex items-center gap-0.5">
                        <i className="mdi mdi-star" style={{ fontSize: '12px', color: '#F9B90F' }}></i>
                        {f.rating || 0}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 3: Sân hàng đầu */}
        <div className="mb-6">
          <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Sân hàng đầu</h2>
              <p className="text-sm text-gray-400 mt-0.5">Sân tập tốt nhất được lựa chọn</p>
            </div>
            <FilterTabs activeFilter={topFilter} onChange={setTopFilter} />
          </div>
          {getFilteredFacilities(topFilter).length === 0 ? (
            <div className="text-center py-10 text-gray-400">Chưa có sân nào.</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {getFilteredFacilities(topFilter).slice(0, 8).map(f => <FacilityCard key={f.id} facility={f} />)}
            </div>
          )}
          <div className="text-center mt-4">
            <button onClick={() => navigate('/fields')} className="text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline">Xem tất cả →</button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Home;
