// server.js (now auto-converts between folder and JSON mode)

const express = require('express');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');
const app = express();
const server = require('http').createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.json());

// === Settings ===
const USE_JSON_MODE = true; // 🔹 true = JSON metadata mode; false = folder moving mode
const METADATA_FILE = path.join(__dirname, 'image-metadata.json');

// === Folder Paths ===
const NEW_IMAGES_FOLDER = path.join(__dirname, 'New Images');
const APPROVED_FOLDER = path.join(__dirname, 'Approved Images');
const DENIED_FOLDER = path.join(__dirname, 'Denied Images');
const ALL_IMAGES_FOLDER = path.join(__dirname, 'Images');

let imageMetadata = {}; // Loaded if using JSON mode

// === Ensure Folders Exist ===
[NEW_IMAGES_FOLDER, APPROVED_FOLDER, DENIED_FOLDER, ALL_IMAGES_FOLDER].forEach(folder => {
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
    console.log(`📁 Created folder: ${folder}`);
  } else {
    console.log(`✅ Found folder: ${folder}`);
  }
});

// === Mode Conversion on Startup ===
if (USE_JSON_MODE) {
  // 🡒 Convert from folders into central Images/ + JSON
  const mergeIntoImages = (folder, status) => {
    fs.readdirSync(folder).forEach(file => {
      if (!/\.(jpg|jpeg|png|gif)$/i.test(file)) return;
      const src = path.join(folder, file);
      const dest = path.join(ALL_IMAGES_FOLDER, file);
      if (!fs.existsSync(dest)) {
        fs.renameSync(src, dest);
        imageMetadata[file] = { status, timestamp: Date.now() };
        console.log(`➡️ Moved ${file} to Images/ and set status: ${status}`);
      }
    });
  };

  mergeIntoImages(NEW_IMAGES_FOLDER, 'new');
  mergeIntoImages(APPROVED_FOLDER, 'approved');
  mergeIntoImages(DENIED_FOLDER, 'denied');

  // ✅ Ensure all existing images in /Images are tracked in metadata
  const allImages = fs.readdirSync(ALL_IMAGES_FOLDER).filter(f => /\.(jpg|jpeg|png|gif)$/i.test(f));
  const trackedSet = new Set(Object.keys(imageMetadata));
  allImages.forEach(file => {
    if (!trackedSet.has(file)) {
      imageMetadata[file] = { status: 'new', timestamp: Date.now() };
      console.log(`➕ Added ${file} to metadata as 'new'`);
    }
  });

  // ❌ Remove metadata entries for files that no longer exist
  Object.keys(imageMetadata).forEach(file => {
    if (!fs.existsSync(path.join(ALL_IMAGES_FOLDER, file))) {
      delete imageMetadata[file];
      console.log(`🗑️ Removed ${file} from metadata (file missing)`);
    }
  });

  saveMetadata();
  console.log(`📦 Finished converting to JSON mode.`);

} else {
  // 🡒 Convert JSON data back into folders
  if (fs.existsSync(METADATA_FILE)) {
    imageMetadata = JSON.parse(fs.readFileSync(METADATA_FILE));
    Object.entries(imageMetadata).forEach(([filename, data]) => {
      const src = path.join(ALL_IMAGES_FOLDER, filename);
      let dest;
      if (data.status === 'new') dest = path.join(NEW_IMAGES_FOLDER, filename);
      else if (data.status === 'approved') dest = path.join(APPROVED_FOLDER, filename);
      else if (data.status === 'denied') dest = path.join(DENIED_FOLDER, filename);
      else return;

      if (fs.existsSync(src) && !fs.existsSync(dest)) {
        fs.renameSync(src, dest);
        console.log(`⬅️ Moved ${filename} to folder: ${data.status}`);
      }
    });
  }
  imageMetadata = {}; // Reset for folder mode
}

function saveMetadata() {
  fs.writeFileSync(METADATA_FILE, JSON.stringify(imageMetadata, null, 2));
}

// === Static Files ===
app.use('/', express.static(path.join(__dirname)));
app.use('/images/new', express.static(NEW_IMAGES_FOLDER));
app.use('/images/approved', express.static(APPROVED_FOLDER));
app.use('/images/denied', express.static(DENIED_FOLDER));
app.use('/images/all', express.static(ALL_IMAGES_FOLDER));

// Optional CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header('Access-Control-Allow-Methods', 'GET,POST');
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});

app.get('/api/config', (req, res) => {
  res.json({ useJsonMode: USE_JSON_MODE });
});

// List images
app.get('/api/list-new-images', (req, res) => {
  if (USE_JSON_MODE) {
    const newImages = Object.keys(imageMetadata).filter(name => imageMetadata[name].status === 'new');
    res.json(newImages);
  } else {
    sendImageList(NEW_IMAGES_FOLDER, res);
  }
});

app.get('/api/list-approved-images', (req, res) => {
  if (USE_JSON_MODE) {
    const approved = Object.keys(imageMetadata).filter(name => imageMetadata[name].status === 'approved');
    res.json(approved);
  } else {
    sendImageList(APPROVED_FOLDER, res);
  }
});

app.get('/api/list-denied-images', (req, res) => {
  if (USE_JSON_MODE) {
    const denied = Object.keys(imageMetadata).filter(name => imageMetadata[name].status === 'denied');
    res.json(denied);
  } else {
    sendImageList(DENIED_FOLDER, res);
  }
});

function sendImageList(folder, res) {
  fs.readdir(folder, (err, files) => {
    if (err) return res.status(500).send('Error reading folder');
    const images = files.filter(f => /\.(jpg|jpeg|png|gif)$/i.test(f));
    res.json(images);
  });
}

// Count new images
app.get('/api/count-new-images', (req, res) => {
  if (USE_JSON_MODE) {
    const count = Object.values(imageMetadata).filter(img => img.status === 'new').length;
    res.json(count);
  } else {
    fs.readdir(NEW_IMAGES_FOLDER, (err, files) => {
      if (err) return res.status(500).send('Error reading folder');
      const count = files.filter(f => /\.(jpg|jpeg|png|gif)$/i.test(f)).length;
      res.json(count);
    });
  }
});

// Move image (Approve/Deny)
app.post('/api/move-image', (req, res) => {
  const { filename, status } = req.body;
  if (!filename || !status) return res.status(400).send('Missing filename or status');

  if (USE_JSON_MODE) {
    if (!imageMetadata[filename]) imageMetadata[filename] = { status: 'new' };
    imageMetadata[filename].status = status;
    saveMetadata();
    res.send('Metadata updated');
  } else {
    const sourcePath = path.join(NEW_IMAGES_FOLDER, filename);
    const targetFolder = status === 'approved' ? APPROVED_FOLDER : DENIED_FOLDER;
    const targetPath = path.join(targetFolder, filename);

    fs.rename(sourcePath, targetPath, (err) => {
      if (err) return res.status(500).send('Failed to move image');
      res.send('Image moved');
    });
  }
});

// Move back to new
app.post('/api/move-back-to-new', (req, res) => {
  const { filename, fromStatus } = req.body;
  if (!filename || !fromStatus) return res.status(400).send('Missing fields');

  if (USE_JSON_MODE) {
    if (!imageMetadata[filename]) return res.status(404).send('Not found in metadata');
    imageMetadata[filename].status = 'new';
    saveMetadata();
    res.send('Moved back to new');
  } else {
    const sourceFolder = fromStatus === 'approved' ? APPROVED_FOLDER : DENIED_FOLDER;
    const sourcePath = path.join(sourceFolder, filename);
    const targetPath = path.join(NEW_IMAGES_FOLDER, filename);

    fs.rename(sourcePath, targetPath, (err) => {
      if (err) return res.status(500).send('Failed to move back');
      res.send('Image moved back to new');
    });
  }
});

// === WebSocket Notifications + JSON Sync ===
wss.on('connection', (ws) => {
  console.log('📡 WebSocket client connected');
});

fs.watch(ALL_IMAGES_FOLDER, { recursive: true }, (eventType, filename) => {
  if (!filename || !/\.(jpg|jpeg|png|gif)$/i.test(filename)) return;

  if (USE_JSON_MODE) {
    if (!imageMetadata[filename]) {
      imageMetadata[filename] = { status: 'new', timestamp: Date.now() };
      saveMetadata();
      console.log(`📸 Auto-added ${filename} to metadata`);
    }
  }

  broadcastFolderChange();
});

function broadcastFolderChange() {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send('folderChanged');
    }
  });
}

// Start server
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`🚀 Moderation server running at http://localhost:${PORT}`);
});
