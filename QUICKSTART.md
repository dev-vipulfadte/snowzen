# Getting Started with Snowzen React

Welcome to Snowzen! 👋 Here's everything you need to know to get up and running.

---

## ⚡ 60-Second Setup

```bash
# 1. Clone/Open project
cd snowzen

# 2. Install
npm install

# 3. Run
npm run dev

# 4. Open browser
http://localhost:3000
```

Done! ✅

---

## 📋 Prerequisites Checklist

- [ ] Node.js 16+ installed - Check with `node --version`
- [ ] npm installed - Check with `npm --version`
- [ ] Modern web browser (Chrome, Firefox, Safari, Edge)
- [ ] Internet connection (for Firebase)
- [ ] Text editor (VS Code recommended)

**Missing Node.js?** Download from https://nodejs.org/

---

## 🔑 First Time Login

### Create an Account
1. Go to **Register** tab
2. Enter email: `test@example.com`
3. Create password (min 6 chars)
4. Confirm password
5. Click **Create Account**

### Sign In
1. Go to **Sign In** tab
2. Enter your email
3. Enter your password
4. Click **Sign In**

### Sign In with Google
1. Click **Continue with Google**
2. Select your Google account
3. Done!

---

## 🎯 Feature Quick Guide

### 📊 Dashboard
- View your daily schedule as a pie chart
- See current activity with live countdown
- Check next upcoming task
- View total planned time
- Switch between Chart and Table views

### ✏️ Edit My Day
- Add new tasks with start/end times
- Set task names and notes
- Edit existing tasks
- Delete tasks
- See all tasks in order

### 📅 Calendar
- Add events (birthdays, meetings, etc.)
- Set recurring events (yearly, monthly)
- Filter events by type
- See days until event
- Delete events

### 👤 Profile
- Update your name and age
- Set health goals
- Change password
- Choose from 6 themes
- Toggle notifications
- All changes sync automatically

---

## 🎨 Changing Your Theme

1. Go to **Profile** section
2. Scroll to "Choose Theme"
3. Click a theme card (Emerald, Midnight, Sunset, Lavender, Cotton Candy, Ocean)
4. Theme changes instantly!
5. Preference is saved automatically

---

## 🔐 Changing Your Password

1. Go to **Profile** section
2. Scroll to "Change Password"
3. Enter current password
4. Enter new password (min 6 chars)
5. Confirm new password
6. Click **Update Password**

⚠️ **Note**: Google Sign-In users cannot change passwords here.

---

## 📱 Mobile Installation

### iPhone/iPad (Safari)
1. Open app in Safari
2. Tap Share button (box with arrow)
3. Select "Add to Home Screen"
4. Name it "Snowzen"
5. Tap "Add"

### Android (Chrome)
1. Open app in Chrome browser
2. Tap ⋮ (menu icon)
3. Tap "Install app"
4. Confirm installation
5. App appears on home screen

---

## ⌨️ Keyboard Shortcuts (Coming Soon)

- `Cmd/Ctrl + K` - Open command palette
- `Cmd/Ctrl + /` - Toggle sidebar

---

## 💾 Your Data & Privacy

✅ **All data is:**
- Stored securely in Firebase
- Only accessible to you
- Synced across all devices
- Encrypted in transit
- Never shared with third parties

✅ **You can:**
- Export your data
- Delete your account
- Download all information
- Change passwords anytime

---

## 🐛 Troubleshooting

### App won't load
**Solution**: 
- Refresh page (Cmd/Ctrl + R)
- Clear cache (Cmd/Ctrl + Shift + R)
- Check internet connection
- Restart dev server (`npm run dev`)

### Can't login
**Solution**:
- Check email spelling
- Verify password is correct
- Try Google Sign-In instead
- Check Firebase console

### Tasks not saving
**Solution**:
- Check internet connection
- Look for error messages
- Try refreshing page
- Check browser console (F12)

### Theme won't change
**Solution**:
- Try different theme
- Refresh page
- Clear browser cache

### Other issues?
- Open browser console: `F12`
- Look for error messages
- Check terminal where you ran `npm run dev`

---

## 📚 Pro Tips

### 💡 General
- Click on any stat card to see more details
- Hover over pie chart segments to see task names
- Use Tab key to navigate forms
- Responsive design works on all sizes

### 📊 Dashboard
- Pie chart is interactive - hover to highlight tasks
- Live countdown updates every second
- Current progress bar shows task completion
- Table view good for detailed task list

### ✏️ Tasks
- Times can't overlap (app prevents conflicts)
- Tasks auto-sort by time
- Edit button (pencil icon) to modify
- Delete button (trash icon) to remove
- Long task names wrap to new line

### 📅 Events
- Set recurring events (birthdays every year!)
- Filter events by type
- Colors indicate event type
- "Today" and "Tomorrow" shortcuts in countdown

### 👤 Profile
- Changes save automatically
- Pick memorable password
- Health goal motivates you daily
- Experiment with themes!

---

## 🌐 Accessing the App

### During Development
- Local: **http://localhost:3000**
- On network: **http://your-ip:3000**

### After Deployment
- Check with your hosting provider
- Usually a URL like `snowzen.vercel.app`

---

## 🚀 Deploying Your App

### Quick Deploy (Vercel - Recommended)
```bash
npm install -g vercel
vercel
# Follow prompts
```

### Deploy to Firebase
```bash
npm install -g firebase-tools
firebase login
firebase deploy
```

### Deploy to GitHub Pages
1. Build: `npm run build`
2. Push `dist/` folder to GitHub
3. Enable GitHub Pages in settings

---

## 📞 Need Help?

### Check These First
1. **README.md** - Full documentation
2. **INSTALLATION.md** - Setup help
3. **Browser Console** - Error messages (F12)
4. **Firebase Console** - Data status

### Still Need Help?
1. Check GitHub issues
2. Search Stack Overflow for your error
3. Check Firebase documentation
4. Ask in React community forums

---

## 🎓 Learning Resources

### React
- [React Official Docs](https://react.dev)
- [React Tutorial](https://react.dev/learn)
- [React Router Guide](https://reactrouter.com)

### Firebase
- [Firebase Docs](https://firebase.google.com/docs)
- [Firebase Auth](https://firebase.google.com/docs/auth)
- [Realtime Database](https://firebase.google.com/docs/database)

### Styling
- [Tailwind CSS](https://tailwindcss.com)
- [Tailwind Components](https://tailwindui.com)

### Build Tools
- [Vite Guide](https://vitejs.dev)
- [Vite React Plugin](https://vitejs.dev/guide/framework.html)

---

## ✨ Have Fun!

Snowzen is designed to help you live healthier. Use it to:
- 🎯 Plan your day
- ⏰ Stay on schedule
- 📊 Visualize your routine
- 🎨 Customize to your style
- 📱 Sync across devices

**Enjoy your journey to better health! 💪**

---

## 🔗 Quick Links

| Resource | Link |
|----------|------|
| **React** | https://react.dev |
| **Vite** | https://vitejs.dev |
| **Tailwind** | https://tailwindcss.com |
| **Firebase** | https://firebase.google.com |
| **Node.js** | https://nodejs.org |
| **VS Code** | https://code.visualstudio.com |

---

**Last Updated**: May 2026

Made with ❤️ for healthy living
