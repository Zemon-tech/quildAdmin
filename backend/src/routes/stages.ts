import { Router, Request, Response } from 'express';
import { PodStage } from '../models/PodStage';
import { Pod } from '../models/Pod';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/admin/stages', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const podId = req.query.podId as string;
    const type = req.query.type as string;

    const query: any = {};
    
    if (podId) {
      query.pod = podId;
    }

    if (type) {
      query.type = type;
    }

    const skip = (page - 1) * limit;
    
    const [stages, total] = await Promise.all([
      PodStage.find(query)
        .skip(skip)
        .limit(limit)
        .sort({ order: 1 })
        .populate('pod', 'title phase'),
      PodStage.countDocuments(query),
    ]);

    res.json({
      stages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching stages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/admin/stages', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { pod: podId, order, ...stageData } = req.body;

    const pod = await Pod.findById(podId);
    if (!pod) {
      res.status(404).json({ error: 'Pod not found' });
      return;
    }

    const stage = new PodStage({
      ...stageData,
      pod: podId,
      order: order || 0,
    });
    
    await stage.save();

    res.status(201).json(await stage.populate('pod'));
  } catch (error) {
    console.error('Error creating stage:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/admin/stages/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const stage = await PodStage.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate('pod');

    if (!stage) {
      res.status(404).json({ error: 'Stage not found' });
      return;
    }

    res.json(stage);
  } catch (error) {
    console.error('Error updating stage:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/admin/stages/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const stage = await PodStage.findByIdAndDelete(req.params.id);

    if (!stage) {
      res.status(404).json({ error: 'Stage not found' });
      return;
    }
    
    res.json({ message: 'Stage deleted successfully' });
  } catch (error) {
    console.error('Error deleting stage:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
