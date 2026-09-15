const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || username.trim().length < 3) {
      return res.status(400).send('Username must be at least 3 characters.');
    }
    if (!password || password.length < 6) {
      return res.status(400).send('Password must be at least 6 characters.');
    }

    const trimmedUsername = username.trim();

    // Check if user exists
    let existingUser;
    if (typeof db.prepare === 'function' && typeof db.prepare('').get === 'function') {
      const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
      existingUser = await stmt.get(trimmedUsername);
    } else {
      existingUser = db.prepare('SELECT * FROM users WHERE username = ?').get(trimmedUsername);
    }

    if (existingUser) {
      return res.status(400).send('Username already taken. Please choose another.');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const now = new Date().toISOString();

    if (typeof db.prepare === 'function' && typeof db.prepare('').run === 'function' && db.prepare('').run.constructor.name === 'AsyncFunction') {
      await db.prepare('INSERT INTO users (username, password, created_at) VALUES (?, ?, ?)').run(trimmedUsername, hashedPassword, now);
    } else {
      db.prepare('INSERT INTO users (username, password, created_at) VALUES (?, ?, ?)').run(trimmedUsername, hashedPassword, now);
    }

    console.log(`✅ New user created: ${trimmedUsername}`);
    return res.ok ? res.ok('Account created successfully.') : res.status(200).send('Account created successfully.');
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(400).send(err.message || 'Error creating account');
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(401).send('Invalid username or password.');
    }

    const trimmedUsername = username.trim();

    let user;
    if (typeof db.prepare === 'function' && typeof db.prepare('').get === 'function' && db.prepare('').get.constructor.name === 'AsyncFunction') {
      user = await db.prepare('SELECT * FROM users WHERE username = ?').get(trimmedUsername);
    } else {
      user = db.prepare('SELECT * FROM users WHERE username = ?').get(trimmedUsername);
    }

    if (!user) {
      return res.status(401).send('Invalid username or password.');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).send('Invalid username or password.');
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, sub: user.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({ token, username: user.username });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(401).send('Invalid username or password.');
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
  try {
    let user;
    if (typeof db.prepare === 'function' && typeof db.prepare('').get === 'function' && db.prepare('').get.constructor.name === 'AsyncFunction') {
      user = await db.prepare('SELECT id, username, created_at FROM users WHERE username = ?').get(req.user.username);
    } else {
      user = db.prepare('SELECT id, username, created_at FROM users WHERE username = ?').get(req.user.username);
    }

    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
