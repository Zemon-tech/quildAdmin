import { Router, Request, Response } from 'express';
import { Problem } from '../models/Problem';
import { Pod } from '../models/Pod';
import { PodStage } from '../models/PodStage';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import fs from 'fs';
import path from 'path';

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

// Get problem details with complete pod and stage information
router.get('/problems/:slug', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;
    const userId = req.userId!;

    // Find problem with populated pods
    const problem = await Problem.findOne({ slug, isPublic: true })
      .populate({
        path: 'pods.pod',
        populate: {
          path: 'problem',
          select: 'title slug'
        }
      });

    if (!problem) {
      res.status(404).json({ error: 'Problem not found' });
      return;
    }

    // Get all pods for this problem with their stages
    const pods = await Pod.find({ problem: problem._id })
      .sort({ order: 1 })
      .populate('problem', 'title slug');

    // Get all stages for all pods
    const podIds = pods.map(p => p._id);
    const stages = await PodStage.find({ pod: { $in: podIds } })
      .sort({ order: 1 })
      .populate('pod', 'title phase problem');

    // Group stages by pod
    const stagesByPod = stages.reduce((acc, stage) => {
      const podId = stage.pod._id.toString();
      if (!acc[podId]) {
        acc[podId] = [];
      }
      acc[podId].push(stage);
      return acc;
    }, {} as Record<string, any[]>);

    // Combine pods with their stages
    const podsWithStages = pods.map(pod => ({
      ...pod.toObject(),
      stages: stagesByPod[pod._id.toString()] || []
    }));

    // Load external content if any
    let externalContent = null;
    for (const pod of pods) {
      if (pod.content_file_path) {
        try {
          const contentPath = path.join(process.cwd(), pod.content_file_path);
          if (fs.existsSync(contentPath)) {
            externalContent = fs.readFileSync(contentPath, 'utf-8');
            break; // Load first available content
          }
        } catch (error) {
          console.error('Error loading external content:', error);
        }
      }
    }

    res.json({
      ...problem.toObject(),
      pods: podsWithStages,
      externalContent
    });
  } catch (error) {
    console.error('Error fetching problem details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Content delivery endpoints
router.get('/content/pods/:podId/content', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { podId } = req.params;

    const pod = await Pod.findById(podId);
    if (!pod) {
      res.status(404).json({ error: 'Pod not found' });
      return;
    }

    let content = '';
    
    // Return markdown content if available
    if (pod.description_md) {
      content = pod.description_md;
    }
    
    // Load external content if content_file_path is specified
    if (pod.content_file_path) {
      try {
        const contentPath = path.join(process.cwd(), pod.content_file_path);
        if (fs.existsSync(contentPath)) {
          content = fs.readFileSync(contentPath, 'utf-8');
        }
      } catch (error) {
        console.error('Error loading external content:', error);
      }
    }

    res.json({
      content,
      contentType: 'markdown'
    });
  } catch (error) {
    console.error('Error fetching pod content:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/content/pods/:podId/stages/:stageId/content', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { podId, stageId } = req.params;

    const stage = await PodStage.findOne({ _id: stageId, pod: podId });
    if (!stage) {
      res.status(404).json({ error: 'Stage not found' });
      return;
    }

    let content = '';
    
    // Return stage content markdown if available
    if (stage.content.content_md) {
      content = stage.content.content_md;
    }
    
    // Load external content if stageId matches a file
    if (stage.stageId) {
      try {
        const contentPath = path.join(process.cwd(), 'content', 'stages', `${stage.stageId}.md`);
        if (fs.existsSync(contentPath)) {
          content = fs.readFileSync(contentPath, 'utf-8');
        }
      } catch (error) {
        console.error('Error loading external stage content:', error);
      }
    }

    res.json({
      content,
      contentType: 'markdown',
      stageContent: stage.content
    });
  } catch (error) {
    console.error('Error fetching stage content:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
