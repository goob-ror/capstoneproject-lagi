require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');

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

// Trust the first proxy (needed for rate limiter behind webpack dev proxy / reverse proxy)
app.set('trust proxy', 1);

// Security Headers
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
  );
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

// Global API rate limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Terlalu banyak permintaan, coba lagi nanti.' }
});

// Middleware
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:6969', 'http://127.0.0.1:6767'];

app.use(cors({
  origin: (origin, callback) => {
    // Normalize by stripping trailing slash before comparing
    const normalizedOrigin = origin ? origin.replace(/\/$/, '') : origin;
    if (!normalizedOrigin || allowedOrigins.includes(normalizedOrigin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400 // Cache preflight for 24h
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply global rate limiter to all API routes
app.use('/api', globalLimiter);

// Apply input validation to all routes (except health check)
app.use('/api', validateAllInputs({
  blockMalicious: true,
  sanitizeAuto: true,
  logThreats: true
}));

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

app.listen(PORT, () => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`Server running on port ${PORT}`);
  }
});
