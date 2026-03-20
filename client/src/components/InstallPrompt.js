import React, { useState, useEffect } from 'react';

/**
 * InstallPrompt — Hiện banner/nút "Cài App" khi trình duyệt hỗ trợ PWA install
 * Tích hợp vào App.js hoặc Navbar.js
 */
const InstallPrompt = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showBanner, setShowBanner] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // Detect iOS
        const ios =
            /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase()) &&
            !window.MSStream;
        const isInStandaloneMode =
            window.matchMedia('(display-mode: standalone)').matches ||
            window.navigator.standalone;

        if (ios && !isInStandaloneMode) {
            // Check if user dismissed it before
            const dismissed = sessionStorage.getItem('pwa-ios-dismissed');
            if (!dismissed) {
                setIsIOS(true);
                setShowBanner(true);
            }
        }

        // Capture the install event for Android/Chrome
        const handler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            const dismissed = sessionStorage.getItem('pwa-dismissed');
            if (!dismissed) setShowBanner(true);
        };

        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            console.log('[PWA] User accepted install');
        }
        setDeferredPrompt(null);
        setShowBanner(false);
    };

    const handleDismiss = () => {
        setShowBanner(false);
        const key = isIOS ? 'pwa-ios-dismissed' : 'pwa-dismissed';
        sessionStorage.setItem(key, '1');
    };

    if (!showBanner) return null;

    // iOS Guide
    if (isIOS) {
        return (
            <div className="fixed bottom-0 left-0 right-0 z-[9999] px-4 pb-4 pointer-events-none">
                <div
                    className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 pointer-events-auto"
                    style={{ maxWidth: 480, margin: '0 auto' }}
                >
                    <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-xl flex-shrink-0">
                            ⚽
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-900 text-sm mb-0.5">Cài TìmSân lên iPhone</p>
                            <p className="text-xs text-gray-500">
                                Nhấn{' '}
                                <span className="inline-flex items-center bg-gray-100 px-1.5 py-0.5 rounded font-medium text-gray-700">
                                    ⎙ Chia sẻ
                                </span>{' '}
                                rồi chọn{' '}
                                <span className="inline-flex items-center bg-gray-100 px-1.5 py-0.5 rounded font-medium text-gray-700">
                                    + Thêm vào Màn hình chính
                                </span>
                            </p>
                        </div>
                        <button
                            onClick={handleDismiss}
                            className="text-gray-400 hover:text-gray-600 p-1 flex-shrink-0"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Android / Desktop Chrome
    return (
        <div className="fixed bottom-0 left-0 right-0 z-[9999] px-4 pb-4 pointer-events-none">
            <div
                className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-2xl p-4 pointer-events-auto text-white"
                style={{ maxWidth: 480, margin: '0 auto' }}
            >
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl flex-shrink-0">
                        ⚽
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm mb-0.5">Cài TìmSân về máy</p>
                        <p className="text-xs text-white/80">Dùng offline, không cần mở trình duyệt</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                        <button
                            onClick={handleDismiss}
                            className="px-3 py-2 text-white/70 hover:text-white text-sm font-medium"
                        >
                            Bỏ qua
                        </button>
                        <button
                            onClick={handleInstall}
                            className="px-4 py-2 bg-white text-blue-700 rounded-xl text-sm font-bold hover:bg-blue-50 transition-colors shadow-md"
                        >
                            Cài ngay
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InstallPrompt;
