import { Router } from 'express';
import SUBJECTS from '../data/knowledgePoints';

const router = Router();

router.get('/', (_req, res) => {
  res.json(SUBJECTS);
});

export default router;
