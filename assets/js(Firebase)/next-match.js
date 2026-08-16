// =====================================================
// MATCHES(FIREBASE).JS - ОПТИМИЗИРАНА ВЕРСИЯ
// Използва централизирано зареждане на данни
// =====================================================

(function() {
    'use strict';
    
    function renderMatches(data) {
        console.log('🏆 Рендиране на мачове...');
        
        const clubs = Object.entries(data.clubs || {}).map(([key, value]) => ({
            id: key,
            ...value
        }));
        
        const matches = Object.values(data.matches || {});
        
        // Сортиране по дата
        matches.sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
        
        const ul = document.getElementById('next-match');
        if (!ul) {
            console.warn('❌ Елемент #next-match не е намерен');
            return;
        }
        
        function renderNextMatch() {
            const now = new Date();
            
            const match = matches.find(m => {
                const start = new Date(m.datetime);
                const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
                return now < end;
            });
            
            if (!match) {
                console.warn('⚠️ Няма предстоящи мачове');
                return;
            }
            
            ul.innerHTML = '';
            
            const homeClub = clubs.find(c => c.id === match.home);
            const awayClub = clubs.find(c => c.id === match.away);
            
            if (!homeClub || !awayClub) {
                console.warn('⚠️ Липсват данни за клубове');
                return;
            }
            
            /* ===== ДОМАКИН ===== */
            const liHome = document.createElement('li');
            liHome.innerHTML = `
                <img src="${homeClub?.logo || ''}" alt="${homeClub?.name || ''}" loading="lazy">
                ${homeClub?.name || ''}
            `;
            
            /* ===== СРЕДА ===== */
            const liInfo = document.createElement('li');
            liInfo.id = 'match-info';
            
            const matchDate = new Date(match.datetime);
            
            const timeBig = matchDate.toLocaleTimeString('bg-BG', {
                hour: '2-digit',
                minute: '2-digit'
            });
            
            const weekday = matchDate.toLocaleDateString('bg-BG', { weekday: 'long' });
            const day = String(matchDate.getDate()).padStart(2, '0');
            const month = String(matchDate.getMonth() + 1).padStart(2, '0');
            const year = matchDate.getFullYear();
            
            liInfo.innerHTML = `
                <div id="vs-label" style="text-align: left;">VS</div>
                <div id="match-timer" style="text-align: left; margin-bottom: 5px;">Зареждане...</div>
                <div class="match-time-big" style="text-align: left;">${timeBig}</div>
                <div class="match-day-small" style="text-align: left;">${weekday},</div>
                <div class="match-date-small" style="text-align: left;">${day}.${month}.${year}</div>
            `;
            
            /* ===== ТУРНИР ИКОНА ===== */
            let emoji = '';
            switch (match.tournament) {
                case 'Първенство':
                    emoji = '<img src="images/emoji/efbetliga.png" class="emoji-mach" loading="lazy">';
                    break;
                case 'Купа на България':
                case 'Суперкупа на България':
                    emoji = '<img src="images/emoji/CupLogo.png" class="emoji-mach" loading="lazy">';
                    break;
                case 'Шампионска лига':
                    emoji = '<img src="https://res.cloudinary.com/xgtgerwb/image/upload/v1785258797/of_citypngcom_uefa_champions_league_ball_white_logo_-_2000x2000_hkhdkd.png" class="emoji-mach" loading="lazy">';
                    break;
                case 'Лига Европа':
                    emoji = '<img src="https://res.cloudinary.com/xgtgerwb/image/upload/v1785258734/of_citypngcom_uefa_europa_league_white_logo_-_2000x2000_d9a0zf.png" class="emoji-mach" loading="lazy">';
                    break;
                case 'Лига на конференциите':
                    emoji = '<img src="https://res.cloudinary.com/xgtgerwb/image/upload/v1784980298/uecl-logo_jd41ux.png" class="emoji-mach" loading="lazy">';
                    break;
                case 'Контролна среща':
                case 'Контролна/приятелска среща':
                    emoji = '<img src="images/emoji/control.png" class="emoji-mach" loading="lazy">';
                    break;
                default:
                    emoji = '🥇';
            }
            
            if (emoji) {
                const icon = document.createElement('div');
                icon.className = 'match-icon';
                icon.innerHTML = emoji;
                liInfo.appendChild(icon);
            }
            
            /* ===== ГОСТ ===== */
            const liAway = document.createElement('li');
            liAway.innerHTML = `
                <img src="${awayClub?.logo || ''}" alt="${awayClub?.name || ''}" loading="lazy">
                ${awayClub?.name || ''}
            `;
            
            ul.appendChild(liHome);
            ul.appendChild(liInfo);
            ul.appendChild(liAway);
            
            /* ===== ТАЙМЕР ===== */
            function updateTimer() {
                const now = new Date();
                const matchEnd = new Date(matchDate.getTime() + 2 * 60 * 60 * 1000);
                
                const timerEl = document.getElementById('match-timer');
                if (!timerEl) return;
                
                if (now >= matchDate && now < matchEnd) {
                    timerEl.innerHTML = `
                        <div class="match-live">
                            ⚽ Мачът се играе ⚽
                        </div>
                    `;
                    return;
                }
                
                if (now >= matchEnd) {
                    return;
                }
                
                const diff = matchDate - now;
                
                const days = Math.floor(diff / 86400000);
                const hours = Math.floor((diff / 3600000) % 24);
                const minutes = Math.floor((diff / 60000) % 60);
                const seconds = Math.floor((diff / 1000) % 60);
                
                timerEl.innerHTML = `
                    <div class="match-countdown-time">
                        <div class="time-block">
                            <div class="num">${days}</div>
                            <div class="label">${days === 1 ? 'ден' : 'дни'}</div>
                        </div>
                        <div class="time-block">
                            <div class="num">${hours}</div>
                            <div class="label">${hours === 1 ? 'час' : 'часа'}</div>
                        </div>
                        <div class="time-block">
                            <div class="num">${minutes}</div>
                            <div class="label">${minutes === 1 ? 'минута' : 'минути'}</div>
                        </div>
                        <div class="time-block match-countdown-seconds">
                            <div class="num">${seconds}</div>
                            <div class="label">${seconds === 1 ? 'секунда' : 'секунди'}</div>
                        </div>
                    </div>
                `;
            }
            
            updateTimer();
            const timerInterval = setInterval(updateTimer, 1000);
        }
        
        renderNextMatch();
    }
    
    // Абонираме се за данни
    if (typeof window.subscribeToData === 'function') {
        console.log('📡 matches.js: Абониране за данни...');
        window.subscribeToData(renderMatches);
    } else {
        // Fallback - директно зареждане
        console.warn('⚠️ data-loader не е намерен, използвам директно зареждане...');
        firebase.database().ref().once('value').then(snapshot => {
            renderMatches(snapshot.val());
        });
    }
    
})();