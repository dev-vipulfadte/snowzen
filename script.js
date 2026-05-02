let currentUser = null;
let editingTaskId = null;
let chartView = "pie";

const NAV_MOBILE_BREAKPOINT = 720;
const reminderState = {
    dayKey: "",
    firedEvents: new Set(),
    intervalId: null,
    activeReminder: null
};

const themeOptions = {
    emerald: {
        label: "Emerald",
        colors: ["#2f9e44", "#4bc76b", "#7ad66f", "#b5e48c", "#95d5b2", "#52b788", "#40916c", "#74c69d"]
    },
    midnight: {
        label: "Midnight",
        colors: ["#58a6ff", "#7dc0ff", "#3b82f6", "#38bdf8", "#60a5fa", "#2563eb", "#8ec5ff", "#0ea5e9"]
    },
    sunset: {
        label: "Sunset",
        colors: ["#f26b3a", "#fb923c", "#f97316", "#fdba74", "#ff8c61", "#f59e0b", "#fca5a5", "#fb7185"]
    },
    lavender: {
        label: "Lavender",
        colors: ["#7c5cff", "#9b87f5", "#8b5cf6", "#c4b5fd", "#a78bfa", "#7c3aed", "#d8b4fe", "#818cf8"]
    },
    "cotton-candy": {
        label: "Pink Blue",
        colors: ["#ff5fa2", "#8dd6ff", "#ff89bd", "#6ebcff", "#ffb0cf", "#92e0ff", "#ff77c8", "#5fa8ff"]
    }
};

const defaultSchedule = [
    { id: "default-sleep", startTime: "22:00", endTime: "06:00", name: "Sleep", agenda: "8 hours of restorative sleep" },
    { id: "default-hydrate", startTime: "06:00", endTime: "06:30", name: "Wake Up & Hydrate", agenda: "Drink 500ml of water" },
    { id: "default-exercise", startTime: "06:30", endTime: "07:30", name: "Exercise", agenda: "30 mins of cardio or yoga" },
    { id: "default-breakfast", startTime: "07:30", endTime: "08:00", name: "Healthy Breakfast", agenda: "High protein, low sugar" },
    { id: "default-lunch", startTime: "13:00", endTime: "14:00", name: "Lunch & Walk", agenda: "Balanced meal and 15 min walk" },
    { id: "default-dinner", startTime: "18:00", endTime: "19:00", name: "Dinner", agenda: "Light meal, finish 3 hours before bed" },
    { id: "default-detox", startTime: "21:00", endTime: "22:00", name: "Digital Detox", agenda: "No screens, read a book" }
];

let userData = getDefaultUserData();

window.onload = () => {
    const savedUser = localStorage.getItem("vitality_user");
    if (savedUser) {
        currentUser = savedUser;
        loadUserData();
        showApp();
    } else {
        applyTheme(userData.profile.theme);
    }
    initializeNavbar();
    startReminderLoop();
    requestNotificationPermission();
};

window.addEventListener("resize", handleViewportChange);

function getDefaultUserData() {
    return {
        profile: {
            age: "",
            goal: "",
            theme: "emerald"
        },
        tasks: normalizeTasks(defaultSchedule),
        activityLog: []
    };
}

function login() {
    const name = document.getElementById("username-input").value.trim();
    if (!name) return;

    currentUser = name;
    localStorage.setItem("vitality_user", name);
    loadUserData();
    showApp();
    checkTaskReminders();
}

function logout() {
    currentUser = null;
    localStorage.removeItem("vitality_user");
    userData = getDefaultUserData();
    editingTaskId = null;
    applyTheme(userData.profile.theme);
    resetReminderState();
    hideReminderPopup();
    resetTaskForm();
    document.getElementById("app-container").classList.remove("active");
    document.getElementById("login-page").classList.add("active");
}

function loadUserData() {
    const storedData = localStorage.getItem(`vitality_data_${currentUser}`);
    const defaults = getDefaultUserData();

    if (storedData) {
        const parsed = JSON.parse(storedData);
        userData = {
            profile: {
                ...defaults.profile,
                ...(parsed.profile || {})
            },
            tasks: normalizeTasks(Array.isArray(parsed.tasks) && parsed.tasks.length ? parsed.tasks : defaults.tasks),
            activityLog: Array.isArray(parsed.activityLog) ? parsed.activityLog : []
        };
    } else {
        userData = defaults;
    }

    document.getElementById("profile-name").value = currentUser;
    document.getElementById("profile-age").value = userData.profile.age || "";
    document.getElementById("profile-goal").value = userData.profile.goal || "";
    applyTheme(userData.profile.theme);
    updateThemeSelection(userData.profile.theme);
    resetTaskForm();
    saveData();
    renderDashboard();
    renderCustomTasks();
    checkTaskReminders();
}

function saveData() {
    if (!currentUser) return;
    localStorage.setItem(`vitality_data_${currentUser}`, JSON.stringify(userData));
}

function showApp() {
    document.getElementById("login-page").classList.remove("active");
    document.getElementById("app-container").classList.add("active");
    handleViewportChange();
    switchView("dashboard");
}

function switchView(viewId) {
    document.querySelectorAll(".content-view").forEach((view) => view.classList.remove("active"));
    document.getElementById(viewId).classList.add("active");

    document.querySelectorAll(".nav-btn[data-view]").forEach((button) => {
        button.classList.toggle("active", button.dataset.view === viewId);
    });

    if (window.innerWidth <= NAV_MOBILE_BREAKPOINT) {
        setNavbarOpen(false);
    }
}

function initializeNavbar() {
    setNavbarOpen(window.innerWidth > NAV_MOBILE_BREAKPOINT);
}

function handleViewportChange() {
    if (window.innerWidth > NAV_MOBILE_BREAKPOINT) {
        setNavbarOpen(true);
    }
}

function toggleNavbar() {
    const navbar = document.getElementById("navbar");
    if (!navbar) return;
    setNavbarOpen(!navbar.classList.contains("is-open"));
}

function setNavbarOpen(isOpen) {
    const navbar = document.getElementById("navbar");
    const navToggle = document.getElementById("nav-toggle");
    if (!navbar || !navToggle) return;

    navbar.classList.toggle("is-open", isOpen);
    navToggle.setAttribute("aria-expanded", String(isOpen));
}

function renderDashboard() {
    const sortedTasks = getSortedTasks();
    const taskSegments = getTaskSegments(sortedTasks);

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
            taskId: task.id,
            startTime: task.startTime,
            endTime: task.endTime,
            name: task.name,
            agenda: task.agenda,
            durationMinutes: getDurationMinutes(task.startTime, task.endTime),
            color: palette[index % palette.length],
            nextTaskName: nextTask ? nextTask.name : task.name
        };
    });
}

function renderDayChart(taskSegments) {
    const chartActiveView = document.getElementById("chart-active-view");
    const chartLayout = document.getElementById("chart-layout");
    const detailPanel = document.getElementById("chart-detail-panel");
    const totalLabel = document.getElementById("day-total");
    const plannedMinutes = taskSegments.reduce((total, segment) => total + segment.durationMinutes, 0);

    if (chartLayout) {
        chartLayout.classList.toggle("expanded-view", chartView !== "pie");
    }

    if (!taskSegments.length) {
        chartActiveView.innerHTML = '<div class="detail-note">Add tasks to see your chart.</div>';
        detailPanel.innerHTML = '<p class="success-msg">Add tasks to see your full-day chart.</p>';
        totalLabel.textContent = "0h planned";
        updateChartViewUI();
        return;
    }

    let accumulatedDegrees = 0;
    const gradientParts = taskSegments.map((segment) => {
        const degrees = (segment.durationMinutes / plannedMinutes) * 360;
        const start = accumulatedDegrees;
        const end = accumulatedDegrees + degrees;
        accumulatedDegrees = end;
        return `${segment.color} ${start}deg ${end}deg`;
    });

    if (chartView === "pie") {
        chartActiveView.innerHTML = `
            <div class="pie-chart-wrap">
                <div id="day-pie-chart" class="pie-chart" aria-label="24 hour pie chart representation"></div>
                <div class="chart-center">
                    <strong>${formatDuration(plannedMinutes)}</strong>
                    <span>Planned</span>
                </div>
            </div>
        `;
        const pieChart = document.getElementById("day-pie-chart");
        pieChart.style.background = `conic-gradient(${gradientParts.join(", ")})`;
    } else if (chartView === "table") {
        chartActiveView.innerHTML = `
            <div class="chart-table">
                ${taskSegments.map((segment) => `
                    <div class="chart-table-row">
                        <div>
                            <strong>${segment.name}</strong>
                            <span>${segment.startTime} to ${segment.endTime}</span>
                        </div>
                        <strong>${formatDuration(segment.durationMinutes)}</strong>
                        <span>Task</span>
                    </div>
                `).join("")}
            </div>
        `;
    } else {
        chartActiveView.innerHTML = `
            <div class="chart-bars">
                ${taskSegments.map((segment) => `
                    <div class="chart-bar-item">
                        <div class="chart-bar-label">
                            <strong>${segment.name}</strong>
                            <span>${formatDuration(segment.durationMinutes)}</span>
                        </div>
                        <div class="chart-bar-track">
                            <div class="chart-bar-fill" style="width:${(segment.durationMinutes / plannedMinutes) * 100}%; background:${segment.color};"></div>
                        </div>
                    </div>
                `).join("")}
            </div>
        `;
    }

    detailPanel.innerHTML = chartView === "pie"
        ? `<div class="chart-legend">${taskSegments.map((segment) => `
        <div class="legend-item">
            <span class="legend-color" style="background:${segment.color};"></span>
            <div class="legend-label">
                <strong>${segment.name}</strong>
                <span>${segment.startTime} to ${segment.endTime}</span>
            </div>
            <span class="legend-time">${formatDuration(segment.durationMinutes)}</span>
        </div>
    `).join("")}</div>`
        : `<div class="detail-note">${getChartModeNote(chartView)}</div>`;

    totalLabel.textContent = `${formatDuration(plannedMinutes)} planned`;
    updateChartViewUI();
}

function renderDashboardStats(taskSegments) {
    const stats = document.getElementById("dashboard-stats");
    const currentMinutes = getCurrentMinuteFloat();
    const nextTask = taskSegments.find((task) => timeToMinutes(task.startTime) > currentMinutes) || taskSegments[0] || null;
    const longestTask = taskSegments.reduce((longest, segment) => {
        if (!longest || segment.durationMinutes > longest.durationMinutes) {
            return segment;
        }
        return longest;
    }, null);

    stats.innerHTML = `
        <div class="stat-card">
            <span>Next task</span>
            <strong>${nextTask ? `${nextTask.startTime} - ${nextTask.endTime} ${nextTask.name}` : "No task planned"}</strong>
        </div>
        <div class="stat-card">
            <span>Total activities</span>
            <strong>${taskSegments.length} scheduled moments</strong>
        </div>
        <div class="stat-card">
            <span>Longest block</span>
            <strong>${longestTask ? `${longestTask.name} - ${formatDuration(longestTask.durationMinutes)}` : "Not available"}</strong>
        </div>
    `;
}

function saveTask() {
    const startTime = document.getElementById("task-start-time").value;
    const endTime = document.getElementById("task-end-time").value;
    const name = document.getElementById("task-name").value.trim();
    const agenda = document.getElementById("task-agenda").value.trim();
    const validationMessage = validateTaskForm(startTime, endTime, name, editingTaskId);

    if (validationMessage) {
        setTaskFormMessage(validationMessage, true);
        return;
    }

    const taskPayload = {
        id: editingTaskId || generateTaskId(),
        startTime,
        endTime,
        name,
        agenda
    };

    if (editingTaskId) {
        const taskIndex = userData.tasks.findIndex((task) => task.id === editingTaskId);
        if (taskIndex >= 0) {
            userData.tasks[taskIndex] = taskPayload;
        }
        setTaskFormMessage("Task updated.");
    } else {
        userData.tasks.push(taskPayload);
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
    list.innerHTML = "";

    getSortedTasks().forEach((task) => {
        const li = document.createElement("li");
        li.innerHTML = `
            <div class="task-details">
                <strong>${task.name}</strong>
                <span class="task-meta">${task.startTime} to ${task.endTime}</span>
                <span class="task-meta">${task.agenda || "No details added yet"}</span>
            </div>
            <div class="task-controls">
                <button type="button" class="edit-btn" onclick="editTask('${task.id}')">Edit</button>
                <button type="button" class="delete-btn" onclick="deleteTask('${task.id}')">Remove</button>
            </div>
        `;
        list.appendChild(li);
    });
}

function editTask(taskId) {
    const task = userData.tasks.find((entry) => entry.id === taskId);
    if (!task) return;

    editingTaskId = taskId;
    document.getElementById("task-start-time").value = task.startTime;
    document.getElementById("task-end-time").value = task.endTime;
    document.getElementById("task-name").value = task.name;
    document.getElementById("task-agenda").value = task.agenda || "";
    document.getElementById("task-form-title").innerText = "Edit Task";
    document.getElementById("task-submit-btn").innerText = "Save Changes";
    document.getElementById("task-cancel-btn").classList.remove("hidden");
    setTaskFormMessage("Editing selected task.");
    switchView("edit-day");
}

function cancelTaskEdit() {
    resetTaskForm();
}

function deleteTask(taskId) {
    userData.tasks = userData.tasks.filter((task) => task.id !== taskId);
    userData.activityLog = userData.activityLog.filter((entry) => entry.taskId !== taskId);
    if (editingTaskId === taskId) {
        resetTaskForm();
    }
    saveData();
    renderDashboard();
    renderCustomTasks();
    checkTaskReminders();
}

function resetTaskForm(keepMessage = false) {
    editingTaskId = null;
    document.getElementById("task-start-time").value = "";
    document.getElementById("task-end-time").value = "";
    document.getElementById("task-name").value = "";
    document.getElementById("task-agenda").value = "";
    document.getElementById("task-form-title").innerText = "Add Task";
    document.getElementById("task-submit-btn").innerText = "Add Task";
    document.getElementById("task-cancel-btn").classList.add("hidden");
    if (!keepMessage) {
        setTaskFormMessage("");
    }
}

function setTaskFormMessage(message, isError = false) {
    const messageNode = document.getElementById("task-form-msg");
    if (!messageNode) return;
    messageNode.innerText = message;
    messageNode.classList.toggle("error", isError);
}

function validateTaskForm(startTime, endTime, name, excludeTaskId = null) {
    if (!startTime || !endTime || !name) {
        return "Please fill in start time, end time, and task name.";
    }

    if (startTime === endTime) {
        return "Start time and end time cannot be the same.";
    }

    const candidateTask = {
        id: excludeTaskId || "__candidate__",
        startTime,
        endTime,
        name
    };

    const conflictingTask = userData.tasks.find((task) => task.id !== excludeTaskId && tasksOverlap(candidateTask, task));
    if (conflictingTask) {
        return `This time overlaps with ${conflictingTask.name} (${conflictingTask.startTime} to ${conflictingTask.endTime}).`;
    }

    return "";
}

function saveProfile() {
    userData.profile.age = document.getElementById("profile-age").value;
    userData.profile.goal = document.getElementById("profile-goal").value.trim();
    userData.profile.theme = document.body.dataset.theme || userData.profile.theme;
    saveData();

    document.getElementById("profile-msg").innerText = "Profile saved successfully!";
    setTimeout(() => {
        document.getElementById("profile-msg").innerText = "";
    }, 3000);
}

function renderActivityTimeline(taskSegments) {
    const timeline = document.getElementById("timeline");
    if (!timeline) return;

    const log = Array.isArray(userData.activityLog) ? userData.activityLog : [];
    if (!taskSegments.length) {
        timeline.innerHTML = '<div class="records-empty">No schedule or task records yet.</div>';
        return;
    }

    timeline.innerHTML = taskSegments.map((segment) => {
        const latestStatus = getLatestTaskStatus(segment.taskId, log);
        const statusBadge = latestStatus
            ? `<span class="record-badge ${latestStatus.action}">${formatActionLabel(latestStatus.action)}</span>`
            : '<span class="record-badge pending">Pending</span>';
        const statusMeta = latestStatus
            ? `${latestStatus.summary} ${formatRecordTime(latestStatus.loggedAt)}`
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
            </div>
        `;
    }).join("");
}

function selectTheme(themeName) {
    const safeTheme = themeOptions[themeName] ? themeName : "emerald";
    userData.profile.theme = safeTheme;
    applyTheme(safeTheme);
    updateThemeSelection(safeTheme);
    renderDashboard();
    saveData();

    const message = document.getElementById("profile-msg");
    if (message) {
        message.innerText = `${themeOptions[safeTheme].label} theme applied.`;
        setTimeout(() => {
            if (message.innerText.includes("theme applied")) {
                message.innerText = "";
            }
        }, 2000);
    }
}

function setChartView(nextView) {
    chartView = ["pie", "table", "graph"].includes(nextView) ? nextView : "pie";
    renderDashboard();
}

function cycleChartView() {
    const views = ["pie", "table", "graph"];
    const currentIndex = views.indexOf(chartView);
    chartView = views[(currentIndex + 1) % views.length];
    renderDashboard();
}

function handleChartStageClick(event) {
    if (chartView !== "pie") {
        return;
    }

    if (event.target.closest(".chart-mode-btn")) {
        return;
    }

    cycleChartView();
}

function handleChartStageKeydown(event) {
    if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        if (chartView === "pie") {
            cycleChartView();
        }
    }
}

function updateChartViewUI() {
    document.querySelectorAll(".chart-mode-btn").forEach((button) => {
        button.classList.toggle("active", button.dataset.chartView === chartView);
    });
}

function applyTheme(themeName) {
    const safeTheme = themeOptions[themeName] ? themeName : "emerald";
    document.body.dataset.theme = safeTheme;
}

function updateThemeSelection(themeName) {
    document.querySelectorAll(".theme-option").forEach((option) => {
        option.classList.toggle("active", option.dataset.theme === themeName);
    });
}

function startReminderLoop() {
    if (reminderState.intervalId) {
        clearInterval(reminderState.intervalId);
    }
    reminderState.intervalId = setInterval(checkTaskReminders, 30000);
}

function checkTaskReminders() {
    if (!currentUser) return;

    const taskSegments = getTaskSegments(getSortedTasks());
    if (!taskSegments.length) return;

    resetReminderStateForToday();
    const currentMinuteFloat = getCurrentMinuteFloat();

    taskSegments.forEach((segment) => {
        const endMinute = normalizeMinutes(timeToMinutes(segment.endTime));
        if (isWithinReminderWindow(currentMinuteFloat, endMinute)) {
            triggerTaskReminder(segment);
        }
    });
}

function triggerTaskReminder(segment) {
    const eventKey = `${reminderState.dayKey}|end|${segment.taskId}`;
    if (reminderState.firedEvents.has(eventKey)) {
        return;
    }

    reminderState.firedEvents.add(eventKey);
    const title = `${segment.name} ended`;
    const body = `This task ran from ${segment.startTime} to ${segment.endTime}. Record what happened before moving on to ${segment.nextTaskName}.`;
    showReminderPopup(title, body, segment);
    sendBrowserNotification(title, body);
}

function sendBrowserNotification(title, body) {
    if (Notification.permission === "granted" && currentUser) {
        new Notification(title, {
            body,
            icon: "https://cdn-icons-png.flaticon.com/512/2966/2966327.png"
        });
    }
}

function showReminderPopup(title, body, segment) {
    const popup = document.getElementById("reminder-popup");
    const popupTitle = document.getElementById("reminder-title");
    const popupBody = document.getElementById("reminder-body");
    if (!popup || !popupTitle || !popupBody) return;

    reminderState.activeReminder = {
        segment,
        title,
        body
    };

    popupTitle.innerText = title;
    popupBody.innerText = body;
    popup.classList.add("show");
}

function hideReminderPopup() {
    const popup = document.getElementById("reminder-popup");
    if (popup) {
        popup.classList.remove("show");
    }
    reminderState.activeReminder = null;
}

function handleReminderAction(action) {
    const reminder = reminderState.activeReminder;
    if (!reminder) return;

    if (action === "cancel") {
        hideReminderPopup();
        return;
    }

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
        taskId: segment.taskId,
        taskName: segment.name,
        action,
        summary: `${formatActionLabel(action)} recorded. Task window: ${segment.startTime} to ${segment.endTime}. ${nextStep}`,
        loggedAt: new Date().toISOString()
    };

    const existingIndex = userData.activityLog.findIndex((entry) => entry.taskId === segment.taskId);
    if (existingIndex >= 0) {
        userData.activityLog[existingIndex] = record;
    } else {
        userData.activityLog.unshift(record);
    }

    userData.activityLog = userData.activityLog.slice(0, 20);
    saveData();
}

function getLatestTaskStatus(taskId, log) {
    return log.find((entry) => entry.taskId === taskId) || null;
}

function getChartModeNote(view) {
    if (view === "table") {
        return "Tabular view shows each task with exact start, end, and duration values.";
    }
    if (view === "graph") {
        return "Graph view compares your task durations so longer and shorter blocks stand out quickly.";
    }
    return "Pie view shows how your planned task time is divided across the tasks you created.";
}

function normalizeTasks(rawTasks) {
    const sourceTasks = Array.isArray(rawTasks) ? rawTasks : [];
    const mappedTasks = sourceTasks.map((task) => ({
        ...task,
        startTime: task.startTime || task.time || "09:00",
        endTime: task.endTime || "",
        name: task.name || "Untitled Task",
        agenda: task.agenda || "",
        id: task.id || generateTaskId()
    }));

    const sortedTasks = [...mappedTasks].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

    return sortedTasks.map((task, index) => {
        if (!task.endTime) {
            const nextTask = sortedTasks[(index + 1) % sortedTasks.length];
            const fallbackEnd = nextTask && nextTask.startTime !== task.startTime
                ? nextTask.startTime
                : formatTimeFromMinutes(timeToMinutes(task.startTime) + 60);
            task.endTime = fallbackEnd;
        }
        return {
            id: task.id,
            startTime: task.startTime,
            endTime: task.endTime,
            name: task.name,
            agenda: task.agenda
        };
    });
}

function generateTaskId() {
    return `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function tasksOverlap(taskA, taskB) {
    const rangesA = getTimeRanges(taskA.startTime, taskA.endTime);
    const rangesB = getTimeRanges(taskB.startTime, taskB.endTime);

    return rangesA.some((rangeA) =>
        rangesB.some((rangeB) => rangeA.start < rangeB.end && rangeB.start < rangeA.end)
    );
}

function getTimeRanges(startTime, endTime) {
    const start = timeToMinutes(startTime);
    const end = timeToMinutes(endTime);

    if (start < end) {
        return [{ start, end }];
    }

    return [
        { start, end: 1440 },
        { start: 0, end }
    ];
}

function timeToMinutes(timeString) {
    const [hours, minutes] = timeString.split(":").map(Number);
    return (hours * 60) + minutes;
}

function formatTimeFromMinutes(totalMinutes) {
    const safeMinutes = ((totalMinutes % 1440) + 1440) % 1440;
    const hours = String(Math.floor(safeMinutes / 60)).padStart(2, "0");
    const minutes = String(safeMinutes % 60).padStart(2, "0");
    return `${hours}:${minutes}`;
}

function getDurationMinutes(startTime, endTime) {
    return (timeToMinutes(endTime) - timeToMinutes(startTime) + 1440) % 1440 || 1440;
}

function formatDuration(totalMinutes) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours && minutes) {
        return `${hours}h ${minutes}m`;
    }
    if (hours) {
        return `${hours}h`;
    }
    return `${minutes}m`;
}

function getCurrentMinuteFloat() {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes() + (now.getSeconds() / 60);
}

function formatActionLabel(action) {
    if (action === "complete") return "Complete";
    if (action === "prepone") return "Prepone";
    if (action === "not-done") return "Not Done";
    return "Cancel";
}

function formatRecordTime(isoString) {
    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${minutes}`;
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

function getTodayKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function normalizeMinutes(totalMinutes) {
    return ((totalMinutes % 1440) + 1440) % 1440;
}

function isWithinReminderWindow(currentMinuteFloat, eventMinute) {
    const elapsed = (currentMinuteFloat - eventMinute + 1440) % 1440;
    return elapsed >= 0 && elapsed < 1.1;
}

const smartQuotes = {
    morning: [
        "Win the morning, win the day. Hydrate and conquer!",
        "Every day is a fresh start. Let's build healthy habits today."
    ],
    afternoon: [
        "Midday check-in! Don't forget to stretch and drink water.",
        "Consistency is more important than perfection. Keep going!"
    ],
    evening: [
        "Time to wind down. Disconnect to reconnect with yourself.",
        "Reflect on your wins today. Your body deserves rest."
    ]
};

function getSmartQuote() {
    const hour = new Date().getHours();
    let category = "morning";
    if (hour >= 12 && hour < 18) category = "afternoon";
    if (hour >= 18) category = "evening";
    const quotes = smartQuotes[category];
    return quotes[Math.floor(Math.random() * quotes.length)];
}

function requestNotificationPermission() {
    if ("Notification" in window) {
        Notification.requestPermission();
    }
}

function sendNotification() {
    if (Notification.permission === "granted" && currentUser) {
        new Notification("Vitality Assistant", {
            body: getSmartQuote(),
            icon: "https://cdn-icons-png.flaticon.com/512/2966/2966327.png"
        });
    }
}

setInterval(sendNotification, 6 * 60 * 60 * 1000);
setTimeout(() => {
    if (currentUser) sendNotification();
}, 5000);
