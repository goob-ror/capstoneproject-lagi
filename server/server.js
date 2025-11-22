const express = require('express');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const ibuRoutes = require('./routes/ibuRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from React app
app.use(express.static(path.join(__dirname, '../build')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/ibu', ibuRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Serve React app for all other routes (only in production)
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../build', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
