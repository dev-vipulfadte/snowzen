# Snowzen — Healthy Life Assistant

A clean, zero-dependency **Vanilla HTML / CSS / JavaScript** single-page application (SPA) that helps you plan, visualise, and track your full 24-hour daily routine. Everything — including user accounts and activity history — lives in your browser's **localStorage**, so no server, no signup form, and no external API is needed.

---

## ✨ Features

| Area | What it does |
|------|-------------|
| **Auth** | Register with a username + password. Passwords are hashed (djb2 double-pass) before storage. Login verifies the hash. Per-user data is completely isolated. |
| **24-h Breakdown** | A conic-gradient **Pie chart** shows how your tasks fill the day. Switch instantly to a **Table** or horizontal **Bar graph** view with the mode switcher. |
| **Task Management** | Add tasks with start/end times, a name, and an agenda note. Overlap detection prevents double-booking. Edit or remove any task at any time. |
| **Activity Timeline** | Every scheduled task appears as a timeline card with its current status badge (Pending / Complete / Prepone / Not Done). |
| **Reminders** | A polling loop fires a slide-up **Reminder Popup** within ~1 min of a task's end time. You can mark it Complete, Prepone, or Not Done — the action is stored in your activity log. Browser Notifications are also sent (requires permission). |
| **5 Themes** | Emerald · Midnight · Sunset · Lavender · Pink Blue. Theme preference is saved per user. |
| **Change Password** | In-app password update form with current-password verification. |
| **Smart Quotes** | Wellness nudge notifications fired every 6 hours (morning / afternoon / evening context-aware). |
| **Fully Responsive** | Mobile-first collapsible navbar, responsive dashboard grid, and single-column layouts on small screens. |

---

## 🗂 Project Structure

```
snowzen/
├── index.html   — single HTML page; login + register tabs, app shell, reminder popup
├── style.css    — full stylesheet; CSS variables for theming, responsive breakpoints
├── script.js    — all logic: auth, DB layer, task CRUD, charts, reminders, notifications
└── README.md    — this file
```

---

## 🗄 LocalStorage "Database" Schema

```
vitality_accounts           → { "alice": "<hashed>", "bob": "<hashed>", … }
vitality_user               → "alice"   (currently logged-in username)
vitality_data_alice         → { profile, tasks[], activityLog[] }
vitality_data_bob           → { … }
```

Each `vitality_data_<username>` object has this shape:

```jsonc
{
  "profile": {
    "age"  : "28",
    "goal" : "Sleep better and exercise daily",
    "theme": "midnight"
  },
  "tasks": [
    {
      "id"       : "default-sleep",
      "startTime": "22:00",
      "endTime"  : "06:00",
      "name"     : "Sleep",
      "agenda"   : "8 hours of restorative sleep"
    }
    // …up to N tasks
  ],
  "activityLog": [
    {
      "taskId"  : "default-sleep",
      "taskName": "Sleep",
      "action"  : "complete",
      "summary" : "Complete recorded. Task window: 22:00 to 06:00. …",
      "loggedAt": "2025-06-01T07:03:12.000Z"
    }
    // …latest 20 entries kept
  ]
}
```

---

## 🚀 Running Locally

No build step required.

```bash
# 1. Clone or download the repo
git clone https://github.com/your-handle/snowzen.git
cd snowzen

# 2a. Open directly in any modern browser
open index.html        # macOS
start index.html       # Windows
xdg-open index.html    # Linux

# 2b. OR serve with any static server (avoids some browser security restrictions for Notifications)
npx serve .            # Node.js
python3 -m http.server # Python
```

> **Browser Notification permission** — the app will request permission on load. Accept it to receive reminder pop-ups and wellness nudges. If you block it, the in-app reminder popup still works.

---

## 🔐 Security Notes

This app stores passwords **client-side only**. The hash used (djb2 double-pass with a static salt) provides basic obfuscation — it is **not** a cryptographic password hash like bcrypt. It is appropriate for a personal local-only lifestyle planner but should not be used in a multi-user production environment without a real back-end.

---

## 🎨 Adding a New Theme

1. Add a CSS block in `style.css`:
   ```css
   body[data-theme="ocean"] {
       --primary       : #0077b6;
       --primary-strong: #005f8a;
       --primary-soft  : rgba(0, 119, 182, 0.14);
       /* … other vars … */
   }
   ```
2. Add the theme entry in `script.js` → `themeOptions`:
   ```js
   ocean: {
       label : "Ocean",
       colors: ["#0077b6","#00b4d8","#90e0ef","…"]
   }
   ```
3. Add a button + preview swatch in `index.html` and a `.ocean-preview` rule in the CSS.

---

## 📄 License

MIT — free to use, modify, and distribute.
