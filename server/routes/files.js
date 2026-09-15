const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const uploadDir = path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = (Date.now() + '-' + Math.round(Math.random() * 1E9)) + '_' + file.originalname;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 } // 500MB
});

// Helper to get user record
async function getUserByUsername(username) {
  return await db.get('SELECT * FROM users WHERE username = ?', [username]);
}

// POST /api/files/upload
router.post('/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    const user = await getUserByUsername(req.user.username);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const originalName = req.file.originalname;
    const storedName = req.file.filename;
    const mimetype = req.file.mimetype;
    const size = req.file.size;
    const createdAt = new Date().toISOString();

    const result = await db.run(
      `INSERT INTO files (original_name, stored_name, mimetype, size, uploaded_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [originalName, storedName, mimetype, size, user.id, createdAt]
    );

    const insertedId = result.lastInsertRowid;

    res.json({
      id: insertedId,
      originalName,
      storedName,
      mimetype,
      size,
      createdAt
    });
  } catch (err) {
    console.error('File upload error:', err);
    res.status(500).json({ message: err.message || 'File upload failed' });
  }
});

// GET /api/files (List user files)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const user = await getUserByUsername(req.user.username);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const rows = await db.all(
      `SELECT id, original_name as originalName, stored_name as storedName, mimetype, size, created_at as createdAt 
       FROM files 
       WHERE uploaded_by = ? 
       ORDER BY created_at DESC, id DESC`,
      [user.id]
    );

    res.json(rows || []);
  } catch (err) {
    console.error('List files error:', err);
    res.status(500).json({ message: err.message || 'Could not fetch files' });
  }
});

// GET /api/files/download/:storedName
router.get('/download/:storedName', async (req, res) => {
  try {
    const storedName = req.params.storedName;
    const filePath = path.join(uploadDir, storedName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found: ' + storedName });
    }

    // Try to lookup original filename
    const fileRecord = await db.get('SELECT original_name, mimetype FROM files WHERE stored_name = ?', [storedName]);
    const downloadName = fileRecord ? fileRecord.original_name : storedName;
    const mime = fileRecord ? fileRecord.mimetype : 'application/octet-stream';

    res.setHeader('Content-Type', mime || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(downloadName)}"`);

    const readStream = fs.createReadStream(filePath);
    readStream.pipe(res);
  } catch (err) {
    console.error('Download error:', err);
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/files/:id
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const fileId = req.params.id;
    const user = await getUserByUsername(req.user.username);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const fileRecord = await db.get('SELECT * FROM files WHERE id = ?', [fileId]);

    if (!fileRecord) {
      return res.status(404).json({ message: 'File not found' });
    }

    if (fileRecord.uploaded_by !== user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this file' });
    }

    // Unlink file from disk
    const filePath = path.join(uploadDir, fileRecord.stored_name);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (e) {
        console.warn('Could not delete file from disk:', e.message);
      }
    }

    await db.run('DELETE FROM files WHERE id = ?', [fileId]);
    res.send('File deleted');
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/files/stats
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const user = await getUserByUsername(req.user.username);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const stats = await db.get(
      `SELECT COUNT(*) as totalFiles, COALESCE(SUM(size), 0) as totalBytes FROM files WHERE uploaded_by = ?`,
      [user.id]
    );

    res.json({
      totalFiles: stats.totalFiles || 0,
      totalBytes: stats.totalBytes || 0
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
