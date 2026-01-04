import { Router, Request, Response } from 'express';
import { Pod } from '../models/Pod';
import { Problem } from '../models/Problem';
import { PodStage } from '../models/PodStage';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/admin/pods', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const phase = req.query.phase as string;
    const search = req.query.search as string;

    const query: any = {};
    
    if (phase) {
      query.phase = phase;
    }

    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    const skip = (page - 1) * limit;
    
    const [pods, total] = await Promise.all([
      Pod.find(query)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .populate('problem', 'title slug'),
      Pod.countDocuments(query),
    ]);

    res.json({
      pods,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching pods:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/admin/pods', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { problem: problemId, order, ...podData } = req.body;

    const problem = await Problem.findById(problemId);
    if (!problem) {
      res.status(404).json({ error: 'Problem not found' });
      return;
    }

    const pod = new Pod({
      ...podData,
      problem: problemId,
      order: order || 0,
    });
    
    await pod.save();
    
    problem.pods.push({ pod: pod._id, order: pod.order, weight: 1 });
    await problem.save();

    res.status(201).json(await pod.populate('problem'));
  } catch (error) {
    console.error('Error creating pod:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/admin/pods/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const pod = await Pod.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate('problem');

    if (!pod) {
      res.status(404).json({ error: 'Pod not found' });
      return;
    }

    res.json(pod);
  } catch (error) {
    console.error('Error updating pod:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/admin/pods/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const pod = await Pod.findByIdAndDelete(req.params.id);

    if (!pod) {
      res.status(404).json({ error: 'Pod not found' });
      return;
    }

    await PodStage.deleteMany({ pod: req.params.id });
    
    await Problem.updateOne(
      { _id: pod.problem },
      { $pull: { pods: { pod: req.params.id } } }
    );
    
    res.json({ message: 'Pod deleted successfully' });
  } catch (error) {
    console.error('Error deleting pod:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
