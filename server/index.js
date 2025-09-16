require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const db = require('./models/database');

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy for Railway deployment
app.set('trust proxy', 1);

// Middleware
app.use(helmet());
// 임시로 모든 도메인 허용 (디버깅용)
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Force UTF-8 encoding for all responses
app.use((req, res, next) => {
  res.charset = 'utf-8';
  next();
});

// UTF-8 encoding handling
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Accept-Charset', 'utf-8');
  next();
});

// JSON stringify override for proper UTF-8 encoding
const originalJson = app.response.json;
app.response.json = function(obj) {
  return originalJson.call(this, obj);
};

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Request logging middleware
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.url} - Origin: ${req.headers.origin || 'None'}`);
  next();
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/dreams', require('./routes/dreams'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/community', require('./routes/community'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/qna', require('./routes/qna'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Dream Interpretation API is running' });
});


// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});