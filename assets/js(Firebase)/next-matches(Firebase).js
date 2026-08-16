// =====================================================
// NEXT-MATCHES(FIREBASE).JS - ХИБРИДНА ВЕРСИЯ
// =====================================================

(function() {
    'use strict';
    
    const MATCH_INTERVAL = 7000;
    
    let clubsMap = {};
    let futureMatches = [];
    let matchIndex = 0;
    let autoRotateTimer;
    let isExpanded = false;
    
    const panel = document.getElementById('nextMatchPanel');
    const homeLogo = document.getElementById('homeLogo');
    const awayLogo = document.getElementById('awayLogo');
    const matchNames = document.getElementById('matchNames');
    const matchDate = document.getElementById('matchDate');
    const matchInfo = document.getElementById('matchInfo');
    
    // Запазваме оригиналната ширина на панела
    let originalPanelWidth = '';
    
    function renderNextMatches(data) {
        console.log('⏳ Рендиране на предстоящи мачове...');
        
        // Запазваме ширината на панела
        if (panel) {
            originalPanelWidth = panel.offsetWidth + 'px';
            panel.style.width = originalPanelWidth;
            panel.style.maxWidth = originalPanelWidth;
            panel.style.minWidth = originalPanelWidth;
            // Важно: ширината да е фиксирана, височината автоматична
            panel.style.height = 'auto';
            panel.style.minHeight = 'auto';
            panel.style.maxHeight = 'none';
            panel.style.overflow = 'visible';
        }
        
        clubsMap = {};
        
        Object.entries(data.clubs || {}).forEach(([key, value]) => {
            clubsMap[key] = {
                id: key,
                ...value
            };
        });
        
        const now = new Date();
        
        futureMatches = Object.values(data.matches || {})
            .filter(m => 
                new Date(m.datetime) > now &&
                clubsMap[m.home] && clubsMap[m.away]
            )
            .sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
        
        if (!futureMatches.length) {
            if (panel) {
                panel.innerHTML = `
                    <div style="text-align:center; opacity:0.8; padding:40px;">
                        Няма предстоящи мачове.
                    </div>
                `;
            }
            return;
        }
        
        matchIndex = 0;
        showMatch(futureMatches[0], false);
        addExpandFeature();
        startAutoRotation();
        
        document.getElementById('prevMatchBtn')?.addEventListener('click', prevMatch);
        document.getElementById('nextMatchBtn')?.addEventListener('click', nextMatch);
    }
    
    function showMatch(m, animate = true) {
        const home = clubsMap[m.home];
        const away = clubsMap[m.away];
        
        if (!home || !away) return;
        
        const d = new Date(m.datetime);
        
        const dateStr = d.toLocaleDateString('bg-BG', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        
        const timeStr = d.toLocaleTimeString('bg-BG', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const elements = [homeLogo, awayLogo, matchNames, matchDate, matchInfo];
        
        if (animate) {
            elements.forEach(e => e.style.opacity = 0);
        }
        
        setTimeout(() => {
            homeLogo.src = home.logo || '';
            awayLogo.src = away.logo || '';
            matchNames.textContent = `${home.name} – ${away.name}`;
            matchDate.textContent = `${dateStr} • ${timeStr}`;
            
            if (m.tournament === 'Контролна/приятелска среща') {
                matchInfo.textContent = `Контрола${m.round ? ' №' + m.round : ''}`;
            } else {
                matchInfo.textContent = `${m.tournament}${m.round ? ' | Кръг ' + m.round : ''}`;
            }
            
            if (isExpanded && panel && panel._matchList) {
                updateMatchListHighlightDynamic(panel._matchList);
            }
        }, 200);
        
        setTimeout(() => {
            elements.forEach(e => e.style.opacity = 1);
        }, 400);
    }
    
    function changeMatch() {
        if (isExpanded) return;
        matchIndex = (matchIndex + 1) % futureMatches.length;
        showMatch(futureMatches[matchIndex], true);
    }
    
    function prevMatch() {
        if (!futureMatches.length) return;
        matchIndex--;
        if (matchIndex < 0) {
            matchIndex = futureMatches.length - 1;
        }
        showMatch(futureMatches[matchIndex], true);
        startAutoRotation();
        if (isExpanded && panel && panel._matchList) {
            updateMatchListHighlightDynamic(panel._matchList);
        }
    }
    
    function nextMatch() {
        if (!futureMatches.length) return;
        matchIndex++;
        if (matchIndex >= futureMatches.length) {
            matchIndex = 0;
        }
        showMatch(futureMatches[matchIndex], true);
        startAutoRotation();
        if (isExpanded && panel && panel._matchList) {
            updateMatchListHighlightDynamic(panel._matchList);
        }
    }
    
    function startAutoRotation() {
        clearInterval(autoRotateTimer);
        if (!isExpanded) {
            autoRotateTimer = setInterval(changeMatch, MATCH_INTERVAL);
        }
    }
    
    function addExpandFeature() {
        if (document.getElementById('expandWrapperDynamic')) return;
        
        const expandWrapper = document.createElement('div');
        expandWrapper.id = 'expandWrapperDynamic';
        expandWrapper.style.cssText = `
            width: 100%;
            margin-top: 15px;
            box-sizing: border-box;
            position: relative;
            z-index: 1;
        `;
        
        const expandBtn = document.createElement('button');
        expandBtn.id = 'expandBtnDynamic';
        expandBtn.textContent = '▼ Покажи всички мачове';
        expandBtn.style.cssText = `
            display: block;
            margin: 0 auto;
            padding: 8px 30px;
            font-size: 14px;
            font-weight: 400;
            color: rgba(255, 255, 255, 0.9);
            background: rgba(0, 0, 0, 0.4);
            border: 1px solid rgba(255, 255, 255, 0.15);
            border-radius: 25px;
            cursor: pointer;
            transition: all 0.3s ease;
            backdrop-filter: blur(4px);
            -webkit-backdrop-filter: blur(4px);
            font-family: inherit;
            width: auto;
            min-width: 180px;
            letter-spacing: 0.5px;
            position: relative;
            z-index: 2;
        `;
        
        expandBtn.onmouseenter = function() {
            this.style.background = 'rgba(0, 0, 0, 0.6)';
            this.style.transform = 'scale(1.05)';
        };
        expandBtn.onmouseleave = function() {
            this.style.background = 'rgba(0, 0, 0, 0.4)';
            this.style.transform = 'scale(1)';
        };
        
        const listContainer = document.createElement('div');
        listContainer.id = 'listContainerDynamic';
        listContainer.style.cssText = `
            max-height: 0;
            opacity: 0;
            overflow: hidden;
            transition: max-height 0.6s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.5s ease, margin 0.4s ease;
            margin-top: 0;
            padding: 0 5px;
            background: rgba(0, 0, 0, 0.1);
            border-radius: 12px;
            backdrop-filter: blur(2px);
            -webkit-backdrop-filter: blur(2px);
            width: 100%;
            box-sizing: border-box;
        `;
        
        const listInner = document.createElement('div');
        listInner.id = 'listInnerDynamic';
        listInner.style.cssText = `
            padding: 10px 8px;
            max-height: 400px;
            overflow-y: auto;
            width: 100%;
            box-sizing: border-box;
        `;
        
        const matchList = document.createElement('div');
        matchList.id = 'matchListDynamic';
        matchList.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 8px;
            width: 100%;
            box-sizing: border-box;
        `;
        
        listInner.appendChild(matchList);
        listContainer.appendChild(listInner);
        expandWrapper.appendChild(expandBtn);
        expandWrapper.appendChild(listContainer);
        
        if (panel) {
            panel.appendChild(expandWrapper);
        }
        
        const style = document.createElement('style');
        style.textContent = `
            #listInnerDynamic::-webkit-scrollbar { width: 4px; }
            #listInnerDynamic::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); border-radius: 4px; }
            #listInnerDynamic::-webkit-scrollbar-thumb { background: rgba(255,87,34,0.5); border-radius: 4px; }
            #listInnerDynamic { scrollbar-width: thin; scrollbar-color: rgba(255,87,34,0.5) rgba(255,255,255,0.05); }
            
            /* Панелът да има фиксирана ширина, но автоматична височина */
            #nextMatchPanel {
                width: ${originalPanelWidth} !important;
                max-width: ${originalPanelWidth} !important;
                min-width: ${originalPanelWidth} !important;
                height: auto !important;
                min-height: auto !important;
                max-height: none !important;
                overflow: visible !important;
                box-sizing: border-box !important;
            }
            
            /* Всички вътрешни елементи да са с ширина 100% */
            #nextMatchPanel > * {
                width: 100% !important;
                box-sizing: border-box !important;
            }
        `;
        document.head.appendChild(style);
        
        buildMatchListDynamic(matchList);
        
        expandBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleExpandDynamic(expandBtn, listContainer, matchList);
        });
        
        document.addEventListener('click', function(e) {
            if (isExpanded && panel && !panel.contains(e.target)) {
                collapseListDynamic(expandBtn, listContainer);
            }
        });
        
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && isExpanded) {
                collapseListDynamic(expandBtn, listContainer);
                expandBtn.focus();
            }
        });
        
        if (panel) {
            panel._expandBtn = expandBtn;
            panel._listContainer = listContainer;
            panel._matchList = matchList;
            panel._expandWrapper = expandWrapper;
        }
    }
    
    function buildMatchListDynamic(matchList) {
        if (!matchList) return;
        matchList.innerHTML = '';
        
        futureMatches.forEach((m, index) => {
            const home = clubsMap[m.home];
            const away = clubsMap[m.away];
            
            if (!home || !away) return;
            
            const d = new Date(m.datetime);
            const dateStr = d.toLocaleDateString('bg-BG', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
            const timeStr = d.toLocaleTimeString('bg-BG', {
                hour: '2-digit',
                minute: '2-digit'
            });
            
            const isCurrent = index === matchIndex;
            
            const item = document.createElement('div');
            item.className = 'matchListItemDynamic';
            item.style.cssText = `
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 10px 14px;
                background: ${isCurrent ? 'rgba(255, 87, 34, 0.2)' : 'rgba(255, 255, 255, 0.05)'};
                border-radius: 10px;
                border: 1px solid ${isCurrent ? 'rgba(255, 87, 34, 0.3)' : 'rgba(255, 255, 255, 0.06)'};
                transition: all 0.2s ease;
                cursor: pointer;
                font-size: 13px;
                color: white;
                backdrop-filter: blur(2px);
                -webkit-backdrop-filter: blur(2px);
                width: 100%;
                box-sizing: border-box;
            `;
            
            item.onmouseenter = function() {
                this.style.background = 'rgba(255, 255, 255, 0.12)';
                this.style.transform = 'scale(1.01)';
            };
            item.onmouseleave = function() {
                this.style.background = isCurrent ? 'rgba(255, 87, 34, 0.2)' : 'rgba(255, 255, 255, 0.05)';
                this.style.transform = 'scale(1)';
            };
            
            const teamsDiv = document.createElement('div');
            teamsDiv.style.cssText = `
                display: flex;
                align-items: center;
                gap: 8px;
                flex: 1;
                min-width: 0;
                overflow: hidden;
            `;
            
            const homeLogoImg = document.createElement('img');
            homeLogoImg.src = home.logo || '';
            homeLogoImg.alt = home.name;
            homeLogoImg.loading = 'lazy';
            homeLogoImg.style.cssText = `
                width: 28px;
                height: 28px;
                object-fit: contain;
                flex-shrink: 0;
            `;
            
            const homeName = document.createElement('span');
            homeName.textContent = home.name;
            homeName.style.cssText = `
                font-weight: 600;
                font-size: 13px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                flex-shrink: 1;
                min-width: 0;
            `;
            
            const vsSpan = document.createElement('span');
            vsSpan.textContent = 'vs';
            vsSpan.style.cssText = `
                color: rgba(255, 255, 255, 0.4);
                font-size: 11px;
                font-weight: 300;
                flex-shrink: 0;
                margin: 0 2px;
            `;
            
            const awayLogoImg = document.createElement('img');
            awayLogoImg.src = away.logo || '';
            awayLogoImg.alt = away.name;
            awayLogoImg.loading = 'lazy';
            awayLogoImg.style.cssText = `
                width: 28px;
                height: 28px;
                object-fit: contain;
                flex-shrink: 0;
            `;
            
            const awayName = document.createElement('span');
            awayName.textContent = away.name;
            awayName.style.cssText = `
                font-weight: 600;
                font-size: 13px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                flex-shrink: 1;
                min-width: 0;
            `;
            
            teamsDiv.appendChild(homeLogoImg);
            teamsDiv.appendChild(homeName);
            teamsDiv.appendChild(vsSpan);
            teamsDiv.appendChild(awayLogoImg);
            teamsDiv.appendChild(awayName);
            
            const detailsDiv = document.createElement('div');
            detailsDiv.style.cssText = `
                display: flex;
                flex-direction: column;
                align-items: flex-end;
                gap: 2px;
                font-size: 11px;
                opacity: 0.7;
                flex-shrink: 0;
                margin-left: 12px;
            `;
            
            const dateSpan = document.createElement('span');
            dateSpan.textContent = `${dateStr} • ${timeStr}`;
            dateSpan.style.fontWeight = '500';
            dateSpan.style.whiteSpace = 'nowrap';
            
            const tourSpan = document.createElement('span');
            const tourText = m.tournament === 'Контролна/приятелска среща' 
                ? `Контрола${m.round ? ' №' + m.round : ''}`
                : `${m.tournament}${m.round ? ' | Кръг ' + m.round : ''}`;
            tourSpan.textContent = tourText;
            tourSpan.style.cssText = `
                font-size: 10px;
                opacity: 0.6;
                white-space: nowrap;
            `;
            
            detailsDiv.appendChild(dateSpan);
            detailsDiv.appendChild(tourSpan);
            
            item.appendChild(teamsDiv);
            item.appendChild(detailsDiv);
            
            item.addEventListener('click', function() {
                matchIndex = index;
                showMatch(futureMatches[matchIndex], true);
                collapseListDynamic(panel._expandBtn, panel._listContainer);
                startAutoRotation();
            });
            
            matchList.appendChild(item);
        });
    }
    
    function toggleExpandDynamic(expandBtn, listContainer, matchList) {
        if (isExpanded) {
            collapseListDynamic(expandBtn, listContainer);
        } else {
            expandListDynamic(expandBtn, listContainer, matchList);
        }
    }
    
    function expandListDynamic(expandBtn, listContainer, matchList) {
        if (!listContainer) return;
        
        isExpanded = true;
        listContainer.style.maxHeight = '500px';
        listContainer.style.opacity = '1';
        listContainer.style.marginTop = '12px';
        listContainer.style.padding = '0 5px';
        listContainer.style.overflow = 'hidden';
        
        if (expandBtn) {
            expandBtn.textContent = '▲ Скрий списъка';
            expandBtn.style.marginBottom = '0';
        }
        
        updateMatchListHighlightDynamic(matchList);
        clearInterval(autoRotateTimer);
    }
    
    function collapseListDynamic(expandBtn, listContainer) {
        if (!listContainer) return;
        
        isExpanded = false;
        listContainer.style.maxHeight = '0';
        listContainer.style.opacity = '0';
        listContainer.style.marginTop = '0';
        listContainer.style.padding = '0 5px';
        listContainer.style.overflow = 'hidden';
        
        if (expandBtn) {
            expandBtn.textContent = '▼ Покажи всички мачове';
            expandBtn.style.marginBottom = '0';
        }
        
        startAutoRotation();
    }
    
    function updateMatchListHighlightDynamic(matchList) {
        if (!matchList) return;
        const items = matchList.querySelectorAll('.matchListItemDynamic');
        items.forEach((item, index) => {
            const isCurrent = index === matchIndex;
            item.style.background = isCurrent ? 'rgba(255, 87, 34, 0.25)' : 'rgba(255, 255, 255, 0.05)';
            item.style.borderColor = isCurrent ? 'rgba(255, 87, 34, 0.4)' : 'rgba(255, 255, 255, 0.06)';
        });
    }
    
    // ===== SWIPE =====
    let startX = 0;
    let endX = 0;
    
    function handleSwipe() {
        if (isExpanded) return;
        const diff = startX - endX;
        if (Math.abs(diff) < 40) return;
        if (diff > 0) {
            nextMatch();
        } else {
            prevMatch();
        }
    }
    
    const matchCard = document.getElementById('nextMatchPanel');
    
    matchCard?.addEventListener('touchstart', e => {
        startX = e.changedTouches[0].clientX;
    });
    
    matchCard?.addEventListener('touchend', e => {
        endX = e.changedTouches[0].clientX;
        handleSwipe();
    });
    
    let mouseDown = false;
    
    matchCard?.addEventListener('mousedown', e => {
        mouseDown = true;
        startX = e.clientX;
    });
    
    matchCard?.addEventListener('mouseup', e => {
        if (!mouseDown) return;
        mouseDown = false;
        endX = e.clientX;
        handleSwipe();
    });
    
    matchCard?.addEventListener('mouseleave', () => {
        mouseDown = false;
    });
    
    // ===== АБОНИРАНЕ ЗА ДАННИ =====
    if (typeof window.subscribeToData === 'function') {
        console.log('📡 next-matches.js: Абониране за данни...');
        window.subscribeToData(renderNextMatches);
    } else {
        console.warn('⚠️ data-loader не е намерен, използвам директно зареждане...');
        firebase.database().ref().once('value').then(snapshot => {
            renderNextMatches(snapshot.val());
        });
    }
    
})();