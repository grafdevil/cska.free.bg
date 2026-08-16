// =====================================================
// DATA-LOADER.JS - С ИНДИКАТОР ЗА ПРОГРЕС
// =====================================================

(function() {
    'use strict';
    
    let dataLoaded = false;
    let cachedData = null;
    let loadingPromise = null;
    let subscribers = [];
    let progress = 0;
    
    // Функция за обновяване на индикатора за прогрес
    function updateProgress(value, text = null) {
        progress = Math.min(value, 100);
        const bar = document.getElementById('page-loader-bar');
        const label = document.getElementById('page-loader-text');
        
        if (bar) {
            bar.style.width = progress + '%';
        }
        
        if (label && text) {
            label.textContent = text;
        }
    }
    
    // Главна функция за зареждане на данни
    function loadFirebaseData() {
        if (dataLoaded && cachedData) {
            return Promise.resolve(cachedData);
        }
        
        if (loadingPromise) {
            return loadingPromise;
        }
        
        updateProgress(10, 'Свързване с базата данни...');
        
        loadingPromise = new Promise((resolve, reject) => {
            console.log('📡 Зареждане на данни от Firebase...');
            
            // Симулираме прогрес по време на зареждане
            let progressInterval = setInterval(() => {
                if (progress < 70) {
                    const increment = 2 + Math.random() * 5;
                    updateProgress(Math.min(progress + increment, 70));
                }
            }, 300);
            
            firebase.database().ref().once('value')
                .then(snapshot => {
                    clearInterval(progressInterval);
                    updateProgress(85, 'Обработка на данните...');
                    
                    const data = snapshot.val();
                    
                    if (!data) {
                        updateProgress(100, 'Грешка при зареждане');
                        reject(new Error('Няма данни от Firebase'));
                        return;
                    }
                    
                    // Кешираме данните
                    cachedData = data;
                    dataLoaded = true;
                    
                    console.log('✅ Данните са заредени успешно!');
                    updateProgress(95, 'Подготовка на интерфейса...');
                    
                    // Съхраняваме в глобален обект
                    window.__appData = data;
                    
                    // Изпращаме събитие
                    const event = new CustomEvent('firebaseDataReady', {
                        detail: data,
                        bubbles: true,
                        cancelable: true
                    });
                    document.dispatchEvent(event);
                    
                    // Уведомяваме абонатите
                    subscribers.forEach(callback => {
                        try {
                            callback(data);
                        } catch (e) {
                            console.error('Грешка в абонат:', e);
                        }
                    });
                    subscribers = [];
                    
                    updateProgress(100, 'Готово!');
                    
                    // Скриваме индикатора след 300ms
                    setTimeout(() => {
                        const loader = document.getElementById('page-loader');
                        if (loader) {
                            loader.style.opacity = '0';
                            setTimeout(() => {
                                loader.style.display = 'none';
                            }, 600);
                        }
                    }, 300);
                    
                    resolve(data);
                })
                .catch(error => {
                    clearInterval(progressInterval);
                    console.error('❌ Грешка при зареждане на данни:', error);
                    updateProgress(100, 'Грешка! Опит за повторно...');
                    
                    setTimeout(() => {
                        console.log('🔄 Опит за повторно зареждане...');
                        loadingPromise = null;
                        loadFirebaseData();
                    }, 5000);
                    
                    reject(error);
                });
        });
        
        return loadingPromise;
    }
    
    function subscribeToData(callback) {
        if (dataLoaded && cachedData) {
            setTimeout(() => {
                try {
                    callback(cachedData);
                } catch (e) {
                    console.error('Грешка в абонат (кеш):', e);
                }
            }, 0);
            return;
        }
        
        subscribers.push(callback);
        
        if (!loadingPromise) {
            loadFirebaseData().catch(() => {});
        }
    }
    
    // Експорт
    window.loadFirebaseData = loadFirebaseData;
    window.subscribeToData = subscribeToData;
    window.__firebaseDataLoaded = () => dataLoaded;
    window.__firebaseGetData = () => cachedData;
    
    // Автоматично стартиране
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            updateProgress(5, 'Стартиране...');
            loadFirebaseData().catch(() => {});
        });
    } else {
        updateProgress(5, 'Стартиране...');
        loadFirebaseData().catch(() => {});
    }
    
    // Аварийно скриване на индикатора след 10 секунди
    setTimeout(() => {
        const loader = document.getElementById('page-loader');
        if (loader && loader.style.display !== 'none') {
            console.warn('⚠️ Аварийно скриване на индикатора за зареждане');
            loader.style.opacity = '0';
            setTimeout(() => {
                loader.style.display = 'none';
            }, 600);
        }
    }, 10000);
    
    console.log('📦 Data-loader инициализиран');
    
})();