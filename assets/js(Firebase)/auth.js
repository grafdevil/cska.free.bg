import { initializeApp } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-app.js";
import { 
    getAuth, 
    onAuthStateChanged, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut,
    updatePassword 
} from "https://www.gstatic.com/firebasejs/10.6.0/firebase-auth.js";
import { 
    getDatabase, 
    ref, 
    set, 
    update,
    remove,
    onValue 
} from "https://www.gstatic.com/firebasejs/10.6.0/firebase-database.js";

// ============================================================
// КОНФИГУРАЦИЯ
// ============================================================
const firebaseConfig = {
    apiKey: "AIzaSyB92YVJ517MyHYTOZA6RH7ydgckBYFuZMg",
    authDomain: "studious-loader-483606-b9.firebaseapp.com",
    databaseURL: "https://studious-loader-483606-b9-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "studious-loader-483606-b9",
    storageBucket: "studious-loader-483606-b9.firebasestorage.app",
    messagingSenderId: "301695598830",
    appId: "1:301695598830:web:f716b09ff815d0a3ab33ff"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getDatabase();

// ============================================================
// ЕЛЕМЕНТИ - С ПРОВЕРКА ДАЛИ СЪЩЕСТВУВАТ
// ============================================================
const authScreen = document.getElementById('auth-screen');
const menuContainer = document.getElementById('popup-menu-container');
const menuToggle = document.getElementById('menu-toggle');
const authBtn = document.getElementById('auth-action-btn');
const switchLink = document.getElementById('auth-switch-link');
const emailInput = document.getElementById('auth-email');
const passInput = document.getElementById('auth-pass');
const nameInput = document.getElementById('auth-name');
const phoneInput = document.getElementById('auth-phone');
const nameGroup = document.getElementById('name-group');
const phoneGroup = document.getElementById('phone-group');
const togglePassword = document.getElementById('toggle-password');
const closeBtn = document.getElementById('auth-close-btn');
const profileCloseBtn = document.getElementById('profile-close-btn');
const profilePopup = document.getElementById('profile-popup');

let isRegisterMode = false;
let notificationTimeout = null;
let isMenuOpen = false;

// ============================================================
// МОБИЛНО МЕНЮ - ТОГЪЛ (С ПРОВЕРКА)
// ============================================================
function initMobileMenu() {
    if (!menuToggle || !menuContainer) {
        console.warn('Мобилното меню не е налично');
        return;
    }
    
    menuToggle.addEventListener('click', function(e) {
        e.stopPropagation();
        isMenuOpen = !isMenuOpen;
        
        if (isMenuOpen) {
            menuContainer.classList.add('show');
            this.textContent = '✕';
            this.style.color = '#d11111';
        } else {
            menuContainer.classList.remove('show');
            this.textContent = '☰';
            this.style.color = 'white';
        }
    });
    
    // Затваряне при клик извън менюто
    document.addEventListener('click', function(e) {
        if (isMenuOpen && menuContainer && !menuContainer.contains(e.target) && e.target !== menuToggle) {
            menuContainer.classList.remove('show');
            if (menuToggle) {
                menuToggle.textContent = '☰';
                menuToggle.style.color = 'white';
            }
            isMenuOpen = false;
        }
    });
    
    // Затваряне при скрол
    window.addEventListener('scroll', function() {
        if (isMenuOpen && menuContainer) {
            menuContainer.classList.remove('show');
            if (menuToggle) {
                menuToggle.textContent = '☰';
                menuToggle.style.color = 'white';
            }
            isMenuOpen = false;
        }
    });
}

// Инициализираме мобилното меню
initMobileMenu();

// ============================================================
// СИСТЕМА ЗА НОТИФИКАЦИИ
// ============================================================
function showNotification(message, type = 'info', duration = 4000) {
    const isAuthOpen = authScreen && (authScreen.style.display === 'flex' || authScreen.classList.contains('active'));
    const isProfileOpen = profilePopup && (profilePopup.style.display === 'flex' || profilePopup.classList.contains('active'));
    
    let targetCard = null;
    if (isProfileOpen) {
        targetCard = profilePopup ? profilePopup.querySelector('.auth-card') : null;
    } else if (isAuthOpen) {
        targetCard = authScreen ? authScreen.querySelector('.auth-card') : null;
    }
    
    if (!targetCard) {
        targetCard = document.body;
    }
    
    const oldNotif = document.getElementById('auth-notification');
    if (oldNotif) oldNotif.remove();
    
    if (notificationTimeout) {
        clearTimeout(notificationTimeout);
        notificationTimeout = null;
    }

    const notif = document.createElement('div');
    notif.id = 'auth-notification';
    
    const colors = {
        success: { bg: 'rgba(26, 90, 26, 0.95)', border: '#28a745', icon: '✅' },
        error: { bg: 'rgba(90, 26, 26, 0.95)', border: '#d11111', icon: '❌' },
        info: { bg: 'rgba(26, 42, 90, 0.95)', border: '#17a2b8', icon: 'ℹ️' },
        warning: { bg: 'rgba(90, 74, 26, 0.95)', border: '#ffc107', icon: '⚠️' },
        confirm: { bg: 'rgba(42, 42, 58, 0.97)', border: '#6c757d', icon: '❓' }
    };
    
    const color = colors[type] || colors.info;
    const isOnCard = targetCard !== document.body && targetCard !== null;
    
    notif.style.cssText = `
        position: ${isOnCard ? 'absolute' : 'fixed'};
        top: ${isOnCard ? '-60px' : '20px'};
        left: 50%;
        transform: translateX(-50%) scale(0.8);
        background: ${color.bg};
        border-top: 3px solid ${color.border};
        box-shadow: 0 10px 40px rgba(0,0,0,0.5);
        color: white;
        padding: 14px 22px;
        border-radius: 0 0 12px 12px;
        font-size: 13px;
        z-index: 999999;
        max-width: ${isOnCard ? '90%' : '500px'};
        min-width: ${isOnCard ? 'auto' : '300px'};
        transition: top 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.5s ease;
        font-family: Arial, sans-serif;
        display: flex;
        flex-direction: column;
        gap: 10px;
        pointer-events: auto;
        opacity: 0;
        backdrop-filter: blur(10px);
        border-left: 1px solid rgba(255,255,255,0.05);
        border-right: 1px solid rgba(255,255,255,0.05);
    `;
    
    if (type === 'confirm') {
        notif.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px;">
                <span style="font-size: 20px;">${color.icon}</span>
                <span style="flex: 1; font-weight: 500; font-size: 14px; line-height: 1.4;">${message}</span>
            </div>
            <div style="display: flex; gap: 10px; justify-content: center; margin-top: 2px;">
                <button id="notif-confirm-yes" style="
                    background: #d11111;
                    border: none;
                    color: white;
                    padding: 8px 28px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: bold;
                    font-size: 13px;
                    transition: all 0.3s;
                    flex: 1;
                ">✅ ДА</button>
                <button id="notif-confirm-no" style="
                    background: rgba(255,255,255,0.1);
                    border: 1px solid rgba(255,255,255,0.2);
                    color: white;
                    padding: 8px 28px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: bold;
                    font-size: 13px;
                    transition: all 0.3s;
                    flex: 1;
                ">❌ НЕ</button>
            </div>
        `;
        
        let confirmResolve = null;
        const promise = new Promise((resolve) => {
            confirmResolve = resolve;
        });
        
        if (isOnCard && targetCard) {
            targetCard.style.position = 'relative';
            targetCard.insertBefore(notif, targetCard.firstChild);
        } else {
            document.body.appendChild(notif);
        }
        
        setTimeout(() => {
            const yesBtn = document.getElementById('notif-confirm-yes');
            const noBtn = document.getElementById('notif-confirm-no');
            
            if (yesBtn) {
                yesBtn.onclick = () => {
                    notif.style.top = isOnCard ? '-60px' : '-100px';
                    notif.style.transform = 'translateX(-50%) scale(0.8)';
                    notif.style.opacity = '0';
                    setTimeout(() => { if (notif.parentElement) notif.remove(); }, 500);
                    if (confirmResolve) confirmResolve(true);
                };
            }
            
            if (noBtn) {
                noBtn.onclick = () => {
                    notif.style.top = isOnCard ? '-60px' : '-100px';
                    notif.style.transform = 'translateX(-50%) scale(0.8)';
                    notif.style.opacity = '0';
                    setTimeout(() => { if (notif.parentElement) notif.remove(); }, 500);
                    if (confirmResolve) confirmResolve(false);
                };
            }
        }, 50);
        
        requestAnimationFrame(() => {
            notif.style.top = isOnCard ? '10px' : '20px';
            notif.style.transform = 'translateX(-50%) scale(1)';
            notif.style.opacity = '1';
        });
        
        return promise;
    }
    
    notif.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px; width: 100%;">
            <span style="font-size: 18px;">${color.icon}</span>
            <span style="flex: 1; font-size: 14px; line-height: 1.4;">${message}</span>
            <button onclick="this.closest('#auth-notification').style.top='-60px'; this.closest('#auth-notification').style.transform='translateX(-50%) scale(0.8)'; this.closest('#auth-notification').style.opacity='0'; setTimeout(() => { if(this.closest('#auth-notification')) this.closest('#auth-notification').remove(); }, 500)" style="
                background: transparent;
                border: none;
                color: rgba(255,255,255,0.4);
                font-size: 18px;
                cursor: pointer;
                padding: 0 4px;
                transition: all 0.3s;
            ">✕</button>
        </div>
    `;
    
    if (isOnCard && targetCard) {
        targetCard.style.position = 'relative';
        targetCard.insertBefore(notif, targetCard.firstChild);
    } else {
        document.body.appendChild(notif);
    }
    
    requestAnimationFrame(() => {
        notif.style.top = isOnCard ? '10px' : '20px';
        notif.style.transform = 'translateX(-50%) scale(1)';
        notif.style.opacity = '1';
    });
    
    if (duration > 0) {
        notificationTimeout = setTimeout(() => {
            notif.style.top = isOnCard ? '-60px' : '-100px';
            notif.style.transform = 'translateX(-50%) scale(0.8)';
            notif.style.opacity = '0';
            setTimeout(() => {
                if (notif.parentElement) notif.remove();
            }, 500);
        }, duration);
    }
    
    return Promise.resolve(true);
}

// ============================================================
// ФУНКЦИЯ ЗА ПОКАЗВАНЕ НА БУТОН ЗА ВХОД
// ============================================================
function renderLoginBtn() {
    if (!menuContainer) return;
    
    // Затваряме мобилното меню
    if (isMenuOpen && menuContainer) {
        menuContainer.classList.remove('show');
        if (menuToggle) {
            menuToggle.textContent = '☰';
            menuToggle.style.color = 'white';
        }
        isMenuOpen = false;
    }
    
    menuContainer.innerHTML = '';
    
    const loginBtn = document.createElement('button');
    loginBtn.className = 'menu-btn';
    loginBtn.textContent = '🔑 ВХОД';
    loginBtn.style.cssText = `
        background: transparent;
        border: 1px solid #d11111;
        color: white;
        padding: 8px 20px;
        border-radius: 6px;
        cursor: pointer;
        font-weight: bold;
        transition: all 0.3s;
    `;
    loginBtn.onmouseenter = () => {
        loginBtn.style.background = '#d11111';
    };
    loginBtn.onmouseleave = () => {
        loginBtn.style.background = 'transparent';
    };
    loginBtn.onclick = () => {
        if (authScreen) {
            authScreen.style.display = 'flex';
            authScreen.classList.add('active');
        }
        // Затваряме мобилното меню
        if (isMenuOpen && menuContainer) {
            menuContainer.classList.remove('show');
            if (menuToggle) {
                menuToggle.textContent = '☰';
                menuToggle.style.color = 'white';
            }
            isMenuOpen = false;
        }
    };
    
    menuContainer.appendChild(loginBtn);
}

// ============================================================
// ПОКАЗВАНЕ/СКРИВАНЕ НА ПАРОЛА
// ============================================================
if (togglePassword) {
    togglePassword.onclick = () => {
        if (passInput.type === "password") {
            passInput.type = "text";
            togglePassword.textContent = "🙈";
        } else {
            passInput.type = "password";
            togglePassword.textContent = "👁️";
        }
    };
}

// ============================================================
// ENTER КЛАВИШ
// ============================================================
const handleEnter = (e) => {
    if (e.key === "Enter") {
        e.preventDefault();
        if (authBtn) authBtn.click();
    }
};

if (emailInput) emailInput.addEventListener('keypress', handleEnter);
if (passInput) passInput.addEventListener('keypress', handleEnter);
if (nameInput) nameInput.addEventListener('keypress', handleEnter);
if (phoneInput) phoneInput.addEventListener('keypress', handleEnter);

// ============================================================
// ПРЕВКЛЮЧВАНЕ МЕЖДУ ВХОД/РЕГИСТРАЦИЯ
// ============================================================
if (switchLink) {
    switchLink.onclick = () => {
        isRegisterMode = !isRegisterMode;
        
        const title = document.getElementById('auth-title');
        const subtitle = document.getElementById('auth-subtitle');
        if (title) title.textContent = isRegisterMode ? "Регистрация" : "Вход";
        if (subtitle) subtitle.textContent = isRegisterMode ? "Създайте своя армейски профил" : "Моля, въведете своите данни";
        authBtn.textContent = isRegisterMode ? "Регистрирай ме" : "Влез";
        switchLink.textContent = isRegisterMode ? "Вече имате профил? Влезте" : "Нямате профил? Регистрирайте се";
        
        if (nameGroup) nameGroup.style.display = isRegisterMode ? "block" : "none";
        if (phoneGroup) phoneGroup.style.display = isRegisterMode ? "block" : "none";
    };
}

// ============================================================
// ВХОД/РЕГИСТРАЦИЯ
// ============================================================
if (authBtn) {
    authBtn.onclick = async () => {
        const email = emailInput ? emailInput.value.trim() : "";
        const pass = passInput ? passInput.value.trim() : "";
        const fullName = nameInput ? nameInput.value.trim() : "";
        const phone = phoneInput ? phoneInput.value.trim() : "";

        if (!email || !pass) {
            showNotification("Моля, попълнете имейл и парола!", "warning");
            return;
        }

        if (isRegisterMode && pass.length < 6) {
            showNotification("Паролата трябва да бъде поне 6 символа!", "warning");
            return;
        }

        authBtn.disabled = true;
        authBtn.textContent = "Моля изчакайте...";

        try {
            if (isRegisterMode) {
                const res = await createUserWithEmailAndPassword(auth, email, pass);
                await set(ref(db, `users/${res.user.uid}`), { 
                    email, 
                    fullName: fullName || "Привърженик", 
                    phone: phone || "", 
                    role: 'registered', 
                    status: 'active', 
                    createdAt: new Date().toISOString() 
                });
                showNotification("✅ Успешна регистрация! Добре дошли!", "success", 5000);
            } else {
                await signInWithEmailAndPassword(auth, email, pass);
                showNotification("✅ Успешен вход! Добре дошли!", "success", 4000);
            }
            
            if (authScreen) {
                authScreen.classList.remove('active');
                authScreen.style.display = 'none';
            }
            
            if (emailInput) emailInput.value = '';
            if (passInput) passInput.value = '';
            if (nameInput) nameInput.value = '';
            if (phoneInput) phoneInput.value = '';
            
        } catch (e) {
            let msg = "Грешка при автентикация!";
            switch(e.code) {
                case 'auth/user-not-found': msg = "❌ Потребител не е намерен!"; break;
                case 'auth/wrong-password': msg = "❌ Грешна парола!"; break;
                case 'auth/email-already-in-use': msg = "❌ Този имейл вече е регистриран!"; break;
                case 'auth/invalid-email': msg = "❌ Невалиден имейл адрес!"; break;
                case 'auth/weak-password': msg = "❌ Паролата е твърде слаба!"; break;
                case 'auth/too-many-requests': msg = "❌ Твърде много опити! Изчакайте."; break;
                case 'auth/network-request-failed': msg = "❌ Няма връзка с интернет!"; break;
                default: msg = "❌ " + e.message;
            }
            showNotification(msg, "error", 6000);
        } finally {
            authBtn.disabled = false;
            authBtn.textContent = isRegisterMode ? "Регистрирай ме" : "Влез";
        }
    };
}

// ============================================================
// ЗАТВАРЯНЕ
// ============================================================
const closeAuth = () => {
    if (authScreen) {
        authScreen.classList.remove('active');
        authScreen.style.display = 'none';
    }
};

if (closeBtn) {
    closeBtn.onclick = closeAuth;
}

if (profileCloseBtn) {
    profileCloseBtn.onclick = () => {
        if (profilePopup) {
            profilePopup.style.display = 'none';
            profilePopup.classList.remove('active');
        }
    };
}

// Клик извън модала
window.onclick = (e) => {
    if (e.target === authScreen) closeAuth();
    if (e.target === profilePopup) {
        profilePopup.style.display = 'none';
        profilePopup.classList.remove('active');
    }
};

// Escape клавиш
document.onkeydown = (e) => {
    if (e.key === 'Escape') {
        if (authScreen && (authScreen.style.display === 'flex' || authScreen.classList.contains('active'))) {
            closeAuth();
        }
        if (profilePopup && profilePopup.style.display === 'flex') {
            profilePopup.style.display = 'none';
            profilePopup.classList.remove('active');
        }
    }
};

// ============================================================
// СЪСТОЯНИЕ НА АВТЕНТИКАЦИЯТА
// ============================================================
onAuthStateChanged(auth, (user) => {
    if (!menuContainer) return;

    if (user) {
        onValue(ref(db, `users/${user.uid}`), (snap) => {
            const userData = snap.val() || {};
            
            if (userData.status === 'blocked') {
                showNotification("⛔ Вашият профил е блокиран!", "error", 8000);
                signOut(auth);
                return;
            }
            renderUserMenu(user, userData);
        });

        onValue(ref(db, `messages/${user.uid}`), (snap) => {
            const messages = snap.val();
            if (messages) {
                Object.entries(messages).forEach(([id, msg]) => {
                    if (!msg.read) {
                        showNotification(`📩 ${msg.text}`, "info", 8000);
                        setTimeout(() => {
                            window.deleteMessage(user.uid, id);
                        }, 8000);
                    }
                });
            }
        });

    } else {
        renderLoginBtn();
    }
});

// ============================================================
// АКО НЯМА ПОТРЕБИТЕЛ ОТ СТАРТ
// ============================================================
if (!auth.currentUser) {
    renderLoginBtn();
}

setTimeout(() => {
    if (!auth.currentUser && menuContainer && menuContainer.children.length === 0) {
        renderLoginBtn();
    }
}, 3000);

// ============================================================
// МЕНЮ НА ПОТРЕБИТЕЛ
// ============================================================
function renderUserMenu(user, userData) {
    if (!menuContainer) return;
    
    if (isMenuOpen && menuContainer) {
        menuContainer.classList.remove('show');
        if (menuToggle) {
            menuToggle.textContent = '☰';
            menuToggle.style.color = 'white';
        }
        isMenuOpen = false;
    }
    
    menuContainer.innerHTML = '';
    const role = userData.role || 'registered';
    
    const profileBtn = document.createElement('button');
    profileBtn.className = 'menu-btn';
    profileBtn.style.cssText = `
        border: ${role === 'admin' ? '2px solid gold' : '1px solid #d11111'};
        color: white;
        background: transparent;
        padding: 8px 20px;
        border-radius: 6px;
        cursor: pointer;
        font-weight: bold;
        transition: all 0.3s;
    `;
    profileBtn.textContent = `👤 ${userData.fullName ? userData.fullName.split(' ')[0].toUpperCase() : user.email.split('@')[0].toUpperCase()}`;
    
    profileBtn.onmouseenter = () => {
        profileBtn.style.background = 'rgba(209, 17, 17, 0.2)';
    };
    profileBtn.onmouseleave = () => {
        profileBtn.style.background = 'transparent';
    };
    
    profileBtn.onclick = () => {
        if (profilePopup) {
            const details = document.getElementById('profile-details');
            renderProfileView(user, userData, details);
            profilePopup.style.display = 'flex';
            profilePopup.classList.add('active');
        }
        if (isMenuOpen && menuContainer) {
            menuContainer.classList.remove('show');
            if (menuToggle) {
                menuToggle.textContent = '☰';
                menuToggle.style.color = 'white';
            }
            isMenuOpen = false;
        }
    };
    
    menuContainer.appendChild(profileBtn);
}

// ============================================================
// ПРОФИЛ
// ============================================================
function renderProfileView(user, userData, details, isEditing = false) {
    if (!details) return;
    
    if (isEditing) {
        details.innerHTML = `
            <div class="edit-profile-form">
                <h3>✏️ Редакция на профил</h3>
                <input type="text" id="edit-name" placeholder="Име и Фамилия" value="${userData.fullName || ''}" class="auth-input">
                <input type="text" id="edit-phone" placeholder="Телефон" value="${userData.phone || ''}" class="auth-input">
                <hr style="border: 0; border-top: 1px solid #333; margin: 12px 0;">
                <small style="color: #888;">Смяна на парола (поне 6 символа):</small>
                <input type="password" id="new-password" placeholder="Нова парола" class="auth-input">
                <div style="display: flex; gap: 10px; margin-top: 12px;">
                    <button id="save-profile" class="auth-btn" style="background: #28a745;">💾 ЗАПАЗИ</button>
                    <button id="cancel-edit" class="auth-btn" style="background: #555;">❌ ОТКАЗ</button>
                </div>
            </div>
        `;

        document.getElementById('save-profile').onclick = async () => {
            const newName = document.getElementById('edit-name').value.trim();
            const newPhone = document.getElementById('edit-phone').value.trim();
            const newPass = document.getElementById('new-password').value.trim();
            
            try {
                await update(ref(db, `users/${user.uid}`), { fullName: newName || "Привърженик", phone: newPhone });
                if (newPass.length > 0) {
                    if (newPass.length < 6) throw new Error("Паролата трябва да е поне 6 символа!");
                    await updatePassword(user, newPass);
                }
                showNotification("✅ Профилът беше обновен успешно!", "success", 4000);
                profilePopup.style.display = 'none';
                profilePopup.classList.remove('active');
            } catch (e) {
                showNotification("❌ " + e.message, "error", 5000);
            }
        };

        document.getElementById('cancel-edit').onclick = () => {
            renderProfileView(user, userData, details, false);
        };

    } else {
        const role = userData.role || 'registered';
        details.innerHTML = `
            <div style="border-left: 3px solid #d11111; padding-left: 15px; margin-bottom: 20px;">
                <p style="margin: 5px 0;"><strong>👤 ИМЕ:</strong> ${userData.fullName || '---'}</p>
                <p style="margin: 5px 0;"><strong>📱 ТЕЛЕФОН:</strong> ${userData.phone || '---'}</p>
                <p style="margin: 5px 0;"><strong>📧 EMAIL:</strong> ${user.email}</p>
                <p style="margin: 5px 0;"><strong>⭐ РАНГ:</strong> <span style="color: #d11111; font-weight: bold;">${role.toUpperCase()}</span></p>
            </div>
            <div class="profile-actions">
                <button id="btn-edit-mode" class="auth-btn">✏️ РЕДАКТИРАЙ ПРОФИЛ</button>
                ${(role === 'admin' || role === 'moderator') ? `<button id="btn-admin-panel" class="auth-btn" style="background: gold; color: black;">⚙️ АДМИН ПАНЕЛ</button>` : ''}
                <button id="btn-logout-now" class="auth-btn" style="background: #333;">🚪 ИЗХОД</button>
            </div>
        `;

        document.getElementById('btn-edit-mode').onclick = () => {
            renderProfileView(user, userData, details, true);
        };

        document.getElementById('btn-logout-now').onclick = async () => {
            const confirmed = await showNotification(
                "Сигурни ли сте, че искате да излезете?", 
                "confirm", 
                0
            );
            
            if (confirmed) {
                signOut(auth);
                showNotification("👋 Успешен изход! До скоро!", "info", 3000);
                profilePopup.style.display = 'none';
                profilePopup.classList.remove('active');
            } else {
                showNotification("Действието беше отказано.", "info", 2000);
            }
        };

        const adminBtn = document.getElementById('btn-admin-panel');
        if (adminBtn) {
            adminBtn.onclick = () => {
                fetch('admin/admin.html', { method: 'HEAD' })
                    .then(res => res.ok ? window.location.href = 'admin/admin.html' : showNotification("Админ панелът не е наличен!", "warning", 4000))
                    .catch(() => showNotification("Админ панелът не е наличен!", "warning", 4000));
            };
        }
    }
}

// ============================================================
// СИСТЕМНИ СЪОБЩЕНИЯ
// ============================================================
window.deleteMessage = (userId, msgId) => {
    remove(ref(db, `messages/${userId}/${msgId}`)).catch(e => console.error("Грешка:", e));
};

console.log('✅ Auth системата е заредена успешно!');