/**
 * Twitter Unfollower Tool - Ana JavaScript Dosyası
 * Bu uygulama Twitter API v2 kullanarak takip etmediğin hesapları bulur
 */

class TwitterUnfollower {
    constructor() {
        this.accessToken = null;
        this.userData = null;
        this.followingList = [];
        this.followersList = [];
        this.nonFollowers = [];
        this.selectedUsers = new Set();
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.checkForAuthCode();
        this.loadFromStorage();
    }
    
    bindEvents() {
        // Login butonu
        document.getElementById('login-btn').addEventListener('click', () => {
            this.initiateLogin();
        });
        
        // Logout butonu
        document.getElementById('logout-btn').addEventListener('click', () => {
            this.logout();
        });
        
        // Analiz butonu
        document.getElementById('analyze-btn').addEventListener('click', () => {
            this.analyzeFollowing();
        });
        
        // Yenile butonu
        document.getElementById('refresh-btn').addEventListener('click', () => {
            this.refreshData();
        });
        
        // Toplu seçim butonları
        document.getElementById('select-all-btn').addEventListener('click', () => {
            this.selectAllUsers();
        });
        
        document.getElementById('deselect-all-btn').addEventListener('click', () => {
            this.deselectAllUsers();
        });
        
        // Seçilenleri kaldır butonu
        document.getElementById('unfollow-selected-btn').addEventListener('click', () => {
            this.unfollowSelectedUsers();
        });
        
        // Modal kapatma
        document.querySelector('.modal-close').addEventListener('click', () => {
            this.closeModal();
        });
        
        // Modal dış tıklama
        document.getElementById('modal').addEventListener('click', (e) => {
            if (e.target.id === 'modal') {
                this.closeModal();
            }
        });
    }
    
    // OAuth 2.0 Login başlatma
    initiateLogin() {
        // PKCE parametreleri oluştur
        const codeVerifier = this.generateCodeVerifier();
        const codeChallenge = this.generateCodeChallenge(codeVerifier);
        const state = this.generateRandomString(32);
        
        // Parametreleri sakla
        localStorage.setItem('code_verifier', codeVerifier);
        localStorage.setItem('oauth_state', state);
        
        // OAuth URL oluştur
        const params = new URLSearchParams({
            response_type: 'code',
            client_id: CONFIG.CLIENT_ID,
            redirect_uri: CONFIG.REDIRECT_URI,
            scope: CONFIG.SCOPES,
            state: state,
            code_challenge: codeChallenge,
            code_challenge_method: 'S256'
        });
        
        const authUrl = `${CONFIG.OAUTH.AUTHORIZE_URL}?${params.toString()}`;
        
        // Twitter'a yönlendir
        window.location.href = authUrl;
    }
    
    // URL'den authorization code kontrolü
    async checkForAuthCode() {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');
        
        if (error) {
            this.showError('Giriş iptal edildi veya hata oluştu: ' + error);
            this.cleanUrl();
            return;
        }
        
        if (code && state) {
            const savedState = localStorage.getItem('oauth_state');
            
            if (state !== savedState) {
                this.showError('Güvenlik hatası: State parametresi eşleşmiyor');
                this.cleanUrl();
                return;
            }
            
            try {
                await this.exchangeCodeForToken(code);
                this.cleanUrl();
            } catch (error) {
                console.error('Token exchange failed:', error);
                this.showError('Giriş başarısız oldu. Lütfen tekrar deneyin.');
                this.cleanUrl();
            }
        }
    }
    
    // Authorization code'u access token ile değiştir
    async exchangeCodeForToken(code) {
        this.showLoading('Giriş yapılıyor...', 'Twitter ile kimlik doğrulaması yapılıyor.');
        
        const codeVerifier = localStorage.getItem('code_verifier');
        
        // ⚠️ DEMO: Gerçek uygulamada bu işlem backend'de yapılmalı
        // Şimdilik demo token kullanacağız
        console.log('Authorization code received:', code);
        console.log('Code verifier:', codeVerifier);
        
        // Demo için fake success
        setTimeout(async () => {
            this.accessToken = 'demo_access_token_' + Date.now();
            localStorage.setItem('access_token', this.accessToken);
            localStorage.removeItem('code_verifier');
            localStorage.removeItem('oauth_state');
            
            await this.fetchUserData();
        }, 2000);
    }
    
    // Kullanıcı verilerini çek
    async fetchUserData() {
        try {
            this.showLoading('Profil bilgileri alınıyor...', 'Kullanıcı verileri yükleniyor.');
            
            // ⚠️ DEMO: Gerçek API çağrısı yapılması gereken yer
            // Şimdilik demo veri kullanıyoruz
            
            await this.simulateApiCall(1500);
            
            // Demo kullanıcı verisi
            this.userData = {
                id: '1234567890',
                name: 'Demo Kullanıcı',
                username: 'demouser',
                profile_image_url: 'https://via.placeholder.com/70x70/1da1f2/ffffff?text=DU',
                public_metrics: {
                    following_count: Math.floor(Math.random() * 500) + 100,
                    followers_count: Math.floor(Math.random() * 300) + 50
                }
            };
            
            this.saveToStorage();
            this.showMainSection();
            
        } catch (error) {
            console.error('User data fetch failed:', error);
            this.showError('Kullanıcı bilgileri alınamadı. Lütfen tekrar deneyin.');
        }
    }
    
    // Ana bölümü göster
    showMainSection() {
        this.hideLoading();
        document.getElementById('login-section').classList.add('hidden');
        document.getElementById('main-section').classList.remove('hidden');
        
        // Kullanıcı bilgilerini doldur
        document.getElementById('user-avatar').src = this.userData.profile_image_url;
        document.getElementById('user-name').textContent = this.userData.name;
        document.getElementById('user-handle').textContent = `@${this.userData.username}`;
        document.getElementById('following-count').textContent = this.userData.public_metrics.following_count;
        document.getElementById('followers-count').textContent = this.userData.public_metrics.followers_count;
        
        // Refresh butonunu göster
        document.getElementById('refresh-btn').classList.remove('hidden');
    }
    
    // Takip listelerini analiz et
    async analyzeFollowing() {
        try {
            document.getElementById('results-section').classList.add('hidden');
            this.showLoading('Takip listeleri analiz ediliyor...', 'Bu işlem biraz zaman alabilir.');
            
            // İstatistikleri sıfırla
            this.selectedUsers.clear();
            this.updateSelectedCount();
            
            // Progress bar'ı başlat
            this.updateProgress(0, 4);
            
            // 1. Takip ettiklerini çek
            this.updateLoadingText('Takip ettikleriniz yükleniyor...');
            await this.fetchFollowing();
            this.updateProgress(1, 4);
            
            // 2. Takipçilerini çek  
            this.updateLoadingText('Takipçileriniz yükleniyor...');
            await this.fetchFollowers();
            this.updateProgress(2, 4);
            
            // 3. Karşılaştırma yap
            this.updateLoadingText('Veriler karşılaştırılıyor...');
            await this.compareFollowingAndFollowers();
            this.updateProgress(3, 4);
            
            // 4. Sonuçları göster
            this.updateLoadingText('Sonuçlar hazırlanıyor...');
            await this.simulateApiCall(1000);
            this.updateProgress(4, 4);
            
            this.hideLoading();
            this.displayResults();
            
        } catch (error) {
            console.error('Analysis failed:', error);
            this.hideLoading();
            this.showError('Analiz sırasında hata oluştu. Lütfen tekrar deneyin.');
        }
    }
    
    // Takip edilen hesapları çek
    async fetchFollowing() {
        await this.simulateApiCall(2000);
        
        // Demo veri oluştur
        this.followingList = [];
        const followingCount = this.userData.public_metrics.following_count;
        
        for (let i = 0; i < Math.min(followingCount, 50); i++) {
            this.followingList.push({
                id: `following_${i}`,
                name: `Takip ${i + 1}`,
                username: `takip${i + 1}`,
                profile_image_url: `https://via.placeholder.com/40x40/007bff/ffffff?text=T${i + 1}`
            });
        }
    }
    
    // Takipçileri çek
    async fetchFollowers() {
        await this.simulateApiCall(2000);
        
        // Demo veri oluştur
        this.followersList = [];
        const followersCount = this.userData.public_metrics.followers_count;
        
        for (let i = 0; i < Math.min(followersCount, 30); i++) {
            this.followersList.push({
                id: `follower_${i}`,
                name: `Takipçi ${i + 1}`,
                username: `takipci${i + 1}`,
                profile_image_url: `https://via.placeholder.com/40x40/28a745/ffffff?text=F${i + 1}`
            });
        }
    }
    
    // Listeleri karşılaştır
    async compareFollowingAndFollowers() {
        await this.simulateApiCall(1000);
        
        const followerIds = new Set(this.followersList.map(user => user.id));
        
        // Seni takip etmeyenler
        this.nonFollowers = this.followingList.filter(user => !followerIds.has(user.id));
        
        // Karşılıklı takipleşenler
        const mutualCount = this.followingList.filter(user => followerIds.has(user.id)).length;
        
        // İstatistikleri güncelle
        document.getElementById('mutual-count').textContent = mutualCount;
        document.getElementById('non-mutual-count').textContent = this.nonFollowers.length;
    }
    
    // Sonuçları göster
    displayResults() {
        const resultsSection = document.getElementById('results-section');
        const nonFollowersList = document.getElementById('non-followers-list');
        const emptyResults = document.getElementById('empty-results');
        
        if (this.nonFollowers.length === 0) {
            nonFollowersList.innerHTML = '';
            emptyResults.classList.remove('hidden');
            resultsSection.classList.remove('hidden');
            return;
        }
        
        emptyResults.classList.add('hidden');
        nonFollowersList.innerHTML = '';
        
        this.nonFollowers.forEach(user => {
            const userItem = this.createUserListItem(user);
            nonFollowersList.appendChild(userItem);
        });
        
        resultsSection.classList.remove('hidden');
        this.updateSelectedCount();
    }
    
    // Kullanıcı liste öğesi oluştur
    createUserListItem(user) {
        const div = document.createElement('div');
        div.className = 'user-item';
        div.dataset.userId = user.id;
        
        div.innerHTML = `
            <div class="user-item-left">
                <input type="checkbox" class="user-checkbox" data-user-id="${user.id}">
                <img src="${user.profile_image_url}" alt="${user.name}" class="user-avatar-small">
                <div class="user-info-text">
                    <h4>${user.name}</h4>
                    <p>@${user.username}</p>
                </div>
            </div>
            <div class="user-actions">
                <a href="https://twitter.com/${user.username}" target="_blank" class="btn-view">
                    <i class="fas fa-external-link-alt"></i>
                </a>
                <button class="btn-unfollow" data-user-id="${user.id}">
                    <i class="fas fa-user-minus"></i>
                </button>
            </div>
        `;
        
        // Event listener'ları ekle
        const checkbox = div.querySelector('.user-checkbox');
        const unfollowBtn = div.querySelector('.btn-unfollow');
        
        checkbox.addEventListener('change', () => {
            this.toggleUserSelection(user.id, checkbox.checked);
        });
        
        unfollowBtn.addEventListener('click', () => {
            this.unfollowUser(user.id);
        });
        
        return div;
    }
    
    // Kullanıcı seçimini değiştir
    toggleUserSelection(userId, selected) {
        const userItem = document.querySelector(`[data-user-id="${userId}"]`).closest('.user-item');
        
        if (selected) {
            this.selectedUsers.add(userId);
            userItem.classList.add('selected');
        } else {
            this.selectedUsers.delete(userId);
            userItem.classList.remove('selected');
        }
        
        this.updateSelectedCount();
    }
    
    // Seçili kullanıcı sayısını güncelle
    updateSelectedCount() {
        const count = this.selectedUsers.size;
        document.getElementById('selected-count').textContent = count;
        document.getElementById('unfollow-selected-btn').disabled = count === 0;
    }
    
    // Tüm kullanıcıları seç
    selectAllUsers() {
        const checkboxes = document.querySelectorAll('.user-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = true;
            this.toggleUserSelection(checkbox.dataset.userId, true);
        });
    }
    
    // Tüm seçimleri kaldır
    deselectAllUsers() {
        const checkboxes = document.querySelectorAll('.user-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
            this.toggleUserSelection(checkbox.dataset.userId, false);
        });
    }
    
    // Tek kullanıcıyı takipten çık
    async unfollowUser(userId) {
        const user = this.nonFollowers.find(u => u.id === userId);
        if (!user) return;
        
        const confirmed = await this.showConfirmModal(
            'Takibi Bırak',
            `${user.name} (@${user.username}) hesabını takip etmeyi bırakmak istediğinize emin misiniz?`
        );
        
        if (!confirmed) return;
        
        try {
            this.showLoading('Takipten çıkılıyor...', `${user.name} hesabından takip kaldırılıyor.`);
            
            // Demo API çağrısı
            await this.simulateApiCall(2000);
            
            // Listeden kaldır
            this.removeUserFromList(userId);
            this.hideLoading();
            
            this.showSuccessMessage(`${user.name} hesabını takipten çıktınız.`);
            
        } catch (error) {
            console.error('Unfollow failed:', error);
            this.hideLoading();
            this.showError('Takipten çıkarken hata oluştu. Lütfen tekrar deneyin.');
        }
    }
    
    // Seçili kullanıcıları takipten çık
    async unfollowSelectedUsers() {
        if (this.selectedUsers.size === 0) return;
        
        const selectedUsersList = Array.from(this.selectedUsers).map(id => 
            this.nonFollowers.find(u => u.id === id)
        ).filter(Boolean);
        
        const confirmed = await this.showConfirmModal(
            'Toplu Takipten Çık',
            `${selectedUsersList.length} hesabı takipten çıkarmak istediğinize emin misiniz?\n\n` +
            selectedUsersList.map(u => `• ${u.name} (@${u.username})`).slice(0, 5).join('\n') +
            (selectedUsersList.length > 5 ? `\n... ve ${selectedUsersList.length - 5} hesap daha` : '')
        );
        
        if (!confirmed) return;
        
        try {
            this.showLoading('Toplu takipten çıkılıyor...', 'Bu işlem birkaç dakika sürebilir.');
            
            let completed = 0;
            const total = selectedUsersList.length;
            
            for (const user of selectedUsersList) {
                this.updateLoadingText(`${user.name} takipten çıkarılıyor... (${completed + 1}/${total})`);
                this.updateProgress(completed, total);
                
                // Demo API çağrısı
                await this.simulateApiCall(1500);
                
                // Listeden kaldır
                this.removeUserFromList(user.id);
                completed++;
            }
            
            this.hideLoading();
            this.showSuccessMessage(`${completed} hesap başarıyla takipten çıkarıldı.`);
            
        } catch (error) {
            console.error('Bulk unfollow failed:', error);
            this.hideLoading();
            this.showError('Toplu takipten çıkarken hata oluştu. Bazı hesaplar işlenmiş olabilir.');
        }
    }
    
    // Kullanıcıyı listeden kaldır
    removeUserFromList(userId) {
        // DOM'dan kaldır
        const userItem = document.querySelector(`[data-user-id="${userId}"]`).closest('.user-item');
        if (userItem) {
            userItem.remove();
        }
        
        // Listeden kaldır
        this.nonFollowers = this.nonFollowers.filter(u => u.id !== userId);
        this.selectedUsers.delete(userId);
        
        // İstatistikleri güncelle
        const currentFollowing = parseInt(document.getElementById('following-count').textContent) - 1;
        const currentNonMutual = this.nonFollowers.length;
        
        document.getElementById('following-count').textContent = currentFollowing;
        document.getElementById('non-mutual-count').textContent = currentNonMutual;
        
        this.updateSelectedCount();
        
        // Liste boşsa empty state göster
        if (this.nonFollowers.length === 0) {
            document.getElementById('non-followers-list').innerHTML = '';
            document.getElementById('empty-results').classList.remove('hidden');
        }
    }
    
    // Verileri yenile
    async refreshData() {
        await this.fetchUserData();
        document.getElementById('results-section').classList.add('hidden');
    }
    
    // Çıkış yap
    logout() {
        this.accessToken = null;
        this.userData = null;
        this.followingList = [];
        this.followersList = [];
        this.nonFollowers = [];
        this.selectedUsers.clear();
        
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_data');
        
        document.getElementById('main-section').classList.add('hidden');
        document.getElementById('results-section').classList.add('hidden');
        document.getElementById('login-section').classList.remove('hidden');
        
        this.cleanUrl();
    }
    
    // Loading göster
    showLoading(title = 'Yükleniyor...', text = 'Lütfen bekleyin.') {
        document.getElementById('loading-title').textContent = title;
        document.getElementById('loading-text').textContent = text;
        document.getElementById('loading-section').classList.remove('hidden');
        document.getElementById('main-section').classList.add('hidden');
        document.getElementById('login-section').classList.add('hidden');
    }
    
    // Loading gizle
    hideLoading() {
        document.getElementById('loading-section').classList.add('hidden');
    }
    
    // Loading text güncelle
    updateLoadingText(text) {
        document.getElementById('loading-text').textContent = text;
    }
    
    // Progress bar güncelle
    updateProgress(current, total) {
        const percentage = total > 0 ? (current / total) * 100 : 0;
        document.getElementById('progress-fill').style.width = `${percentage}%`;
        document.getElementById('progress-current').textContent = current;
        document.getElementById('progress-total').textContent = total;
    }
    
    // Modal göster
    showModal(content) {
        document.getElementById('modal-body').innerHTML = content;
        document.getElementById('modal').classList.remove('hidden');
    }
    
    // Modal kapat
    closeModal() {
        document.getElementById('modal').classList.add('hidden');
    }
    
    // Confirm modal
    showConfirmModal(title, message) {
        return new Promise((resolve) => {
            const content = `
                <h3>${title}</h3>
                <p style="white-space: pre-line; margin: 15px 0;">${message}</p>
                <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">
                    <button id="confirm-no" class="btn-secondary">İptal</button>
                    <button id="confirm-yes" class="btn-danger">Evet</button>
                </div>
            `;
            
            this.showModal(content);
            
            document.getElementById('confirm-yes').onclick = () => {
                this.closeModal();
                resolve(true);
            };
            
            document.getElementById('confirm-no').onclick = () => {
                this.closeModal();
                resolve(false);
            };
        });
    }
    
    // Başarı mesajı
    showSuccessMessage(message) {
        const content = `
            <div style="text-align: center; color: #28a745;">
                <i class="fas fa-check-circle" style="font-size: 3rem; margin-bottom: 15px;"></i>
                <h3>Başarılı!</h3>
                <p>${message}</p>
                <button id="success-ok" class="btn-primary" style="margin-top: 20px;">Tamam</button>
            </div>
        `;
        
        this.showModal(content);
        
        document.getElementById('success-ok').onclick = () => {
            this.closeModal();
        };
    }
    
    // Hata göster
    showError(message) {
        const content = `
            <div style="text-align: center; color: #dc3545;">
                <i class="fas fa-exclamation-circle" style="font-size: 3rem; margin-bottom: 15px;"></i>
                <h3>Hata!</h3>
                <p>${message}</p>
                <button id="error-ok" class="btn-primary" style="margin-top: 20px;">Tamam</button>
            </div>
        `;
        
        this.showModal(content);
        
        document.getElementById('error-ok').onclick = () => {
            this.closeModal();
        };
    }
    
    // Yardımcı fonksiyonlar
    generateRandomString(length) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
    
    generateCodeVerifier() {
        return this.generateRandomString(128);
    }
    
    generateCodeChallenge(verifier) {
    return verifier;
}
    
    async simulateApiCall(delay = 1000) {
        return new Promise(resolve => setTimeout(resolve, delay));
    }
    
    cleanUrl() {
        const url = new URL(window.location);
        url.searchParams.delete('code');
        url.searchParams.delete('state');
        url.searchParams.delete('error');
        window.history.replaceState({}, document.title, url.pathname);
    }
    
    // Veri saklama
    saveToStorage() {
        if (this.userData) {
            localStorage.setItem('user_data', JSON.stringify(this.userData));
        }
    }
    
    loadFromStorage() {
        const token = localStorage.getItem('access_token');
        const userData = localStorage.getItem('user_data');
        
        if (token && userData) {
            this.accessToken = token;
            this.userData = JSON.parse(userData);
            this.showMainSection();
        }
    }
}

// Uygulama başlatma
document.addEventListener('DOMContentLoaded', () => {
    new TwitterUnfollower();
});

// Debug için global erişim
window.TwitterUnfollower = TwitterUnfollower;
