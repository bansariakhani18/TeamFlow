import express from 'express';
import { getMyDashboard } from '../controllers/analyticsController.js';
import { protect } from '../middleware/protect.js';

const router = express.Router();

router.use(protect);

/**
 * @route GET /api/dashboard/me
 * @desc Personal cross-project dashboard summary
 * @access Auth
 */
router.get('/me', getMyDashboard);

export default router;
