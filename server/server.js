const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const ibuRoutes = require('./routes/ibuRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const ancRoutes = require('./routes/ancRoutes');
const komplikasiRoutes = require('./routes/komplikasiRoutes');
const rekapitulasiRoutes = require('./routes/rekapitulasiRoutes');
const posyanduRoutes = require('./routes/posyanduRoutes');
const kelurahanRoutes = require('./routes/kelurahanRoutes');
const auth = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from React app
app.use(express.static(path.join(__dirname, '../build')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/ibu', ibuRoutes);
app.use('/api/dashboard', auth, dashboardRoutes);
app.use('/api/anc', ancRoutes);
app.use('/api/komplikasi', komplikasiRoutes);
app.use('/api/rekapitulasi', rekapitulasiRoutes);
app.use('/api/posyandu', posyanduRoutes);
app.use('/api/kelurahan', kelurahanRoutes);

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
