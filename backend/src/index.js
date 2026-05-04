import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './db.js';
import sessionsRouter from './routes/sessions.js';
import analyticsRouter from './routes/analytics.js';

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors({ origin: '*' })); // Allow all origins for development
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Basic health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'PlayTrace Backend is running' });
});

// Routes
app.use('/api/sessions', sessionsRouter);
app.use('/api/analytics', analyticsRouter);

// Error handler for unhandled errors
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
