// =====================================================
// BACKGROUND(FIREBASE).JS - ОПТИМИЗИРАНА ВЕРСИЯ
// =====================================================

(function() {
    'use strict';
    
    const ROTATE_INTERVAL = 50000;
    let matchesPlayed = [];
    let clubMap = {};
    let currentIndex = 0;
    
    const playedhomeLogo = document.getElementById("home-logo");
    const playedawayLogo = document.getElementById("away-logo");
    const playedmatchResult = document.getElementById("match-result");
    
    function renderBackground(data) {
        console.log('🎨 Рендиране на фон...');
        
        if (!data) return;
        
        clubMap = {};
        Object.entries(data.clubs || {}).forEach(([id, club]) => {
            clubMap[id] = club.logo || '';
        });
        
        matchesPlayed = Object.values(data.matches || {}).filter(m =>
            typeof m.result === 'string' && m.result.includes('-')
        );
        
        if (!matchesPlayed.length) {
            console.warn('⚠️ Няма изиграни мачове за фон');
            return;
        }
        
function updateMatch() {
    document.querySelectorAll('.team-logo').forEach(logo => logo.classList.add('hidden'));
    playedmatchResult.classList.remove('visible');
    playedmatchResult.classList.add('hidden');
    
    setTimeout(() => {
        const match = matchesPlayed[currentIndex];
        
        playedhomeLogo.src = clubMap[match.home] || '';
        playedawayLogo.src = clubMap[match.away] || '';
        
        if (match.result) {
            // Парсиране на резултата (например "0-0 (5-4)")
            const regex = /(\d+)-(\d+)\s*\((\d+)-(\d+)\)/;
            const matchData = match.result.match(regex);
            
            console.log('🎯 Резултат:', match.result);
            console.log('📊 Парсирано:', matchData);
            
            if (matchData) {
                // Има дусипи
                const homeScore = matchData[1];
                const awayScore = matchData[2];
                const homePenalties = matchData[3];
                const awayPenalties = matchData[4];
                
                console.log(`✅ Показвам дусипи: ${homeScore}(${homePenalties}) - ${awayScore}(${awayPenalties})`);
                
                playedmatchResult.innerHTML = 
                    `<span class="score-wrapper">
                        ${homeScore}<span class="penalty-score">${homePenalties}</span>
                    </span>  :  
                    <span class="score-wrapper">
                        ${awayScore}<span class="penalty-score">${awayPenalties}</span>
                    </span>`;
            } else {
                // Обичайни резултати без дусипи
                console.log('⚠️ Няма дусипи, показвам обичайния резултат');
                playedmatchResult.textContent = match.result.replace('-', '  :  ');
            }
        }
        
        document.querySelectorAll('.team-logo').forEach(logo => logo.classList.remove('hidden'));
        
        playedmatchResult.classList.remove('hidden');
        playedmatchResult.classList.add('visible');
        
        currentIndex = (currentIndex + 1) % matchesPlayed.length;
    }, 800);
}
        
        updateMatch();
        setInterval(updateMatch, ROTATE_INTERVAL);
    }
    
    // ===== АБОНИРАНЕ ЗА ДАННИ =====
    if (typeof window.subscribeToData === 'function') {
        console.log('📡 background.js: Абониране за данни...');
        window.subscribeToData(renderBackground);
    } else {
        console.warn('⚠️ data-loader не е намерен, използвам директно зареждане...');
        firebase.database().ref().once('value').then(snapshot => {
            renderBackground(snapshot.val());
        });
    }
    
})();