# Snowzen — Healthy Life Assistant

> **✨ Now powered by React with Vite!** 
> 
> A modern, responsive **React + Firebase** application that helps you plan, visualize, and track your full 24-hour daily routine. Featuring beautiful themes, real-time synchronization, and a delightful user experience.

---

## 🎯 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# 3. Open http://localhost:3000
```

**That's it!** Your app is running. 🚀

---

## ✨ Features

| Area | What it does |
|------|-------------|
| **🔐 Authentication** | Secure Firebase Auth with Email/Password and Google OAuth. Per-user data isolation and real-time sync. |
| **📊 24-hour Breakdown** | Interactive pie chart shows your day layout. Switch between Pie Chart and Table views instantly. |
| **✅ Task Management** | Add/edit/delete tasks with smart overlap detection. Automatic sorting and beautiful timeline view. |
| **📅 Calendar & Events** | Manage birthdays, anniversaries, meetings with recurring event support and smart filtering. |
| **🔔 Reminders** | Real-time task reminders with browser notifications (requires permission). |
| **🎨 6 Themes** | Emerald · Midnight · Sunset · Lavender · Cotton Candy · Ocean. Auto-applied across the app. |
| **👤 User Profiles** | Manage name, age, health goals, and preferences. Real-time Firebase sync. |
| **🔐 Password Management** | Change password with secure re-authentication. |
| **📱 Fully Responsive** | Mobile-first design. Works perfectly on all devices. |
| **📲 PWA Ready** | Install as app on mobile. Works offline with service workers. |

---

## 🛠 Technology Stack

| Component | Technology |
|-----------|-----------|
| **Frontend** | React 18, Vite, Tailwind CSS |
| **State Management** | React Context API |
| **Routing** | React Router v6 |
| **Backend** | Firebase (Auth, Realtime DB) |
| **Styling** | Tailwind CSS + CSS Custom Properties |
| **Icons** | Lucide React |
| **Build** | Vite (Lightning fast) |

---

## 📦 Installation

### Requirements
- Node.js 16+
- npm or yarn

### Setup

```bash
# Clone the repository
git clone https://github.com/your-username/snowzen.git
cd snowzen

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The app will open automatically at `http://localhost:3000`.

---

## 📁 Project Structure

```
snowzen/
├── public/
│   ├── index.html           # HTML template
│   ├── manifest.json        # PWA manifest
│   └── logo.png             # App icon
├── src/
│   ├── main.jsx             # React entry point
│   ├── App.jsx              # Main app with routing
│   ├── index.css            # Global styles (Tailwind)
│   ├── firebase.js          # Firebase initialization
│   ├── context/
│   │   ├── AuthContext.jsx  # Authentication state
│   │   └── DataContext.jsx  # User data & operations
│   ├── pages/
│   │   ├── LoginPage.jsx    # Authentication page
│   │   └── AppPage.jsx      # Main app container
│   └── components/
│       ├── Navbar.jsx                    # Navigation
│       ├── Dashboard.jsx                 # Home page
│       ├── TaskManager.jsx               # Task CRUD
│       ├── Calendar.jsx                  # Events management
│       ├── Profile.jsx                   # User settings
│       ├── ActivityTimeline.jsx          # Today's schedule
│       ├── LoadingScreen.jsx             # Loading indicator
│       ├── ReminderPopup.jsx             # Reminders
│       └── charts/
│           └── InteractivePieChart.jsx   # 24-hour chart
├── vite.config.js           # Vite configuration
├── tailwind.config.js        # Tailwind CSS setup
├── postcss.config.js         # PostCSS config
├── package.json              # Dependencies
├── .gitignore                # Git ignore rules
├── .env.example              # Environment variables template
└── README.md                 # This file
```

---

## 🔄 Firebase Configuration

The app uses Firebase Realtime Database and Authentication. Configuration is embedded in `src/firebase.js`:

```javascript
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
```

**No database changes needed** - all existing data is preserved!

---

## 📊 Database Schema

```
users/{uid}/
├── profile/
│   ├── name: "John Doe"
│   ├── age: "28"
│   ├── goal: "Sleep better"
│   ├── theme: "emerald"
│   ├── avatar: "data:image/..."
│   └── alertsEnabled: true
├── tasks/
│   └── [{
│     id: "default-exercise",
│     startTime: "06:30",
│     endTime: "07:30",
│     name: "Exercise",
│     agenda: "30 mins cardio"
│   }, ...]
├── activityLog/
│   └── [{
│     taskId: "default-exercise",
│     date: "2024-01-15",
│     status: "completed",
│     notes: "..."
│   }, ...]
├── events/
│   └── [{
│     id: "event-123",
│     date: "2024-03-15",
│     title: "Alice's Birthday",
│     type: "Birthday",
│     recurrence: "yearly"
│   }, ...]
└── activeBreak: null
```

---

## 🎨 Theming System

6 beautiful themes built-in:

| Theme | Primary Color | Best For |
|-------|---------------|----------|
| **Emerald** | Green (#2f9e44) | Nature, growth, fresh |
| **Midnight** | Blue (#58a6ff) | Focus, calm, professional |
| **Sunset** | Orange (#f26b3a) | Energy, warmth, active |
| **Lavender** | Purple (#7c5cff) | Creativity, relaxation |
| **Cotton Candy** | Pink/Blue (#ff5fa2) | Fun, playful, vibrant |
| **Ocean** | Teal (#0077b6) | Cool, peaceful, serene |

Switch themes in **Profile** settings. Preference is saved automatically.

---

## 🎯 Core Features

### 1. **Authentication**
- Sign up with email/password
- Sign in with Google
- Secure password change with verification
- Session persistence across page reloads

### 2. **Task Management**
- Create tasks with specific time slots
- Smart overlap detection
- Edit/delete tasks
- Automatic sorting by time
- Task duration visualization

### 3. **Dashboard**
- 24-hour pie chart visualization
- Table view for task list
- Current activity indicator
- Next upcoming task
- Total planned time and unscheduled time
- Real-time countdown updates

### 4. **Calendar**
- Add events with dates
- Event type badges (Birthday, Meeting, Holiday, etc.)
- Recurring events (Monthly, Yearly)
- Filter by event type
- Days until countdown

### 5. **Profile Management**
- Update name, age, health goals
- Change password
- Theme selector
- Notification preferences
- Real-time Firebase sync

### 6. **Responsive Design**
- Mobile-first approach
- Collapsible sidebar on mobile
- Optimized layouts for all screen sizes
- Touch-friendly buttons and inputs

---

## 🚀 Deployment

### Vercel (Recommended - FREE)
```bash
npm install -g vercel
vercel
# Follow prompts to connect your repo
```

### Firebase Hosting
```bash
npm install -g firebase-tools
firebase init
firebase deploy
```

### GitHub Pages
```bash
npm run build
# Deploy the 'dist' folder to GitHub Pages
```

---

## 🔧 Available Scripts

```bash
npm run dev          # Start development server (port 3000)
npm run build        # Build for production
npm run preview      # Preview production build locally
npm run lint         # Run ESLint (if configured)
```

---

## 🐛 Troubleshooting

### Port 3000 already in use
```bash
npm run dev -- --port 3001
```

### Module not found errors
```bash
rm -rf node_modules package-lock.json
npm install
```

### Firebase connection issues
1. Check internet connection
2. Verify Firebase project is active
3. Check Realtime Database rules allow access
4. Clear browser cache and try again

### Styles not loading
1. Clear browser cache (Cmd+Shift+R / Ctrl+Shift+R)
2. Rebuild: `npm run build`
3. Check Tailwind CSS config

### PWA not installing
1. HTTPS required (works automatically on production)
2. manifest.json must be accessible
3. Service worker must be registered successfully

---

## 📱 Mobile App Installation

### iPhone
1. Open app in Safari
2. Tap Share icon
3. Select "Add to Home Screen"
4. Tap "Add"

### Android
1. Open app in Chrome
2. Tap menu (⋮)
3. Select "Install app"
4. Confirm installation

---

## 🤝 Contributing

Contributions are welcome! 

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📚 Resources

- [React Documentation](https://react.dev)
- [Vite Guide](https://vitejs.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Firebase Docs](https://firebase.google.com/docs)
- [React Router](https://reactrouter.com)
- [Lucide Icons](https://lucide.dev)

---

## 📄 License

This project is open source and available under the MIT License.

---

## 🙏 Acknowledgments

Built with ❤️ using React, Firebase, and Tailwind CSS.

Special thanks to the amazing open-source community!

---

## 📞 Support

For issues, questions, or suggestions:
1. Check the [Troubleshooting](#-troubleshooting) section
2. Open an issue on GitHub
3. Contact: [your-email@example.com]

---

**Happy coding! 🎉**

Made with ♥️ by the Snowzen Team
