const express = require('express');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');
const app = express();
const server = require('http').createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.json());

// === Folder Paths ===
const NEW_IMAGES_FOLDER = path.join(__dirname, 'New Images');
const APPROVED_FOLDER = path.join(__dirname, 'Approved Images');
const DENIED_FOLDER = path.join(__dirname, 'Denied Images');

// ✅ Ensure all folders exist
[NEW_IMAGES_FOLDER, APPROVED_FOLDER, DENIED_FOLDER].forEach(folder => {
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
    console.log(`📁 Created folder: ${folder}`);
  } else {
    console.log(`✅ Found folder: ${folder}`);
  }
});

// === Serve static files ===
app.use('/', express.static(path.join(__dirname)));
app.use('/images/new', express.static(NEW_IMAGES_FOLDER));
app.use('/images/approved', express.static(APPROVED_FOLDER));
app.use('/images/denied', express.static(DENIED_FOLDER));

// Optional CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header('Access-Control-Allow-Methods', 'GET,POST');
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});

// === API Routes ===

// List images in folders
app.get('/api/list-new-images', (req, res) => sendImageList(NEW_IMAGES_FOLDER, res));
app.get('/api/list-approved-images', (req, res) => sendImageList(APPROVED_FOLDER, res));
app.get('/api/list-denied-images', (req, res) => sendImageList(DENIED_FOLDER, res));

function sendImageList(folder, res) {
  fs.readdir(folder, (err, files) => {
    if (err) return res.status(500).send('Error reading folder');
    const images = files.filter(f => /\.(jpg|jpeg|png|gif)$/i.test(f));
    res.json(images);
  });
}

// Count new images
app.get('/api/count-new-images', (req, res) => {
  fs.readdir(NEW_IMAGES_FOLDER, (err, files) => {
    if (err) return res.status(500).send('Error reading folder');
    const count = files.filter(f => /\.(jpg|jpeg|png|gif)$/i.test(f)).length;
    res.json(count);
  });
});

// ✅ Move from "New Images" to Approved/Denied
app.post('/api/move-image', (req, res) => {
  const { filename, status } = req.body;
  if (!filename || !status) return res.status(400).send('Missing filename or status');

  const sourcePath = path.join(NEW_IMAGES_FOLDER, filename);
  const targetFolder = status === 'approved' ? APPROVED_FOLDER : DENIED_FOLDER;
  const targetPath = path.join(targetFolder, filename);

  fs.rename(sourcePath, targetPath, (err) => {
    if (err) {
      console.error('❌ Move error:', err);
      return res.status(500).send('Failed to move image');
    }
    console.log(`✅ Moved ${filename} to ${status}`);
    res.send('Image moved successfully');
  });
});

// ✅ Move back to "New Images" from Approved/Denied
app.post('/api/move-back-to-new', (req, res) => {
  const { filename, fromStatus } = req.body;
  if (!filename || !fromStatus) {
    return res.status(400).send('Missing filename or fromStatus');
  }

  const sourceFolder =
    fromStatus === 'approved' ? APPROVED_FOLDER :
    fromStatus === 'denied' ? DENIED_FOLDER : null;

  if (!sourceFolder) return res.status(400).send('Invalid fromStatus');

  const sourcePath = path.join(sourceFolder, filename);
  const targetPath = path.join(NEW_IMAGES_FOLDER, filename);

  console.log(`🔁 Move-back requested for: ${filename}`);
  console.log(`From: ${sourcePath}`);
  console.log(`To:   ${targetPath}`);

  fs.access(sourcePath, fs.constants.F_OK, (err) => {
    if (err) {
      console.error('❌ File not found at source:', sourcePath);
      return res.status(404).send('Source file not found');
    }

    fs.rename(sourcePath, targetPath, (err) => {
      if (err) {
        console.error('❌ Error moving back:', err);
        return res.status(500).send('Failed to move file');
      }
      console.log(`✅ Moved ${filename} back to New Images`);
      res.send('File moved successfully');
    });
  });
});

// 🔄 WebSocket notifications
wss.on('connection', (ws) => {
  console.log('📡 WebSocket client connected');
});

fs.watch(NEW_IMAGES_FOLDER, (eventType, filename) => {
  broadcastFolderChange();
});

function broadcastFolderChange() {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send('folderChanged');
    }
  });
}

// Start the server
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`🚀 Moderation server running at http://localhost:${PORT}`);
});
