// Twitter API Konfigürasyonu
// ⚠️ ÖNEMLİ: Bu dosyadaki değerleri kendi API anahtarlarınızla değiştirin

const CONFIG = {
    // Twitter Developer Console'dan aldığınız Client ID
    CLIENT_ID: 'Z0JjZHZkN2xtcng2dG91NFdOcjE6MTpjaQ',
    
    // Client Secret (güvenlik için frontend'de kullanılmayacak)
    CLIENT_SECRET: 'YOUR_CLIENT_SECRET_HERE',
    
    // OAuth 2.0 Redirect URI
    REDIRECT_URI: window.location.origin + '/callback',
    
    // Twitter API Base URL
    API_BASE_URL: 'https://api.twitter.com/2',
    
    // OAuth 2.0 URLs
    OAUTH: {
        AUTHORIZE_URL: 'https://twitter.com/i/oauth2/authorize',
        TOKEN_URL: 'https://api.twitter.com/2/oauth2/token',
    },
    
    // API Endpoints
    ENDPOINTS: {
        USER_ME: '/users/me',
        USER_FOLLOWING: '/users/:id/following',
        USER_FOLLOWERS: '/users/:id/followers',
        UNFOLLOW_USER: '/users/:id/following/:target_user_id'
    },
    
    // OAuth 2.0 Scopes
    SCOPES: [
        'tweet.read',
        'users.read', 
        'follows.read',
        'follows.write'
    ].join(' '),
    
    // Rate Limits (per 15 minutes)
    RATE_LIMITS: {
        FOLLOWING: 15,
        FOLLOWERS: 15,
        UNFOLLOW: 50,
        USER_LOOKUP: 300
    },
    
    // Uygulama Ayarları
    APP_SETTINGS: {
        MAX_RESULTS_PER_PAGE: 100,
        UNFOLLOW_DELAY: 1000, // 1 saniye
        MAX_BATCH_SIZE: 10
    }
};

// ⚠️ UYARI: Gerçek uygulamada CLIENT_SECRET frontend'de bulunmamalı!
// Bu değerler sadece geliştirme amaçlı buraya konmuştur.
// Production'da backend server kullanılmalıdır.

// Konfigürasyon doğrulama
if (CONFIG.CLIENT_ID === 'YOUR_CLIENT_ID_HERE') {
    console.warn('🚨 UYARI: API anahtarlarınızı config.js dosyasında güncelleyin!');
    console.log('📝 Yapılacaklar:');
    console.log('1. Twitter Developer Console\'dan Client ID\'nizi alın');
    console.log('2. config.js dosyasında YOUR_CLIENT_ID_HERE kısmını değiştirin');
    console.log('3. Redirect URI\'yi Twitter Console\'da ayarlayın');
}

// Geliştirme modu kontrolü
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

if (isDevelopment) {
    console.log('🔧 Geliştirme modu aktif');
    // Geliştirme modunda redirect URI'yi localhost olarak ayarla
    CONFIG.REDIRECT_URI = 'http://localhost:3000/callback';
}

// Export configuration
window.CONFIG = CONFIG;
