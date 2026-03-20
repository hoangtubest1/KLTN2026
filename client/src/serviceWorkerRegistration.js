// Service Worker Registration for TìmSân PWA
// Registers the custom service-worker.js in /public

const isLocalhost = Boolean(
    window.location.hostname === 'localhost' ||
    window.location.hostname === '[::1]' ||
    window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
);

export function register(config) {
    if ('serviceWorker' in navigator) {
        const publicUrl = new URL(process.env.PUBLIC_URL, window.location.href);
        if (publicUrl.origin !== window.location.origin) return;

        window.addEventListener('load', () => {
            const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;

            if (isLocalhost) {
                // In development, verify SW file actually exists
                checkValidServiceWorker(swUrl, config);
                navigator.serviceWorker.ready.then(() => {
                    console.log('[PWA] App is being served cache-first by a service worker.');
                });
            } else {
                registerValidSW(swUrl, config);
            }
        });
    }
}

function registerValidSW(swUrl, config) {
    navigator.serviceWorker
        .register(swUrl)
        .then((registration) => {
            registration.onupdatefound = () => {
                const installingWorker = registration.installing;
                if (!installingWorker) return;
                installingWorker.onstatechange = () => {
                    if (installingWorker.state === 'installed') {
                        if (navigator.serviceWorker.controller) {
                            // New content available
                            console.log('[PWA] New content available; will be used on next reload.');
                            if (config && config.onUpdate) config.onUpdate(registration);
                        } else {
                            // Content cached for offline use
                            console.log('[PWA] Content is cached for offline use.');
                            if (config && config.onSuccess) config.onSuccess(registration);
                        }
                    }
                };
            };
        })
        .catch((error) => {
            console.error('[PWA] Error during service worker registration:', error);
        });
}

function checkValidServiceWorker(swUrl, config) {
    fetch(swUrl, { headers: { 'Service-Worker': 'script' } })
        .then((response) => {
            const contentType = response.headers.get('content-type');
            if (response.status === 404 || (contentType && !contentType.includes('javascript'))) {
                // SW not found — reload
                navigator.serviceWorker.ready.then((registration) => registration.unregister())
                    .then(() => window.location.reload());
            } else {
                registerValidSW(swUrl, config);
            }
        })
        .catch(() => {
            console.log('[PWA] No internet connection. App is running in offline mode.');
        });
}

export function unregister() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready
            .then((registration) => registration.unregister())
            .catch((error) => console.error(error.message));
    }
}
