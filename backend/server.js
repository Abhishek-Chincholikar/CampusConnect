require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const applicationRoutes = require('./routes/applications');
const organizationRoutes = require('./routes/organizations');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const announcementRoutes = require('./routes/announcements');
const reportRoutes = require('./routes/reports');

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const isOriginAllowed = (origin) => {
  if (!origin) {
    return true;
  }

  return allowedOrigins.some((allowedOrigin) => {
    if (allowedOrigin === '*') {
      return true;
    }

    if (allowedOrigin.includes('*')) {
      const escapedPattern = allowedOrigin
        .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
        .replace(/\*/g, '.*');
      const regex = new RegExp(`^${escapedPattern}$`);
      return regex.test(origin);
    }

    return allowedOrigin === origin;
  });
};

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (isOriginAllowed(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'CampusConnect API',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/organizations', organizationRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/announcements', announcementRoutes);
app.use(notFound);
app.use(errorHandler);

const startServer = async () => {
  await connectDB();

  const port = Number(process.env.PORT) || 5000;
  app.listen(port, () => {
    console.log(`API server listening on port ${port}`);
  });
};

if (require.main === module) {
  startServer().catch((error) => {
    console.error('Failed to start API server:', error);
    process.exit(1);
  });
}

module.exports = app;
