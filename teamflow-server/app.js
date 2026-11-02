import express from 'express';
import cors from 'cors';
import { notFound, errorHandler } from './middleware/errorHandler.js';

const app = express();

// Core Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'TeamFlow API is running smoothly' });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

export default app;
