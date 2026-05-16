import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import authRoutes from './routes/authRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import memberRoutes from './routes/memberRoutes.js';
import { projectTaskRouter, taskRouter } from './routes/taskRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/projects', memberRoutes);
app.use('/api/projects/:projectId/tasks', projectTaskRouter);
app.use('/api/tasks', taskRouter);
app.use('/api/dashboard', dashboardRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Team Task Manager API is running'
  });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  app.use(express.static(path.join(__dirname, '../../client/dist')));

  app.get(/(.*)/, (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/dist', 'index.html'));
  });
}

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

export default app;
