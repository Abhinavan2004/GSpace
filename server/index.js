const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const fileRoutes = require('./routes/files');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', service: 'GSpace Node Express SQLite Backend' });
});

// Serve frontend build static files if client build exists
const clientBuildPath = path.resolve(__dirname, '../client/dist');
app.use(express.static(clientBuildPath));

app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  const indexPath = path.join(clientBuildPath, 'index.html');
  if (require('fs').existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  res.status(200).send('GSpace API Server Running on port ' + PORT);
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 GSpace Node+Express+SQLite server running at http://localhost:${PORT}`);
});
