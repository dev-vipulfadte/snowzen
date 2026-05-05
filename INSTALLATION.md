# Installation & Setup Instructions

## 📋 Prerequisites

Before starting, make sure you have:
- **Node.js** 16 or higher - [Download](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- A modern web browser (Chrome, Firefox, Safari, Edge)
- A GitHub account (optional, for version control)

---

## 🚀 Step-by-Step Installation

### 1. **Open Terminal/Command Prompt**

Navigate to your project folder:
```bash
cd /path/to/snowzen
```

### 2. **Install Dependencies**

```bash
npm install
```

This will install all required packages (React, Vite, Tailwind CSS, Firebase, etc.).

**On Windows:**
```bash
npm install
```

**On macOS/Linux:**
```bash
npm install
```

### 3. **Start Development Server**

```bash
npm run dev
```

You should see output like:
```
  VITE v5.0.0  ready in 234 ms

  ➜  Local:   http://localhost:3000/
  ➜  press h to show help
```

**The app will automatically open at http://localhost:3000**

### 4. **View the App**

- Automatic browser window should open
- If not, manually visit: **http://localhost:3000**

---

## 🔐 Firebase Authentication Setup

### Create a Firebase Account

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create Project"
3. Enter project name: `snowzen`
4. Accept terms and create

### Enable Authentication

1. In Firebase console, go to **Authentication**
2. Click "Get Started"
3. Enable **Email/Password** provider
4. Enable **Google** OAuth provider
5. Add your domain to authorized domains

### Set Up Realtime Database

1. Go to **Realtime Database**
2. Click "Create Database"
3. Choose **Start in test mode** (for development)
4. Select your region
5. Click "Enable"

### Database Rules (for development)

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    }
  }
}
```

---

## 🎨 Optional Configuration

### Custom Firebase Config (Advanced)

To use your own Firebase project:

1. Create `.env` file in root folder
2. Add your Firebase credentials:
```
VITE_FIREBASE_API_KEY=your_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_domain_here
...
```

3. Update `src/firebase.js`:
```javascript
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  // ... etc
};
```

### Custom Theme

Edit `tailwind.config.js` to add custom colors or themes.

---

## 📦 Available NPM Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# View help
npm run dev -- --help
```

---

## 🧪 Testing the App

### 1. **Test Authentication**
- Click "Register" to create a new account
- Or use Google Sign-In
- Try "Sign In" with credentials

### 2. **Test Task Management**
- Go to "Edit My Day"
- Add a task with time slot
- Edit and delete tasks
- Check overlap detection works

### 3. **Test Dashboard**
- View the pie chart
- Switch between Chart and Table views
- Check real-time countdown

### 4. **Test Calendar**
- Add events with different types
- Try recurring events
- Filter by type

### 5. **Test Profile**
- Update profile information
- Change theme
- Change password (if using Email/Password auth)

---

## 🐛 Common Issues & Fixes

### **Issue: "npm command not found"**
- **Solution**: Install Node.js from https://nodejs.org/
- Verify: `node --version` and `npm --version`

### **Issue: Port 3000 already in use**
- **Solution**: 
  ```bash
  npm run dev -- --port 3001
  ```

### **Issue: Module not found errors**
- **Solution**:
  ```bash
  rm -rf node_modules package-lock.json
  npm install
  ```

### **Issue: Tailwind styles not loading**
- **Solution**:
  ```bash
  # Clear cache
  Ctrl+Shift+R (or Cmd+Shift+R on Mac)
  
  # Rebuild
  npm run build
  npm run preview
  ```

### **Issue: Firebase not connecting**
- Check your internet connection
- Verify Firebase project is active
- Check browser console for errors (F12)
- Clear browser cache

### **Issue: "Cannot find module '@vitejs/plugin-react'"**
- **Solution**:
  ```bash
  npm install --save-dev @vitejs/plugin-react
  ```

---

## 🚀 Deployment

### Deploy to Vercel (Free & Easy)

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Deploy:
   ```bash
   vercel
   ```

3. Follow the prompts to connect your repository

### Deploy to Firebase Hosting

1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Login:
   ```bash
   firebase login
   ```

3. Initialize:
   ```bash
   firebase init hosting
   ```

4. Build and deploy:
   ```bash
   npm run build
   firebase deploy
   ```

---

## 📚 Project Structure Reference

```
snowzen/
├── src/
│   ├── components/     ← React components
│   ├── context/        ← State management
│   ├── pages/          ← Page components
│   ├── hooks/          ← Custom React hooks
│   ├── utils/          ← Utility functions
│   ├── App.jsx         ← Main app component
│   ├── main.jsx        ← React entry point
│   └── index.css       ← Global styles
├── public/
│   ├── index.html      ← HTML template
│   └── manifest.json   ← PWA manifest
├── package.json        ← Dependencies
├── vite.config.js      ← Build config
└── tailwind.config.js  ← Tailwind config
```

---

## 💡 Tips

1. **Dev Server Hot Reload**: Changes save automatically
2. **Browser DevTools**: Press F12 to debug
3. **Console Logs**: Check `npm run dev` terminal for errors
4. **Firebase Console**: Monitor data in real-time
5. **Tailwind Docs**: https://tailwindcss.com for styling help

---

## ✅ You're All Set!

Your Snowzen app is ready to use! 🎉

- **Dev Server**: http://localhost:3000
- **Firebase Console**: https://console.firebase.google.com
- **Documentation**: See README.md

Happy coding! 💻
