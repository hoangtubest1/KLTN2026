import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import usePlatform from '../hooks/usePlatform';

/**
 * Bottom Navigation Bar — chỉ hiện khi chạy trên native app (Android/iOS)
 * Cung cấp quick access tới 4 tab chính
 */
const MobileNavBar = () => {
    const { isNative } = usePlatform();
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated } = useAuth();

    // Chỉ hiện trên native app
    if (!isNative) return null;

    const tabs = [
        {
            id: 'home',
            label: 'Trang Chủ',
            icon: '🏠',
            path: '/',
            match: (p) => p === '/',
        },
        {
            id: 'fields',
            label: 'Tìm Sân',
            icon: '🏟️',
            path: '/fields',
            match: (p) => p.startsWith('/fields') || p.startsWith('/facility'),
        },
        {
            id: 'bookings',
            label: 'Lịch Đặt',
            icon: '📅',
            path: isAuthenticated ? '/bookings' : '/login',
            match: (p) => p.startsWith('/bookings'),
        },
        {
            id: 'profile',
            label: 'Tài Khoản',
            icon: '👤',
            path: isAuthenticated ? '/profile' : '/login',
            match: (p) => p.startsWith('/profile') || p.startsWith('/login') || p.startsWith('/register'),
        },
    ];

    return (
        <>
            {/* Spacer để tránh content bị che bởi nav bar */}
            <div style={{ height: '70px' }} />

            {/* Bottom Nav Bar */}
            <nav
                className="mobile-bottom-nav"
                style={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    zIndex: 9998,
                    display: 'flex',
                    background: '#ffffff',
                    borderTop: '1px solid #e5e7eb',
                    boxShadow: '0 -4px 20px rgba(0,0,0,0.10)',
                    paddingBottom: 'env(safe-area-inset-bottom, 0px)',
                }}
            >
                {tabs.map((tab) => {
                    const isActive = tab.match(location.pathname);
                    return (
                        <button
                            key={tab.id}
                            onClick={() => navigate(tab.path)}
                            style={{
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '10px 4px 8px',
                                border: 'none',
                                background: 'transparent',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                minHeight: '60px',
                                gap: '3px',
                                position: 'relative',
                            }}
                        >
                            {/* Active indicator */}
                            {isActive && (
                                <span style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    width: '32px',
                                    height: '3px',
                                    background: 'linear-gradient(90deg, #2563eb, #7c3aed)',
                                    borderRadius: '0 0 4px 4px',
                                }} />
                            )}

                            <span style={{
                                fontSize: '22px',
                                lineHeight: 1,
                                filter: isActive ? 'none' : 'grayscale(30%)',
                                transform: isActive ? 'scale(1.1)' : 'scale(1)',
                                transition: 'transform 0.2s ease',
                            }}>
                                {tab.icon}
                            </span>

                            <span style={{
                                fontSize: '11px',
                                fontWeight: isActive ? 700 : 400,
                                color: isActive ? '#2563eb' : '#6b7280',
                                fontFamily: 'Roboto, sans-serif',
                                lineHeight: 1,
                            }}>
                                {tab.label}
                            </span>
                        </button>
                    );
                })}
            </nav>
        </>
    );
};

export default MobileNavBar;
