import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Đăng ký Service Worker để bật tính năng PWA (offline, cài app)
serviceWorkerRegistration.register({
  onUpdate: (registration) => {
    // Thông báo khi có version mới
    console.log('[PWA] Phiên bản mới đã sẵn sàng. Tải lại để cập nhật.');
  },
  onSuccess: (registration) => {
    console.log('[PWA] App đã được cache để dùng offline.');
  },
});
