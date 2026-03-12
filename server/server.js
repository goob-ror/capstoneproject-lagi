const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const ibuRoutes = require('./routes/ibuRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const ancRoutes = require('./routes/ancRoutes');
const persalinanRoutes = require('./routes/persalinanRoutes');
const nifasRoutes = require('./routes/nifasRoutes');
const komplikasiRoutes = require('./routes/komplikasiRoutes');
const rekapitulasiRoutes = require('./routes/rekapitulasiRoutes');
const posyanduRoutes = require('./routes/posyanduRoutes');
const kelurahanRoutes = require('./routes/kelurahanRoutes');
const userRoutes = require('./routes/userRoutes');
const excelExportRoutes = require('./routes/excelExportRoutes');
const excelReportBulananRoutes = require('./routes/excelReportBulananRoutes');
const reportDataRoutes = require('./routes/reportDataRoutes');
const auth = require('./middleware/auth');
const { validateAllInputs } = require('./middleware/inputValidator');

const app = express();
const PORT = process.env.PORT || 5000;

// Security Headers
app.use((req, res, next) => {
  // Content Security Policy
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
  );
  // Prevent XSS attacks
  res.setHeader('X-XSS-Protection', '1; mode=block');
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Middleware
app.use(cors({
  origin: ['http://localhost:6969', 'http://127.0.0.1:6767'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply input validation to all routes (except health check)
app.use('/api', validateAllInputs({
  blockMalicious: true,
  sanitizeAuto: true,
  logThreats: true
}));

// Serve static files from React app
app.use(express.static(path.join(__dirname, '../build')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/ibu', ibuRoutes);
app.use('/api/dashboard', auth, dashboardRoutes);
app.use('/api/anc', ancRoutes);
app.use('/api/persalinan', persalinanRoutes);
app.use('/api/nifas', nifasRoutes);
app.use('/api/komplikasi', komplikasiRoutes);
app.use('/api/rekapitulasi', rekapitulasiRoutes);
app.use('/api/posyandu', posyanduRoutes);
app.use('/api/kelurahan', kelurahanRoutes);
app.use('/api/users', userRoutes);
app.use('/api/excel-export', excelExportRoutes);
app.use('/api/excel-report-bulanan', excelReportBulananRoutes);
app.use('/api/report-data', reportDataRoutes);

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
