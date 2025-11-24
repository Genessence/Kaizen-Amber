import { Router } from 'express';
import { leaderboardController } from '../controllers/leaderboard.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, leaderboardController.getLeaderboard.bind(leaderboardController));
router.get('/plant/:plantId', authenticate, leaderboardController.getPlantBreakdown.bind(leaderboardController));
router.post('/recalculate', authenticate, leaderboardController.recalculateLeaderboard.bind(leaderboardController));

export default router;

