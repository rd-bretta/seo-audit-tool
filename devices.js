// devices.js
module.exports = [
  // Mobile Devices
  {
    name: 'iPhone 12',
    viewport: { width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
  },
  {
    name: 'iPhone 14 Pro',
    viewport: { width: 430, height: 932, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
  },
  {
    name: 'Pixel 5',
    viewport: { width: 393, height: 851, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
    userAgent: 'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.101 Mobile Safari/537.36'
  },
  {
    name: 'Samsung Galaxy S20',
    viewport: { width: 412, height: 915, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
    userAgent: 'Mozilla/5.0 (Linux; Android 10; SAMSUNG SM-G980F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.106 Mobile Safari/537.36'
  },
  {
    name: 'iPad Pro 12.9',
    viewport: { width: 1024, height: 1366, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Safari/604.1'
  },

  // Desktop Variations
  {
    name: 'Desktop 1920x1080',
    viewport: { width: 1920, height: 1080, isMobile: false },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  },
  {
    name: 'Desktop 1366x768',
    viewport: { width: 1366, height: 768, isMobile: false },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  },
  {
    name: 'Desktop 1440x900',
    viewport: { width: 1440, height: 900, isMobile: false },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  },
  {
    name: 'Desktop 1536x864',
    viewport: { width: 1536, height: 864, isMobile: false },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  },
  {
    name: 'Desktop 1280x1024',
    viewport: { width: 1280, height: 1024, isMobile: false },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  },
  {
    name: 'Desktop 1600x900',
    viewport: { width: 1600, height: 900, isMobile: false },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  },
  {
    name: 'Desktop 2560x1440',
    viewport: { width: 2560, height: 1440, isMobile: false },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  },
  {
    name: 'Desktop 3840x2160 (4K)',
    viewport: { width: 3840, height: 2160, isMobile: false },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  },
  {
    name: 'Desktop 7680x4320 (8K)',
    viewport: { width: 7680, height: 4320, isMobile: false },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  }
];
