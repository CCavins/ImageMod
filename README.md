
# Moderation Dashboard

A fast, real-time, folder-based image moderation tool built with pure JavaScript and Node.js.

✅ Moderate images (Approve/Deny)  
✅ Smooth viewer transitions and keyboard shortcuts  
✅ Move images back to "New" for re-moderation  
✅ Auto-creates necessary folders on startup  
✅ Real-time live updates using WebSocket  
✅ Easily accessible on your local network

---

## 📂 Folder Structure

```
/YourProject/
├── moderation.html
├── server.js
├── README.md
├── New Images/         # Incoming unmoderated images
├── Approved Images/    # Approved images
└── Denied Images/      # Denied images
```

✅ If any of these folders are missing, `server.js` **automatically creates them**.

✅ Images are organized simply by moving files between these folders.

---

## 📦 Dependencies

Install Node.js if you haven't already:  
👉 [Download Node.js](https://nodejs.org/)

Then install the required NPM packages:

```bash
npm install express ws
```

| Package | Purpose |
|---------|---------|
| express | Host frontend (HTML/JS) and expose API routes |
| ws      | WebSocket live server updates (pushes file changes instantly) |

✅ No database, no frontend frameworks — extremely lightweight.

---

## ⚙️ Setup Instructions

### 1. Clone or prepare your project folder

Ensure you have:

- `moderation.html`
- `server.js`
- `README.md`

Folders `New Images/`, `Approved Images/`, and `Denied Images/` will be created if missing.

---

### 2. Install dependencies

From your project folder:

```bash
npm install express ws
```

---

### 3. Start the server

Run:

```bash
node server.js
```

✅ Console output should confirm folders created or found:

```
✅ Found folder: /path/to/New Images
✅ Found folder: /path/to/Approved Images
✅ Found folder: /path/to/Denied Images
🚀 Moderation server running at http://localhost:3000
```

---

### 4. Open the Moderation Dashboard

In your browser:

```text
http://localhost:3000/moderation.html
```

✅ You will see the live moderation interface.

✅ Images added to `New Images/` will appear instantly — **no page refresh needed**.

---

## 🧠 How It Works

| Action/Mode | What Happens |
|-----------------------------|------------------------------------------------|
| Auto-Add (Default ON)        | New images automatically appear in the moderation queue — no clicks needed. |
| Manual Refresh (Auto-Add OFF)| Refresh button appears — manually pull new images into the queue when desired. |
| Approve (✅)                  | Image is moved from New ➔ Approved folder. |
| Deny (❌)                     | Image is moved from New ➔ Denied folder. |
| Click in Approved/Denied     | Option to move the image back into the New moderation queue. |
| Refresh Button               | Manually rechecks all folders for new images when Auto-Add is OFF. |
| WebSocket Push Updates       | Instantly detects new files in New Images folder — no browser refresh needed. |


✅ Full animation on approve/deny  
✅ Smooth keyboard shortcuts (→ Approve, ← Deny, ESC to Exit)


---



## 🔄 Moderation Modes: JSON vs Folder-Based

This tool supports **two moderation modes**, configured by a single setting in `server.js`:

```js
const USE_JSON_MODE = true; // ✅ true = JSON mode, false = folder mode
```

---

### ✅ JSON Mode (`USE_JSON_MODE = true`)

| Feature | Behavior |
|--------|----------|
| Central folder | All images live in `/Images/` |
| Metadata | Tracked in `image-metadata.json` |
| Status updates | Approve/Deny only update JSON flags (no file moves) |
| Auto-conversion | On boot, files from `New Images`, `Approved Images`, and `Denied Images` are moved to `Images/` and tagged accordingly |
| Auto-sync | New files added to `Images/` on disk are added to JSON; missing files are removed from metadata |

---

### 📁 Folder Mode (`USE_JSON_MODE = false`)

| Feature | Behavior |
|--------|----------|
| Image sorting | Files live in separate folders: `New Images/`, `Approved Images/`, `Denied Images/` |
| No metadata used | `image-metadata.json` is ignored |
| Status updates | Physically moves files between folders |
| Auto-conversion | On boot, all images in `/Images/` are moved back to their correct folders based on the JSON flags, then JSON is cleared |

---

### 🔁 Switching Between Modes

To switch modes:

1. Open `server.js`
2. Find the setting near the top:

```js
const USE_JSON_MODE = true; // or false
```

3. Restart the server:

```bash
node server.js
```

The server will automatically:
- Move files appropriately between folders
- Update or rebuild the metadata file (`image-metadata.json`)
- Ensure everything is synced with the active mode

## ⌨️ Keyboard Shortcuts (Viewer)

| Key             | Action             |
|-----------------|--------------------|
| → (Right Arrow) | Approve the image   |
| ← (Left Arrow)  | Deny the image      |
| Esc             | Go back to grid view |

---

## 🚀 Accessing Over Local Network

Moderate from your **phone, tablet, or another computer** on the same Wi-Fi:

### Steps:

1. Find your local IP:

```bash
ipconfig   (Windows)
ifconfig   (Mac/Linux)
```

Example output:

```bash
IPv4 Address: 192.168.1.105
```

2. On your other device’s browser:

```text
http://192.168.1.105:3000/moderation.html
```

✅ Server must allow firewall access  
✅ Devices must be on the same local network (Wi-Fi, Ethernet)

---

## 🛠 Troubleshooting

| Problem                        | Cause / Solution                              |
|---------------------------------|-----------------------------------------------|
| Images not showing             | Only `.jpg`, `.jpeg`, `.png`, `.gif` supported |
| Move back to New not working    | Server must be running; file must exist       |
| WebSocket updates not firing    | Browser refresh; restart server              |
| Permission errors               | Check folder read/write permissions          |
| Firewall blocking               | Allow Node.js app through local firewall     |

✅ Always check your terminal logs — move errors or permission errors will appear there.

---

## 📈 Recommended Improvements (Optional)

- Add login authentication for moderator access
- Save a database log of all actions (e.g., approved/denied/moved)
- Add mobile optimizations for easier moderation on phones
- Deploy the Node.js server to a cloud service (Render, AWS EC2, DigitalOcean)
- Implement multi-user roles (reviewer, admin)

---

## 🔥 Quick Command Cheat Sheet

```bash
npm install express ws      # Install server dependencies
node server.js              # Start server
open http://localhost:3000/moderation.html   # Open dashboard in browser
```

---

## 📜 License

This project is provided **as-is** for personal, educational, or internal team use.  
Feel free to modify, extend, and enhance it for your needs.

---

## ❤️ Built for fast workflows

This project was designed to help teams and individuals moderate high volumes of images  
simply and quickly with **zero database, zero external dependencies**, and **near instant updates**.

---
