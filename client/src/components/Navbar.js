import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import logo from '../assets/logopage.jpeg';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSportsDropdownOpen, setIsSportsDropdownOpen] = useState(false);
  const [sports, setSports] = useState([]);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSports();

    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsSportsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSports = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/sports');
      setSports(response.data);
    } catch (error) {
      console.error('Error fetching sports:', error);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleSportClick = (sportId) => {
    navigate(`/booking/${sportId}`);
    setIsSportsDropdownOpen(false);
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 flex-shrink-0">
            <img
              src={logo}
              alt="T&T Sport"
              className="h-16 w-auto object-contain hover:scale-105 transition-transform duration-300"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden xl:flex items-center space-x-1 flex-1 justify-center">
            <Link
              to="/"
              className="text-white hover:text-blue-300 hover:bg-white/10 px-3 py-2 rounded-lg transition-all duration-300 font-medium text-sm"
            >
              Trang Chủ
            </Link>

            {/* Sports Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsSportsDropdownOpen(!isSportsDropdownOpen)}
                className="text-white hover:text-blue-300 hover:bg-white/10 px-3 py-2 rounded-lg transition-all duration-300 font-medium text-sm whitespace-nowrap flex items-center gap-1"
              >
                Danh Sách Sân Bãi
                <svg
                  className={`w-4 h-4 transition-transform duration-200 ${isSportsDropdownOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {isSportsDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50 animate-fadeIn">
                  <div className="px-4 py-2 border-b border-gray-200">
                    <p className="text-xs font-semibold text-gray-500 uppercase">Môn thể thao</p>
                  </div>

                  {/* View All Link */}
                  <Link
                    to="/fields"
                    onClick={() => setIsSportsDropdownOpen(false)}
                    className="w-full text-left px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200 flex items-center gap-3 border-b border-gray-100"
                  >
                    <span className="text-xl">🏆</span>
                    <span className="font-semibold text-sm">Tất cả</span>
                  </Link>

                  {sports.length === 0 ? (
                    <div className="px-4 py-3 text-center text-gray-400 text-sm">
                      Đang tải...
                    </div>
                  ) : (
                    sports.map((sport) => (
                      <button
                        key={sport._id}
                        onClick={() => handleSportClick(sport._id)}
                        className="w-full text-left px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200 flex items-center gap-3"
                      >
                        <span className="text-xl">{sport.emoji || '⚽'}</span>
                        <span className="font-medium text-sm">{sport.nameVi || sport.name}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            <Link
              to="/owner"
              className="text-orange-400 hover:text-orange-300 hover:bg-orange-400/10 px-3 py-2 rounded-lg transition-all duration-300 font-semibold text-sm whitespace-nowrap"
            >
              Dành Cho Chủ Sân
            </Link>
            <Link
              to="/contact"
              className="text-white hover:text-blue-300 hover:bg-white/10 px-3 py-2 rounded-lg transition-all duration-300 font-medium text-sm"
            >
              Liên Hệ
            </Link>

            {isAuthenticated && (
              <>
                <Link
                  to="/bookings"
                  className="text-white hover:text-blue-300 hover:bg-white/10 px-3 py-2 rounded-lg transition-all duration-300 font-medium text-sm whitespace-nowrap"
                >
                  Lịch Đã Đặt
                </Link>
                {user?.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-2 rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-300 font-semibold shadow-md text-sm"
                  >
                    Quản Lý
                  </Link>
                )}
              </>
            )}
          </div>

          {/* Auth Section - Desktop */}
          <div className="hidden xl:flex items-center space-x-3 flex-shrink-0">
            {isAuthenticated ? (
              <>
                <span className="text-blue-300 font-medium text-sm whitespace-nowrap">
                  Xin chào, {user?.name}
                </span>
                <button
                  onClick={logout}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 text-sm"
                >
                  Đăng Xuất
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-white hover:text-blue-300 px-3 py-2 rounded-lg transition-all duration-300 font-medium text-sm"
                >
                  Đăng Nhập
                </Link>
                <Link
                  to="/register"
                  className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-all duration-300 font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5 text-sm"
                >
                  Đăng Ký
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMobileMenu}
            className="xl:hidden text-white p-2 rounded-lg hover:bg-white/10 transition-colors duration-300"
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="xl:hidden pb-4 space-y-2 animate-fadeIn">
            <Link
              to="/"
              onClick={toggleMobileMenu}
              className="block text-white hover:text-blue-300 hover:bg-white/10 px-4 py-3 rounded-lg transition-all duration-300 font-medium"
            >
              Trang Chủ
            </Link>

            {/* Mobile Sports Dropdown */}
            <div>
              <button
                onClick={() => setIsSportsDropdownOpen(!isSportsDropdownOpen)}
                className="w-full text-left text-white hover:text-blue-300 hover:bg-white/10 px-4 py-3 rounded-lg transition-all duration-300 font-medium flex items-center justify-between"
              >
                Danh Sách Sân Bãi
                <svg
                  className={`w-4 h-4 transition-transform duration-200 ${isSportsDropdownOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isSportsDropdownOpen && (
                <div className="mt-2 ml-4 space-y-1 bg-white/10 rounded-lg p-2">
                  {sports.length === 0 ? (
                    <div className="px-4 py-2 text-center text-gray-300 text-sm">
                      Đang tải...
                    </div>
                  ) : (
                    sports.map((sport) => (
                      <button
                        key={sport._id}
                        onClick={() => handleSportClick(sport._id)}
                        className="w-full text-left px-3 py-2 text-white hover:bg-white/20 rounded-lg transition-colors duration-200 flex items-center gap-3"
                      >
                        <span className="text-lg">{sport.emoji || '⚽'}</span>
                        <span className="text-sm">{sport.nameVi || sport.name}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            <Link
              to="/owner"
              onClick={toggleMobileMenu}
              className="block text-orange-400 hover:text-orange-300 hover:bg-orange-400/10 px-4 py-3 rounded-lg transition-all duration-300 font-semibold"
            >
              Dành Cho Chủ Sân
            </Link>
            <Link
              to="/contact"
              onClick={toggleMobileMenu}
              className="block text-white hover:text-blue-300 hover:bg-white/10 px-4 py-3 rounded-lg transition-all duration-300 font-medium"
            >
              Liên Hệ
            </Link>

            {isAuthenticated && (
              <>
                <Link
                  to="/bookings"
                  onClick={toggleMobileMenu}
                  className="block text-white hover:text-blue-300 hover:bg-white/10 px-4 py-3 rounded-lg transition-all duration-300 font-medium"
                >
                  Lịch Đã Đặt
                </Link>
                {user?.role === 'admin' && (
                  <Link
                    to="/admin"
                    onClick={toggleMobileMenu}
                    className="block bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-3 rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-300 font-semibold shadow-md text-center"
                  >
                    Quản Lý
                  </Link>
                )}
              </>
            )}

            {/* Mobile Auth */}
            <div className="pt-2 border-t border-white/20 space-y-2">
              {isAuthenticated ? (
                <>
                  <div className="text-blue-300 font-medium px-4 py-2">
                    Xin chào, {user?.name}
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      toggleMobileMenu();
                    }}
                    className="w-full bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-lg font-medium transition-all duration-300 shadow-md"
                  >
                    Đăng Xuất
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={toggleMobileMenu}
                    className="block text-white hover:text-blue-300 hover:bg-white/10 px-4 py-3 rounded-lg transition-all duration-300 font-medium text-center"
                  >
                    Đăng Nhập
                  </Link>
                  <Link
                    to="/register"
                    onClick={toggleMobileMenu}
                    className="block bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-4 py-3 rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-all duration-300 font-semibold shadow-md text-center"
                  >
                    Đăng Ký
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
