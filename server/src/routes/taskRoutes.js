import express from 'express';
import {
  createTask,
  getProjectTasks,
  getTaskById,
  updateTask,
  deleteTask,
} from '../controllers/taskController.js';
import { protect } from '../middleware/authMiddleware.js';

const projectTaskRouter = express.Router({ mergeParams: true });
const taskRouter = express.Router();

projectTaskRouter.use(protect);
taskRouter.use(protect);

projectTaskRouter.route('/')
  .post(createTask)
  .get(getProjectTasks);

taskRouter.route('/:id')
  .get(getTaskById)
  .put(updateTask)
  .delete(deleteTask);

export { projectTaskRouter, taskRouter };
