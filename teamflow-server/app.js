import express from 'express';
import cors from 'cors';
import projectRoutes from './routes/projectRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

const app = express();

// Core Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/public', express.static('public'));
app.use(express.static('public'));

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, status: 'ok', message: 'TeamFlow API is running smoothly' });
});

// Mount Routes
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

export default app;
