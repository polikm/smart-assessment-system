import { Router } from 'express';
import { getDb } from '../db.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';
import type { AuthRequest } from '../middleware/auth.js';

const router = Router();

// 获取FAQ列表（公开接口，无需登录）
router.get('/', async (req, res) => {
  try {
    const db = await getDb();
    const { category, search, status } = req.query;

    let query = 'SELECT * FROM faq_knowledge WHERE 1=1';
    const params: any[] = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    } else {
      query += ' AND status = "active"';
    }

    if (search) {
      query += ' AND (question LIKE ? OR answer LIKE ? OR tags LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    query += ' ORDER BY created_at DESC';

    const faqs = await db.all(query, params);
    res.json(faqs);
  } catch (error) {
    console.error('[FAQ] List error:', error);
    res.status(500).json({ message: '获取FAQ列表失败' });
  }
});

// 获取FAQ分类列表
router.get('/categories', async (req, res) => {
  try {
    const db = await getDb();
    const categories = await db.all(`
      SELECT category, COUNT(*) as count
      FROM faq_knowledge
      WHERE status = 'active'
      GROUP BY category
      ORDER BY count DESC
    `);
    res.json(categories);
  } catch (error) {
    console.error('[FAQ] Categories error:', error);
    res.status(500).json({ message: '获取分类失败' });
  }
});

// 获取单个FAQ
router.get('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const faq = await db.get('SELECT * FROM faq_knowledge WHERE id = ?', [req.params.id]);

    if (!faq) {
      return res.status(404).json({ message: 'FAQ不存在' });
    }

    res.json(faq);
  } catch (error) {
    console.error('[FAQ] Get error:', error);
    res.status(500).json({ message: '获取FAQ失败' });
  }
});

// 创建FAQ（管理员）
router.post('/', authMiddleware, roleMiddleware(['admin']), async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    const { question, answer, category, tags } = req.body;

    const result = await db.run(
      'INSERT INTO faq_knowledge (question, answer, category, tags) VALUES (?, ?, ?, ?)',
      [question, answer, category || 'general', tags || '']
    );

    res.status(201).json({ id: result.lastID, message: '创建成功' });
  } catch (error) {
    console.error('[FAQ] Create error:', error);
    res.status(500).json({ message: '创建FAQ失败' });
  }
});

// 更新FAQ（管理员）
router.put('/:id', authMiddleware, roleMiddleware(['admin']), async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    const { question, answer, category, tags, status } = req.body;

    await db.run(
      `UPDATE faq_knowledge SET
        question = COALESCE(?, question),
        answer = COALESCE(?, answer),
        category = COALESCE(?, category),
        tags = COALESCE(?, tags),
        status = COALESCE(?, status)
      WHERE id = ?`,
      [question, answer, category, tags, status, req.params.id]
    );

    res.json({ message: '更新成功' });
  } catch (error) {
    console.error('[FAQ] Update error:', error);
    res.status(500).json({ message: '更新FAQ失败' });
  }
});

// 删除FAQ（管理员）
router.delete('/:id', authMiddleware, roleMiddleware(['admin']), async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    await db.run('DELETE FROM faq_knowledge WHERE id = ?', [req.params.id]);
    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('[FAQ] Delete error:', error);
    res.status(500).json({ message: '删除FAQ失败' });
  }
});

export default router;
