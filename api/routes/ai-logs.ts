import { Router } from 'express';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';
import type { AuthRequest } from '../middleware/auth.js';
import { getAILogs, getAIStats } from '../utils/aiClient.js';

const router = Router();

router.get('/', authMiddleware, roleMiddleware(['admin']), async (req: AuthRequest, res) => {
  try {
    const { feature, limit, offset } = req.query;
    const result = await getAILogs({
      feature: feature as string | undefined,
      limit: limit ? parseInt(limit as string) : 50,
      offset: offset ? parseInt(offset as string) : 0,
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: '获取AI使用记录失败' });
  }
});

router.get('/stats', authMiddleware, roleMiddleware(['admin']), async (req: AuthRequest, res) => {
  try {
    const stats = await getAIStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: '获取AI统计失败' });
  }
});

export default router;
