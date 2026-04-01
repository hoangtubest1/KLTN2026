import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSportsDropdownOpen, setIsSportsDropdownOpen] = useState(false);
  const [sports, setSports] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSports();

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsSportsDropdownOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSports = async () => {
    try {
      const response = await api.get('/sports');
      setSports(response.data);
    } catch (error) {
      console.error('Error fetching sports:', error);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleSportClick = (sportId) => {
    navigate(`/fields?sport=${sportId}`);
    setIsSportsDropdownOpen(false);
    setIsMobileMenuOpen(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/fields?name=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <nav className="bg-white sticky top-0 z-50 shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <img
              src="/assets/football-logo.png"
              alt="TÌM SÂN"
              className="w-9 h-9 rounded-lg object-contain"
            />
            <span className="font-bold text-lg tracking-tight" style={{ color: '#111' }}>TÌM SÂN</span>
          </Link>

          {/* Desktop Navigation - Centered */}
          <div className="hidden lg:flex items-center justify-center flex-1 px-8">
            <Link
              to="/"
              className="text-gray-500 hover:text-gray-900 px-4 py-2 rounded-lg transition-all duration-200 font-medium text-sm"
            >
              Trang Chủ
            </Link>

            {/* Sports Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsSportsDropdownOpen(!isSportsDropdownOpen)}
                className="text-gray-500 hover:text-gray-900 px-4 py-2 rounded-lg transition-all duration-200 font-medium text-sm flex items-center gap-1"
              >
                Sân Bãi
                <svg
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${isSportsDropdownOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isSportsDropdownOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-52 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-50">
                  <Link
                    to="/fields"
                    onClick={() => setIsSportsDropdownOpen(false)}
                    className="w-full text-left px-4 py-2.5 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200 flex items-center gap-3 text-sm border-b border-gray-100"
                  >
                    <span className="text-lg">🏆</span>
                    <span className="font-semibold">Tất cả sân bãi</span>
                  </Link>
                  <div className="px-4 py-1.5 border-b border-gray-100">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Theo môn thể thao</p>
                  </div>
                  {sports.length === 0 ? (
                    <div className="px-4 py-3 text-center text-gray-400 text-sm">Đang tải...</div>
                  ) : (
                    sports.map((sport) => (
                      <button
                        key={sport.id}
                        onClick={() => handleSportClick(sport.id)}
                        className="w-full text-left px-4 py-2.5 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200 flex items-center gap-3 text-sm"
                      >
                        <span className="text-lg">{sport.emoji || ''}</span>
                        <span className="font-medium">{sport.nameVi || sport.name}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            <Link
              to="/news"
              className="text-gray-500 hover:text-gray-900 px-4 py-2 rounded-lg transition-all duration-200 font-medium text-sm"
            >
              Tin Tức
            </Link>

            {isAuthenticated ? (
              <Link
                to="/bookings"
                className="text-gray-500 hover:text-gray-900 px-4 py-2 rounded-lg transition-all duration-200 font-medium text-sm"
              >
                Đặt Sân
              </Link>
            ) : (
              <Link
                to="/login"
                className="text-gray-500 hover:text-gray-900 px-4 py-2 rounded-lg transition-all duration-200 font-medium text-sm"
              >
                Đặt Sân
              </Link>
            )}
          </div>

          {/* Right Section - Search + Auth */}
          <div className="hidden lg:flex items-center gap-2 flex-shrink-0">

            {/* Search */}
            <div className="relative" ref={searchRef}>
              {isSearchOpen ? (
                <form onSubmit={handleSearch} className="flex items-center">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm sân..."
                    autoFocus
                    className="w-48 px-3 py-1.5 text-sm rounded-lg bg-gray-100 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-green-400 focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }}
                    className="ml-1 text-gray-400 hover:text-gray-600 p-1.5"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-all"
                  title="Tìm kiếm"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                  </svg>
                </button>
              )}
            </div>

            {/* Owner Link */}
            <Link
              to="/owner"
              className="text-gray-500 hover:text-orange-500 px-3 py-1.5 rounded-lg transition-all duration-200 text-sm font-medium"
            >
              Dành Cho Chủ Sân
            </Link>

            {/* Auth */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2 ml-1">
                {user?.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="text-gray-500 hover:text-gray-900 px-3 py-1.5 rounded-lg transition-all duration-200 text-sm font-medium"
                  >
                    Quản Lý
                  </Link>
                )}
                <Link
                  to="/profile"
                  className="flex items-center gap-2 text-gray-500 hover:text-gray-900 px-3 py-1.5 rounded-lg transition-all duration-200 text-sm font-medium"
                >
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: '#22b84c' }}>
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <span className="max-w-[120px] truncate">{user?.name}</span>
                </Link>
                <button
                  onClick={logout}
                  className="text-gray-400 hover:text-red-500 px-3 py-1.5 rounded-lg transition-all duration-200 text-sm font-medium"
                >
                  Đăng Xuất
                </button>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-500 hover:text-gray-900 px-4 py-1.5 rounded-lg transition-all duration-200 text-sm font-medium"
                >
                  Đăng Nhập
                </Link>
                <Link
                  to="/register"
                  className="text-white px-4 py-1.5 rounded-lg transition-all duration-200 text-sm font-semibold hover:opacity-90"
                  style={{ background: '#22b84c' }}
                >
                  Đăng Ký
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMobileMenu}
            className="lg:hidden text-gray-500 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden pb-4 space-y-1 border-t border-gray-100 pt-3">
            {/* Mobile Search */}
            <form onSubmit={handleSearch} className="flex items-center px-2 pb-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm sân bãi..."
                className="flex-1 px-3 py-2 text-sm rounded-lg bg-gray-100 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-green-400"
              />
              <button type="submit" className="ml-2 text-gray-400 p-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
              </button>
            </form>

            <Link to="/" onClick={toggleMobileMenu} className="block text-gray-600 hover:text-gray-900 hover:bg-gray-50 px-4 py-2.5 rounded-lg text-sm font-medium">
              Trang Chủ
            </Link>

            <div>
              <button
                onClick={() => setIsSportsDropdownOpen(!isSportsDropdownOpen)}
                className="w-full text-left text-gray-600 hover:text-gray-900 hover:bg-gray-50 px-4 py-2.5 rounded-lg text-sm font-medium flex items-center justify-between"
              >
                Sân Bãi
                <svg className={`w-4 h-4 transition-transform ${isSportsDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                </svg>
              </button>
              {isSportsDropdownOpen && (
                <div className="ml-4 mt-1 space-y-0.5">
                  <Link to="/fields" onClick={toggleMobileMenu} className="block text-gray-500 hover:text-gray-900 hover:bg-gray-50 px-3 py-2 rounded-lg text-sm">
                    Tất cả sân bãi
                  </Link>
                  {sports.map((sport) => (
                    <button
                      key={sport.id}
                      onClick={() => handleSportClick(sport.id)}
                      className="w-full text-left text-gray-500 hover:text-gray-900 hover:bg-gray-50 px-3 py-2 rounded-lg text-sm flex items-center gap-2"
                    >
                      <span>{sport.emoji || '⚽'}</span>
                      <span>{sport.nameVi || sport.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Link to="/news" onClick={toggleMobileMenu} className="block text-gray-600 hover:text-gray-900 hover:bg-gray-50 px-4 py-2.5 rounded-lg text-sm font-medium">
              Tin Tức
            </Link>

            <Link to="/login" onClick={toggleMobileMenu} className="block text-gray-600 hover:text-gray-900 hover:bg-gray-50 px-4 py-2.50 rounded-lg text-sm font-medium">
              Đặt Sân
            </Link>

            <Link to="/owner" onClick={toggleMobileMenu} className="block text-orange-500 hover:text-orange-600 hover:bg-orange-50 px-4 py-2.5 rounded-lg text-sm font-medium">
              Dành Cho Chủ Sân
            </Link>

            <div className="pt-2 border-t border-gray-100">
              {isAuthenticated ? (
                <>
                  <Link to="/profile" onClick={toggleMobileMenu} className="block text-gray-600 hover:text-gray-900 hover:bg-gray-50 px-4 py-2.5 rounded-lg text-sm font-medium">
                    👤 {user?.name}
                  </Link>
                  {user?.role === 'admin' && (
                    <Link to="/admin" onClick={toggleMobileMenu} className="block text-gray-600 hover:text-gray-900 hover:bg-gray-50 px-4 py-2.5 rounded-lg text-sm font-medium">
                      Quản Lý
                    </Link>
                  )}
                  <button onClick={() => { logout(); toggleMobileMenu(); }} className="w-full text-left text-red-500 hover:text-red-600 hover:bg-red-50 px-4 py-2.5 rounded-lg text-sm font-medium mt-1">
                    Đăng Xuất
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={toggleMobileMenu} className="block text-gray-600 hover:text-gray-900 hover:bg-gray-50 px-4 py-2.5 rounded-lg text-sm font-medium">
                    Đăng Nhập
                  </Link>
                  <Link to="/register" onClick={toggleMobileMenu} className="block text-white font-semibold px-4 py-2.5 rounded-lg text-sm mt-1" style={{ background: '#22b84c' }}>
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
