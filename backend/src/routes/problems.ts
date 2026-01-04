import { Router, Request, Response } from 'express';
import { Problem } from '../models/Problem';
import { Pod } from '../models/Pod';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/admin/problems', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const difficulty = req.query.difficulty as string;
    const isPublic = req.query.isPublic;

    const query: any = {};
    
    if (difficulty) {
      query.difficulty = difficulty;
    }

    if (isPublic !== undefined) {
      query.isPublic = isPublic === 'true';
    }

    const skip = (page - 1) * limit;
    
    const [problems, total] = await Promise.all([
      Problem.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }),
      Problem.countDocuments(query),
    ]);

    res.json({
      problems,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching problems:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/admin/problems', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const problem = new Problem(req.body);
    await problem.save();
    res.status(201).json(problem);
  } catch (error) {
    console.error('Error creating problem:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/admin/problems/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const problem = await Problem.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!problem) {
      res.status(404).json({ error: 'Problem not found' });
      return;
    }

    res.json(problem);
  } catch (error) {
    console.error('Error updating problem:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/admin/problems/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const problem = await Problem.findByIdAndDelete(req.params.id);

    if (!problem) {
      res.status(404).json({ error: 'Problem not found' });
      return;
    }

    await Pod.deleteMany({ problem: req.params.id });
    
    res.json({ message: 'Problem deleted successfully' });
  } catch (error) {
    console.error('Error deleting problem:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
