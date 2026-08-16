// =====================================================
// VIDEO-ARCHIVE(FIREBASE).JS - ОПТИМИЗИРАНА ВЕРСИЯ
// =====================================================

(function() {
    'use strict';
    
    const pastMatchesContainer = document.getElementById('past-matches');
    
    function renderArchive(data) {
        console.log('🎬 Рендиране на видео архив...');
        
        const matches = Object.values(data.matches || {})
            .filter(m => m.result);
        
        const clubs = data.clubs || {};
        
        if (!pastMatchesContainer) return;
        
        pastMatchesContainer.innerHTML = '';
        
        matches
            .sort((a, b) => new Date(a.datetime) - new Date(b.datetime))
            .forEach(match => {
                const homeClub = clubs[match.home];
                const awayClub = clubs[match.away];
                if (!homeClub || !awayClub) return;
                
                let emoji = '';
                switch (match.tournament) {
                    case 'Първенство': emoji = '<img src="images/emoji/efbetliga.png" class="emoji" loading="lazy">'; break;
                    case 'Купа на България': emoji = '<img src="images/emoji/CupLogo.png" class="emoji" loading="lazy">'; break;
                    case 'Шампионска лига': emoji = '<img src="https://res.cloudinary.com/xgtgerwb/image/upload/v1785258797/of_citypngcom_uefa_champions_league_ball_white_logo_-_2000x2000_hkhdkd.png" class="emoji" loading="lazy">'; break;
                    case 'Лига Европа': emoji = '<img src="https://res.cloudinary.com/xgtgerwb/image/upload/v1785258734/of_citypngcom_uefa_europa_league_white_logo_-_2000x2000_d9a0zf.png" class="emoji" loading="lazy">'; break;
                    case 'Лига на конференциите': emoji = '<img src="https://res.cloudinary.com/xgtgerwb/image/upload/v1784980298/uecl-logo_jd41ux.png" class="emoji" loading="lazy">'; break;
                    case 'Контролна/приятелска среща': emoji = '<img src="images/emoji/control.png" class="emoji" loading="lazy">'; break;
                    default: emoji = '🥇';
                }
                
                function parseResult(result) {
                    if (!result) return { main: '?', home: '?', away: '?', penalties: null };
                    
                    const penaltyMatch = result.match(/^(.+?)\s*\((.+?)\)$/);
                    if (penaltyMatch) {
                        const mainResult = penaltyMatch[1].trim();
                        const penaltyResult = penaltyMatch[2].trim();
                        const parts = mainResult.split('-');
                        return {
                            main: mainResult,
                            home: parts[0]?.trim() || '?',
                            away: parts[1]?.trim() || '?',
                            penalties: penaltyResult
                        };
                    }
                    
                    const parts = result.split('-');
                    return {
                        main: result,
                        home: parts[0]?.trim() || '?',
                        away: parts[1]?.trim() || '?',
                        penalties: null
                    };
                }
                
                function generateCompactStats(stats, result) {
                    if (!stats) {
                        if (result) {
                            const parsed = parseResult(result);
                            return `<div class="compact-stats-container">
                                <div class="compact-stat result-only">
                                    <span class="result-only-home">${parsed.home}</span>
                                    <span class="result-only-divider">:</span>
                                    <span class="result-only-away">${parsed.away}</span>
                                    ${parsed.penalties ? `<span class="result-only-penalties">(${parsed.penalties})</span>` : ''}
                                </div>
                            </div>`;
                        }
                        return '';
                    }
                    
                    const homeStats = stats.home || {};
                    const awayStats = stats.away || {};
                    const parsed = parseResult(result);
                    
                    let items = [];
                    
                    if (homeStats.possession !== undefined || awayStats.possession !== undefined) {
                        const homeP = homeStats.possession || 0;
                        const awayP = awayStats.possession || 0;
                        const total = homeP + awayP;
                        if (total > 0) {
                            const homeWidth = total !== 100 ? (homeP / total) * 100 : homeP;
                            const awayWidth = total !== 100 ? (awayP / total) * 100 : awayP;
                            
                            let homeScore = `${parsed.home}`;
                            if (parsed.penalties) {
                                homeScore += `(${parsed.penalties.split('-')[0]})`;
                            }
                            
                            let awayScore = `${parsed.away}`;
                            if (parsed.penalties) {
                                awayScore += `(${parsed.penalties.split('-')[1]})`;
                            }
                            
                            items.push(`
                                <div class="compact-stat">
                                    <div class="compact-bar possession-bar">
                                        <span class="possession-home" style="width:${homeWidth}%">
                                            <span class="possession-score">${homeScore}</span>
                                            <span class="possession-percent">${homeP}%</span>
                                        </span>
                                        <span class="possession-away" style="width:${awayWidth}%">
                                            <span class="possession-percent">${awayP}%</span>
                                            <span class="possession-score">${awayScore}</span>
                                        </span>
                                    </div>
                                </div>
                            `);
                        }
                    }
                    
                    const hasShots = (homeStats.shots !== undefined || awayStats.shots !== undefined) ||
                                    (homeStats.shotsOnTarget !== undefined || awayStats.shotsOnTarget !== undefined);
                    
                    if (hasShots) {
                        const maxShots = Math.max(homeStats.shots || 0, awayStats.shots || 0, 1);
                        const homeShotsP = maxShots > 0 ? ((homeStats.shots || 0) / maxShots) * 100 : 0;
                        const awayShotsP = maxShots > 0 ? ((awayStats.shots || 0) / maxShots) * 100 : 0;
                        
                        const maxTarget = Math.max(homeStats.shotsOnTarget || 0, awayStats.shotsOnTarget || 0, 1);
                        const homeTargetP = maxTarget > 0 ? ((homeStats.shotsOnTarget || 0) / maxTarget) * 100 : 0;
                        const awayTargetP = maxTarget > 0 ? ((awayStats.shotsOnTarget || 0) / maxTarget) * 100 : 0;
                        
                        items.push(`
                            <div class="compact-stat shots-row">
                                <div class="shots-container">
                                    <div class="shot-item">
                                        <div class="compact-bar shot-bar">
                                            <span class="shot-home" style="width:${homeShotsP}%">
                                                <span class="shot-label-inner">Общо</span>
                                                <span class="shot-value">${homeStats.shots || 0}</span>
                                            </span>
                                            <span class="shot-label-inner2">-удари</span>
                                            <span class="shot-away" style="width:${awayShotsP}%">
                                                <span class="shot-value">${awayStats.shots || 0}</span>
                                            </span>
                                        </div>
                                    </div>
                                    <div class="shot-item">
                                        <div class="compact-bar shot-bar">
                                            <span class="shot-home" style="width:${homeTargetP}%">
                                                <span class="shot-label-inner">Точни</span>
                                                <span class="shot-value">${homeStats.shotsOnTarget || 0}</span>
                                            </span>
                                            <span class="shot-label-inner2">-удари</span>
                                            <span class="shot-away" style="width:${awayTargetP}%">
                                                <span class="shot-value">${awayStats.shotsOnTarget || 0}</span>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `);
                    }
                    
                    return items.length > 0 ? `
                        <div class="compact-stats-container">
                            ${items.join('')}
                        </div>
                    ` : '';
                }
                
                const cube = document.createElement('div');
                cube.className = 'match-cube';
                cube.innerHTML = `
                    <div class="logos">
                        <img src="${homeClub.logo || ''}" alt="${homeClub.name}" loading="lazy" onerror="this.src=''; this.alt='-'">
                        <span class="vs-label-arhive">${emoji}</span>
                        <img src="${awayClub.logo || ''}" alt="${awayClub.name}" loading="lazy" onerror="this.src=''; this.alt='-'">
                    </div>
                    <div class="match-date-header">
                        ${match.datetime ? new Date(match.datetime).toLocaleString('bg-BG') : ''}
                    </div>
                    <div class="match-extra">
                        ${match.round ? `<div class="match-round">
                            ${match.tournament === 'Първенство' ? 'Кръг'
                            : match.tournament === 'Купа на България' ? 'Фаза'
                            : match.tournament === 'Шампионска лига' ? 'Квалификация'
                            : match.tournament === 'Лига Европа' ? 'Квалификация'
                            : match.tournament === 'Лига на конференциите' ? 'Квалификация'
                            : match.tournament === 'Контролна/приятелска среща' ? 'Контрола №'
                            : ''}: ${match.round}
                        </div>` : ''}
                        ${match.stats ? generateCompactStats(match.stats, match.result) : 
                          (match.result ? generateCompactStats(null, match.result) : '')}
                        ${match.youtube ? `<div class="video-placeholder" data-src="${match.youtube.replace('youtube.com','youtube-nocookie.com')}"></div>` : ''}
                    </div>
                `;
                
                cube.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const isOpen = this.classList.contains('cube-expanded');
                    document.querySelectorAll('.cube-expanded').forEach(c => {
                        if (c !== this) closeCube(c);
                    });
                    if (isOpen) {
                        closeCube(this);
                    } else {
                        this.classList.add('cube-expanded');
                        const placeholder = this.querySelector('.video-placeholder');
                        if (placeholder && !placeholder.querySelector('iframe')) {
                            const videoUrl = placeholder.getAttribute('data-src');
                            placeholder.innerHTML = `<iframe src="${videoUrl}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen loading="lazy"></iframe>`;
                        }
                    }
                });
                
                pastMatchesContainer.appendChild(cube);
            });
    }
    
    function closeCube(cube) {
        cube.classList.remove('cube-expanded');
        const placeholder = cube.querySelector('.video-placeholder');
        if (placeholder) placeholder.innerHTML = '';
    }
    
    document.body.addEventListener('click', () => {
        document.querySelectorAll('.cube-expanded').forEach(cube => closeCube(cube));
    });
    
    // ===== АБОНИРАНЕ ЗА ДАННИ =====
    if (typeof window.subscribeToData === 'function') {
        console.log('📡 video-archive.js: Абониране за данни...');
        window.subscribeToData(renderArchive);
    } else {
        console.warn('⚠️ data-loader не е намерен, използвам директно зареждане...');
        firebase.database().ref().once('value').then(snapshot => {
            renderArchive(snapshot.val());
        });
    }
    
})();