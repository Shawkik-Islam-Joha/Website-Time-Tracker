# ⏳ Website Time Tracker

A lightweight extension that tracks how much time you spend on different websites every day.

Note: It'll work on any chromium based browser.

---

## 🚀 Features

- Tracks active tab time accurately.
- Stops counting time when the browser window is minimized.
- Provides a toggleable statistics panel (hidden by default).
- Displays per-site daily usage in clean list format.
- Allows left/right navigation to browse last 7 days.
- Shows a 7-day total usage comparison bar chart.
- Maintains a rolling 7-day usage history.
- Includes reset button for clearing today’s data.
- Formats total daily time clearly and consistently.
- Clean, interactive and responsive popup UI.
---

## 📂 Project Structure
```
Website-Time-Tracker/
│
├── manifest.json # Extension configuration
├── background.js # Time tracking logic
├── content.js # Website interaction logic
├── popup.html # Popup UI
├── popup.js # Popup functionality
├── popup.css # Popup styling
│
├── icons/ # Extension icons
│ ├── icon16.png
│ ├── icon48.png
│ └── icon128.png
│
├── README.md
├── LICENSE
└── .gitignore
```

---

## 🛠 Installation (Developer Mode)

1. Download ZIP from GitHub repo → Code → Download ZIP  
2. Extract ZIP to a folder
3. Open Extensions page 
4. Turn ON **Developer mode** (top-right toggle)  
5. Click **Load unpacked** → select the folder with manifest.json  
6. Done – extension is now loaded (reload icon to update later)

---

## 🧠 How It Works

- Uses the `chrome.tabs` API to detect active tabs
- Uses `chrome.storage.local` to store time data
- Background script continuously tracks active website
- Popup reads stored data and displays daily statistics

---

## 📷 Screenshots

### Main View
<img width="427" height="668" alt="image" src="https://github.com/user-attachments/assets/4eec377d-9a47-4f51-93d6-0473f9237dfb" />

### Statistics Panel
<img width="449" height="606" alt="image" src="https://github.com/user-attachments/assets/1e51be31-99ca-4cce-99a3-16ceeed0389d" />

### 7-Day Chart
<img width="431" height="269" alt="image" src="https://github.com/user-attachments/assets/9a075439-6844-47ac-bfd4-f833f37691c2" />

