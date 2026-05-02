/* ═══════════════════════════════════════════════════════════════════════════
   Snowzen — Healthy Life Assistant  |  script.js
   ─────────────────────────────────────────────────────────────────────────
   "Database" layer  →  localStorage
     vitality_accounts  : { [username]: hashedPassword }
     vitality_user      : currently logged-in username
     vitality_data_<u>  : full UserData object for user <u>
   ═══════════════════════════════════════════════════════════════════════ */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    updatePassword,
    EmailAuthProvider,
    reauthenticateWithCredential,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getDatabase, ref, get, set } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { getMessaging, onMessage } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyAgzlL-gFdky4ZfXdkJlvT8vuTQbuE0iuE",
    authDomain: "snowzen-ef591.firebaseapp.com",
    databaseURL: "https://snowzen-ef591-default-rtdb.firebaseio.com",
    projectId: "snowzen-ef591",
    storageBucket: "snowzen-ef591.firebasestorage.app",
    messagingSenderId: "17525600938",
    appId: "1:17525600938:web:4e61cffcc998c16f6d56d3",
    measurementId: "G-M5QPPRHDM1"
};

// Initialize Firebase & Analytics
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Auth & Firestore so the rest of your app can use them
const auth = getAuth(app);
const db = getDatabase(app);
const messaging = getMessaging(app);
const functions = getFunctions(app);
const googleProvider = new GoogleAuthProvider();

"use strict";

/* ── global state ──────────────────────────────────────────────────────── */
let currentUser  = null;
let editingTaskId = null;
let chartView    = "pie";

const NAV_MOBILE_BREAKPOINT = 720;

const reminderState = {
    dayKey       : "",
    firedEvents  : new Set(),
    intervalId   : null,
    activeReminder: null
};

/* ── theme palette map ─────────────────────────────────────────────────── */
const themeOptions = {
    emerald: {
        label : "Emerald",
        colors: ["#2f9e44","#4bc76b","#7ad66f","#b5e48c","#95d5b2","#52b788","#40916c","#74c69d"]
    },
    midnight: {
        label : "Midnight",
        colors: ["#58a6ff","#7dc0ff","#3b82f6","#38bdf8","#60a5fa","#2563eb","#8ec5ff","#0ea5e9"]
    },
    sunset: {
        label : "Sunset",
        colors: ["#f26b3a","#fb923c","#f97316","#fdba74","#ff8c61","#f59e0b","#fca5a5","#fb7185"]
    },
    lavender: {
        label : "Lavender",
        colors: ["#7c5cff","#9b87f5","#8b5cf6","#c4b5fd","#a78bfa","#7c3aed","#d8b4fe","#818cf8"]
    },
    "cotton-candy": {
        label : "Pink Blue",
        colors: ["#ff5fa2","#8dd6ff","#ff89bd","#6ebcff","#ffb0cf","#92e0ff","#ff77c8","#5fa8ff"]
    }
};

/* ── default healthy schedule ──────────────────────────────────────────── */
const defaultSchedule = [
    { id:"default-sleep",     startTime:"22:00", endTime:"06:00", name:"Sleep",             agenda:"8 hours of restorative sleep" },
    { id:"default-hydrate",   startTime:"06:00", endTime:"06:30", name:"Wake Up & Hydrate", agenda:"Drink 500 ml of water" },
    { id:"default-exercise",  startTime:"06:30", endTime:"07:30", name:"Exercise",           agenda:"30 mins of cardio or yoga" },
    { id:"default-breakfast", startTime:"07:30", endTime:"08:00", name:"Healthy Breakfast",  agenda:"High protein, low sugar" },
    { id:"default-lunch",     startTime:"13:00", endTime:"14:00", name:"Lunch & Walk",       agenda:"Balanced meal and 15 min walk" },
    { id:"default-dinner",    startTime:"18:00", endTime:"19:00", name:"Dinner",             agenda:"Light meal, finish 3 hours before bed" },
    { id:"default-detox",     startTime:"21:00", endTime:"22:00", name:"Digital Detox",      agenda:"No screens, read a book" }
];

let userData = getDefaultUserData();

/* ════════════════════════════════════════════════════════════════════════
   BOOT
════════════════════════════════════════════════════════════════════════ */
function boot() {
    // Register the Service Worker for offline caching
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./firebase-messaging-sw.js')
            .catch(err => console.error('Service Worker registration failed:', err));
    }

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUser = user.displayName ? user.displayName.split(' ')[0] : (user.email ? user.email.split('@')[0] : 'User');
            await loadUserData();
            showApp();
            hideLoadingScreen();
        } else {
            currentUser = null;
            applyTheme(userData.profile.theme);
            document.getElementById("app-container").classList.remove("active");
            document.getElementById("login-page").classList.add("active");
            hideLoadingScreen();
        }
    });

    initializeNavbar();
    startReminderLoop();
    requestNotificationPermission();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
} else {
    boot();
}

window.addEventListener("resize", handleViewportChange);

/* ════════════════════════════════════════════════════════════════════════
   PWA INSTALLATION
════════════════════════════════════════════════════════════════════════ */
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later.
    deferredPrompt = e;
    // Update UI to notify the user they can add to home screen
    const installBtn = document.getElementById('install-app-btn');
    if (installBtn) installBtn.classList.remove('hidden');
});

async function installPWA() {
    if (!deferredPrompt) return;
    // Show the native install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
        const installBtn = document.getElementById('install-app-btn');
        if (installBtn) installBtn.classList.add('hidden');
    }
    // We've used the prompt, and can't use it again, throw it away
    deferredPrompt = null;
}

/* ════════════════════════════════════════════════════════════════════════
   AUTH  UI
════════════════════════════════════════════════════════════════════════ */

/** Switch between the Sign-In and Register tab panels */
function switchAuthTab(tab) {
    const isLogin = tab === "login";

    document.getElementById("tab-login").classList.toggle("active", isLogin);
    document.getElementById("tab-register").classList.toggle("active", !isLogin);
    document.getElementById("tab-login").setAttribute("aria-selected", String(isLogin));
    document.getElementById("tab-register").setAttribute("aria-selected", String(!isLogin));

    document.getElementById("auth-login-panel").classList.toggle("hidden", !isLogin);
    document.getElementById("auth-register-panel").classList.toggle("hidden", isLogin);

    document.getElementById("login-msg").innerText    = "";
    document.getElementById("register-msg").innerText = "";
}

/** Handle the Register form submission */
async function register() {
    const email     = document.getElementById("reg-email").value.trim();
    const password  = document.getElementById("reg-password").value;
    const password2 = document.getElementById("reg-password2").value;
    const msgEl     = document.getElementById("register-msg");

    if (!email || !password || !password2) {
        showAuthMsg(msgEl, "Please fill in all fields.", true);
        return;
    }
    if (!email.includes("@")) {
        showAuthMsg(msgEl, "Please enter a valid email address.", true);
        return;
    }
    if (password.length < 6) {
        showAuthMsg(msgEl, "Password must be at least 6 characters.", true);
        return;
    }
    if (password !== password2) {
        showAuthMsg(msgEl, "Passwords do not match.", true);
        return;
    }

    try {
        showAuthMsg(msgEl, "Creating account...", false);
        showLoadingScreen("Creating your account...");
        await createUserWithEmailAndPassword(auth, email, password);
        showAuthMsg(msgEl, "Account created! Signing you in…", false);
        document.getElementById("reg-password").value  = "";
        document.getElementById("reg-password2").value = "";
    } catch (error) {
        hideLoadingScreen();
        console.error("Register Error:", error);
        showAuthMsg(msgEl, error.message, true);
    }
}

/** Handle the Login form submission */
async function login() {
    const email    = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;
    const msgEl    = document.getElementById("login-msg");

    if (!email || !password) {
        showAuthMsg(msgEl, "Please enter your email and password.", true);
        return;
    }

    try {
        showAuthMsg(msgEl, "Signing in...", false);
        showLoadingScreen("Authenticating...");
        await signInWithEmailAndPassword(auth, email, password);
        document.getElementById("login-password").value = "";
    } catch (error) {
        hideLoadingScreen();
        console.error("Login Error:", error);
        showAuthMsg(msgEl, "Invalid email or password.", true);
    }
}

/** Handle Google Sign-In */
async function loginWithGoogle(source = 'login') {
    const msgEl = document.getElementById(source === 'register' ? 'register-msg' : 'login-msg');
    try {
        showAuthMsg(msgEl, "Redirecting to Google...", false);
        showLoadingScreen("Connecting to Google...");
        await signInWithPopup(auth, googleProvider);
        // Note: onAuthStateChanged handles routing to the app automatically!
    } catch (error) {
        hideLoadingScreen();
        console.error("Google Auth Error:", error);
        showAuthMsg(msgEl, error.message, true);
    }
}

function showAuthMsg(el, text, isError = false) {
    el.innerText = text;
    el.classList.toggle("error", isError);
}

function showLoadingScreen(msg = "Loading...") {
    const loader = document.getElementById("global-loader");
    const loaderMsg = document.getElementById("loader-msg");
    if (loaderMsg) loaderMsg.innerText = msg;
    if (loader) loader.classList.remove("hide");
}

function hideLoadingScreen() {
    const loader = document.getElementById("global-loader");
    if (loader) loader.classList.add("hide");
}

/** Handle the Change Password form in Profile */
async function changePassword() {
    const current  = document.getElementById("pw-current").value;
    const next     = document.getElementById("pw-new").value;
    const confirm  = document.getElementById("pw-confirm").value;
    const msgEl    = document.getElementById("pw-msg");

    if (!current || !next || !confirm) {
        showAuthMsg(msgEl, "Please fill in all password fields.", true);
        return;
    }
    if (next.length < 6) {
        showAuthMsg(msgEl, "New password must be at least 6 characters.", true);
        return;
    }
    if (next !== confirm) {
        showAuthMsg(msgEl, "New passwords do not match.", true);
        return;
    }

    try {
        const user = auth.currentUser;
        if (!user) throw new Error("Not logged in.");

        if (user.providerData.some(p => p.providerId === 'google.com')) {
            throw new Error("Google Sign-In users cannot change passwords here.");
        }
        
        const credential = EmailAuthProvider.credential(user.email, current);
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, next);

        document.getElementById("pw-current").value = "";
        document.getElementById("pw-new").value     = "";
        document.getElementById("pw-confirm").value = "";
        showAuthMsg(msgEl, "Password updated successfully!", false);

        setTimeout(() => { if (msgEl) msgEl.innerText = ""; }, 3000);
    } catch (error) {
        showAuthMsg(msgEl, error.message, true);
    }
}

/* ════════════════════════════════════════════════════════════════════════
   SESSION / DATA
════════════════════════════════════════════════════════════════════════ */

function getDefaultUserData() {
    return {
        profile    : { name: "", age: "", goal: "", theme: "emerald", avatar: "" },
        tasks      : normalizeTasks(defaultSchedule),
        activityLog: [],
        events     : []
    };
}

function showLogoutModal() {
    const modal = document.getElementById("logout-modal");
    if (modal) modal.classList.add("active");
}

function hideLogoutModal() {
    const modal = document.getElementById("logout-modal");
    if (modal) modal.classList.remove("active");
}

async function logout() {
    hideLogoutModal();

    try {
        await signOut(auth);
        currentUser   = null;
        editingTaskId = null;

        userData = getDefaultUserData();
        resetReminderState();
        hideReminderPopup();
        resetTaskForm();

    /* Clear auth fields */
    ["login-email","login-password","reg-email","reg-password","reg-password2"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "";
    });
    ["login-msg","register-msg"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerText = "";
        });
        switchAuthTab("login");
    } catch (err) {
        console.error("Error logging out", err);
    }
}

async function loadUserData() {
    if (!auth.currentUser) return;
    try {
        const dbRef = ref(db, "users/" + auth.currentUser.uid);
        const snapshot = await get(dbRef);
        const defaults = getDefaultUserData();

        if (snapshot.exists()) {
            const parsed = snapshot.val();
            userData = {
                profile    : { ...defaults.profile, ...(parsed.profile || {}) },
                    tasks      : normalizeTasks(Array.isArray(parsed.tasks) ? parsed.tasks : defaults.tasks),
                activityLog: Array.isArray(parsed.activityLog) ? parsed.activityLog : [],
                events     : Array.isArray(parsed.events) ? parsed.events : []
            };
        } else {
            userData = defaults;
            await saveData(); // Immediately store default pre-existing tasks into the database
        }
    } catch (error) {
        console.error("Error loading user data:", error);
            userData = getDefaultUserData(); // Fallback so app doesn't break
        } finally {
            // Always render UI so the screen isn't left blank if database fails
            document.getElementById("profile-name").value = userData.profile.name || currentUser;
            document.getElementById("profile-age").value  = userData.profile.age  || "";
            document.getElementById("profile-goal").value = userData.profile.goal || "";
            const profilePreview = document.getElementById("profile-pic-preview");
            if (profilePreview) profilePreview.src = userData.profile.avatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png";
            applyTheme(userData.profile.theme);
            updateThemeSelection(userData.profile.theme);
            resetTaskForm();
            renderDashboard();
            renderCustomTasks();
            renderEvents();
            renderCalendar();
            updateCalendarBadge();
            checkTaskReminders();
    }
}

/** Persist the current user's data to Realtime Database */
async function saveData() {
    if (!auth.currentUser) return false;
    try {
        await set(ref(db, "users/" + auth.currentUser.uid), userData);
        return true;
    } catch (error) {
        console.error("Error saving user data:", error);
        return false;
    }
}

function showApp() {
    document.getElementById("login-page").classList.remove("active");
    document.getElementById("app-container").classList.add("active");
    handleViewportChange();
    switchView("dashboard");
}

/* ════════════════════════════════════════════════════════════════════════
   NAVIGATION
════════════════════════════════════════════════════════════════════════ */

function switchView(viewId) {
    document.querySelectorAll(".content-view").forEach(v => v.classList.remove("active"));
    document.getElementById(viewId).classList.add("active");

    document.querySelectorAll(".nav-btn[data-view]").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.view === viewId);
    });

    if (window.innerWidth <= NAV_MOBILE_BREAKPOINT) setNavbarOpen(false);
}

function initializeNavbar() {
    setNavbarOpen(window.innerWidth > NAV_MOBILE_BREAKPOINT);
}

function handleViewportChange() {
    if (window.innerWidth > NAV_MOBILE_BREAKPOINT) setNavbarOpen(true);
}

function toggleNavbar() {
    const navbar = document.getElementById("navbar");
    if (!navbar) return;
    setNavbarOpen(!navbar.classList.contains("is-open"));
}

function setNavbarOpen(isOpen) {
    const navbar     = document.getElementById("navbar");
    const navToggle  = document.getElementById("nav-toggle");
    if (!navbar || !navToggle) return;
    navbar.classList.toggle("is-open", isOpen);
    navToggle.setAttribute("aria-expanded", String(isOpen));
}

/* ════════════════════════════════════════════════════════════════════════
   DASHBOARD RENDERING
════════════════════════════════════════════════════════════════════════ */

function renderDashboard() {
    const sortedTasks    = getSortedTasks();
    const taskSegments   = getTaskSegments(sortedTasks);
    renderActivityTimeline(taskSegments);
    renderDayChart(taskSegments);
    renderDashboardStats(taskSegments);
}

function getSortedTasks() {
    return normalizeTasks(userData.tasks);
}

function getTaskSegments(sortedTasks) {
    const palette = themeOptions[userData.profile.theme]?.colors || themeOptions.emerald.colors;
    return sortedTasks.map((task, index) => {
        const nextTask = sortedTasks[(index + 1) % sortedTasks.length];
        return {
            taskId         : task.id,
            startTime      : task.startTime,
            endTime        : task.endTime,
            name           : task.name,
            agenda         : task.agenda,
            durationMinutes: getDurationMinutes(task.startTime, task.endTime),
            color          : palette[index % palette.length],
            nextTaskName   : nextTask ? nextTask.name : task.name
        };
    });
}

function renderDayChart(taskSegments) {
    const chartActiveView = document.getElementById("chart-active-view");
    const chartLayout     = document.getElementById("chart-layout");
    const detailPanel     = document.getElementById("chart-detail-panel");
    const totalLabel      = document.getElementById("day-total");
    const plannedMinutes  = taskSegments.reduce((t, s) => t + s.durationMinutes, 0);

    if (chartLayout) chartLayout.classList.toggle("expanded-view", chartView !== "pie");

    if (!taskSegments.length) {
        chartActiveView.innerHTML = '<div class="detail-note">Add tasks to see your chart.</div>';
        detailPanel.innerHTML     = '<p class="success-msg">Add tasks to see your full-day chart.</p>';
        totalLabel.textContent    = "0h planned";
        updateChartViewUI();
        return;
    }

    /* Build Interactive SVG Pie Chart segments */
    let cumulativePercent = 0;
    const svgPaths = taskSegments.map(s => {
        const percent = s.durationMinutes / plannedMinutes;
        if (percent === 1) {
            return `<circle cx="0" cy="0" r="1" fill="${s.color}" class="pie-slice" data-task-id="${s.taskId}" data-task-name="${s.name}" data-task-dur="${formatDuration(s.durationMinutes)}"></circle>`;
        }
        const startX = Math.cos(2 * Math.PI * cumulativePercent - Math.PI / 2);
        const startY = Math.sin(2 * Math.PI * cumulativePercent - Math.PI / 2);
        cumulativePercent += percent;
        const endX = Math.cos(2 * Math.PI * cumulativePercent - Math.PI / 2);
        const endY = Math.sin(2 * Math.PI * cumulativePercent - Math.PI / 2);
        const largeArcFlag = percent > 0.5 ? 1 : 0;
        
        const d = `M 0 0 L ${startX} ${startY} A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY} Z`;
        return `<path d="${d}" fill="${s.color}" class="pie-slice" data-task-id="${s.taskId}" data-task-name="${s.name}" data-task-dur="${formatDuration(s.durationMinutes)}"></path>`;
    }).join("");

    if (chartView === "pie") {
        chartActiveView.innerHTML = `
            <div class="pie-chart-wrap">
                <svg viewBox="-1.05 -1.05 2.1 2.1" class="interactive-pie" aria-label="24-hour pie chart">
                    ${svgPaths}
                </svg>
                <div class="chart-center" id="pie-center-display">
                    <strong>${formatDuration(plannedMinutes)}</strong>
                    <span>Planned</span>
                </div>
            </div>`;

        // Add interactivity to the pie slices
        const defaultCenter = `<strong>${formatDuration(plannedMinutes)}</strong><span>Planned</span>`;
        document.querySelectorAll('.pie-slice').forEach(slice => {
            const handleInteract = (e) => {
                e.target.parentNode.appendChild(e.target); // Bring slice to front for scaling effect
                const name = e.target.getAttribute('data-task-name');
                const dur = e.target.getAttribute('data-task-dur');
                document.getElementById('pie-center-display').innerHTML = `
                    <strong style="font-size: 1rem; line-height: 1.15; margin-bottom: 0.15rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; padding: 0 0.5rem; text-align: center;">${name}</strong>
                    <span>${dur}</span>
                `;
            };
            slice.addEventListener('mouseenter', handleInteract);
            slice.addEventListener('touchstart', handleInteract, {passive: true});
            
            const handleLeave = () => {
                document.getElementById('pie-center-display').innerHTML = defaultCenter;
            };
            slice.addEventListener('mouseleave', handleLeave);
            slice.addEventListener('touchend', handleLeave);
            
            slice.addEventListener('click', (e) => {
                const taskId = e.target.getAttribute('data-task-id');
                if (taskId) editTask(taskId);
            });
        });

    } else if (chartView === "table") {
        chartActiveView.innerHTML = `
            <div class="chart-table">
                ${taskSegments.map(s => `
                    <div class="chart-table-row">
                        <div>
                            <strong>${s.name}</strong>
                            <span>${s.startTime} to ${s.endTime}</span>
                        </div>
                        <strong>${formatDuration(s.durationMinutes)}</strong>
                        <span>Task</span>
                    </div>`).join("")}
            </div>`;
    }

    detailPanel.innerHTML = chartView === "pie"
        ? `<div class="chart-legend">${taskSegments.map(s => `
            <div class="legend-item">
                <span class="legend-color" style="background:${s.color};"></span>
                <div class="legend-label">
                    <strong>${s.name}</strong>
                    <span>${s.startTime} to ${s.endTime}</span>
                </div>
                <span class="legend-time">${formatDuration(s.durationMinutes)}</span>
            </div>`).join("")}</div>`
        : `<div class="detail-note">${getChartModeNote(chartView)}</div>`;

    totalLabel.textContent = `${formatDuration(plannedMinutes)} planned`;
    updateChartViewUI();
}

function renderDashboardStats(taskSegments) {
    const stats          = document.getElementById("dashboard-stats");
    const currentMinutes = getCurrentMinuteFloat();

    const currentTask    = taskSegments.find(t => {
        const start = timeToMinutes(t.startTime);
        const end = timeToMinutes(t.endTime);
        if (start <= end) return currentMinutes >= start && currentMinutes < end;
        return currentMinutes >= start || currentMinutes < end; // Handles overnight tasks
    }) || null;

    let progressHtml = "";
    if (currentTask) {
        const start = timeToMinutes(currentTask.startTime);
        let elapsed = currentMinutes - start;
        if (elapsed < 0) elapsed += 1440; // overnight handling
        const pct = Math.min(100, Math.max(0, (elapsed / currentTask.durationMinutes) * 100));
        const left = Math.ceil(currentTask.durationMinutes - elapsed);

        progressHtml = `
            <div class="current-progress-wrap">
                <div class="current-progress-track">
                    <div class="current-progress-fill" style="width:${pct}%;background:${currentTask.color};"></div>
                </div>
                <div class="progress-time-left">${left}m remaining</div>
            </div>`;
    }

    const nextTask       = taskSegments.find(t => timeToMinutes(t.startTime) > currentMinutes) || taskSegments[0] || null;
    const longestTask    = taskSegments.reduce((best, s) =>
        (!best || s.durationMinutes > best.durationMinutes) ? s : best, null);

    const plannedMinutes = taskSegments.reduce((sum, s) => sum + s.durationMinutes, 0);
    const unscheduledMin = Math.max(0, 1440 - plannedMinutes);

    // Calculate Next Event
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    const upcomingEvents = (userData.events || [])
        .map(ev => {
            const effDateStr = getNextOccurrence(ev, today);
            const evDate = new Date(effDateStr + 'T00:00:00');
            const diffDays = Math.ceil((evDate - today) / (1000 * 60 * 60 * 24));
            return { ...ev, diffDays };
        })
        .filter(ev => ev.diffDays >= 0)
        .sort((a, b) => a.diffDays - b.diffDays);
        
    const nextEvent = upcomingEvents[0];
    const nextEventText = nextEvent ? `${nextEvent.title} · ${nextEvent.diffDays === 0 ? "Today!" : nextEvent.diffDays === 1 ? "Tomorrow" : "In " + nextEvent.diffDays + " days"}` : "No upcoming events";

    const eventHighlightClass = (nextEvent && nextEvent.diffDays <= 1) ? "highlight-event" : "";

    stats.innerHTML = `
        <div class="stat-card" style="animation-delay: 0s;">
            <span>Current activity</span>
            <strong>${currentTask ? currentTask.name : "Free Time"}</strong>
            ${progressHtml}
        </div>
        <div class="stat-card" style="animation-delay: 0.05s;">
            <span>Next up</span>
            <strong>${nextTask ? `${nextTask.startTime} ${nextTask.name}` : "None"}</strong>
        </div>
        <div class="stat-card" style="animation-delay: 0.1s;">
            <span>Unscheduled</span>
            <strong>${formatDuration(unscheduledMin)} free</strong>
        </div>
        <div class="stat-card" style="animation-delay: 0.15s;">
            <span>Total planned</span>
            <strong>${taskSegments.length} tasks</strong>
        </div>
        <div class="stat-card" style="animation-delay: 0.2s;">
            <span>Longest block</span>
            <strong>${longestTask ? `${longestTask.name} (${formatDuration(longestTask.durationMinutes)})` : "N/A"}</strong>
        </div>
        <div class="stat-card ${eventHighlightClass}" style="animation-delay: 0.25s;">
            <span>Next Event</span>
            <strong>${nextEventText}</strong>
        </div>`;
}

/* ════════════════════════════════════════════════════════════════════════
   TASK CRUD
════════════════════════════════════════════════════════════════════════ */

function saveTask() {
    const startTime = document.getElementById("task-start-time").value;
    const endTime   = document.getElementById("task-end-time").value;
    const name      = document.getElementById("task-name").value.trim();
    const agenda    = document.getElementById("task-agenda").value.trim();
    const errMsg    = validateTaskForm(startTime, endTime, name, editingTaskId);

    if (errMsg) { setTaskFormMessage(errMsg, true); return; }

    const payload = { id: editingTaskId || generateTaskId(), startTime, endTime, name, agenda };

    if (editingTaskId) {
        const idx = userData.tasks.findIndex(t => t.id === editingTaskId);
        if (idx >= 0) userData.tasks[idx] = payload;
        setTaskFormMessage("Task updated.");
    } else {
        userData.tasks.push(payload);
        setTaskFormMessage("Task added.");
    }

    userData.tasks = normalizeTasks(userData.tasks);
    saveData();
    renderDashboard();
    renderCustomTasks();
    checkTaskReminders();
    resetTaskForm(true);
}

function renderCustomTasks() {
    const list = document.getElementById("custom-task-list");
    if (!list) return;
    list.innerHTML = "";
    const tasks = getSortedTasks();
    const taskSegments = getTaskSegments(tasks); // Gets theme colors for each task
    
    if (!taskSegments.length) {
        list.innerHTML = '<li style="justify-content: center; color: var(--muted); padding: 2.5rem 1rem; text-align: center; border: 1px dashed var(--border); background: var(--surface-alt);">No tasks planned. Add a task above to build your schedule!</li>';
        return;
    }

    taskSegments.forEach((task, index) => {
        const li = document.createElement("li");
        li.style.animationDelay = `${index * 0.05}s`;
        li.innerHTML = `
            <div style="position: absolute; left: 0; top: 0; bottom: 0; width: 6px; background-color: ${task.color};"></div>
            <div class="task-details" style="padding-left: 0.4rem;">
                <div style="display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap; margin-bottom: 0.3rem;">
                    <strong style="font-size: 1.05rem; line-height: 1;">${task.name}</strong>
                    <span class="stat-chip" style="background: ${task.color}22; color: ${task.color}; padding: 0.15rem 0.5rem; font-size: 0.75rem; line-height: 1; border: 1px solid ${task.color}44;">${task.startTime} — ${task.endTime}</span>
                </div>
                <span class="task-meta">${task.agenda || "No details added yet"}</span>
            </div>
            <div class="task-controls">
                <button type="button" class="edit-btn" onclick="editTask('${task.taskId}')" title="Edit">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    Edit
                </button>
                <button type="button" class="delete-btn" onclick="deleteTask('${task.taskId}')" title="Remove">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    Remove
                </button>
            </div>`;
        list.appendChild(li);
    });
}

function editTask(taskId) {
    const task = userData.tasks.find(t => t.id === taskId);
    if (!task) return;
    editingTaskId = taskId;
    document.getElementById("task-start-time").value  = task.startTime;
    document.getElementById("task-end-time").value    = task.endTime;
    document.getElementById("task-name").value        = task.name;
    document.getElementById("task-agenda").value      = task.agenda || "";
    document.getElementById("task-form-title").innerText  = "Edit Task";
    document.getElementById("task-submit-btn").innerText  = "Save Changes";
    document.getElementById("task-cancel-btn").classList.remove("hidden");
    setTaskFormMessage("Editing selected task.");
    switchView("edit-day");
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function cancelTaskEdit() { resetTaskForm(); }

function deleteTask(taskId) {
    userData.tasks       = userData.tasks.filter(t => t.id !== taskId);
    userData.activityLog = userData.activityLog.filter(e => e.taskId !== taskId);
    if (editingTaskId === taskId) resetTaskForm();
    saveData();
    renderDashboard();
    renderCustomTasks();
    checkTaskReminders();
}

function resetTaskForm(keepMessage = false) {
    editingTaskId = null;
    ["task-start-time","task-end-time","task-name","task-agenda"].forEach(id => {
        document.getElementById(id).value = "";
    });
    document.getElementById("task-form-title").innerText  = "Add Task";
    document.getElementById("task-submit-btn").innerText  = "Add Task";
    document.getElementById("task-cancel-btn").classList.add("hidden");
    if (!keepMessage) setTaskFormMessage("");
}

function setTaskFormMessage(message, isError = false) {
    const el = document.getElementById("task-form-msg");
    if (!el) return;
    el.innerText = message;
    el.classList.toggle("error", isError);
}

function validateTaskForm(startTime, endTime, name, excludeTaskId = null) {
    if (!startTime || !endTime || !name) {
        return "Please fill in start time, end time, and task name.";
    }
    if (startTime === endTime) {
        return "Start time and end time cannot be the same.";
    }
    const candidate = { id: excludeTaskId || "__candidate__", startTime, endTime, name };
    const conflict  = userData.tasks.find(t => t.id !== excludeTaskId && tasksOverlap(candidate, t));
    if (conflict) {
        return `This time overlaps with "${conflict.name}" (${conflict.startTime}–${conflict.endTime}).`;
    }
    return "";
}

/* ════════════════════════════════════════════════════════════════════════
   CALENDAR EVENTS
════════════════════════════════════════════════════════════════════════ */

let currentCalDate = new Date();

function renderCalendar() {
    const year = currentCalDate.getFullYear();
    const month = currentCalDate.getMonth();

    document.getElementById("calendar-month-year").innerText =
        new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' });

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const grid = document.getElementById("calendar-days");
    if (!grid) return;
    grid.innerHTML = "";

    const todayStr = getTodayKey();

    // Empty slots for previous month offset
    for (let i = 0; i < firstDay; i++) {
        grid.innerHTML += `<div class="cal-day empty"></div>`;
    }

    // Generate Days
    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const refDateObj = new Date(dateStr + 'T00:00:00');
        const eventsToday = (userData.events || []).filter(e => getNextOccurrence(e, refDateObj) === dateStr);
        const isToday = dateStr === todayStr;

        let labelsHtml = "";
        if (eventsToday.length > 0) {
            const labelElements = eventsToday.map(ev => {
                return `<div class="cal-event-label ${getEventBadgeClass(ev.type)}">${ev.title}</div>`;
            }).join("");
            labelsHtml = `<div class="cal-events">${labelElements}</div>`;
        }

        grid.innerHTML += `
            <div class="cal-day ${isToday ? 'today' : ''} ${eventsToday.length > 0 ? 'has-event' : ''}" onclick="selectCalendarDate('${dateStr}')">
                <span class="cal-date-num">${d}</span>
                ${labelsHtml}
            </div>
        `;
    }
}

function changeMonth(offset) {
    currentCalDate.setMonth(currentCalDate.getMonth() + offset);
    renderCalendar();
}

function selectCalendarDate(dateStr) {
    document.getElementById("event-date").value = dateStr;
    document.getElementById("event-title").focus();
    // Optional smooth scroll to form
    document.getElementById("event-date").scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function saveEvent() {
    const date  = document.getElementById("event-date").value;
    const title = document.getElementById("event-title").value.trim();
    const type  = document.getElementById("event-type").value.trim();
    const recurrence = document.getElementById("event-recurrence").value;
    const msgEl = document.getElementById("event-form-msg");

    if (!date || !title || !type) {
        if (msgEl) { msgEl.innerText = "Please fill in all event details."; msgEl.classList.add("error"); }
        return;
    }

    const newEvent = {
        id: `event-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        date,
        title,
        type,
        recurrence
    };

    userData.events.push(newEvent);
    // Sort events chronologically
    userData.events.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    saveData();
    renderEvents();
    renderCalendar();
    updateCalendarBadge();

    document.getElementById("event-date").value = "";
    document.getElementById("event-title").value = "";
    document.getElementById("event-type").value = "";
    document.getElementById("event-recurrence").value = "once";
    if (msgEl) { msgEl.innerText = "Event added successfully!"; msgEl.classList.remove("error"); setTimeout(() => msgEl.innerText = "", 3000); }
}

function getEventBadgeClass(type) {
    const t = (type || "").toLowerCase();
    if (t.includes("birthday")) return "badge-birthday";
    if (t.includes("anniversar") || t.includes("wedding")) return "badge-anniversary";
    if (t.includes("meet") || t.includes("appointment") || t.includes("work")) return "badge-meeting";
    if (t.includes("exam") || t.includes("test")) return "badge-exam";
    if (t.includes("holiday") || t.includes("vacation") || t.includes("trip")) return "badge-holiday";
    return "badge-default";
}

function renderEvents() {
    const list = document.getElementById("events-list");
    if (!list) return;
    list.innerHTML = "";
    
    const filterEl = document.getElementById("event-filter");
    const filterValue = filterEl ? filterEl.value : "All";
    
    const monthFilterEl = document.getElementById("event-month-filter");
    const monthFilterValue = monthFilterEl ? monthFilterEl.value : "";
    
    const todayObj = new Date();
    let displayEvents = (userData.events || []).map(ev => {
        return { ...ev, displayDate: getNextOccurrence(ev, todayObj) };
    });

    if (filterValue !== "All") {
        displayEvents = displayEvents.filter(ev => ev.type === filterValue);
    }
    if (monthFilterValue) {
        displayEvents = displayEvents.filter(ev => ev.displayDate.startsWith(monthFilterValue));
    }

    displayEvents.sort((a, b) => new Date(a.displayDate) - new Date(b.displayDate));

    if (!displayEvents.length) {
        list.innerHTML = '<li style="justify-content: center; color: var(--muted); padding: 1.5rem;">No upcoming events found.</li>';
        return;
    }

    displayEvents.forEach((ev, index) => {
        const li = document.createElement("li");
        li.style.animationDelay = `${index * 0.05}s`;
        // Format date to a readable format (e.g., Dec 25, 2024)
        const dateObj = new Date(ev.displayDate + 'T00:00:00'); // Prevent timezone offset issues
        const dateString = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
        const badgeClass = getEventBadgeClass(ev.type);
        const recurrenceText = ev.recurrence === 'monthly' ? ' • ↻ Monthly' : ev.recurrence === 'yearly' ? ' • ↻ Yearly' : '';
        
        li.innerHTML = `
            <div class="task-details">
                <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                    <strong style="display: inline-block; margin: 0;">${ev.title}</strong>
                    <span class="event-badge ${badgeClass}">${ev.type}</span>
                </div>
                <span class="task-meta">${dateString}${recurrenceText}</span>
            </div>
            <div class="task-controls">
                <button type="button" class="delete-btn" onclick="deleteEvent('${ev.id}')">Remove</button>
            </div>`;
        list.appendChild(li);
    });
}

function deleteEvent(eventId) {
    userData.events = userData.events.filter(e => e.id !== eventId);
    saveData();
    renderEvents();
    renderCalendar();
    updateCalendarBadge();
}

function updateCalendarBadge() {
    const badge = document.getElementById("nav-calendar-badge");
    if (!badge) return;
    const todayObj = new Date();
    const todayStr = getTodayKey(todayObj);
    const todayEvents = (userData.events || []).filter(ev => getNextOccurrence(ev, todayObj) === todayStr);
    if (todayEvents.length > 0) {
        badge.innerText = todayEvents.length;
        badge.classList.remove("hidden");
    } else {
        badge.classList.add("hidden");
    }
}

/* ════════════════════════════════════════════════════════════════════════
   PROFILE
════════════════════════════════════════════════════════════════════════ */

async function saveProfile() {
    userData.profile.name  = document.getElementById("profile-name").value.trim();
    userData.profile.age   = document.getElementById("profile-age").value;
    userData.profile.goal  = document.getElementById("profile-goal").value.trim();
    userData.profile.theme = document.body.dataset.theme || userData.profile.theme;
    
    const msg = document.getElementById("profile-msg");
    if (msg) { msg.style.color = "var(--muted)"; msg.innerText = "Saving to Firebase..."; }
    
    const success = await saveData();
    
    if (msg && success) {
        msg.innerText = "Profile saved to Firebase successfully!";
        setTimeout(() => { if (msg.innerText.includes("successfully")) msg.innerText = ""; }, 3000);
    } else if (msg && !success) {
        msg.style.color = "#c83f3f";
        msg.innerText = "Error saving to database. Check connection or rules.";
    }
}

function handleProfilePicUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement("canvas");
            const MAX_WIDTH = 250;
            const MAX_HEIGHT = 250;
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
            } else {
                if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
            }
            canvas.width = width;
            canvas.height = height;
            
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, width, height);
            
            // Compress heavily to keep the Firestore doc perfectly safe
            userData.profile.avatar = canvas.toDataURL("image/jpeg", 0.7);
            
            const profilePreview = document.getElementById("profile-pic-preview");
            if (profilePreview) profilePreview.src = userData.profile.avatar;
            
            const msg = document.getElementById("profile-msg");
            if (msg) { msg.style.color = "var(--muted)"; msg.innerText = "Uploading picture to Firebase..."; }

            saveData().then(success => {
                if (msg && success) {
                    msg.innerText = "Profile picture saved to Firebase!";
                    setTimeout(() => { if (msg.innerText.includes("picture saved")) msg.innerText = ""; }, 3000);
                } else if (msg && !success) {
                    msg.style.color = "#c83f3f";
                    msg.innerText = "Error uploading picture.";
                }
            });
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

/* ════════════════════════════════════════════════════════════════════════
   ACTIVITY TIMELINE
════════════════════════════════════════════════════════════════════════ */

function renderActivityTimeline(taskSegments) {
    const timeline = document.getElementById("timeline");
    if (!timeline) return;
    const log = Array.isArray(userData.activityLog) ? userData.activityLog : [];

    if (!taskSegments.length) {
        timeline.innerHTML = '<div class="records-empty">No schedule or task records yet.</div>';
        return;
    }

    timeline.innerHTML = taskSegments.map(segment => {
        const latest     = getLatestTaskStatus(segment.taskId, log);
        const statusBadge = latest
            ? `<span class="record-badge ${latest.action}">${formatActionLabel(latest.action)}</span>`
            : '<span class="record-badge pending">Pending</span>';
        const statusMeta  = latest
            ? `${latest.summary} ${formatRecordTime(latest.loggedAt)}`
            : `Planned window: ${segment.startTime} to ${segment.endTime}`;

        return `
            <div class="timeline-entry schedule-entry">
                <div class="timeline-entry-main">
                    <div class="timeline-entry-row">
                        <strong>${segment.startTime}</strong>
                        <span>${segment.endTime}</span>
                        <span>${segment.name}</span>
                        ${statusBadge}
                    </div>
                    <small>${segment.agenda || "No details added yet"}</small>
                    <div class="timeline-entry-meta">${statusMeta}</div>
                </div>
            </div>`;
    }).join("");
}

/* ════════════════════════════════════════════════════════════════════════
   THEME
════════════════════════════════════════════════════════════════════════ */

function selectTheme(themeName) {
    const safe            = themeOptions[themeName] ? themeName : "emerald";
    userData.profile.theme = safe;
    applyTheme(safe);
    updateThemeSelection(safe);
    renderDashboard();
    saveData();
    const msg = document.getElementById("profile-msg");
    if (msg) {
        msg.innerText = `${themeOptions[safe].label} theme applied.`;
        setTimeout(() => { if (msg.innerText.includes("theme applied")) msg.innerText = ""; }, 2000);
    }
}

function applyTheme(themeName) {
    document.body.dataset.theme = themeOptions[themeName] ? themeName : "emerald";
}

function updateThemeSelection(themeName) {
    document.querySelectorAll(".theme-option").forEach(opt =>
        opt.classList.toggle("active", opt.dataset.theme === themeName));
}

/* ════════════════════════════════════════════════════════════════════════
   CHART
════════════════════════════════════════════════════════════════════════ */

function setChartView(nextView) {
    chartView = ["pie","table"].includes(nextView) ? nextView : "pie";
    renderDashboard();
}

function cycleChartView() {
    const views = ["pie","table"];
    chartView   = views[(views.indexOf(chartView) + 1) % views.length];
    renderDashboard();
}

function handleChartStageClick(event) {
    if (chartView !== "pie") return;
    if (event.target.closest(".chart-mode-btn")) return;
    if (event.target.closest(".pie-slice")) return; // Prevent cycling when tapping a slice
    cycleChartView();
}

function handleChartStageKeydown(event) {
    if ((event.key === "Enter" || event.key === " ") && chartView === "pie") {
        event.preventDefault();
        cycleChartView();
    }
}

function updateChartViewUI() {
    document.querySelectorAll(".chart-mode-btn").forEach(btn =>
        btn.classList.toggle("active", btn.dataset.chartView === chartView));
}

function getChartModeNote(view) {
    if (view === "table") return "Tabular view shows each task with exact start, end, and duration values.";
    return "Pie view shows how your planned task time is divided across the tasks you created.";
}

/* ════════════════════════════════════════════════════════════════════════
   AUDIO ALARM
════════════════════════════════════════════════════════════════════════ */
let alarmInterval = null;

function playBeep() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        if (ctx.state === 'suspended') ctx.resume();

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        
        osc.start();
        gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.5);
        osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
        console.warn("Audio playback prevented by browser policy", e);
    }
}

function startForcedAlarm() {
    if (alarmInterval) return;
    playBeep(); 
    alarmInterval = setInterval(playBeep, 1000);
    
    const popup = document.getElementById("reminder-popup");
    if (popup) popup.classList.add("alarm-active");
}

function stopForcedAlarm() {
    if (alarmInterval) {
        clearInterval(alarmInterval);
        alarmInterval = null;
    }
    
    const popup = document.getElementById("reminder-popup");
    if (popup) popup.classList.remove("alarm-active");
}

/* ════════════════════════════════════════════════════════════════════════
   REMINDERS
════════════════════════════════════════════════════════════════════════ */

function startReminderLoop() {
    if (reminderState.intervalId) clearInterval(reminderState.intervalId);
    reminderState.intervalId = setInterval(checkTaskReminders, 30_000);
}

function checkTaskReminders() {
    if (!currentUser) return;

    resetReminderStateForToday();

    // 1. Check upcoming events for today
    const todayObj = new Date();
    const todayStr = getTodayKey(todayObj);
    const tomorrowStr = getTomorrowKey(todayObj);
    (userData.events || []).forEach(ev => {
        const effDate = getNextOccurrence(ev, todayObj);
        if (effDate === todayStr) {
            triggerEventReminder(ev, 0);
        } else if (effDate === tomorrowStr) {
            triggerEventReminder(ev, 1);
        }
    });

    // 2. Check scheduled tasks
    const taskSegments = getTaskSegments(getSortedTasks());
    
    // Keep dashboard stats live
    const dash = document.getElementById("dashboard");
    if (dash && dash.classList.contains("active")) {
        renderDashboardStats(taskSegments);
    }

    if (!taskSegments.length) return;

    const currentMinuteFloat = getCurrentMinuteFloat();

    taskSegments.forEach(segment => {
        const endMinute = normalizeMinutes(timeToMinutes(segment.endTime));
        const startMinute = normalizeMinutes(timeToMinutes(segment.startTime));
        
        if (isWithinReminderWindow(currentMinuteFloat, startMinute)) {
            triggerTaskReminder(segment, 'start');
        }
        if (isWithinReminderWindow(currentMinuteFloat, endMinute)) {
            triggerTaskReminder(segment, 'end');
        }
    });
}

function triggerTaskReminder(segment, type) {
    const eventKey = `${reminderState.dayKey}|${type}|${segment.taskId}`;
    if (reminderState.firedEvents.has(eventKey)) return;

    reminderState.firedEvents.add(eventKey);
    
    let title, body;
    if (type === 'start') {
        title = `${segment.name} is starting`;
        body  = `It's time to start: ${segment.name}. Scheduled from ${segment.startTime} to ${segment.endTime}.`;
    } else {
        title = `${segment.name} ended`;
        body  = `This task ran from ${segment.startTime} to ${segment.endTime}. Record what happened before moving on to ${segment.nextTaskName}.`;
    }
    
    showReminderPopup(title, body, segment, type);
    sendBrowserNotification(title, body);
    startForcedAlarm(); 
}

function triggerEventReminder(ev, daysLeft = 0) {
    const eventKey = `event|${ev.id}|${getTodayKey()}|${daysLeft}`;
    if (reminderState.firedEvents.has(eventKey)) return;

    reminderState.firedEvents.add(eventKey);
    
    let title, body;
    if (daysLeft === 0) {
        title = `Today: ${ev.title}`;
        body  = `Don't forget! Today is marked as a ${ev.type}.`;
    } else {
        title = `Tomorrow: ${ev.title}`;
        body  = `Upcoming event tomorrow! Make sure you are prepared for this ${ev.type}.`;
    }
    
    showReminderPopup(title, body, null, 'event');
    sendBrowserNotification(title, body);
    startForcedAlarm();
}

function showReminderPopup(title, body, segment, type = 'end') {
    const popup     = document.getElementById("reminder-popup");
    const popupTitle = document.getElementById("reminder-title");
    const popupBody  = document.getElementById("reminder-body");
    const endActions = document.getElementById("reminder-actions-end");
    const startActions = document.getElementById("reminder-actions-start");
    if (!popup || !popupTitle || !popupBody) return;

    reminderState.activeReminder = { segment, title, body, type };

    popupTitle.innerText = title;
    popupBody.innerText  = body;
    
    if (type === 'start' || type === 'event') {
        if (endActions) endActions.classList.add('hidden');
        if (startActions) startActions.classList.remove('hidden');
    } else {
        if (endActions) endActions.classList.remove('hidden');
        if (startActions) startActions.classList.add('hidden');
    }
    popup.classList.add("show");
}

function hideReminderPopup() {
    const popup = document.getElementById("reminder-popup");
    if (popup) popup.classList.remove("show");
    reminderState.activeReminder = null;
    stopForcedAlarm();
}

function handleReminderAction(action) {
    const reminder = reminderState.activeReminder;
    if (!reminder) return;

    stopForcedAlarm();

    if (action === "cancel" || action === "acknowledge-start") { hideReminderPopup(); return; }

    addTaskRecord(reminder.segment, action);
    renderDashboard();

    const popupBody = document.getElementById("reminder-body");
    if (popupBody) {
        popupBody.innerText = `${formatActionLabel(action)} recorded. Press Cancel when you want to close this reminder.`;
    }
}

function addTaskRecord(segment, action) {
    const nextStep = action === "complete"
        ? `Completed before ${segment.nextTaskName}.`
        : action === "prepone"
            ? "Marked to be handled earlier next time."
            : "Not completed in this window.";

    const record = {
        taskId  : segment.taskId,
        taskName: segment.name,
        action,
        summary : `${formatActionLabel(action)} recorded. Task window: ${segment.startTime} to ${segment.endTime}. ${nextStep}`,
        loggedAt: new Date().toISOString()
    };

    const idx = userData.activityLog.findIndex(e => e.taskId === segment.taskId);
    if (idx >= 0) { userData.activityLog[idx] = record; }
    else          { userData.activityLog.unshift(record); }

    userData.activityLog = userData.activityLog.slice(0, 20);
    saveData();
}

function resetReminderStateForToday() {
    const todayKey = getTodayKey();
    if (reminderState.dayKey !== todayKey) {
        reminderState.dayKey = todayKey;
        reminderState.firedEvents.clear();
    }
}

function resetReminderState() {
    reminderState.dayKey = "";
    reminderState.firedEvents.clear();
    reminderState.activeReminder = null;
}

/* ════════════════════════════════════════════════════════════════════════
   TASK NORMALIZATION / HELPERS
════════════════════════════════════════════════════════════════════════ */

function normalizeTasks(rawTasks) {
    const source = Array.isArray(rawTasks) ? rawTasks : [];
    const mapped = source.map(task => ({
        ...task,
        startTime: task.startTime || task.time || "09:00",
        endTime  : task.endTime   || "",
        name     : task.name      || "Untitled Task",
        agenda   : task.agenda    || "",
        id       : task.id        || generateTaskId()
    }));

    const sorted = [...mapped].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

    return sorted.map((task, index) => {
        if (!task.endTime) {
            const next = sorted[(index + 1) % sorted.length];
            task.endTime = (next && next.startTime !== task.startTime)
                ? next.startTime
                : formatTimeFromMinutes(timeToMinutes(task.startTime) + 60);
        }
        return { id: task.id, startTime: task.startTime, endTime: task.endTime, name: task.name, agenda: task.agenda };
    });
}

function generateTaskId() {
    return `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function tasksOverlap(taskA, taskB) {
    const rangesA = getTimeRanges(taskA.startTime, taskA.endTime);
    const rangesB = getTimeRanges(taskB.startTime, taskB.endTime);
    return rangesA.some(rA => rangesB.some(rB => rA.start < rB.end && rB.start < rA.end));
}

function getTimeRanges(startTime, endTime) {
    const start = timeToMinutes(startTime);
    const end   = timeToMinutes(endTime);
    if (start < end) return [{ start, end }];
    return [{ start, end: 1440 }, { start: 0, end }];
}

/* ════════════════════════════════════════════════════════════════════════
   PURE UTILITY FUNCTIONS
════════════════════════════════════════════════════════════════════════ */

function timeToMinutes(timeString) {
    const [hours, minutes] = timeString.split(":").map(Number);
    return hours * 60 + minutes;
}

function formatTimeFromMinutes(totalMinutes) {
    const safe    = ((totalMinutes % 1440) + 1440) % 1440;
    const hours   = String(Math.floor(safe / 60)).padStart(2, "0");
    const minutes = String(safe % 60).padStart(2, "0");
    return `${hours}:${minutes}`;
}

function getDurationMinutes(startTime, endTime) {
    return (timeToMinutes(endTime) - timeToMinutes(startTime) + 1440) % 1440 || 1440;
}

function formatDuration(totalMinutes) {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    if (h && m) return `${h}h ${m}m`;
    if (h)      return `${h}h`;
    return `${m}m`;
}

function getCurrentMinuteFloat() {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes() + (now.getSeconds() / 60);
}

function normalizeMinutes(totalMinutes) {
    return ((totalMinutes % 1440) + 1440) % 1440;
}

function isWithinReminderWindow(currentMinuteFloat, eventMinute) {
    const elapsed = (currentMinuteFloat - eventMinute + 1440) % 1440;
    return elapsed >= 0 && elapsed < 1.1;
}

function getTodayKey(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

function getTomorrowKey(date = new Date()) {
    const tomorrow = new Date(date);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const y = tomorrow.getFullYear();
    const m = String(tomorrow.getMonth() + 1).padStart(2, "0");
    const d = String(tomorrow.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

function getNextOccurrence(ev, referenceDate) {
    const recurrence = ev.recurrence || "once";
    const t = (ev.type || "").toLowerCase();
    const isYearlyLegacy = t.includes("birthday") || t.includes("anniversar");
    
    if (recurrence === "once" && !isYearlyLegacy) return ev.date;

    const refStr = getTodayKey(referenceDate);
    if (ev.date >= refStr) return ev.date;

    const [yStr, mStr, dStr] = ev.date.split('-');
    const oD = parseInt(dStr, 10);
    const refY = referenceDate.getFullYear();
    const refM = referenceDate.getMonth();

    if (recurrence === "yearly" || isYearlyLegacy) {
        let projected = `${refY}-${mStr}-${dStr}`;
        if (projected < refStr) projected = `${refY + 1}-${mStr}-${dStr}`;
        return projected;
    }

    if (recurrence === "monthly") {
        let pDate = new Date(refY, refM, oD);
        let projected = getTodayKey(pDate);
        if (projected < refStr) {
            pDate = new Date(refY, refM + 1, oD);
            projected = getTodayKey(pDate);
        }
        return projected;
    }
    
    return ev.date;
}

function getLatestTaskStatus(taskId, log) {
    return log.find(e => e.taskId === taskId) || null;
}

function formatActionLabel(action) {
    if (action === "complete")  return "Complete";
    if (action === "prepone")   return "Prepone";
    if (action === "not-done")  return "Not Done";
    return "Cancel";
}

function formatRecordTime(isoString) {
    const d = new Date(isoString);
    const dd  = String(d.getDate()).padStart(2, "0");
    const mm  = String(d.getMonth() + 1).padStart(2, "0");
    const yy  = d.getFullYear();
    const hh  = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${dd}/${mm}/${yy} ${hh}:${min}`;
}

/* ════════════════════════════════════════════════════════════════════════
   NOTIFICATIONS
════════════════════════════════════════════════════════════════════════ */

async function requestNotificationPermission() {
    try {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
            console.log("Notification permission granted.");
            
            // Listen for Firebase Push Messages while app is open
            onMessage(messaging, (payload) => {
                console.log("FCM Message received:", payload);
                sendBrowserNotification(payload.notification?.title || "New Alert", payload.notification?.body || "");
                startForcedAlarm();
            });
        }
    } catch (error) {
        console.error("Error requesting notification permission:", error);
    }
}

function sendBrowserNotification(title, body) {
    if (Notification.permission === "granted" && currentUser) {
        new Notification(title, {
            body,
            icon: "https://cdn-icons-png.flaticon.com/512/2966/2966327.png"
        });
    }
}

/* Smart daily wellness nudges */
const smartQuotes = {
    morning  : ["Win the morning, win the day. Hydrate and conquer!", "Every day is a fresh start. Let's build healthy habits today."],
    afternoon: ["Midday check-in! Don't forget to stretch and drink water.", "Consistency is more important than perfection. Keep going!"],
    evening  : ["Time to wind down. Disconnect to reconnect with yourself.", "Reflect on your wins today. Your body deserves rest."]
};

function getSmartQuote() {
    const h  = new Date().getHours();
    const cat = h < 12 ? "morning" : h < 18 ? "afternoon" : "evening";
    const arr = smartQuotes[cat];
    return arr[Math.floor(Math.random() * arr.length)];
}

function sendSmartNotification() {
    if (Notification.permission === "granted" && currentUser) {
        new Notification("Snowzen — Vitality Reminder", {
            body: getSmartQuote(),
            icon: "https://cdn-icons-png.flaticon.com/512/2966/2966327.png"
        });
    }
}

setInterval(sendSmartNotification, 6 * 60 * 60 * 1000);          // every 6 h
setTimeout(() => { if (currentUser) sendSmartNotification(); }, 5_000);

/* ════════════════════════════════════════════════════════════════════════
   AI CHAT BOT
════════════════════════════════════════════════════════════════════════ */

function toggleChat() {
    const chatWindow = document.getElementById("chat-window");
    if (chatWindow) chatWindow.classList.toggle("hidden");
}

function sendChatMessage() {
    const input = document.getElementById("chat-input");
    const messages = document.getElementById("chat-messages");
    const text = input.value.trim();

    if (!text) return;

    // Append user message
    const userEl = document.createElement("div");
    userEl.className = "user-msg msg";
    userEl.innerText = text;
    messages.appendChild(userEl);

    input.value = "";
    messages.scrollTop = messages.scrollHeight;

    // Generate bot response with a slight delay
    setTimeout(() => {
        const botEl = document.createElement("div");
        botEl.className = "bot-msg msg";
        botEl.innerText = generateBotResponse(text);
        messages.appendChild(botEl);
        messages.scrollTop = messages.scrollHeight;
    }, 500);
}

function generateBotResponse(input) {
    const lower = input.toLowerCase();

    if (lower.includes("sleep") || lower.includes("tired")) {
        return "Aim for 7-9 hours of sleep! Try keeping a consistent bedtime, avoid caffeine late in the day, and keep your room cool and dark to improve sleep quality.";
    }
    if (lower.includes("water") || lower.includes("hydrat") || lower.includes("drink")) {
        return "Hydration is key! Try to drink at least 8 glasses (2 liters) of water a day. Keeping a bottle nearby as a visual reminder really helps.";
    }
    if (lower.includes("stress") || lower.includes("anxi") || lower.includes("overwhelm")) {
        return "Take a deep breath. Try the 4-7-8 method: inhale for 4s, hold for 7s, exhale for 8s. Also, taking brief walks can significantly lower cortisol levels.";
    }
    if (lower.includes("diet") || lower.includes("food") || lower.includes("eat") || lower.includes("meal")) {
        return "Focus on whole foods: plenty of vegetables, lean proteins, and healthy fats. Minimize added sugars and highly processed foods. Most importantly, listen to your body's hunger cues!";
    }
    if (lower.includes("exercise") || lower.includes("workout") || lower.includes("fitness")) {
        return "Movement is medicine! Aim for 150 minutes of moderate aerobic activity or 75 minutes of vigorous activity a week, plus strength training. Even a 10-minute daily walk is a huge win.";
    }
    if (lower.includes("hello") || lower.includes("hi")) {
        const botName = userData.profile.name || currentUser || 'there';
        return `Hello ${botName}! How can I help you with your health and wellness goals today?`;
    }
    
    return "That's an interesting topic! To stay healthy, remember the fundamentals: good sleep, regular movement, proper hydration, and balanced nutrition. Anything specific you'd like tips on?";
}

/* ════════════════════════════════════════════════════════════════════════
   MODULE EXPORTS TO WINDOW (For inline HTML event handlers)
════════════════════════════════════════════════════════════════════════ */
window.switchAuthTab = switchAuthTab;
window.register = register;
window.login = login;
window.loginWithGoogle = loginWithGoogle;
window.showLogoutModal = showLogoutModal;
window.hideLogoutModal = hideLogoutModal;
window.logout = logout;
window.changePassword = changePassword;
window.switchView = switchView;
window.toggleNavbar = toggleNavbar;
window.setChartView = setChartView;
window.cycleChartView = cycleChartView;
window.handleChartStageClick = handleChartStageClick;
window.handleChartStageKeydown = handleChartStageKeydown;
window.saveTask = saveTask;
window.editTask = editTask;
window.cancelTaskEdit = cancelTaskEdit;
window.deleteTask = deleteTask;
window.renderEvents = renderEvents;
window.saveEvent = saveEvent;
window.renderCalendar = renderCalendar;
window.changeMonth = changeMonth;
window.selectCalendarDate = selectCalendarDate;
window.deleteEvent = deleteEvent;
window.saveProfile = saveProfile;
window.handleProfilePicUpload = handleProfilePicUpload;
window.selectTheme = selectTheme;
window.handleReminderAction = handleReminderAction;
window.installPWA = installPWA;
window.toggleChat = toggleChat;
window.sendChatMessage = sendChatMessage;