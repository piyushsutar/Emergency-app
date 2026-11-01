/**
 * EMERGENCY SOS & SAFETY MANAGEMENT - CORE APPLICATION CONTROLLER
 * Integrates Auth, GPS Location, SOS Trigger, Contacts, History, Reports, and Settings.
 */

let activeTab = 'dashboard';
let currentHistoryFilter = 'all';

// ==================== APP INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', async () => {
    initClock();
    await checkUserSession();
});

// Live IST Clock
function initClock() {
    function updateClock() {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-IN', {
            timeZone: 'Asia/Kolkata',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        }) + ' IST';

        const clockEl = document.getElementById('topClockDisplay');
        if (clockEl) clockEl.textContent = timeStr;
    }
    updateClock();
    setInterval(updateClock, 1000);
}

// Session Verification
async function checkUserSession() {
    try {
        const session = await window.sosAuth.getSession();
        if (session && session.email) {
            showScreen('main');
            await initializeUserEnvironment(session);
        } else {
            showScreen('auth');
        }
    } catch (err) {
        console.error('Session check error:', err);
        showScreen('auth');
    }
}

function showScreen(screen) {
    const authScreen = document.getElementById('authScreen');
    const mainScreen = document.getElementById('mainScreen');

    if (screen === 'main') {
        authScreen.classList.add('hidden');
        mainScreen.classList.remove('hidden');
    } else {
        mainScreen.classList.add('hidden');
        authScreen.classList.remove('hidden');
    }
}

// Initialize environment after login
async function initializeUserEnvironment(session) {
    await loadProfileData();
    await loadDashboardData();
    await loadSettings();
    initMotionDetection();
    refreshGpsLocation();
}

// ==================== AUTHENTICATION CONTROLLER ====================
function switchAuthTab(tab) {
    const loginBtn = document.getElementById('tabLoginBtn');
    const regBtn = document.getElementById('tabRegisterBtn');
    const loginForm = document.getElementById('loginForm');
    const regForm = document.getElementById('registerForm');
    const authAlert = document.getElementById('authAlert');

    authAlert.classList.add('hidden');

    if (tab === 'login') {
        loginBtn.classList.add('active');
        regBtn.classList.remove('active');
        loginForm.classList.remove('hidden');
        regForm.classList.add('hidden');
    } else {
        regBtn.classList.add('active');
        loginBtn.classList.remove('active');
        regForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
    }
}

function showAuthAlert(msg, type = 'danger') {
    const alertBox = document.getElementById('authAlert');
    alertBox.textContent = msg;
    alertBox.className = `alert-box ${type}`;
    alertBox.classList.remove('hidden');
}

async function handleLoginSubmit(event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const submitBtn = document.getElementById('loginSubmitBtn');

    submitBtn.disabled = true;
    submitBtn.textContent = 'Verifying...';

    try {
        const session = await window.sosAuth.login(email, password);
        showScreen('main');
        await initializeUserEnvironment(session);
    } catch (err) {
        showAuthAlert(err.message, 'danger');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign In to Dashboard';
    }
}

async function handleRegisterSubmit(event) {
    event.preventDefault();
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const phone = document.getElementById('regPhone').value;
    const pass = document.getElementById('regPassword').value;
    const confirmPass = document.getElementById('regConfirmPassword').value;
    const submitBtn = document.getElementById('regSubmitBtn');

    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating Account...';

    try {
        const session = await window.sosAuth.register(name, email, phone, pass, confirmPass);
        showAuthAlert('Account created successfully! Redirecting...', 'success');
        setTimeout(async () => {
            showScreen('main');
            await initializeUserEnvironment(session);
        }, 800);
    } catch (err) {
        showAuthAlert(err.message, 'danger');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Account';
    }
}

function openForgotPasswordModal() {
    document.getElementById('forgotPasswordModal').classList.remove('hidden');
    document.getElementById('forgotMsg').classList.add('hidden');
    document.getElementById('forgotEmail').value = document.getElementById('loginEmail').value || '';
}

function closeForgotPasswordModal() {
    document.getElementById('forgotPasswordModal').classList.add('hidden');
}

async function handleForgotPasswordSubmit(event) {
    event.preventDefault();
    const email = document.getElementById('forgotEmail').value;
    const newPass = document.getElementById('forgotNewPass').value;
    const confirmPass = document.getElementById('forgotConfirmPass').value;
    const msgBox = document.getElementById('forgotMsg');

    try {
        await window.sosAuth.resetPassword(email, newPass, confirmPass);
        msgBox.textContent = 'Password reset successfully! You can now log in.';
        msgBox.className = 'alert-box success';
        msgBox.classList.remove('hidden');
        setTimeout(() => {
            closeForgotPasswordModal();
            switchAuthTab('login');
        }, 1500);
    } catch (err) {
        msgBox.textContent = err.message;
        msgBox.className = 'alert-box danger';
        msgBox.classList.remove('hidden');
    }
}

async function handleLogout() {
    if (confirm('Are you sure you want to log out from this device?')) {
        await window.sosAuth.logout();
        window.sosMotion.stopListening();
        showScreen('auth');
    }
}

// ==================== NAVIGATION CONTROLLER ====================
function navigateToTab(tab) {
    activeTab = tab;

    // Hide all sub-views
    const views = ['Dashboard', 'Contacts', 'History', 'Reports', 'Profile', 'Settings'];
    views.forEach(v => {
        const el = document.getElementById(`view${v}`);
        if (el) el.classList.add('hidden');
    });

    // Unselect nav items
    const navItems = document.querySelectorAll('.bottom-nav .nav-item');
    navItems.forEach(n => n.classList.remove('active'));

    // Activate selected view
    const targetView = document.getElementById(`view${tab.charAt(0).toUpperCase() + tab.slice(1)}`);
    if (targetView) targetView.classList.remove('hidden');

    // Highlight nav button
    const navMap = {
        'dashboard': 'navDashBtn',
        'contacts': 'navContactsBtn',
        'history': 'navHistoryBtn',
        'reports': 'navReportsBtn'
    };
    if (navMap[tab]) {
        const btn = document.getElementById(navMap[tab]);
        if (btn) btn.classList.add('active');
    }

    // Refresh view specific data
    if (tab === 'dashboard') loadDashboardData();
    else if (tab === 'contacts') loadContactsList();
    else if (tab === 'history') loadHistory();
    else if (tab === 'reports') loadReportsMetrics();
    else if (tab === 'profile') loadProfileData();
    else if (tab === 'settings') loadSettings();
}

// ==================== DASHBOARD CONTROLLER ====================
async function loadDashboardData() {
    const session = await window.sosAuth.getSession();
    if (!session) return;

    const profile = await window.sosDB.getProfile(session.email) || {};

    // Header avatar
    const headerLetter = document.getElementById('headerAvatarText');
    const headerImg = document.getElementById('headerAvatarImg');
    if (profile.photo) {
        headerImg.src = profile.photo;
        headerImg.classList.remove('hidden');
        headerLetter.classList.add('hidden');
    } else {
        headerLetter.textContent = (profile.name || session.name || 'U').charAt(0).toUpperCase();
        headerLetter.classList.remove('hidden');
        headerImg.classList.add('hidden');
    }

    // Dashboard Banner
    const dashName = document.getElementById('dashUserName');
    const dashBlood = document.getElementById('dashBloodGroup');
    const dashAvatarInitial = document.getElementById('dashAvatarInitial');
    const dashAvatarImg = document.getElementById('dashAvatarImg');

    if (dashName) dashName.textContent = profile.name || session.name;
    if (dashBlood) dashBlood.textContent = `Blood: ${profile.bloodGroup || 'Unknown'}`;

    if (profile.photo) {
        dashAvatarImg.src = profile.photo;
        dashAvatarImg.classList.remove('hidden');
        dashAvatarInitial.classList.add('hidden');
    } else {
        dashAvatarInitial.textContent = (profile.name || session.name || 'U').charAt(0).toUpperCase();
        dashAvatarInitial.classList.remove('hidden');
        dashAvatarImg.classList.add('hidden');
    }

    // Load mini contacts
    await renderDashboardContacts(session.email);

    // Load recent history mini
    await renderDashboardRecentHistory(session.email);
}

async function renderDashboardContacts(userEmail) {
    const container = document.getElementById('dashContactsList');
    if (!container) return;

    const contacts = await window.sosDB.getContacts(userEmail);

    if (contacts.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding: 12px; background: var(--surface-card); border-radius: var(--radius-sm); color: var(--text-muted); font-size: 12px;">
                No emergency contacts added yet.
                <div style="margin-top:6px;"><button class="btn btn-sm btn-outline" onclick="navigateToTab('contacts')">+ Add 5 Contacts</button></div>
            </div>`;
        return;
    }

    container.innerHTML = contacts.map(c => `
        <div class="contact-card-compact">
            <div class="contact-compact-info">
                <span class="contact-compact-name">${escapeHtml(c.name)}</span>
                <span class="contact-compact-rel">${escapeHtml(c.relationship || 'Emergency Contact')} &bull; ${c.phone}</span>
            </div>
            <div class="contact-compact-actions">
                <button class="circle-action-btn call" onclick="callContact('${c.phone}', '${escapeHtml(c.name)}')" title="Call">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                </button>
                <button class="circle-action-btn sms" onclick="sendIndividualSms('${c.phone}', '${escapeHtml(c.name)}')" title="Send Emergency SMS">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                </button>
            </div>
        </div>
    `).join('');
}

async function renderDashboardRecentHistory(userEmail) {
    const container = document.getElementById('dashRecentHistory');
    if (!container) return;

    const history = await window.sosDB.getSosHistory(userEmail);
    const recent = history.slice(0, 3);

    if (recent.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding: 12px; background: var(--surface-card); border-radius: var(--radius-sm); color: var(--text-muted); font-size: 12px;">
                No SOS emergency activations recorded yet.
            </div>`;
        return;
    }

    container.innerHTML = recent.map(e => `
        <div class="recent-event-item">
            <div class="event-item-left">
                <span class="event-item-time">${e.timeIST}</span>
                <span class="event-item-date">${e.date} (${e.day})</span>
            </div>
            <div>
                <span class="badge blood-badge">${e.status}</span>
            </div>
        </div>
    `).join('');
}

// ==================== GPS LOCATION ====================
async function refreshGpsLocation() {
    const coordsEl = document.getElementById('dashCoords');
    const metaEl = document.getElementById('dashLocationMeta');
    const mapsLink = document.getElementById('dashMapsLink');

    if (coordsEl) coordsEl.textContent = 'Acquiring GPS fix...';
    if (metaEl) metaEl.textContent = 'Checking satellite / network geolocation...';

    try {
        const loc = await window.sosLocation.getCurrentLocation(true);
        if (coordsEl) coordsEl.textContent = `${loc.latitude.toFixed(5)}, ${loc.longitude.toFixed(5)}`;
        if (metaEl) metaEl.textContent = `Accuracy: ±${loc.accuracy}m • Updated: ${loc.formattedTime}`;
        if (mapsLink) {
            mapsLink.href = loc.mapsUrl;
            mapsLink.classList.remove('disabled');
        }
    } catch (err) {
        if (coordsEl) coordsEl.textContent = 'GPS Signal Unavailable';
        if (metaEl) metaEl.textContent = err.message;
        if (mapsLink) {
            mapsLink.href = 'javascript:void(0)';
            mapsLink.classList.add('disabled');
        }
    }
}

// ==================== SOS ACTIVATION ENGINE ====================
function initiateSosProcess() {
    const overlay = document.getElementById('sosCountdownOverlay');
    const numberEl = document.getElementById('countdownNumber');

    overlay.classList.remove('hidden');

    const started = window.sosEngine.triggerSosCountdown(
        (remaining) => {
            if (numberEl) numberEl.textContent = remaining;
        },
        async (result) => {
            overlay.classList.add('hidden');
            if (result && result.success) {
                showSosSuccessModal(result.event);
                await loadDashboardData();
            } else {
                alert('SOS Activation failed: ' + (result ? result.error : 'Unknown error'));
            }
        },
        () => {
            overlay.classList.add('hidden');
        }
    );

    if (!started) {
        overlay.classList.add('hidden');
    }
}

function abortSosCountdown() {
    window.sosEngine.cancelSos();
    const overlay = document.getElementById('sosCountdownOverlay');
    overlay.classList.add('hidden');
}

function showSosSuccessModal(event) {
    const modal = document.getElementById('sosSuccessModal');
    document.getElementById('successModalTime').textContent = `${event.timeIST} (${event.date})`;
    document.getElementById('successModalCoords').textContent = event.latitude && event.longitude 
        ? `${event.latitude}, ${event.longitude}` 
        : 'Location unavailable';
    document.getElementById('successModalContacts').textContent = `${event.smsResults ? event.smsResults.length : 0} Contacts Prepared`;

    modal.classList.remove('hidden');
}

function closeSuccessModal() {
    document.getElementById('sosSuccessModal').classList.add('hidden');
}

// ==================== CALLING & INDIVIDUAL ACTIONS ====================
async function callContact(phone, name) {
    const session = await window.sosAuth.getSession();
    if (!session) return;
    try {
        await window.sosCall.makeCall(session.email, name, phone);
    } catch (err) {
        alert(err.message);
    }
}

async function callHelpline(number, name) {
    const session = await window.sosAuth.getSession();
    if (!session) return;
    try {
        await window.sosCall.makeCall(session.email, name, number);
    } catch (err) {
        alert(err.message);
    }
}

async function sendIndividualSms(phone, name) {
    const session = await window.sosAuth.getSession();
    if (!session) return;

    const profile = await window.sosDB.getProfile(session.email) || {};
    let locationData = window.sosLocation.currentLocation;
    if (!locationData) {
        try {
            locationData = await window.sosLocation.getCurrentLocation();
        } catch (e) {
            locationData = {
                mapsUrl: 'Location Unavailable',
                formattedTime: new Date().toLocaleTimeString('en-IN') + ' IST'
            };
        }
    }

    await window.sosSms.sendIndividualSms(
        session.email,
        profile,
        { name, phone, relationship: 'Contact' },
        locationData
    );
}

// ==================== CONTACTS MANAGEMENT CONTROLLER ====================
async function loadContactsList() {
    const session = await window.sosAuth.getSession();
    if (!session) return;

    const contacts = await window.sosDB.getContacts(session.email);
    const counterDisplay = document.getElementById('contactCounterDisplay');
    const container = document.getElementById('contactsFullList');
    const addBtn = document.getElementById('addNewContactBtn');

    if (counterDisplay) counterDisplay.textContent = `${contacts.length} / 5`;
    if (addBtn) addBtn.disabled = (contacts.length >= 5);

    if (contacts.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding: 30px; background: var(--surface-card); border-radius: var(--radius-md); color: var(--text-muted);">
                <p style="margin-bottom:12px;">You haven't added any emergency contacts yet.</p>
                <button class="btn btn-primary" onclick="openContactModal()">+ Add Your First Contact</button>
            </div>`;
        return;
    }

    container.innerHTML = contacts.map(c => `
        <div class="contact-full-card">
            <div class="contact-full-top">
                <div class="contact-main-meta">
                    <h4>${escapeHtml(c.name)}</h4>
                    <span class="contact-phone-num">${c.phone}</span>
                </div>
                <span class="contact-rel-tag">${escapeHtml(c.relationship || 'Emergency')}</span>
            </div>
            <div class="contact-card-btn-row">
                <button class="btn btn-sm btn-secondary" onclick="callContact('${c.phone}', '${escapeHtml(c.name)}')">Call</button>
                <button class="btn btn-sm btn-secondary" onclick="sendIndividualSms('${c.phone}', '${escapeHtml(c.name)}')">SMS</button>
                <button class="btn btn-sm btn-outline" onclick="openContactModal('${c.id}')">Edit</button>
                <button class="btn btn-sm btn-danger" onclick="deleteContact('${c.id}')">Delete</button>
            </div>
        </div>
    `).join('');
}

async function openContactModal(editId = null) {
    const modal = document.getElementById('contactModal');
    const title = document.getElementById('contactModalTitle');
    const errorBox = document.getElementById('contactErrorMsg');

    errorBox.classList.add('hidden');
    document.getElementById('contactEditId').value = editId || '';

    if (editId) {
        title.textContent = 'Edit Emergency Contact';
        const session = await window.sosAuth.getSession();
        const contacts = await window.sosDB.getContacts(session.email);
        const contact = contacts.find(c => c.id === editId);
        if (contact) {
            document.getElementById('contactName').value = contact.name;
            document.getElementById('contactPhone').value = contact.phone;
            document.getElementById('contactRel').value = contact.relationship || 'Parent';
        }
    } else {
        title.textContent = 'Add Emergency Contact';
        document.getElementById('contactForm').reset();
    }

    modal.classList.remove('hidden');
}

function closeContactModal() {
    document.getElementById('contactModal').classList.add('hidden');
}

async function handleContactSave(event) {
    event.preventDefault();
    const session = await window.sosAuth.getSession();
    if (!session) return;

    const editId = document.getElementById('contactEditId').value;
    const name = document.getElementById('contactName').value.trim();
    const phone = document.getElementById('contactPhone').value.trim();
    const relationship = document.getElementById('contactRel').value;
    const errorBox = document.getElementById('contactErrorMsg');

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
        errorBox.textContent = 'Please enter a valid 10-digit mobile number.';
        errorBox.classList.remove('hidden');
        return;
    }

    const currentContacts = await window.sosDB.getContacts(session.email);

    if (!editId && currentContacts.length >= 5) {
        errorBox.textContent = 'Maximum limit of 5 emergency contacts reached.';
        errorBox.classList.remove('hidden');
        return;
    }

    const contactObj = {
        id: editId || ('contact_' + Date.now()),
        userEmail: session.email,
        name: name,
        phone: cleanPhone,
        relationship: relationship,
        updatedAt: new Date().toISOString()
    };

    await window.sosDB.saveContact(contactObj);
    closeContactModal();
    await loadContactsList();
    await loadDashboardData();
}

async function deleteContact(id) {
    if (confirm('Delete this emergency contact?')) {
        await window.sosDB.deleteContact(id);
        await loadContactsList();
        await loadDashboardData();
    }
}

// ==================== ADVANCED EMERGENCY HISTORY ====================
async function loadHistory() {
    const session = await window.sosAuth.getSession();
    if (!session) return;

    const container = document.getElementById('historyRecordsList');
    const query = (document.getElementById('historySearchInput').value || '').toLowerCase().trim();

    const sosList = await window.sosDB.getSosHistory(session.email);
    const smsList = await window.sosDB.getSmsRecords(session.email);
    const callList = await window.sosDB.getCallRecords(session.email);

    if (currentHistoryFilter === 'sms') {
        renderSmsHistory(smsList, query, container);
    } else if (currentHistoryFilter === 'calls') {
        renderCallsHistory(callList, query, container);
    } else {
        renderAllSosHistory(sosList, query, container);
    }
}

function setHistoryFilter(filter) {
    currentHistoryFilter = filter;
    const pills = document.querySelectorAll('.filter-pills .filter-pill');
    pills.forEach(p => p.classList.remove('active'));
    event.target.classList.add('active');
    loadHistory();
}

function filterHistoryList() {
    loadHistory();
}

function renderAllSosHistory(list, query, container) {
    let filtered = list;
    if (query) {
        filtered = list.filter(e => 
            e.date.toLowerCase().includes(query) ||
            e.day.toLowerCase().includes(query) ||
            (e.emergencyContacts && e.emergencyContacts.some(c => c.phone.includes(query) || c.name.toLowerCase().includes(query)))
        );
    }

    if (filtered.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding: 20px; color: var(--text-muted);">No SOS activation records found.</div>`;
        return;
    }

    container.innerHTML = filtered.map(e => `
        <div class="history-item-card">
            <div class="history-item-header">
                <div class="history-date-box">
                    <strong>${e.date}</strong>
                    <span>${e.day} • ${e.timeIST}</span>
                </div>
                <span class="badge blood-badge">${e.status}</span>
            </div>
            <div class="history-coords-row">
                <span>GPS: ${e.latitude && e.longitude ? `${e.latitude}, ${e.longitude} (±${e.accuracy}m)` : 'Unavailable'}</span>
                ${e.mapsUrl && e.mapsUrl !== 'Location Unavailable' ? ` • <a href="${e.mapsUrl}" target="_blank" style="color:#38bdf8;">Map</a>` : ''}
            </div>
            <div class="history-sms-list">
                ${(e.smsResults || []).map(s => `
                    <div class="history-sms-row">
                        <span>${escapeHtml(s.contactName)} (${s.phone})</span>
                        <span class="sms-status-pill ${s.status.includes('Dispatched') ? 'sent' : 'fail'}">${s.status}</span>
                    </div>
                `).join('')}
            </div>
            <div style="margin-top: 8px; text-align: right;">
                <button class="btn-text-small" onclick="generateIndividualSosReport('${e.id}')">Export SOS Incident PDF</button>
            </div>
        </div>
    `).join('');
}

function renderSmsHistory(list, query, container) {
    let filtered = list;
    if (query) {
        filtered = list.filter(s =>
            s.date.toLowerCase().includes(query) ||
            s.contactName.toLowerCase().includes(query) ||
            s.phone.includes(query)
        );
    }

    if (filtered.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding: 20px; color: var(--text-muted);">No SMS logs found.</div>`;
        return;
    }

    container.innerHTML = filtered.map(s => `
        <div class="history-item-card">
            <div class="history-item-header">
                <div>
                    <strong>${escapeHtml(s.contactName)}</strong>
                    <div style="font-size:12px; color:var(--text-muted);">${s.phone}</div>
                </div>
                <span class="sms-status-pill ${s.status.includes('Dispatched') ? 'sent' : 'fail'}">${s.status}</span>
            </div>
            <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">
                ${s.date} at ${s.timeIST}
            </div>
        </div>
    `).join('');
}

function renderCallsHistory(list, query, container) {
    let filtered = list;
    if (query) {
        filtered = list.filter(c =>
            c.date.toLowerCase().includes(query) ||
            c.contactName.toLowerCase().includes(query) ||
            c.phone.includes(query)
        );
    }

    if (filtered.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding: 20px; color: var(--text-muted);">No call logs found.</div>`;
        return;
    }

    container.innerHTML = filtered.map(c => `
        <div class="history-item-card">
            <div class="history-item-header">
                <div>
                    <strong>${escapeHtml(c.contactName)}</strong>
                    <div style="font-size:12px; color:var(--text-muted);">${c.phone}</div>
                </div>
                <span class="badge" style="background:rgba(245, 158, 11, 0.2); color:#f59e0b;">${c.status}</span>
            </div>
            <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">
                Attempted: ${c.date} at ${c.timeIST}
            </div>
        </div>
    `).join('');
}

// ==================== REPORTS & PDF GENERATOR ====================
async function loadReportsMetrics() {
    const session = await window.sosAuth.getSession();
    if (!session) return;

    const sos = await window.sosDB.getSosHistory(session.email);
    const sms = await window.sosDB.getSmsRecords(session.email);
    const calls = await window.sosDB.getCallRecords(session.email);
    const contacts = await window.sosDB.getContacts(session.email);

    document.getElementById('kpiTotalSos').textContent = sos.length;
    document.getElementById('kpiTotalSms').textContent = sms.length;
    document.getElementById('kpiTotalCalls').textContent = calls.length;
    document.getElementById('kpiTotalContacts').textContent = contacts.length;
}

async function generatePdfReport(type) {
    try {
        await window.sosReport.generateReport(type);
    } catch (err) {
        alert('Failed to generate report: ' + err.message);
    }
}

async function generateCustomRangeReport() {
    const start = document.getElementById('reportStartDate').value;
    const end = document.getElementById('reportEndDate').value;

    if (!start || !end) {
        alert('Please select both start date and end date.');
        return;
    }

    try {
        await window.sosReport.generateReport('range', { startDate: start, endDate: end });
    } catch (err) {
        alert('Failed to generate range report: ' + err.message);
    }
}

async function generateIndividualSosReport(sosId) {
    try {
        await window.sosReport.generateReport('individual', { sosId });
    } catch (err) {
        alert('Failed to generate SOS report: ' + err.message);
    }
}

// ==================== PERSONAL PROFILE CONTROLLER ====================
async function loadProfileData() {
    const session = await window.sosAuth.getSession();
    if (!session) return;

    const profile = await window.sosDB.getProfile(session.email) || {};

    document.getElementById('profName').value = profile.name || session.name || '';
    document.getElementById('profEmail').value = session.email;
    document.getElementById('profPhone').value = profile.phone || session.phone || '';
    document.getElementById('profDob').value = profile.dob || '';
    document.getElementById('profBlood').value = profile.bloodGroup || 'Unknown';
    document.getElementById('profAddress').value = profile.address || '';

    const largeImg = document.getElementById('profileAvatarImg');
    const largeLetter = document.getElementById('profileAvatarLetter');
    if (profile.photo) {
        largeImg.src = profile.photo;
        largeImg.classList.remove('hidden');
        largeLetter.classList.add('hidden');
    } else {
        largeLetter.textContent = (profile.name || session.name || 'U').charAt(0).toUpperCase();
        largeLetter.classList.remove('hidden');
        largeImg.classList.add('hidden');
    }
}

async function handleProfileSave(event) {
    event.preventDefault();
    const session = await window.sosAuth.getSession();
    if (!session) return;

    const name = document.getElementById('profName').value.trim();
    const phone = document.getElementById('profPhone').value.trim();
    const dob = document.getElementById('profDob').value;
    const bloodGroup = document.getElementById('profBlood').value;
    const address = document.getElementById('profAddress').value.trim();

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
        alert('Please enter a valid 10-digit mobile number.');
        return;
    }

    const existingProfile = await window.sosDB.getProfile(session.email) || {};

    const updatedProfile = {
        ...existingProfile,
        userEmail: session.email,
        name: name,
        phone: cleanPhone,
        dob: dob,
        bloodGroup: bloodGroup,
        address: address,
        photo: existingProfile.photo || '',
        updatedAt: new Date().toISOString()
    };

    await window.sosDB.saveProfile(updatedProfile);

    // Update session user name/phone
    session.name = name;
    session.phone = cleanPhone;
    await window.sosAuth.setSession(session);

    const msg = document.getElementById('profileSaveMsg');
    msg.textContent = 'Profile updated and saved permanently!';
    msg.className = 'alert-box success';
    msg.classList.remove('hidden');

    setTimeout(() => {
        msg.classList.add('hidden');
        loadDashboardData();
    }, 1500);
}

function handlePhotoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file.');
        return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
        const base64Data = e.target.result;
        await saveProfilePhoto(base64Data);
    };
    reader.readAsDataURL(file);
}

async function capturePhotoNative() {
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Camera) {
        try {
            const image = await window.Capacitor.Plugins.Camera.getPhoto({
                quality: 85,
                allowEditing: true,
                resultType: 'base64'
            });
            const base64Data = `data:image/jpeg;base64,${image.base64String}`;
            await saveProfilePhoto(base64Data);
            return;
        } catch (capErr) {
            console.warn('Capacitor camera failed or cancelled:', capErr);
        }
    }
    // Fallback to trigger file input with capture
    document.getElementById('profilePhotoInput').click();
}

async function saveProfilePhoto(base64Data) {
    const session = await window.sosAuth.getSession();
    if (!session) return;

    const profile = await window.sosDB.getProfile(session.email) || {
        userEmail: session.email,
        name: session.name,
        phone: session.phone
    };

    profile.photo = base64Data;
    profile.updatedAt = new Date().toISOString();
    await window.sosDB.saveProfile(profile);

    await loadProfileData();
    await loadDashboardData();
}

// ==================== SETTINGS & MOTION CONTROLLER ====================
async function loadSettings() {
    const session = await window.sosAuth.getSession();
    if (!session) return;

    const settings = await window.sosDB.getSettings(session.email);
    document.getElementById('settingShakeToggle').checked = settings.shakeDetectionEnabled;
    document.getElementById('settingSirenToggle').checked = settings.sirenSoundEnabled;
    document.getElementById('settingCountdownSelect').value = settings.countdownDuration || 5;

    const shakeBadge = document.getElementById('shakeStatusBadge');
    if (shakeBadge) {
        shakeBadge.textContent = `Shake Alert: ${settings.shakeDetectionEnabled ? 'ON' : 'OFF'}`;
        shakeBadge.style.opacity = settings.shakeDetectionEnabled ? '1' : '0.5';
    }
}

async function toggleShakeSetting(enabled) {
    const session = await window.sosAuth.getSession();
    if (!session) return;

    const settings = await window.sosDB.getSettings(session.email);
    settings.shakeDetectionEnabled = enabled;
    await window.sosDB.saveSettings(settings);

    if (enabled) {
        window.sosMotion.startListening();
    } else {
        window.sosMotion.stopListening();
    }

    const shakeBadge = document.getElementById('shakeStatusBadge');
    if (shakeBadge) {
        shakeBadge.textContent = `Shake Alert: ${enabled ? 'ON' : 'OFF'}`;
        shakeBadge.style.opacity = enabled ? '1' : '0.5';
    }
}

async function toggleSirenSetting(enabled) {
    const session = await window.sosAuth.getSession();
    if (!session) return;

    const settings = await window.sosDB.getSettings(session.email);
    settings.sirenSoundEnabled = enabled;
    await window.sosDB.saveSettings(settings);
}

async function updateCountdownSetting(seconds) {
    const session = await window.sosAuth.getSession();
    if (!session) return;

    const settings = await window.sosDB.getSettings(session.email);
    settings.countdownDuration = Number(seconds);
    await window.sosDB.saveSettings(settings);
}

function initMotionDetection() {
    window.sosMotion.init(() => {
        // Shaking detected - trigger SOS countdown
        initiateSosProcess();
    }, { threshold: 18, enabled: true });
}

// Helper to prevent XSS in dynamic renders
function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
