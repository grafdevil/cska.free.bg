// =====================================================
// PLAYERS(FIREBASE).JS - ОПТИМИЗИРАНА ВЕРСИЯ
// Използва централизирано зареждане на данни
// =====================================================

(function() {
    'use strict';
    
    const INTERVAL_MS = 10000;
    
    let players = [];
    let bgCurrent = 0;
    let isPlayersExpanded = false;
    
    // DOM елементи
    const elNum = document.getElementById('playerNumber');
    const elName = document.getElementById('playerName');
    const elPos = document.getElementById('playerPos');
    const elNation = document.getElementById('playerNation');
    const elAge = document.getElementById('playerAge');
    
    const gamer1 = document.getElementById("bg-gamer-1");
    const gamer2 = document.getElementById("bg-gamer-2");
    let intervalId = null;
    let bgActive = gamer1;
    
    function renderPlayers(data) {
        console.log('👤 Рендиране на играчи...');
        
        players = Object.values(data.players || {})
            .filter(p => p.visible !== false);
        
        if (!players.length) {
            const card = document.getElementById('playerCard');
            if (card) {
                card.innerHTML = `
                    <div style="text-align:center; opacity:0.8; padding:40px;">
                        Няма добавени играчи.
                    </div>
                `;
            }
            return;
        }
        
        bgCurrent = 0;
        showPlayer(players[0], false);
        
        gamer1.style.backgroundImage = `url("${players[0].photo || ''}")`;
        gamer1.style.opacity = 1;
        gamer2.style.opacity = 0;
        bgActive = gamer1;
        
        setTimeout(() => {
            addPlayersExpandFeature();
        }, 200);
        
        if (intervalId) clearInterval(intervalId);
        intervalId = setInterval(changePlayer, INTERVAL_MS);
    }
    
    function showPlayer(p, animate = true) {
        const textEls = [elNum, elName];
        
        if (animate) textEls.forEach(e => e.style.opacity = '0');
        
        setTimeout(() => {
            elNum.textContent = '' + (p.number ?? '⚠️ Няма въведен номер');
            const playerName = (p.name ?? '⚠️ Неизвестен').replace(' ', '<br>');
            elName.innerHTML = playerName;
            const position = p.position ?? '⚠️ Няма въведена позиция';
            const nation = p.nation ?? '⚠️ Няма въведена националност';
            const age = p.age ?? '⚠️ Няма въведена възраст';
            elPos.innerHTML = `<strong><b>${position}</b></strong> от <strong><b>${nation}</b></strong> на <strong><b>${age}</b></strong> г.`;
        }, 300);
        
        setTimeout(() => {
            textEls.forEach(e => e.style.transition = 'opacity .8s ease');
            textEls.forEach(e => e.style.opacity = '1');
        }, 600);
        
        const card = document.getElementById('playerCard');
        if (isPlayersExpanded && card && card._playersList) {
            updatePlayersListHighlight(card._playersList);
        }
    }
    
    function changePlayer() {
        if (!players.length || isPlayersExpanded) return;
        
        const next = (bgCurrent + 1) % players.length;
        const player = players[next];
        
        const nextGamer = bgActive === gamer1 ? gamer2 : gamer1;
        nextGamer.style.backgroundImage = `url("${player.photo || ''}")`;
        nextGamer.style.opacity = 1;
        bgActive.style.opacity = 0;
        bgActive = nextGamer;
        
        showPlayer(player, true);
        bgCurrent = next;
    }
    
    function goNext() {
        clearInterval(intervalId);
        if (!players.length || isPlayersExpanded) return;
        changePlayer();
        intervalId = setInterval(changePlayer, INTERVAL_MS);
    }
    
    function goPrev() {
        if (!players.length || isPlayersExpanded) return;
        
        clearInterval(intervalId);
        bgCurrent = (bgCurrent - 1 + players.length) % players.length;
        const player = players[bgCurrent];
        
        const nextGamer = bgActive === gamer1 ? gamer2 : gamer1;
        nextGamer.style.backgroundImage = `url("${player.photo || ''}")`;
        nextGamer.style.opacity = 1;
        bgActive.style.opacity = 0;
        bgActive = nextGamer;
        
        showPlayer(player, true);
        intervalId = setInterval(changePlayer, INTERVAL_MS);
    }
    
    function addPlayersExpandFeature() {
        const card = document.getElementById('playerCard');
        if (!card) return;
        
        const oldWrapper = document.getElementById('playersExpandWrapper');
        if (oldWrapper) {
            oldWrapper.remove();
        }
        
        const expandWrapper = document.createElement('div');
        expandWrapper.id = 'playersExpandWrapper';
        expandWrapper.style.cssText = `
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            z-index: 20;
            padding: 20px 20px 15px 20px;
            background: linear-gradient(to top, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.3) 70%, rgba(0,0,0,0) 100%);
            pointer-events: none;
            border-radius: 0 0 18px 18px;
        `;
        
        const expandBtn = document.createElement('button');
        expandBtn.id = 'playersExpandBtn';
        expandBtn.textContent = '▼ Покажи всички играчи';
        expandBtn.style.cssText = `
            display: block;
            margin: 0 auto 8px auto;
            padding: 8px 30px;
            font-size: 14px;
            font-weight: 500;
            color: rgba(255, 255, 255, 0.9);
            background: rgba(0, 0, 0, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.15);
            border-radius: 25px;
            cursor: pointer;
            transition: all 0.3s ease;
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            font-family: inherit;
            width: auto;
            min-width: 180px;
            letter-spacing: 0.5px;
            pointer-events: auto;
            position: relative;
            z-index: 21;
        `;
        
        expandBtn.onmouseenter = function() {
            this.style.background = 'rgba(0, 0, 0, 0.5)';
            this.style.transform = 'scale(1.05)';
            this.style.borderColor = 'rgba(255, 87, 34, 0.3)';
        };
        expandBtn.onmouseleave = function() {
            this.style.background = 'rgba(0, 0, 0, 0.2)';
            this.style.transform = 'scale(1)';
            this.style.borderColor = 'rgba(255, 255, 255, 0.15)';
        };
        
        const listContainer = document.createElement('div');
        listContainer.id = 'playersListContainer';
        listContainer.style.cssText = `
            max-height: 0;
            opacity: 0;
            overflow: hidden;
            transition: max-height 0.6s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.5s ease;
            margin-top: 0;
            padding: 0;
            background: rgba(0, 0, 0, 0.1);
            border-radius: 12px;
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.06);
            pointer-events: auto;
        `;
        
        const listInner = document.createElement('div');
        listInner.id = 'playersListInner';
        listInner.style.cssText = `
            padding: 12px 10px;
            max-height: 400px;
            overflow-y: auto;
        `;
        
        const playersList = document.createElement('div');
        playersList.id = 'playersListDynamic';
        playersList.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 8px;
        `;
        
        listInner.appendChild(playersList);
        listContainer.appendChild(listInner);
        expandWrapper.appendChild(expandBtn);
        expandWrapper.appendChild(listContainer);
        
        card.style.position = 'relative';
        card.appendChild(expandWrapper);
        
        const styleId = 'playersScrollStyle';
        let style = document.getElementById(styleId);
        if (!style) {
            style = document.createElement('style');
            style.id = styleId;
            style.textContent = `
                #playersListInner::-webkit-scrollbar { width: 4px; }
                #playersListInner::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); border-radius: 4px; }
                #playersListInner::-webkit-scrollbar-thumb { background: rgba(255,87,34,0.5); border-radius: 4px; }
                #playersListInner { scrollbar-width: thin; scrollbar-color: rgba(255,87,34,0.5) rgba(255,255,255,0.05); }
                .playerListItemDynamic {
                    display: flex !important;
                    align-items: center !important;
                    justify-content: space-between !important;
                    padding: 10px 14px !important;
                    border-radius: 10px !important;
                    transition: all 0.2s ease !important;
                    cursor: pointer !important;
                    gap: 12px !important;
                    color: white !important;
                }
                .playerListItemDynamic:hover { transform: scale(1.02) !important; }
                .playerListItemDynamic .player-left {
                    display: flex !important;
                    align-items: center !important;
                    gap: 12px !important;
                    flex: 1 !important;
                    min-width: 0 !important;
                }
                .playerListItemDynamic .player-photo-small {
                    width: 40px !important;
                    height: 40px !important;
                    object-fit: cover !important;
                    border-radius: 50% !important;
                    flex-shrink: 0 !important;
                    background: rgba(255,255,255,0.1) !important;
                }
                .playerListItemDynamic .player-info-small {
                    display: flex !important;
                    flex-direction: column !important;
                    gap: 2px !important;
                    min-width: 0 !important;
                }
                .playerListItemDynamic .player-name-small {
                    font-weight: 600 !important;
                    font-size: 14px !important;
                    white-space: nowrap !important;
                    overflow: hidden !important;
                    text-overflow: ellipsis !important;
                }
                .playerListItemDynamic .player-details-small {
                    font-size: 12px !important;
                    opacity: 0.7 !important;
                    white-space: nowrap !important;
                    overflow: hidden !important;
                    text-overflow: ellipsis !important;
                }
                .playerListItemDynamic .player-status {
                    display: flex !important;
                    align-items: center !important;
                    gap: 8px !important;
                    flex-shrink: 0 !important;
                }
                .playerListItemDynamic .current-badge {
                    font-size: 11px !important;
                    color: #ff5722 !important;
                    font-weight: 600 !important;
                    opacity: 0.9 !important;
                }
                @media (max-width: 900px) {
                    #playersExpandWrapper {
                        position: relative !important;
                        background: rgba(0,0,0,0.3) !important;
                        padding: 10px 15px !important;
                        border-radius: 0 0 14px 14px !important;
                    }
                    #playersListInner { max-height: 200px !important; }
                }
            `;
            document.head.appendChild(style);
        }
        
        buildPlayersListDynamic(playersList);
        
        expandBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            togglePlayersExpand(expandBtn, listContainer, playersList);
        });
        
        document.addEventListener('click', function(e) {
            if (isPlayersExpanded && card && !card.contains(e.target)) {
                collapsePlayersList(expandBtn, listContainer);
            }
        });
        
        card._playersExpandBtn = expandBtn;
        card._playersListContainer = listContainer;
        card._playersList = playersList;
        card._playersExpandWrapper = expandWrapper;
    }
    
    function buildPlayersListDynamic(playersList) {
        if (!playersList) return;
        playersList.innerHTML = '';
        
        players.forEach((p, index) => {
            const isCurrent = index === bgCurrent;
            
            const item = document.createElement('div');
            item.className = 'playerListItemDynamic';
            item.style.cssText = `
                background: ${isCurrent ? 'rgba(255, 87, 34, 0.25)' : 'rgba(255, 255, 255, 0.06)'};
                border: 1px solid ${isCurrent ? 'rgba(255, 87, 34, 0.4)' : 'rgba(255, 255, 255, 0.08)'};
            `;
            
            const leftDiv = document.createElement('div');
            leftDiv.className = 'player-left';
            
            const photoImg = document.createElement('img');
            photoImg.className = 'player-photo-small';
            photoImg.src = p.photo || '';
            photoImg.alt = p.name || 'Играч';
            photoImg.loading = 'lazy';
            if (isCurrent) {
                photoImg.style.border = '2px solid rgba(255, 87, 34, 0.5)';
            }
            
            const infoDiv = document.createElement('div');
            infoDiv.className = 'player-info-small';
            
            const nameSpan = document.createElement('span');
            nameSpan.className = 'player-name-small';
            nameSpan.textContent = p.name || 'Неизвестен';
            
            const detailsSpan = document.createElement('span');
            detailsSpan.className = 'player-details-small';
            const details = [];
            if (p.number) details.push(`#${p.number}`);
            if (p.position) details.push(p.position);
            if (p.nation) details.push(p.nation);
            if (p.age) details.push(`${p.age} г.`);
            detailsSpan.textContent = details.join(' • ') || 'Няма данни';
            
            infoDiv.appendChild(nameSpan);
            infoDiv.appendChild(detailsSpan);
            
            leftDiv.appendChild(photoImg);
            leftDiv.appendChild(infoDiv);
            
            const rightDiv = document.createElement('div');
            rightDiv.className = 'player-status';
            
            if (isCurrent) {
                const currentBadge = document.createElement('span');
                currentBadge.className = 'current-badge';
                currentBadge.textContent = '● Текущ';
                rightDiv.appendChild(currentBadge);
            }
            
            item.appendChild(leftDiv);
            item.appendChild(rightDiv);
            
            item.addEventListener('click', function() {
                bgCurrent = index;
                const player = players[bgCurrent];
                
                const nextGamer = bgActive === gamer1 ? gamer2 : gamer1;
                nextGamer.style.backgroundImage = `url("${player.photo || ''}")`;
                nextGamer.style.opacity = 1;
                bgActive.style.opacity = 0;
                bgActive = nextGamer;
                
                showPlayer(player, true);
                
                const btn = document.getElementById('playersExpandBtn');
                const container = document.getElementById('playersListContainer');
                collapsePlayersList(btn, container);
                startPlayerRotation();
            });
            
            playersList.appendChild(item);
        });
    }
    
    function togglePlayersExpand(expandBtn, listContainer, playersList) {
        if (isPlayersExpanded) {
            collapsePlayersList(expandBtn, listContainer);
        } else {
            expandPlayersList(expandBtn, listContainer, playersList);
        }
    }
    
    function expandPlayersList(expandBtn, listContainer, playersList) {
        if (!listContainer) return;
        
        isPlayersExpanded = true;
        
        listContainer.style.maxHeight = '650px';
        listContainer.style.opacity = '1';
        listContainer.style.marginTop = '8px';
        listContainer.style.padding = '0';
        listContainer.style.overflow = 'hidden';
        
        if (expandBtn) {
            expandBtn.textContent = '▲ Скрий списъка';
        }
        
        const card = document.getElementById('playerCard');
        if (card) {
            card.style.height = 'auto';
            card.style.minHeight = '90vh';
            card.style.transition = 'min-height 0.5s ease';
        }
        
        updatePlayersListHighlight(playersList);
        clearInterval(intervalId);
    }
    
    function collapsePlayersList(expandBtn, listContainer) {
        if (!listContainer) return;
        
        isPlayersExpanded = false;
        
        listContainer.style.maxHeight = '0';
        listContainer.style.opacity = '0';
        listContainer.style.marginTop = '0';
        listContainer.style.padding = '0';
        listContainer.style.overflow = 'hidden';
        
        if (expandBtn) {
            expandBtn.textContent = '▼ Покажи всички играчи';
        }
        
        const card = document.getElementById('playerCard');
        if (card) {
            card.style.minHeight = '';
            card.style.height = '';
        }
        
        startPlayerRotation();
    }
    
    function updatePlayersListHighlight(playersList) {
        if (!playersList) return;
        const items = playersList.querySelectorAll('.playerListItemDynamic');
        items.forEach((item, index) => {
            const isCurrent = index === bgCurrent;
            item.style.background = isCurrent ? 'rgba(255, 87, 34, 0.25)' : 'rgba(255, 255, 255, 0.06)';
            item.style.borderColor = isCurrent ? 'rgba(255, 87, 34, 0.4)' : 'rgba(255, 255, 255, 0.08)';
            
            const img = item.querySelector('.player-photo-small');
            if (img) {
                img.style.border = isCurrent ? '2px solid rgba(255, 87, 34, 0.5)' : 'none';
            }
            
            const rightDiv = item.querySelector('.player-status');
            if (rightDiv) {
                rightDiv.innerHTML = '';
                if (isCurrent) {
                    const badge = document.createElement('span');
                    badge.className = 'current-badge';
                    badge.textContent = '● Текущ';
                    rightDiv.appendChild(badge);
                }
            }
        });
    }
    
    function startPlayerRotation() {
        clearInterval(intervalId);
        if (!isPlayersExpanded) {
            intervalId = setInterval(changePlayer, INTERVAL_MS);
        }
    }
    
    // Събития за бутони
    document.getElementById("playerNext")?.addEventListener("click", goNext);
    document.getElementById("playerPrev")?.addEventListener("click", goPrev);
    
    // Swipe
    const playerCard = document.getElementById('playerCard');
    let swipeStartX = 0;
    let swipeEndX = 0;
    let mousePressed = false;
    
    function handlePlayerSwipe() {
        if (isPlayersExpanded) return;
        const diff = swipeStartX - swipeEndX;
        if (Math.abs(diff) < 40) return;
        if (diff > 0) {
            goNext();
        } else {
            goPrev();
        }
    }
    
    playerCard?.addEventListener('touchstart', (e) => {
        swipeStartX = e.changedTouches[0].clientX;
    });
    
    playerCard?.addEventListener('touchend', (e) => {
        swipeEndX = e.changedTouches[0].clientX;
        handlePlayerSwipe();
    });
    
    playerCard?.addEventListener('mousedown', (e) => {
        mousePressed = true;
        swipeStartX = e.clientX;
    });
    
    playerCard?.addEventListener('mouseup', (e) => {
        if (!mousePressed) return;
        mousePressed = false;
        swipeEndX = e.clientX;
        handlePlayerSwipe();
    });
    
    playerCard?.addEventListener('mouseleave', () => {
        mousePressed = false;
    });
    
    // ===== АБОНИРАНЕ ЗА ДАННИ =====
    if (typeof window.subscribeToData === 'function') {
        console.log('📡 players.js: Абониране за данни...');
        window.subscribeToData(renderPlayers);
    } else {
        console.warn('⚠️ data-loader не е намерен, използвам директно зареждане...');
        firebase.database().ref('players').on('value', snapshot => {
            renderPlayers({ players: snapshot.val() || {} });
        });
    }
    
})();