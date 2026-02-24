# ⏳ Website Time Tracker (Microsoft Edge Extension)

A lightweight Microsoft Edge extension that tracks how much time you spend on different websites every day.
Note: It'll work on any chromium based browser.

---

## 🚀 Features

- ⌛ Tracks time spent per website
- 📊 Shows total time spent today
- 📈 Displays percentage usage per site
- 🔄 Automatically runs in the background
- 🎯 Simple and clean popup interface

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

## 📊 Data Structure Example

```json
{
  "2026-02-25": {
    "youtube.com": 3600,
    "github.com": 1800
  }
}
