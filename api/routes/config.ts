import { Router } from 'express';
import { getDb } from '../db.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';
import type { AuthRequest } from '../middleware/auth.js';

const router = Router();

router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    const configs = await db.all('SELECT * FROM config');
    const configMap: Record<string, string> = {};
    for (const c of configs) {
      configMap[c.key] = c.value;
    }
    res.json(configMap);
  } catch (error) {
    res.status(500).json({ message: '获取配置失败' });
  }
});

router.put('/', authMiddleware, roleMiddleware(['admin']), async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    const updates = req.body;

    for (const [key, value] of Object.entries(updates)) {
      await db.run(
        'INSERT INTO config (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP',
        [key, value, value]
      );
    }

    res.json({ message: '更新成功' });
  } catch (error) {
    res.status(500).json({ message: '更新配置失败' });
  }
});

export default router;
