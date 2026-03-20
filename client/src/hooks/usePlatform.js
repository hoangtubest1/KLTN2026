import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

/**
 * Hook detect platform: 'android' | 'ios' | 'web'
 * Usage: const { isNative, isAndroid, isWeb, platform } = usePlatform();
 */
const usePlatform = () => {
    const platform = Capacitor.getPlatform();     // 'android' | 'ios' | 'web'
    const isNative = Capacitor.isNativePlatform(); // true on android/ios

    return {
        platform,
        isNative,
        isAndroid: platform === 'android',
        isIOS: platform === 'ios',
        isWeb: platform === 'web',
    };
};

export default usePlatform;
