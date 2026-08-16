window.onload = () => {
    document.body.style.overflow = 'auto';
    const overlays = document.querySelectorAll('.modal-overlay');
    overlays.forEach(o => o.remove());
};
function formatDateTime(datetime) {
    if (!datetime) return '-';

    const d = new Date(datetime);

    return d.toLocaleString('bg-BG', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}
function formatDate(dateString) {
    if (!dateString) return '-';

    const d = new Date(dateString);

    return d.toLocaleDateString('bg-BG', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-app.js";
import { getDatabase, ref, set, onValue, remove, update, get } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-database.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyB92YVJ517MyHYTOZA6RH7ydgckBYFuZMg",
    authDomain: "studious-loader-483606-b9.firebaseapp.com",
    databaseURL: "https://studious-loader-483606-b9-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "studious-loader-483606-b9",
    storageBucket: "studious-loader-483606-b9.firebasestorage.app",
    messagingSenderId: "301695598830",
    appId: "1:301695598830:web:f716b09ff815d0a3ab33ff"
};

const TOURNAMENTS = ["Първенство", "Купа на България", "Суперкупа на България", "Шампионска Лига", "Лига Европа", "Лига на конференциите", "Контролна/приятелска среща"];
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);
const PLAYER_POSITIONS = [
  'Всички',
  'Вратар',
  'Защитник',
  'Полузащитник',
  'Нападател'
];

let activePlayerTab = 'Всички';

window.switchPlayerTab = (pos) => {
    activePlayerTab = pos;
    renderPlayers();
};

// Държава и Роли
let state = { clubs: {}, players: {}, matches: {}, users: {}, music: {} };
let userRole = 'registered'; 
let activeMatchTab = 'upcoming';

// Помощни функции
const uid = () => 'id_' + Math.random().toString(36).slice(2, 9);
const escapeHtml = (s) => s ? String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])) : '';

// --- ПРОВЕРКА НА ПРАВА ---
const canEdit = () => (userRole === 'admin' || userRole === 'moderator');
const canDelete = () => (userRole === 'admin');

// --- AUTH И ЗАРЕЖДАНЕ ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        const overlays = document.querySelectorAll('.modal-overlay');
        overlays.forEach(el => el.remove());
        document.body.style.overflow = 'auto';

        onValue(ref(db, 'users/' + user.uid), (snap) => {
            const userData = snap.val();
            userRole = userData ? userData.role : 'registered';
            
            const emailElem = document.getElementById('current-user-email');
            const roleElem = document.getElementById('current-user-role');
            const navUsers = document.getElementById('nav-users');
            const infoSection = document.getElementById('info-section');

            if (emailElem) emailElem.textContent = user.email;
            if (roleElem) roleElem.textContent = userRole;

            // Показване на менюто за потребители само за админ
            if (navUsers) {
                navUsers.style.display = (userRole === 'admin') ? 'block' : 'none';
            }
            
            // Показване на инфо секцията само за админ
            if (infoSection) {
                infoSection.style.display = (userRole === 'admin') ? 'block' : 'none';
            }

            initDataSync();
        });
    } else {
        window.location.href = 'index.html';
    }
});

function initDataSync() {
    onValue(ref(db, '/'), snap => {
        const d = snap.val() || {};
        state = { 
            clubs: d.clubs || {}, 
            players: d.players || {}, 
            matches: d.matches || {},
            users: d.users || {},
            music: d.music || {}
        };
        
        console.log('Заредени песни (music):', Object.keys(state.music || {}).length);
        
        const activeLi = document.querySelector('.nav-links li.active');
        if (activeLi) {
            const section = activeLi.dataset.section;
            if (sections[section]) sections[section]();
        }
    });
}

// --- НАВИГАЦИЯ ---
const sections = {
    dashboard: renderDashboard,
    clubs: renderClubs,
    players: renderPlayers,
    matches: renderMatches,
    'users-manage': renderUsersManager,
    songs: renderSongs,
    music: renderSongs
};

document.querySelectorAll('.nav-links li').forEach(li => {
    li.onclick = function() {
        if (this.id === 'logout-btn' || !this.dataset.section) return;
        document.querySelectorAll('.nav-links li').forEach(el => el.classList.remove('active'));
        this.classList.add('active');
        document.getElementById('section-title').textContent = this.innerText;
        sections[this.dataset.section]();
    };
});

// --- ФУНКЦИИ ЗА РЕНДЕРИРАНЕ ---

function renderDashboard() {
    const clubsCount = Object.keys(state.clubs || {}).length;
    const playersCount = Object.keys(state.players || {}).length;
    const matchesCount = Object.keys(state.matches || {}).length;
    const songsCount = Object.keys(state.music || {}).length;
    
    const upcoming = Object.values(state.matches)
        .filter(m => new Date(m.datetime) > new Date())
        .sort((a, b) => new Date(a.datetime) - new Date(b.datetime))
        .slice(0, 3);

    let upcomingHtml = upcoming.map(m => {
        const homeClub = state.clubs[m.home];
        const awayClub = state.clubs[m.away];
        return `
            <div class="match-item" style="padding: 12px 10px; text-align: center;">
                <div class="match-date" style="font-size: 0.8rem; color: #888; margin-bottom: 8px;">
                    📅 ${formatDateTime(m.datetime)}
                </div>
                <div class="match-teams" style="display: flex; align-items: center; justify-content: center; gap: 15px;">
                    <div class="team-container" style="display: flex; align-items: center; gap: 8px; width: 140px; justify-content: flex-end;">
                        ${homeClub?.logo ? `<img src="${homeClub.logo}" alt="${homeClub.name}" class="team-logo" style="width: 35px; height: 35px; object-fit: contain; border-radius: 50%;">` : ''}
                        <strong class="team-name" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${homeClub?.name || '?'}</strong>
                    </div>
                    <span class="match-vs" style="color: #666; font-weight: bold; font-size: 0.9rem; min-width: 30px;">vs</span>
                    <div class="team-container" style="display: flex; align-items: center; gap: 8px; width: 140px; justify-content: flex-start;">
                        ${awayClub?.logo ? `<img src="${awayClub.logo}" alt="${awayClub.name}" class="team-logo" style="width: 35px; height: 35px; object-fit: contain; border-radius: 50%;">` : ''}
                        <strong class="team-name" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${awayClub?.name || '?'}</strong>
                    </div>
                </div>
            </div>
        `;
    }).join('') || '<p style="text-align: center; color: #888; padding: 20px 0;">Няма предстоящи мачове</p>';

    const recent = Object.values(state.matches)
        .filter(m => new Date(m.datetime) <= new Date())
        .sort((a, b) => new Date(b.datetime) - new Date(a.datetime))
        .slice(0, 3);

    let recentHtml = recent.map(m => {
        const homeClub = state.clubs[m.home];
        const awayClub = state.clubs[m.away];
        return `
            <div class="match-item" style="padding: 12px 10px; text-align: center;">
                <div class="match-date" style="font-size: 0.8rem; color: #888; margin-bottom: 8px;">
                    📅 ${formatDateTime(m.datetime)}
                </div>
                <div class="match-teams" style="display: flex; align-items: center; justify-content: center; gap: 15px; margin-bottom: 8px;">
                    <div class="team-container" style="display: flex; align-items: center; gap: 8px; width: 140px; justify-content: flex-end;">
                        ${homeClub?.logo ? `<img src="${homeClub.logo}" alt="${homeClub.name}" class="team-logo" style="width: 35px; height: 35px; object-fit: contain; border-radius: 50%;">` : ''}
                        <strong class="team-name" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${homeClub?.name || '?'}</strong>
                    </div>
                    <span class="match-vs" style="color: #666; font-weight: bold; font-size: 0.9rem; min-width: 30px;">vs</span>
                    <div class="team-container" style="display: flex; align-items: center; gap: 8px; width: 140px; justify-content: flex-start;">
                        ${awayClub?.logo ? `<img src="${awayClub.logo}" alt="${awayClub.name}" class="team-logo" style="width: 35px; height: 35px; object-fit: contain; border-radius: 50%;">` : ''}
                        <strong class="team-name" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${awayClub?.name || '?'}</strong>
                    </div>
                </div>
                ${m.result ? `<div class="match-result" style="font-size: 0.9rem; font-weight: bold; color: #2563eb;">🏆 ${m.result}</div>` : ''}
            </div>
        `;
    }).join('') || '<p style="text-align: center; color: #888; padding: 20px 0;">Няма изиграни мачове</p>';

    document.getElementById('dynamic-content').innerHTML = `
        <div class="dashboard-stats-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
            <div class="stat-card" style="text-align: left;">
                <h4 style="margin-top:0;"><i class="fas fa-search"></i> Бързо търсене</h4>
                <input type="text" placeholder="Търси клуб, играч, мач, песен..." 
                       style="width:97%; padding:8px; border-radius:4px; border:1px solid #ddd;"
                       oninput="handleGlobalSearch(this.value)">
                <div id="global-results" style="max-height: 350px; overflow-y: auto;"></div>
            </div> 
            <div class="stat-card" style="background: #fef3c7; border: 1px solid #f59e0b;">
                <h3>Действие</h3>
                <div class="action-buttons" style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 5px;">
                    <button onclick="editMatch()" class="btn-primary" style="padding:5px 10px; font-size:12px; flex: 1; min-width: 80px;">+ Нов Мач</button>
                    <button onclick="editPlayer()" class="btn-primary" style="padding:5px 10px; font-size:12px; flex: 1; min-width: 80px;">+ Нов Играч</button>
                    <button onclick="editClub()" class="btn-primary" style="padding:5px 10px; font-size:12px; flex: 1; min-width: 80px;">+ Нов Клуб</button>
                    <button onclick="editSong()" class="btn-primary" style="padding:5px 10px; font-size:12px; flex: 1; min-width: 80px;">+ Нова Песен</button>
                </div>
            </div>			
        </div>			
        <div class="stats-grid">
            <div class="stat-card"><h3>Клубове</h3><p>${clubsCount}</p></div>
            <div class="stat-card"><h3>Играчи</h3><p>${playersCount}</p></div>
            <div class="stat-card"><h3>Мачове</h3><p>${matchesCount}</p></div>
            <div class="stat-card"><h3>Песни</h3><p>${songsCount}</p></div>			
        </div>

        <div class="dashboard-matches-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px;">
            <div class="stat-card" style="text-align: left;">
                <h4 style="margin-top:0;">
                    <i class="fas fa-calendar-alt"></i> Следващи мачове
                </h4>
                ${upcomingHtml}
            </div>

            <div class="stat-card" style="text-align: left;">
                <h4 style="margin-top:0;">
                    <i class="fas fa-history"></i> Последни мачове
                </h4>
                ${recentHtml}
            </div>
        </div>
    `;
}

function renderClubs() {
    const totalClubs = Object.keys(state.clubs).length;
    const statsHtml = `<div class="stat-card" style="margin-bottom:15px; background:#f1f5f9; border-left:5px solid var(--primary);">
                        <i class="fas fa-shield-alt"></i> Общо Клубове: <strong>${totalClubs}</strong>
                      </div>`;

    // Сортиране на клубовете - ЦСКА първи
    const clubsArray = Object.entries(state.clubs);
    const sortedClubs = clubsArray.sort((a, b) => {
        const aName = a[1].name.toLowerCase();
        const bName = b[1].name.toLowerCase();
        if (aName.includes('цска') || aName.includes('cska')) return -1;
        if (bName.includes('цска') || bName.includes('cska')) return 1;
        return aName.localeCompare(bName);
    });

    let rows = '';
    sortedClubs.forEach(([id, c]) => {
        const isCSKA = c.name.toLowerCase().includes('цска') || c.name.toLowerCase().includes('cska');
        const displayName = isCSKA ? `⭐ ${c.name}` : c.name;
        rows += `<tr>
            <td data-label="Лого"><img src="${c.logo}" class="player-photo-zoom" style="height:50px; width:50px; object-fit:contain; background:white; border-radius:4px;"></td>
            <td data-label="Име"><strong>${escapeHtml(displayName)}</strong></td>
            <td data-label="Стадион">${escapeHtml(c.stadium || '-')}</td>
            <td data-label="Действия">
                ${canEdit() ? `<button class="btn-edit" onclick="editClub('${id}')"><i class="fas fa-pen"></i></button>` : ''}
                ${canDelete() ? `<button class="btn-del" onclick="deleteItem('clubs','${id}')"><i class="fas fa-trash"></i></button>` : ''}
            </td>
        </tr>`;
    });

    document.getElementById('dynamic-content').innerHTML = `
        ${statsHtml}
        <div style="margin-bottom:15px; display:flex; gap:10px; flex-wrap:wrap;">
            ${canEdit() ? `<button class="btn-primary" onclick="editClub()">+ Нов Клуб</button>` : ''}
            <input type="text" id="clubSearch" placeholder="Търси клуб..." style="flex:1; padding:10px; border:1px solid #ddd; border-radius:6px;" oninput="liveSearch('clubSearch', 'clubsTable')">
        </div>
        <table class="data-table" id="clubsTable">
            <thead><tr><th>Лого</th><th>Име</th><th>Стадион</th><th>Действия</th></tr></thead>
            <tbody>${rows || '<tr><td colspan="4">Няма открити клубове</td></tr>'}</tbody>
        </table>`;
}

function renderPlayers() {
    let playersArr = Object.entries(state.players);

    if (activePlayerTab !== 'Всички') {
        playersArr = playersArr.filter(([id, p]) =>
            p.position?.toLowerCase().trim() === activePlayerTab.toLowerCase().trim()
        );

    }

    const total = playersArr.length;

    let tabsHtml = `
    <div class="tabs-container" style="margin-bottom:15px;">
        ${PLAYER_POSITIONS.map(pos => `
            <button class="tab-btn ${activePlayerTab === pos ? 'active' : ''}"
                    onclick="switchPlayerTab('${pos}')">
                ${pos}
            </button>
        `).join('')}
    </div>`;

    let rows = '';
    playersArr.forEach(([id, p]) => {
        const club = state.clubs[p.club] || { name: 'Свободен агент' };

        rows += `<tr>
            <td><img src="${p.photo}" class="player-photo-zoom" style="width:50px;border-radius:5px;"></td>
            <td><strong>${escapeHtml(p.name)}</strong><br><small>#${p.number}</small></td>
            <td>${escapeHtml(p.position)}</td>
            <td>${escapeHtml(p.nation)}</td>
			<td>${p.birthDate ? new Date(p.birthDate).toLocaleDateString('bg-BG') : '-'}</td>
            <td>${p.age} г.</td>
            <td>${escapeHtml(club.name)}</td>
            
            <td>${p.visible !== false ? '✅' : '❌'}</td>
            
            <td>
                ${canEdit() ? `<button class="btn-edit" onclick="editPlayer('${id}')"><i class="fas fa-pen"></i></button>` : ''}
                ${canDelete() ? `<button class="btn-del" onclick="deleteItem('players','${id}')"><i class="fas fa-trash"></i></button>` : ''}
            </td>
        </tr>`;
    });

    document.getElementById('dynamic-content').innerHTML = `
        <div class="stat-card" style="margin-bottom:15px;">
            Общо играчи: <strong>${total}</strong>
        </div>

        ${tabsHtml}

        <div style="margin-bottom:15px; display:flex; gap:10px;">
            ${canEdit() ? `<button class="btn-primary" onclick="editPlayer()">+ Нов Играч</button>` : ''}
            <input type="text" id="pSearch" placeholder="Търси..." class="search-input"
                   oninput="liveSearch('pSearch', 'pTable')">
        </div>

        <table class="data-table" id="pTable">
            <thead>
                <tr>
                    <th>Снимка</th>
                    <th>Име</th>
                    <th>Позиция</th>
                    <th>Нация</th>
					<th>Дата на раждане</th>
                    <th>Възраст</th>
                    <th>Клуб</th>
					<th>Видим</th>
                    <th>Действия</th>
                </tr>
            </thead>
            <tbody>${rows || '<tr><td colspan="9">Няма играчи</td></tr>'}</tbody>
        </table>
    `;
}

// Изчисляване на възраст от дата на раждане
function calculateAge(birthDate) {
    if (!birthDate) return '';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
}

function renderMatches() {
    const container = document.getElementById('dynamic-content');
    const now = new Date();
    
    const allMatches = Object.entries(state.matches).map(([id, m]) => ({ id, ...m }));
    const upcoming = allMatches.filter(m => new Date(m.datetime) > now);
    const past = allMatches.filter(m => new Date(m.datetime) <= now);

    const statsHtml = `
        <div class="stats-grid" style="margin-bottom:20px;">
            <div class="stat-card" style="background:#f8fafc; border-bottom:3px solid #64748b;">Общо: <strong>${allMatches.length}</strong></div>
            <div class="stat-card" style="background:#f0fdf4; border-bottom:3px solid #22c55e;">Предстоящи: <strong>${upcoming.length}</strong></div>
            <div class="stat-card" style="background:#eff6ff; border-bottom:3px solid #3b82f6;">Изминали: <strong>${past.length}</strong></div>
        </div>`;

    let rows = '';
    const currentList = activeMatchTab === 'upcoming' 
        ? upcoming.sort((a,b) => new Date(a.datetime) - new Date(b.datetime)) 
        : past.sort((a,b) => new Date(b.datetime) - new Date(a.datetime));

    currentList.forEach(m => {
        const homeClub = state.clubs[m.home] || { name: '?', logo: '' };
        const awayClub = state.clubs[m.away] || { name: '?', logo: '' };
        const ytIcon = m.youtube ? `<a href="${m.youtube}" target="_blank" style="color:#ff0000; margin-left:10px;"><i class="fab fa-youtube fa-lg"></i></a>` : '';
        
        rows += `<tr>
            <td data-label="Дата/Турнир">
                <strong>${m.datetime ? formatDateTime(m.datetime) : '-'}</strong><br>
                <span style="color:var(--primary); font-size:0.8rem;">
                ${
                    m.tournament === 'Контролна/приятелска среща'
                        ? `Контрола №${m.round || '?'}`
                        : `${escapeHtml(m.tournament)}${m.round ? ` (Кръг ${m.round})` : ''}`
                }
                </span>
            </td>
<td data-label="Двубой">
    <div style="display:flex; align-items:center; justify-content:center; gap:10px;">
        <img src="${homeClub.logo}" width="30"> <span>${escapeHtml(homeClub.name)}</span>
        <span class="result-badge">${m.result || 'vs'}</span>
        <span>${escapeHtml(awayClub.name)}</span> <img src="${awayClub.logo}"  width="30">
        ${ytIcon}
    </div>
    ${m.stats ? `
    <div style="font-size: 0.7rem; color: #666; margin-top: 5px; display: flex; justify-content: center; gap: 15px; flex-wrap: wrap;">
		<span>⏱️ Притежание: ${m.stats.home?.possession || '-'}%:${m.stats.away?.possession || '-'}%</span>
        <span>⚽ Удари: ${m.stats.home?.shots || '-'}:${m.stats.away?.shots || '-'}</span>
        <span>🎯 Точни: ${m.stats.home?.shotsOnTarget || '-'}:${m.stats.away?.shotsOnTarget || '-'}</span>
        <span>🟨 ${m.stats.home?.yellowCards || 0}:${m.stats.away?.yellowCards || 0}</span>
        ${(m.stats.home?.redCards > 0 || m.stats.away?.redCards > 0) ? `<span style="color:#ef4444;">🟥 ${m.stats.home?.redCards || 0}:${m.stats.away?.redCards || 0}</span>` : ''}
    </div>
    ` : ''}
</td>
            <td data-label="Място/Бележки">
                <small><i class="fas fa-map-marker-alt"></i> ${escapeHtml(m.venue || '-')}</small>
                ${m.notes ? `<br><small style="color:gray;">${escapeHtml(m.notes)}</small>` : ''}
            </td>
            <td data-label="Действия">
                ${activeMatchTab === 'past' && canEdit() ? `<button class="btn-edit" style="background:#10b981; color:white;" onclick="setResult('${m.id}')"><i class="fas fa-check-circle"></i></button>` : ''}
                ${canEdit() ? `<button class="btn-edit" onclick="editMatch('${m.id}')"><i class="fas fa-pen"></i></button>` : ''}
                ${canDelete() ? `<button class="btn-del" onclick="deleteItem('matches','${m.id}')"><i class="fas fa-trash"></i></button>` : ''}
            </td>
        </tr>`;
    });

container.innerHTML = `
        ${statsHtml}
        <div class="tabs-container">
            <button class="tab-btn ${activeMatchTab === 'upcoming' ? 'active' : ''}" onclick="switchMatchTab('upcoming')">Предстоящи</button>
            <button class="tab-btn ${activeMatchTab === 'past' ? 'active' : ''}" onclick="switchMatchTab('past')">Изминали</button>
        </div>
        
        <div style="margin-bottom: 15px; display: flex; gap: 10px; flex-wrap: wrap;">
            ${activeMatchTab === 'upcoming' && canEdit() ? `<button class="btn-primary" onclick="editMatch()">+ Нов Мач</button>` : ''}
            
            <input type="text" id="matchSearch" placeholder="Търси мач (отбор, турнир)..." 
                   style="flex:1; min-width:200px; padding:10px; border:1px solid #ddd; border-radius:6px;" 
                   oninput="liveSearch('matchSearch', 'matchesTable')">
        </div>

        <table class="data-table" id="matchesTable">
            <thead>
                <tr>
                    <th>Дата & Турнир</th>
                    <th>Мач & Резултат</th>
                    <th>Място & Детайли</th>
                    <th>Действия</th>
                </tr>
            </thead>
            <tbody>${rows || '<tr><td colspan="4">Няма открити мачове в тази категория</td></tr>'}</tbody>
        </table>`;
}

// --- УПРАВЛЕНИЕ НА ПОТРЕБИТЕЛИ ---
function renderUsersManager() {
    if (userRole !== 'admin') return;
    const users = Object.entries(state.users);
    
    let rows = '';
    users.forEach(([userId, u]) => {
        const date = u.createdAt ? new Date(u.createdAt).toLocaleString('bg-BG') : 'Няма данни';
        const isBlocked = u.status === 'blocked';
        
        rows += `
        <tr style="${isBlocked ? 'opacity: 0.6; background: #fff1f2;' : ''}">
            <td>
                <strong>${escapeHtml(u.fullName || 'Няма име')}</strong><br>
                <small>${escapeHtml(u.email)}</small>
            </td>
            <td>${escapeHtml(u.phone || '-')}</td>
            <td><span class="role-badge ${u.role}">${u.role}</span></td>
            <td><small>${date}</small></td>
            <td>
                <div style="display: flex; gap: 5px;">
                    <button class="btn-edit" onclick="editUserProfile('${userId}')" title="Редактирай профил"><i class="fas fa-user-edit"></i></button>
                    <button class="btn-edit" style="background:#8b5cf6" onclick="sendMessageToUser('${userId}')" title="Изпрати съобщение"><i class="fas fa-envelope"></i></button>
                    <button class="btn-edit" style="background:${isBlocked ? '#10b981' : '#f59e0b'}" onclick="toggleBlockUser('${userId}', ${isBlocked})" title="Блокирай потребителя">
                        <i class="fas ${isBlocked ? 'fa-unlock' : 'fa-ban'}"></i>
                    </button>
                    <button class="btn-del" onclick="deleteUser('${userId}')" title="Изтрий потребител"><i class="fas fa-user-times"></i></button>
                </div>
                <div style="margin-top: 5px;">
                    <select onchange="changeRole('${userId}', this.value)" style="font-size: 11px; padding: 2px;">
                        <option value="registered" ${u.role === 'registered' ? 'selected' : ''}>РЕГИСТРИРАН</option>
                        <option value="moderator" ${u.role === 'moderator' ? 'selected' : ''}>МОДЕРАТОР</option>
                        <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>АДМИНИСТРАТОР</option>
                    </select>
                </div>
            </td>
        </tr>`;
    });

    document.getElementById('dynamic-content').innerHTML = `
        <div class="stat-card" style="margin-bottom:15px;">Управление на потребители (${users.length})</div>
        <input type="text" id="uSearch" placeholder="Търси по име, имейл или телефон..." class="search-input" oninput="liveSearch('uSearch', 'uTable')">
        <table class="data-table" id="uTable">
            <thead>
                <tr>
                    <th>Потребител</th>
                    <th>Телефон</th>
                    <th>Роля</th>
                    <th>Регистрация</th>
                    <th>Действия</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>`;
}

// --- АДМИН ПРАВА НАД ПОТРЕБИТЕЛИ ---

window.editUserProfile = (userId) => {
    const u = state.users[userId];
    const html = `
        <div class="form-grid">
            <div class="form-group"><label>Пълно име</label><input id="u-name" value="${escapeHtml(u.fullName || '')}"></div>
            <div class="form-group"><label>Телефон</label><input id="u-phone" value="${escapeHtml(u.phone || '')}"></div>
            <div class="form-group"><label>Имейл</label><input id="u-email" value="${escapeHtml(u.email || '')}"></div>
            <div class="form-group"><label>Роля</label>
                <select id="u-role">
                    <option value="registered" ${u.role === 'registered' ? 'selected' : ''}>РЕГИСТРИРАН</option>
                    <option value="moderator" ${u.role === 'moderator' ? 'selected' : ''}>МОДЕРАТОР</option>
                    <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>АДМИНИСТРАТОР</option>
                </select>
            </div>
        </div>
    `;
    showModal('Редактиране на профил', html, () => {
        const updates = {
            fullName: document.getElementById('u-name').value,
            phone: document.getElementById('u-phone').value,
            email: document.getElementById('u-email').value,
            role: document.getElementById('u-role').value
        };
        update(ref(db, 'users/' + userId), updates);
    });
};

window.toggleBlockUser = (userId, currentBlockedStatus) => {
    const action = currentBlockedStatus ? 'отблокирате' : 'блокирате';
    if (confirm(`Сигурни ли сте, че искате да ${action} този потребител?`)) {
        update(ref(db, 'users/' + userId), { status: currentBlockedStatus ? 'active' : 'blocked' });
    }
};

window.deleteUser = (userId) => {
    if (confirm("ВНИМАНИЕ: Това ще изтрие данните на потребителя от базата данни! Продължаване?")) {
        remove(ref(db, 'users/' + userId));
    }
};

window.sendMessageToUser = (userId) => {
    const u = state.users[userId];
    const html = `
        <div class="form-group">
            <label>До: ${escapeHtml(u.fullName || u.email)}</label>
            <textarea id="u-msg" placeholder="Напишете вашето съобщение тук..." style="width:100%; height:120px; margin-top:10px; padding:10px;"></textarea>
        </div>
    `;
    showModal('Изпрати системно съобщение', html, () => {
        const msgText = document.getElementById('u-msg').value;
        if (!msgText.trim()) return;
        
        const msgId = uid();
        set(ref(db, 'messages/' + userId + '/' + msgId), {
            text: msgText,
            from: 'Admin System',
            timestamp: new Date().toISOString(),
            read: false
        }).then(() => alert('Съобщението е изпратено!'));
    });
};

// --- ФУНКЦИИ ЗА ПЕСНИ ---
window.editSong = (id) => {
    const s = id ? state.music[id] : { title: '', url: '', order: 0 };
    
    const html = `
        <div class="form-group"><label>Заглавие</label><input id="s-title" value="${escapeHtml(s.title)}" placeholder="Въведете заглавие на песента"></div>
        <div class="form-group"><label>URL на песента</label><input id="s-url" value="${escapeHtml(s.url)}" placeholder="https://example.com/song.mp3"></div>
        <div class="form-group"><label>Номер (поредност)</label><input id="s-order" type="number" value="${s.order || 0}" placeholder="1, 2, 3..." style="width:100%; padding:8px;"></div>
        <small style="color: #666;">По-малък номер = по-напред в плейлиста</small>
    `;
    
    showModal(id ? 'Редактирай Песен' : 'Нова Песен', html, () => {
        const data = {
            title: document.getElementById('s-title').value.trim(),
            url: document.getElementById('s-url').value.trim(),
            order: parseInt(document.getElementById('s-order').value) || 0
        };
        
        if (!data.title) {
            alert('Моля, въведете заглавие на песента!');
            return;
        }
        if (!data.url) {
            alert('Моля, въведете URL на песента!');
            return;
        }
        
        set(ref(db, 'music/' + (id || uid())), data).then(() => {
            const activeLi = document.querySelector('.nav-links li.active');
            if (activeLi && (activeLi.dataset.section === 'songs' || activeLi.dataset.section === 'music')) {
                renderSongs();
            }
        });
    });
};

window.deleteSong = (id) => {
    if (confirm("Сигурни ли сте, че искате да изтриете тази песен?")) {
        remove(ref(db, 'music/' + id)).then(() => {
            const activeLi = document.querySelector('.nav-links li.active');
            if (activeLi && (activeLi.dataset.section === 'songs' || activeLi.dataset.section === 'music')) {
                renderSongs();
            }
        });
    }
};

function renderSongs() {
    const totalSongs = Object.keys(state.music || {}).length;
    
    let rows = '';
    const sortedSongs = Object.entries(state.music || {}).sort((a, b) => (a[1].order || 0) - (b[1].order || 0));
    
    sortedSongs.forEach(([id, s]) => {
rows += `<tr>
    <td><strong>${escapeHtml(s.title)}</strong></td>
    <td>${s.url ? `<a href="${s.url}" target="_blank"><i class="fas fa-external-link-alt" style="color:#2563eb;"></i> Отвори</a>` : '-'}</td>
    <td>${s.order || 0}</td>
    <td>
        <button onclick="playSong('${s.url}', '${escapeHtml(s.title)}')" 
                class="btn-edit" 
                style="background:#10b981; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;"
                title="Пусни песен">
            <i class="fas fa-play"></i>
        </button>
        ${canEdit() ? `<button class="btn-edit" onclick="editSong('${id}')"><i class="fas fa-pen"></i></button>` : ''}
        ${canDelete() ? `<button class="btn-del" onclick="deleteSong('${id}')"><i class="fas fa-trash"></i></button>` : ''}
    </td>
</tr>`;
    });

    document.getElementById('dynamic-content').innerHTML = `
        <div class="stat-card" style="margin-bottom:15px; background:#f1f5f9; border-left:5px solid #8b5cf6;">
            <i class="fas fa-music"></i> Общо Песни: <strong>${totalSongs}</strong>
        </div>
        <div style="margin-bottom:15px; display:flex; gap:10px; flex-wrap:wrap;">
            ${canEdit() ? `<button class="btn-primary" onclick="editSong()">+ Нова Песен</button>` : ''}
            <input type="text" id="songSearch" placeholder="Търси песен..." style="flex:1; padding:10px; border:1px solid #ddd; border-radius:6px;" oninput="liveSearch('songSearch', 'songsTable')">
        </div>
        <table class="data-table" id="songsTable">
            <thead><tr><th>Заглавие</th><th>URL</th><th>Номер</th><th>Действия</th></tr></thead>
            <tbody>${rows || '<tr><td colspan="4">Няма добавени песни</td></tr>'}</tbody>
        </table>
    `;
}

// Добави тази функция след window.handleGlobalSearch
window.playSong = (url, title) => {
    // Провери дали вече има активен аудио плеър
    let audioPlayer = document.getElementById('audio-player');
    
    if (!audioPlayer) {
        // Създай нов аудио плеър
        audioPlayer = document.createElement('div');
        audioPlayer.id = 'audio-player';
        audioPlayer.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: white;
            padding: 15px;
            border-radius: 10px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            z-index: 9999;
            max-width: 300px;
            width: 100%;
            border: 1px solid #e2e8f0;
        `;
        document.body.appendChild(audioPlayer);
    }
    
    // Обнови съдържанието на плеъра
    audioPlayer.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <strong style="font-size: 0.9rem; color: #1e293b;">🎵 ${escapeHtml(title)}</strong>
            <button onclick="closeAudioPlayer()" style="background: none; border: none; font-size: 1.2rem; cursor: pointer; color: #ef4444;">✕</button>
        </div>
        <audio controls style="width: 100%;" autoplay>
            <source src="${url}" type="audio/mpeg">
            Вашият браузър не поддържа аудио елемент.
        </audio>
        <div style="margin-top: 5px; font-size: 0.7rem; color: #888; text-align: center;">
            <span id="audio-status">Възпроизвежда се...</span>
        </div>
    `;
    
    // Добави слушатели за събития на аудиото
    const audio = audioPlayer.querySelector('audio');
    if (audio) {
        audio.addEventListener('play', () => {
            document.getElementById('audio-status').textContent = '▶️ Възпроизвежда се';
        });
        audio.addEventListener('pause', () => {
            document.getElementById('audio-status').textContent = '⏸️ Пауза';
        });
        audio.addEventListener('ended', () => {
            document.getElementById('audio-status').textContent = '⏹️ Край';
        });
        audio.addEventListener('error', () => {
            document.getElementById('audio-status').textContent = '❌ Грешка при зареждане';
        });
    }
};

// Функция за затваряне на аудио плеъра
window.closeAudioPlayer = () => {
    const player = document.getElementById('audio-player');
    if (player) {
        player.remove();
    }
};

// --- ГЛОБАЛНИ ФУНКЦИИ ---
window.logout = () => { if(confirm("Изход?")) signOut(auth).then(() => window.location.href = "index.html"); };
window.switchMatchTab = (tab) => { activeMatchTab = tab; renderMatches(); };
window.changeRole = (uid, newRole) => { update(ref(db, 'users/' + uid), { role: newRole }); };

window.deleteItem = (path, id) => {
    if (confirm("Сигурни ли сте?")) {
        remove(ref(db, path + '/' + id));
    }
};

window.editClub = (id) => {
    const c = id ? state.clubs[id] : { name: '', logo: '', stadium: '' };
    const html = `<div class="form-group"><label>Име</label><input id="m-name" placeholder="Въведете име на клуб" value="${escapeHtml(c.name)}"></div>
                  <div class="form-group"><label>Лого URL</label><input id="m-logo" placeholder="Поставете линка на логото" value="${escapeHtml(c.logo)}"></div>
                  <div class="form-group"><label>Стадион</label><input id="m-stadium" placeholder="Въведете име на домакински стадион" value="${escapeHtml(c.stadium)}"></div>`;
    showModal(id ? 'Редактирай Клуб' : 'Нов Клуб', html, () => {
        const data = { name: document.getElementById('m-name').value, logo: document.getElementById('m-logo').value, stadium: document.getElementById('m-stadium').value };
        set(ref(db, 'clubs/' + (id || uid())), data);
    });
};

window.setResult = (id) => {
    const m = state.matches[id];
    const homeName = state.clubs[m.home]?.name || 'Домакин';
    const awayName = state.clubs[m.away]?.name || 'Гост';

    const stats = m.stats || {};
    const homeStats = stats.home || {};
    const awayStats = stats.away || {};

    let mainResult = m.result || '';
    let penaltyResult = m.penaltyResult || '';
    
    if (mainResult && mainResult.includes('(')) {
        const parts = mainResult.match(/^(.+?)\s*\((.+?)\)$/);
        if (parts) {
            mainResult = parts[1].trim();
            penaltyResult = parts[2].trim();
        }
    }

    const html = `
        <div style="margin-bottom:15px; text-align:center; font-weight:bold; background:#e2e8f0; padding:10px; border-radius:6px;">
            ${homeName} vs ${awayName}
        </div>
        
        <div class="form-group"><label>Резултат</label>
            <input id="res-score" value="${mainResult}" placeholder="напр. 2-1" style="width:100%; padding:8px;"></div>
        
        <div class="form-group"><label>Дуспи (пеналти)</label>
            <input id="res-penalties" value="${penaltyResult}" placeholder="напр. 4-3 (ако има дуспи)" style="width:100%; padding:8px;">
            <small style="color: #666;">Оставете празно, ако няма дуспи</small>
        </div>
        
        <div class="form-group"><label>YouTube Линк</label>
            <input id="res-yt" value="${m.youtube || ''}" placeholder="https://www.youtube.com/watch?v=..." style="width:100%; padding:8px;"></div>
        
        <hr style="margin: 15px 0; border: 1px dashed #ddd;">
        
        <h4 style="margin: 10px 0; text-align: center; color: #2563eb;">📊 Статистика на мача</h4>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div style="background: #f8fafc; padding: 12px; border-radius: 8px;">
                <h5 style="margin: 0 0 10px 0; text-align: center; color: #1e293b;">🏠 ${homeName}</h5>
                <div class="form-group" style="margin-bottom: 8px;">
                    <label style="font-size: 0.85rem;">Притежание на топката (%)</label>
                    <input id="home-possession" type="number" value="${homeStats.possession || ''}" placeholder="45" min="0" max="100" style="width:100%; padding:6px;">
                </div>
                <div class="form-group" style="margin-bottom: 8px;">
                    <label style="font-size: 0.85rem;">Общо удари</label>
                    <input id="home-shots" type="number" value="${homeStats.shots || ''}" placeholder="12" min="0" style="width:100%; padding:6px;">
                </div>
                <div class="form-group" style="margin-bottom: 8px;">
                    <label style="font-size: 0.85rem;">Точни удари</label>
                    <input id="home-shots-on-target" type="number" value="${homeStats.shotsOnTarget || ''}" placeholder="5" min="0" style="width:100%; padding:6px;">
                </div>
                <div class="form-group" style="margin-bottom: 8px;">
                    <label style="font-size: 0.85rem;">Жълти картони</label>
                    <input id="home-yellow" type="number" value="${homeStats.yellowCards || ''}" placeholder="2" min="0" style="width:100%; padding:6px;">
                </div>
                <div class="form-group" style="margin-bottom: 8px;">
                    <label style="font-size: 0.85rem;">Червени картони</label>
                    <input id="home-red" type="number" value="${homeStats.redCards || ''}" placeholder="0" min="0" style="width:100%; padding:6px;">
                </div>
            </div>
            
            <div style="background: #f8fafc; padding: 12px; border-radius: 8px;">
                <h5 style="margin: 0 0 10px 0; text-align: center; color: #1e293b;">✈️ ${awayName}</h5>
                <div class="form-group" style="margin-bottom: 8px;">
                    <label style="font-size: 0.85rem;">Притежание на топката (%)</label>
                    <input id="away-possession" type="number" value="${awayStats.possession || ''}" placeholder="55" min="0" max="100" style="width:100%; padding:6px;">
                </div>
                <div class="form-group" style="margin-bottom: 8px;">
                    <label style="font-size: 0.85rem;">Общо удари</label>
                    <input id="away-shots" type="number" value="${awayStats.shots || ''}" placeholder="8" min="0" style="width:100%; padding:6px;">
                </div>
                <div class="form-group" style="margin-bottom: 8px;">
                    <label style="font-size: 0.85rem;">Точни удари</label>
                    <input id="away-shots-on-target" type="number" value="${awayStats.shotsOnTarget || ''}" placeholder="3" min="0" style="width:100%; padding:6px;">
                </div>
                <div class="form-group" style="margin-bottom: 8px;">
                    <label style="font-size: 0.85rem;">Жълти картони</label>
                    <input id="away-yellow" type="number" value="${awayStats.yellowCards || ''}" placeholder="3" min="0" style="width:100%; padding:6px;">
                </div>
                <div class="form-group" style="margin-bottom: 8px;">
                    <label style="font-size: 0.85rem;">Червени картони</label>
                    <input id="away-red" type="number" value="${awayStats.redCards || ''}" placeholder="0" min="0" style="width:100%; padding:6px;">
                </div>
            </div>
        </div>
        
        <div class="form-group" style="margin-top: 15px;">
            <label>Допълнителни бележки</label>
            <textarea id="res-notes" style="width:100%; height:80px; padding:8px; border:1px solid #ddd; border-radius:6px;">${m.notes || ''}</textarea>
        </div>
    `;

    showModal('Задай резултат и статистика', html, () => {
        const homePoss = parseInt(document.getElementById('home-possession').value) || 0;
        const awayPoss = parseInt(document.getElementById('away-possession').value) || 0;
        
        if (homePoss > 0 && awayPoss > 0 && (homePoss + awayPoss) !== 100) {
            if (!confirm(`Внимание: Сумата на притежанието е ${homePoss + awayPoss}%. Искате ли да продължите въпреки това?`)) {
                return;
            }
        }

        const statsData = {
            home: {
                possession: homePoss || null,
                shots: parseInt(document.getElementById('home-shots').value) || null,
                shotsOnTarget: parseInt(document.getElementById('home-shots-on-target').value) || null,
                yellowCards: parseInt(document.getElementById('home-yellow').value) || null,
                redCards: parseInt(document.getElementById('home-red').value) || null
            },
            away: {
                possession: awayPoss || null,
                shots: parseInt(document.getElementById('away-shots').value) || null,
                shotsOnTarget: parseInt(document.getElementById('away-shots-on-target').value) || null,
                yellowCards: parseInt(document.getElementById('away-yellow').value) || null,
                redCards: parseInt(document.getElementById('away-red').value) || null
            }
        };

        Object.keys(statsData.home).forEach(key => {
            if (statsData.home[key] === null) delete statsData.home[key];
        });
        Object.keys(statsData.away).forEach(key => {
            if (statsData.away[key] === null) delete statsData.away[key];
        });

        const hasStats = Object.keys(statsData.home).length > 0 || Object.keys(statsData.away).length > 0;

        let mainResult = document.getElementById('res-score').value.trim();
        const penaltyResult = document.getElementById('res-penalties').value.trim();
        
        let finalResult = mainResult;
        if (penaltyResult) {
            finalResult = `${mainResult} (${penaltyResult})`;
        }

        const updateData = {
            result: finalResult,
            youtube: document.getElementById('res-yt').value.trim(),
            notes: document.getElementById('res-notes').value.trim()
        };

        if (penaltyResult) {
            updateData.penaltyResult = penaltyResult;
        } else {
            updateData.penaltyResult = null;
        }

        if (hasStats) {
            updateData.stats = statsData;
        }

        update(ref(db, 'matches/' + id), updateData);
    });
};

window.handleGlobalSearch = (val) => {
    const resultsDiv = document.getElementById('global-results');
    if (!val.trim()) {
        resultsDiv.innerHTML = '';
        return;
    }
    const query = val.toLowerCase();
    let html = '';

    // 1. ТЪРСЕНЕ В КЛУБОВЕ
    const foundClubs = Object.entries(state.clubs || {}).filter(([id, c]) => 
        c.name.toLowerCase().includes(query) || (c.stadium && c.stadium.toLowerCase().includes(query))
    );

    // 2. ТЪРСЕНЕ В ИГРАЧИ
    const foundPlayers = Object.entries(state.players || {}).filter(([id, p]) => {
        const clubName = state.clubs[p.club]?.name.toLowerCase() || '';
        return p.name.toLowerCase().includes(query) ||
               p.position.toLowerCase().includes(query) ||
               p.nation.toLowerCase().includes(query) ||
               
               (p.salary && p.salary.toLowerCase().includes(query));
               
    });

    // 3. ТЪРСЕНЕ В МАЧОВЕ
    const foundMatches = Object.entries(state.matches || {}).filter(([id, m]) => {
        const hName = state.clubs[m.home]?.name.toLowerCase() || '';
        const aName = state.clubs[m.away]?.name.toLowerCase() || '';
        return m.tournament.toLowerCase().includes(query) ||
               m.venue.toLowerCase().includes(query) ||
               hName.includes(query) || aName.includes(query) ||
               (m.notes && m.notes.toLowerCase().includes(query));
    });

    // 4. ТЪРСЕНЕ В ПЕСНИ (music)
    const foundSongs = Object.entries(state.music || {}).filter(([id, s]) => 
        s.title.toLowerCase().includes(query)
    );

    // Секция Клубове
    if (foundClubs.length) {
        html += `<h4 style="color:var(--primary); margin-top:15px;"><i class="fas fa-shield-alt"></i> Клубове</h4>`;
        foundClubs.forEach(([id, c]) => {
            html += `<div class="stat-card" style="display:flex; align-items:center; gap:10px; margin-bottom:5px; padding:10px;">
                <img src="${c.logo}" width="30"> <strong>${c.name}</strong>
                ${canEdit() ? `<button class="btn-edit" onclick="editClub('${id}')" style="margin-left:auto;"><i class="fas fa-pen"></i></button>` : ''}
            </div>`;
        });
    }

    // Секция Играчи
    if (foundPlayers.length) {
        html += `<h4 style="color:var(--secondary); margin-top:15px;"><i class="fas fa-users"></i> Играчи</h4>`;
        foundPlayers.forEach(([id, p]) => {
            html += `<div class="stat-card" style="display:flex; align-items:center; gap:10px; margin-bottom:5px; padding:10px;">
                <img src="${p.photo}" width="30" style="border-radius:4px;"> 
                <div><strong>${p.name}</strong> <small>(${p.position}, ${p.nation})</small></div>
                ${canEdit() ? `<button class="btn-edit" onclick="editPlayer('${id}')" style="margin-left:auto;"><i class="fas fa-pen"></i></button>` : ''}
            </div>`;
        });
    }

    // Секция Мачове
    if (foundMatches.length) {
        html += `<h4 style="color:#10b981; margin-top:15px;"><i class="fas fa-calendar-alt"></i> Мачове</h4>`;
        foundMatches.forEach(([id, m]) => {
            const h = state.clubs[m.home]?.name || '?';
            const a = state.clubs[m.away]?.name || '?';
            html += `<div class="stat-card" style="margin-bottom:5px; padding:10px;">
                <div style="font-size:0.85rem; font-weight:bold;">${h} ${m.result || 'vs'} ${a}</div>
                <div style="font-size:0.75rem; color:gray;">${formatDateTime(m.datetime)} - ${m.tournament}</div>
                ${canEdit() ? `<button class="btn-edit" onclick="editMatch('${id}')" style="margin-top:5px; padding:2px 10px;"><i class="fas fa-pen"></i> Редактирай</button>` : ''}
            </div>`;
        });
    }

    // Секция Песни
// Секция Песни
// Секция Песни
if (foundSongs.length) {
    html += `<h4 style="color:#8b5cf6; margin-top:15px;"><i class="fas fa-music"></i> Песни</h4>`;
    foundSongs.forEach(([id, s]) => {
        html += `<div class="stat-card" style="margin-bottom:5px; padding:10px;">
            <div style="display:flex; align-items:center; gap:10px;">
                <span>🎵</span>
                <div style="flex:1;">
                    <div style="font-size:0.85rem; font-weight:bold;">${escapeHtml(s.title)}</div>
                    <div style="font-size:0.75rem; color:gray;">Номер: ${s.order || 0}</div>
                </div>
                <button onclick="playSong('${s.url}', '${escapeHtml(s.title)}')" 
                        class="btn-edit" 
                        style="background:#10b981; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;"
                        title="Пусни песен">
                    <i class="fas fa-play"></i>
                </button>
                ${canEdit() ? `
                    <button class="btn-edit" onclick="editSong('${id}')" title="Редактирай песен"><i class="fas fa-pen"></i></button>
                ` : ''}
                ${canDelete() ? `
                    <button class="btn-del" onclick="deleteSong('${id}')" title="Изтрий песен"><i class="fas fa-trash"></i></button>
                ` : ''}
            </div>
        </div>`;
    });
}

    resultsDiv.innerHTML = html || '<p style="color:gray; padding:10px;">Няма намерени резултати за тази дума.</p>';
};

function showModal(title, content, onSave) {
    const existing = document.querySelector('.modal-overlay');
    if (existing) existing.remove();
    const div = document.createElement('div');
    div.className = 'modal-overlay';
    div.innerHTML = `<div class="modal-content"><h3>${title}</h3><div class="modal-body-scroll">${content}</div><div class="modal-footer"><button class="btn-primary" id="saveBtn">Запази</button><button class="btn-cancel" id="closeBtn">Отказ</button></div></div>`;
    document.body.appendChild(div);
    if (document.getElementById('m-date')) {
        flatpickr("#m-date", {
            enableTime: true,
            time_24hr: true,
            dateFormat: "Y-m-d\\TH:i",
            minuteIncrement: 1
        });
    }
    document.getElementById('saveBtn').onclick = () => { onSave(); div.remove(); };
    document.getElementById('closeBtn').onclick = () => div.remove();
}

// --- ТЪРСЕНЕ В ТАБЛИЦИТЕ ---
window.liveSearch = (inputId, tableId) => {
    const input = document.getElementById(inputId);
    const filter = input.value.toLowerCase();
    const table = document.getElementById(tableId);
    if (!table) return;
    const tr = table.getElementsByTagName("tr");

    for (let i = 1; i < tr.length; i++) {
        let text = tr[i].textContent || tr[i].innerText;
        tr[i].style.display = text.toLowerCase().indexOf(filter) > -1 ? "" : "none";
    }
};

// --- РЕДАКТИРАНЕ НА ИГРАЧ ---
window.editPlayer = (id) => {
    const p = id ? state.players[id] : {
      name: '', number: '', club: '', photo: '',
      position: '', nation: '', birthDate: '', age: '',
      visible: true
    };
    
    // Списък с позиции за падащо меню
    const POSITIONS = [
        'Вратар',
        'Защитник',
        'Полузащитник',
        'Нападател'
    ];
    
    // Сортиране на клубовете - ЦСКА първи
    const clubsArray = Object.entries(state.clubs);
    const sortedClubs = clubsArray.sort((a, b) => {
        const aName = a[1].name.toLowerCase();
        const bName = b[1].name.toLowerCase();
        if (aName.includes('цска') || aName.includes('cska')) return -1;
        if (bName.includes('цска') || bName.includes('cska')) return 1;
        return aName.localeCompare(bName);
    });
    
    let clubOptions = '';
    if (id) {
        // Редакция - показваме всички клубове сортирани
        clubOptions = '<option value="">Свободен агент</option>';
        sortedClubs.forEach(([cid, c]) => {
            const isCSKA = c.name.toLowerCase().includes('цска') || c.name.toLowerCase().includes('cska');
            const selected = p.club === cid ? 'selected' : '';
            const label = isCSKA ? `⭐ ${c.name}` : c.name;
            clubOptions += `<option value="${cid}" ${selected}>${label}</option>`;
        });
    } else {
        // Добавяне - само ЦСКА София
        const cskClub = sortedClubs.find(([cid, c]) => 
            c.name.toLowerCase().includes('цска') || c.name.toLowerCase().includes('cska')
        );
        if (cskClub) {
            clubOptions = `<option value="${cskClub[0]}" selected>⭐ ${cskClub[1].name}</option>`;
        } else {
            clubOptions = '<option value="">Няма намерен клуб ЦСКА София</option>';
            // Ако няма ЦСКА, показваме всички клубове като резервен вариант
            sortedClubs.forEach(([cid, c]) => {
                const selected = p.club === cid ? 'selected' : '';
                clubOptions += `<option value="${cid}" ${selected}>${c.name}</option>`;
            });
        }
    }
    
    // Опции за позиция - падащо меню
    const posOptions = POSITIONS.map(pos => 
        `<option value="${pos}" ${p.position === pos ? 'selected' : ''}>${pos}</option>`
    ).join('');

    // Форматиране на датата за input type="date"
    const birthDateValue = p.birthDate ? new Date(p.birthDate).toISOString().split('T')[0] : '';
    
    // Определяне дали възрастта е ръчно въведена или изчислена
    const isManualAge = p.age && !p.birthDate;
    const ageDisplay = p.age || '';

    const html = `
        <div class="form-grid">
            <div class="form-group"><label>Име</label><input id="p-name" placeholder="Въведете име на играч" value="${escapeHtml(p.name)}"></div>
            <div class="form-group"><label>Номер</label><input id="p-num" placeholder="Въведете номер на играч" type="number" value="${p.number}"></div>
            <div class="form-group"><label>Клуб</label><select id="p-club">${clubOptions}</select></div>
            <div class="form-group"><label>Позиция</label>
                <select id="p-pos">${posOptions}</select>
            </div>
            <div class="form-group"><label>Държава</label><input id="p-nat" placeholder="Въведете националност на играч" value="${escapeHtml(p.nation)}"></div>
        </div>
        
        <div class="form-grid">
            <div class="form-group">
                <label>Дата на раждане</label>
                <input type="date" id="p-birthdate" value="${birthDateValue}" 
                       onchange="updateAgeFromBirthdate()" 
                       style="width:100%; padding:8px; border:1px solid #ddd; border-radius:4px;">
                <small style="color: #666;">Оставете празно, ако не знаете датата на раждане</small>
            </div>
            <div class="form-group">
                <label>Възраст</label>
                <input id="p-age" placeholder="Въведете възраст (или автоматично)" type="number" 
                       value="${ageDisplay}" style="width:100%; padding:8px; border:1px solid #ddd; border-radius:4px;">
                <small style="color: #666;">Автоматично се изчислява при избор на дата</small>
            </div>
        </div>
        
        <div class="form-group">
            <label>Снимка (URL)</label>
            <input id="p-photo" placeholder="поставете линка със снимката на играча" value="${escapeHtml(p.photo)}">
        </div>

        <div class="form-group">
            <label class="checkbox-card">
                <input type="checkbox" 
                       id="p-visible" 
                       ${p.visible !== false ? 'checked' : ''}>
                Показвай играча в сайта
            </label>
        </div>
    `;

    showModal(id ? 'Редактирай Играч' : 'Нов Играч', html, () => {
        const birthDate = document.getElementById('p-birthdate').value;
        const manualAge = document.getElementById('p-age').value;
        let finalAge = manualAge;
        
        // Ако има дата на раждане, изчисляваме възрастта
        if (birthDate) {
            const calculatedAge = calculateAge(birthDate);
            if (calculatedAge !== '') {
                finalAge = calculatedAge;
            }
        }
        
        const data = {
            name: document.getElementById('p-name').value,
            number: document.getElementById('p-num').value,
            club: document.getElementById('p-club').value,
            position: document.getElementById('p-pos').value,
            nation: document.getElementById('p-nat').value,
            birthDate: birthDate || null,
            age: finalAge,
            photo: document.getElementById('p-photo').value,
            visible: document.getElementById('p-visible').checked
        };

        // Ако нямаме дата на раждане и възрастта е празна, запазваме null
        if (!birthDate && !data.age) {
            data.age = '';
        }

        set(ref(db, 'players/' + (id || uid())), data);
    });
    
    // Добавяме глобалната функция за автоматично изчисляване
    window.updateAgeFromBirthdate = function() {
        const birthInput = document.getElementById('p-birthdate');
        const ageInput = document.getElementById('p-age');
        if (birthInput && birthInput.value) {
            const age = calculateAge(birthInput.value);
            if (age !== '') {
                ageInput.value = age;
                // Маркираме полето като автоматично изчислено
                ageInput.style.backgroundColor = '#f0fdf4';
                ageInput.style.borderColor = '#22c55e';
                // Показваме индикатор
                const small = ageInput.parentElement.querySelector('small');
                if (small) {
                    small.textContent = `✅ Автоматично изчислена възраст: ${age} години`;
                    small.style.color = '#22c55e';
                }
            }
        } else {
            // Ако няма дата, премахваме индикатора
            const ageInput = document.getElementById('p-age');
            if (ageInput) {
                ageInput.style.backgroundColor = '';
                ageInput.style.borderColor = '';
                const small = ageInput.parentElement.querySelector('small');
                if (small) {
                    small.textContent = 'Автоматично се изчислява при избор на дата';
                    small.style.color = '#666';
                }
            }
        }
    };
};

// --- РЕДАКТИРАНЕ НА МАЧ ---
window.editMatch = (id) => {
    const m = id ? state.matches[id] : { datetime: '', home: '', away: '', venue: '', tournament: '--Избери турнир--', round: '', result: '', youtube: '', notes: '' };
    
    // Сортиране на клубовете - ЦСКА първи
    const clubsArray = Object.entries(state.clubs);
    const sortedClubs = clubsArray.sort((a, b) => {
        const aName = a[1].name.toLowerCase();
        const bName = b[1].name.toLowerCase();
        if (aName.includes('цска') || aName.includes('cska')) return -1;
        if (bName.includes('цска') || bName.includes('cska')) return 1;
        return aName.localeCompare(bName);
    });
    
    let homeOpts = '', awayOpts = '';
    sortedClubs.forEach(([cid, c]) => {
        const isCSKA = c.name.toLowerCase().includes('цска') || c.name.toLowerCase().includes('cska');
        const selectedHome = m.home === cid ? 'selected' : '';
        const selectedAway = m.away === cid ? 'selected' : '';
        const label = isCSKA ? `⭐ ${c.name}` : c.name;
        homeOpts += `<option value="${cid}" ${selectedHome}>${label}</option>`;
        awayOpts += `<option value="${cid}" ${selectedAway}>${label}</option>`;
    });

    const validTournaments = ["Първенство", "Купа на България", "Суперкупа на България",  "Шампионска Лига", "Лига Европа", "Лига на конференциите", "Контролна/приятелска среща"];
    
    if (m.tournament && !validTournaments.includes(m.tournament)) {
        validTournaments.push(m.tournament);
    }

    let tourOpts = validTournaments.map(t => 
        `<option value="${t}" ${m.tournament === t ? 'selected' : ''}>${t}</option>`
    ).join('');

    const html = `
        <div class="form-group"><label>Дата и Час</label><input type="text" placeholder="Кликни за да избереш дата и час" id="m-date" value="${m.datetime}"></div>
        <div class="form-grid">
            <div class="form-group"><label>Домакин</label><select id="m-home"><option value="">Избери домакин</option>${homeOpts}</select></div>
            <div class="form-group"><label>Гост</label><select id="m-away"><option value="">Избери гост</option>${awayOpts}</select></div>
        </div>
        <div class="form-grid">
            <div class="form-group"><label>Турнир</label><select id="m-tour">${tourOpts}</select></div>
            <div class="form-group"><label>Кръг</label><input id="m-round" placeholder="Въведете кръг" value="${escapeHtml(m.round)}"></div>
        </div>
        <div class="form-group"><label>Стадион/Място</label><input id="m-venue" placeholder="Въведете име на стадион " value="${escapeHtml(m.venue)}"></div>
    `;

    showModal(id ? 'Редактирай Мач' : 'Нов Мач', html, () => {
        const data = {
            datetime: document.getElementById('m-date').value,
            home: document.getElementById('m-home').value,
            away: document.getElementById('m-away').value,
            tournament: document.getElementById('m-tour').value,
            round: document.getElementById('m-round').value,
            venue: document.getElementById('m-venue').value,
            result: m.result || '',
            youtube: m.youtube || '',
            notes: m.notes || ''
        };
        set(ref(db, 'matches/' + (id || uid())), data);
    });
};