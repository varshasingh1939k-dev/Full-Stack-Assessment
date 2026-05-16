import express from 'express';
import { 
  getDashboardStats,
  getDashboardSummary,
  getDashboardByStatus,
  getDashboardByUser,
  getDashboardOverdue
} from '../controllers/dashboardController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/summary', getDashboardSummary);
router.get('/by-status', getDashboardByStatus);
router.get('/by-user', getDashboardByUser);
router.get('/overdue', getDashboardOverdue);

// Keep existing just in case
router.route('/').get(getDashboardStats);

export default router;
