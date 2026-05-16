import express from 'express';
import {
  getProjectMembers,
  addProjectMember,
  removeProjectMember,
  getAvailableUsers,
} from '../controllers/memberController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/:projectId/members')
  .get(getProjectMembers)
  .post(addProjectMember);

router.route('/:projectId/available-users')
  .get(getAvailableUsers);

router.route('/:projectId/members/:userId')
  .delete(removeProjectMember);

export default router;
