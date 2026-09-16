const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
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

// Configure Express to serve the built React app (client/dist or client/build)
const clientDistPath = path.resolve(__dirname, '../client/dist');
const clientBuildPath = path.resolve(__dirname, '../client/build');
const staticPath = fs.existsSync(clientDistPath) ? clientDistPath : clientBuildPath;

app.use(express.static(staticPath));

// Fallback route serving index.html for any unmatched non-API request (React SPA Routing)
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  const indexPath = path.join(staticPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  res.status(200).send('GSpace API Server Running on port ' + PORT);
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 GSpace Node+Express+SQLite server running at http://localhost:${PORT}`);
});
