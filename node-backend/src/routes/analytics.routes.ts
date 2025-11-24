import { Router } from 'express';
import { analyticsController } from '../controllers/analytics.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/dashboard/overview', authenticate, analyticsController.getDashboardOverview.bind(analyticsController));
router.get('/dashboard/unified', authenticate, analyticsController.getUnifiedDashboard.bind(analyticsController));
router.get('/plant-performance', authenticate, analyticsController.getPlantPerformance.bind(analyticsController));
router.get('/category-breakdown', authenticate, analyticsController.getCategoryBreakdown.bind(analyticsController));
router.get('/cost-savings', authenticate, analyticsController.getCostSavings.bind(analyticsController));
router.get('/cost-analysis', authenticate, analyticsController.getCostAnalysis.bind(analyticsController));
router.get('/plant-monthly-breakdown/:plantId', authenticate, analyticsController.getPlantMonthlyBreakdown.bind(analyticsController));
router.get('/star-ratings', authenticate, analyticsController.getStarRatings.bind(analyticsController));
router.get('/plant-monthly-trend/:plantId', authenticate, analyticsController.getPlantMonthlyTrend.bind(analyticsController));
router.get('/benchmark-stats', authenticate, analyticsController.getBenchmarkStats.bind(analyticsController));
router.post('/recalculate-savings', authenticate, analyticsController.recalculateSavings.bind(analyticsController));

export default router;

