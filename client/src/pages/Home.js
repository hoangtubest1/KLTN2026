import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Home = () => {
  const [sports, setSports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchData, setSearchData] = useState({
    sport: '',
    fieldName: '',
    area: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchSports();
  }, []);

  const fetchSports = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/sports');
      setSports(response.data);
      if (response.data.length > 0) {
        setSearchData(prev => ({ ...prev, sport: response.data[0]._id }));
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching sports:', error);
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchData.sport) {
      navigate(`/booking/${searchData.sport}`);
    } else {
      navigate('/booking');
    }
  };

  const handleChange = (e) => {
    setSearchData({
      ...searchData,
      [e.target.name]: e.target.value
    });
  };

  const getSportIcon = (sportName) => {
    const icons = {
      'football': '⚽',
      'badminton': '🏸',
      'pickleball': '🏓',
      'tennis': '🎾',
      'basketball': '🏀',
      'volleyball': '🏐'
    };
    return icons[sportName] || '🏃';
  };

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
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 overflow-hidden">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
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

            {/* Hero Title */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              HỆ THỐNG HỖ TRỢ TÌM KIẾM
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-300">
                SÂN BÃI NHANH
              </span>
            </h1>

            <p className="text-lg md:text-xl text-blue-100 mb-10 max-w-3xl mx-auto">
              Dữ liệu được cập nhật thường xuyên giúp cho người dùng tìm được sân một cách nhanh nhất
            </p>

            {/* Search Form */}
            <form onSubmit={handleSearch} className="max-w-5xl mx-auto">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-white/20">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <select
                    name="sport"
                    value={searchData.sport}
                    onChange={handleChange}
                    className="px-4 py-3 rounded-lg bg-white/90 backdrop-blur-sm text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  >
                    <option value="">Chọn môn thể thao</option>
                    {sports.map((sport) => (
                      <option key={sport._id} value={sport._id}>
                        {sport.nameVi || sport.name}
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    name="fieldName"
                    value={searchData.fieldName}
                    onChange={handleChange}
                    placeholder="Nhập tên sân..."
                    className="px-4 py-3 rounded-lg bg-white/90 backdrop-blur-sm text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />

                  <input
                    type="text"
                    name="area"
                    value={searchData.area}
                    onChange={handleChange}
                    placeholder="Nhập khu vực"
                    className="px-4 py-3 rounded-lg bg-white/90 backdrop-blur-sm text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />

                  <button
                    type="submit"
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2"
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

        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#f8fafc" />
          </svg>
        </div>
      </div>

      {/* Sports Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Các Môn Thể Thao Phổ Biến
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-600 mx-auto rounded-full"></div>
        </div>

        {sports.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏃</div>
            <p className="text-gray-600 text-lg">Chưa có môn thể thao nào. Vui lòng thêm môn thể thao từ API.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sports.map((sport) => (
              <div
                key={sport._id}
                className="group bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-blue-300 hover:-translate-y-2"
              >
                <div className="p-6">
                  {/* Icon */}
                  <div className="text-6xl mb-4 text-center group-hover:scale-110 transition-transform duration-300">
                    {getSportIcon(sport.name)}
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">
                    {sport.nameVi || sport.name}
                  </h3>

                  {/* Description */}
                  <p className="text-gray-600 text-sm mb-4 text-center line-clamp-2">
                    {sport.description || 'Môn thể thao phổ biến'}
                  </p>

                  {/* Info */}
                  <div className="flex justify-between items-center mb-4 text-sm">
                    <span className="text-blue-600 font-semibold">
                      {sport.pricePerHour?.toLocaleString('vi-VN')}đ/giờ
                    </span>
                    <span className="text-gray-500">
                      {sport.facilities?.length || 0} sân
                    </span>
                  </div>

                  {/* Button */}
                  <button
                    onClick={() => navigate(`/booking/${sport._id}`)}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-3 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg group-hover:scale-105"
                  >
                    Đặt Lịch Ngay
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
