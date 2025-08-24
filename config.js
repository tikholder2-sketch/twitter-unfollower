// Twitter API Konfigürasyonu
const CONFIG = {
    // Twitter Developer Console'dan aldığınız Client ID
    CLIENT_ID: 'Z0JjZHZkN2xtcng2dG91NFdOcjE6MTpjaQ',
    
    // Client Secret (güvenlik için frontend'de kullanılmayacak)
    CLIENT_SECRET: 'YOUR_CLIENT_SECRET_HERE',
    
    // OAuth 2.0 Redirect URI
    REDIRECT_URI: window.location.origin + '/',
    API_BASE_URL: window.location.origin + '/api',
    
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
        UNFOLLOW_DELAY: 1000,
        MAX_BATCH_SIZE: 10
    }
};

// Export configuration
window.CONFIG = CONFIG;
