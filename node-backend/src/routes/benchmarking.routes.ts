import { Router } from 'express';
import { benchmarkingController } from '../controllers/benchmarking.controller';
import { authenticate, requireHQ } from '../middleware/auth';

const router = Router();

router.post('/benchmark/:id', authenticate, requireHQ, benchmarkingController.benchmarkPractice.bind(benchmarkingController));
router.delete('/unbenchmark/:id', authenticate, requireHQ, benchmarkingController.unbenchmarkPractice.bind(benchmarkingController));
router.get('/list', authenticate, benchmarkingController.listBenchmarkedPractices.bind(benchmarkingController));
router.get('/recent', authenticate, benchmarkingController.getRecentBenchmarkedPractices.bind(benchmarkingController));
router.get('/copies/:id', authenticate, benchmarkingController.getPracticeCopies.bind(benchmarkingController));
router.get('/total-count', authenticate, benchmarkingController.getTotalBenchmarkedCount.bind(benchmarkingController));
router.get('/copy-spread', authenticate, benchmarkingController.getCopySpread.bind(benchmarkingController));

export default router;

