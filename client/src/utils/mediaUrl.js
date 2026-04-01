/**
 * Chuẩn hóa URL ảnh (uploads, tin tức) khi DB còn lưu URL dev (localhost).
 * Trên production, trình duyệt không tải được http://localhost:5000/uploads/...
 */

function getStaticOrigin() {
  const api = process.env.REACT_APP_API_URL || '';
  if (api) {
    try {
      const u = new URL(api.replace(/\/?api\/?$/, ''));
      return u.origin;
    } catch {
      /* fall through */
    }
  }
  if (typeof window !== 'undefined') return window.location.origin;
  return '';
}

/**
 * @param {string|null|undefined} url
 * @returns {string}
 */
export function resolveMediaUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const s = url.trim();
  if (!s) return '';

  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//i.test(s)) {
    try {
      const u = new URL(s);
      return `${getStaticOrigin()}${u.pathname}${u.search || ''}`;
    } catch {
      return s;
    }
  }

  if (s.startsWith('/')) {
    return `${getStaticOrigin()}${s}`;
  }

  return s;
}
