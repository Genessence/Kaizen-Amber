import { Router } from 'express';
import { questionsController } from '../controllers/questions.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { askQuestionSchema, answerQuestionSchema } from '../utils/validators';

const router = Router();

router.get('/practice/:practiceId', authenticate, questionsController.getPracticeQuestions.bind(questionsController));
router.post(
  '/practice/:practiceId',
  authenticate,
  validate(askQuestionSchema),
  questionsController.askQuestion.bind(questionsController)
);
router.post(
  '/answer/:questionId',
  authenticate,
  validate(answerQuestionSchema),
  questionsController.answerQuestion.bind(questionsController)
);
router.delete('/:questionId', authenticate, questionsController.deleteQuestion.bind(questionsController));

export default router;

