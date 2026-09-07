const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { errorHandler } = require('./middleware/errorHandler');
const { AppError } = require('./utils/apiResponse');

const authRoutes = require('./routes/authRoutes');
const healthRoutes = require('./routes/healthRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
const teamRoutes = require('./routes/teamRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const plannerRoutes = require('./routes/plannerRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const docRoutes = require('./routes/docRoutes');
const { apiLimiter } = require('./middleware/rateLimiter');

const app = express();

// Security HTTP headers
app.use(helmet({ contentSecurityPolicy: false }));

// Request logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Global API rate limiting
app.use('/api', apiLimiter);

// CORS setup (supports single-domain Render deployment, CLIENT_URL, and local dev)
app.use((req, res, next) => {
  const allowedOrigins = [
    process.env.CLIENT_URL,
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173'
  ].filter(Boolean);

  const origin = req.headers.origin;

  // Allow requests with no origin (e.g. mobile apps, curl, Postman, internal calls)
  if (!origin || process.env.NODE_ENV === 'development') {
    return cors({
      origin: origin || true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    })(req, res, next);
  }

  // Allow explicitly registered origins
  if (allowedOrigins.includes(origin)) {
    return cors({
      origin,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    })(req, res, next);
  }

  // Allow same-origin requests dynamically on Render
  if (req.headers.host) {
    try {
      const originHost = new URL(origin).host;
      if (originHost === req.headers.host) {
        return cors({
          origin,
          credentials: true,
          methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
          allowedHeaders: ['Content-Type', 'Authorization']
        })(req, res, next);
      }
    } catch {
      // ignore parse error
    }
  }

  return next(new AppError('CORS origin blocked', 403));
});

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/docs', docRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/planner', plannerRoutes);
app.use('/api/notifications', notificationRoutes);

// Serve frontend static assets if built
const clientDistPath = path.join(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath, { index: false }));
}

// Root informational endpoint & browser entry point
app.get('/', (req, res) => {
  // If a browser is accessing root, serve the SPA client
  if (req.headers.accept && req.headers.accept.includes('text/html') && fs.existsSync(path.join(clientDistPath, 'index.html'))) {
    return res.sendFile(path.join(clientDistPath, 'index.html'));
  }

  // API clients, curl, and automated test suites receive JSON status
  res.json({
    name: 'Web-Based Integrated Project-Monitoring Platform API',
    version: '1.0.0',
    status: 'operational',
    documentation: '/api/docs',
    health: '/api/health'
  });
});

// 404 Handler for undefined API routes
app.all('/api/*', (req, res, next) => {
  next(new AppError(`Cannot find ${req.method} ${req.originalUrl} on this server`, 404));
});

// Single Page Application (SPA) routing fallback: send index.html for all non-API GET routes
app.get('*', (req, res, next) => {
  const indexPath = path.join(clientDistPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  next(new AppError(`Cannot find ${req.method} ${req.originalUrl} on this server`, 404));
});

// 404 Handler for undefined non-GET requests (e.g. POST to unknown path)
app.all('*', (req, res, next) => {
  next(new AppError(`Cannot find ${req.method} ${req.originalUrl} on this server`, 404));
});

// Centralized error handler
app.use(errorHandler);

module.exports = app;
