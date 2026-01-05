import { Router, Request, Response } from 'express';
import { PodStage } from '../models/PodStage';
import { Pod } from '../models/Pod';
import { Problem } from '../models/Problem';
import { UserStageProgress } from '../models/UserStageProgress';
import { PodAttempt } from '../models/PodAttempt';
import { ProblemAttempt } from '../models/ProblemAttempt';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import fs from 'fs';
import path from 'path';

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

// User-facing stage endpoints

// Get all stages for a specific pod with full content
router.get('/pods/:podId/stages', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { podId } = req.params;
    const userId = req.userId!;

    // Verify pod exists
    const pod = await Pod.findById(podId).populate('problem', 'title slug');
    if (!pod) {
      res.status(404).json({ error: 'Pod not found' });
      return;
    }

    // Get all stages for this pod
    const stages = await PodStage.find({ pod: podId })
      .sort({ order: 1 })
      .populate('pod', 'title phase problem');

    // Get user's progress for these stages
    const userProgress = await UserStageProgress.find({
      userId,
      stageId: { $in: stages.map(s => s._id) }
    });

    // Combine stages with progress
    const stagesWithProgress = stages.map(stage => {
      const progress = userProgress.find(p => p.stageId.toString() === stage._id.toString());
      return {
        ...stage.toObject(),
        userProgress: progress || null
      };
    });

    res.json({
      pod,
      stages: stagesWithProgress
    });
  } catch (error) {
    console.error('Error fetching pod stages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get specific stage details with full content
router.get('/pods/:podId/stages/:stageId', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { podId, stageId } = req.params;
    const userId = req.userId!;

    // Verify stage exists and belongs to the specified pod
    const stage = await PodStage.findOne({ _id: stageId, pod: podId })
      .populate('pod', 'title phase problem');

    if (!stage) {
      res.status(404).json({ error: 'Stage not found' });
      return;
    }

    // Get user's progress for this stage
    const progress = await UserStageProgress.findOne({
      userId,
      stageId: stage._id
    });

    // Load external content if content_file_path is specified
    let externalContent = null;
    const pod = stage.pod as any; // Cast to access populated fields
    if (pod && pod.content_file_path) {
      try {
        const contentPath = path.join(process.cwd(), pod.content_file_path);
        if (fs.existsSync(contentPath)) {
          externalContent = fs.readFileSync(contentPath, 'utf-8');
        }
      } catch (error) {
        console.error('Error loading external content:', error);
      }
    }

    res.json({
      ...stage.toObject(),
      userProgress: progress || null,
      externalContent
    });
  } catch (error) {
    console.error('Error fetching stage details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start a stage
router.post('/pods/:podId/stages/:stageId/start', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { podId, stageId } = req.params;
    const userId = req.userId!;

    // Verify stage exists
    const stage = await PodStage.findOne({ _id: stageId, pod: podId });
    if (!stage) {
      res.status(404).json({ error: 'Stage not found' });
      return;
    }

    // Find or create pod attempt
    let podAttempt = await PodAttempt.findOne({
      userId,
      pod: podId,
      status: 'active'
    });

    if (!podAttempt) {
      // Create problem attempt first if needed
      const pod = await Pod.findById(podId);
      if (!pod) {
        res.status(404).json({ error: 'Pod not found' });
        return;
      }

      let problemAttempt = await ProblemAttempt.findOne({
        userId,
        problem: pod.problem,
        status: 'active'
      });

      if (!problemAttempt) {
        problemAttempt = new ProblemAttempt({
          userId,
          problem: pod.problem,
          status: 'active',
          startedAt: new Date()
        });
        await problemAttempt.save();
      }

      // Create pod attempt
      podAttempt = new PodAttempt({
        userId,
        problemAttempt: problemAttempt._id,
        pod: podId,
        status: 'active',
        startedAt: new Date()
      });
      await podAttempt.save();
    }

    // Create or update stage progress
    let stageProgress = await UserStageProgress.findOne({
      userId,
      stageId: stage._id,
      podAttemptId: podAttempt._id
    });

    if (!stageProgress) {
      stageProgress = new UserStageProgress({
        userId,
        stageId: stage._id,
        podAttemptId: podAttempt._id,
        status: 'in_progress',
        startedAt: new Date(),
        timeSpent: 0
      });
    } else if (stageProgress.status === 'locked') {
      stageProgress.status = 'in_progress';
      stageProgress.startedAt = new Date();
    }

    await stageProgress.save();

    res.json({
      message: 'Stage started successfully',
      stageProgress
    });
  } catch (error) {
    console.error('Error starting stage:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Complete a stage
router.post('/pods/:podId/stages/:stageId/complete', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { podId, stageId } = req.params;
    const userId = req.userId!;
    const { assessmentScore, notes } = req.body;

    // Verify stage exists
    const stage = await PodStage.findOne({ _id: stageId, pod: podId });
    if (!stage) {
      res.status(404).json({ error: 'Stage not found' });
      return;
    }

    // Find user's stage progress
    const stageProgress = await UserStageProgress.findOne({
      userId,
      stageId: stage._id
    });

    if (!stageProgress) {
      res.status(404).json({ error: 'Stage progress not found' });
      return;
    }

    // Update stage progress
    stageProgress.status = 'completed';
    stageProgress.completedAt = new Date();
    if (assessmentScore !== undefined) {
      stageProgress.assessmentScore = assessmentScore;
    }
    if (notes) {
      stageProgress.notes = notes;
    }

    await stageProgress.save();

    res.json({
      message: 'Stage completed successfully',
      stageProgress
    });
  } catch (error) {
    console.error('Error completing stage:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update stage progress
router.patch('/pods/:podId/stages/:stageId/progress', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { podId, stageId } = req.params;
    const userId = req.userId!;
    const { timeSpent, resourcesViewed, caseStudiesViewed, practiceProblemAttempts, mcqAttempts } = req.body;

    // Find user's stage progress
    const stageProgress = await UserStageProgress.findOne({
      userId,
      stageId: stageId
    });

    if (!stageProgress) {
      res.status(404).json({ error: 'Stage progress not found' });
      return;
    }

    // Update progress fields
    if (timeSpent !== undefined) {
      stageProgress.timeSpent = timeSpent;
    }
    if (resourcesViewed) {
      stageProgress.resourcesViewed = resourcesViewed;
    }
    if (caseStudiesViewed) {
      stageProgress.caseStudiesViewed = caseStudiesViewed;
    }
    if (practiceProblemAttempts) {
      stageProgress.practiceProblemAttempts = practiceProblemAttempts;
    }
    if (mcqAttempts) {
      stageProgress.mcqAttempts = mcqAttempts;
    }

    stageProgress.lastAccessedAt = new Date();
    await stageProgress.save();

    res.json({
      message: 'Stage progress updated successfully',
      stageProgress
    });
  } catch (error) {
    console.error('Error updating stage progress:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Submit practice problem answer
router.post('/pods/:podId/stages/:stageId/practice/submit', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { podId, stageId } = req.params;
    const userId = req.userId!;
    const { problemId, userAnswer } = req.body;

    // Verify stage exists and get practice problem
    const stage = await PodStage.findOne({ _id: stageId, pod: podId });
    if (!stage) {
      res.status(404).json({ error: 'Stage not found' });
      return;
    }

    const practiceProblem = stage.content.practiceProblems?.find(p => p.id === problemId);
    if (!practiceProblem) {
      res.status(404).json({ error: 'Practice problem not found' });
      return;
    }

    // Check if answer is correct
    const isCorrect = userAnswer.trim().toLowerCase() === practiceProblem.solution?.trim().toLowerCase();

    // Find or create stage progress
    let stageProgress = await UserStageProgress.findOne({
      userId,
      stageId: stage._id
    });

    if (!stageProgress) {
      res.status(404).json({ error: 'Stage progress not found' });
      return;
    }

    // Add or update practice problem attempt
    const existingAttempt = stageProgress.practiceProblemAttempts.find(a => a.problemId === problemId);
    if (existingAttempt) {
      existingAttempt.userAnswer = userAnswer;
      existingAttempt.isCorrect = isCorrect;
      existingAttempt.attempts += 1;
      existingAttempt.timeSpent = req.body.timeSpent || existingAttempt.timeSpent;
      existingAttempt.completedAt = new Date();
    } else {
      stageProgress.practiceProblemAttempts.push({
        problemId,
        userAnswer,
        isCorrect,
        attempts: 1,
        timeSpent: req.body.timeSpent || 0,
        completedAt: new Date()
      });
    }

    await stageProgress.save();

    res.json({
      isCorrect,
      solution: isCorrect ? practiceProblem.solution : undefined,
      message: isCorrect ? 'Correct answer!' : 'Incorrect answer. Try again!'
    });
  } catch (error) {
    console.error('Error submitting practice problem:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Submit MCQ answer
router.post('/pods/:podId/stages/:stageId/assessment/submit', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { podId, stageId } = req.params;
    const userId = req.userId!;
    const { questionId, selectedOptionId } = req.body;

    // Verify stage exists and get MCQ question
    const stage = await PodStage.findOne({ _id: stageId, pod: podId });
    if (!stage) {
      res.status(404).json({ error: 'Stage not found' });
      return;
    }

    const mcqQuestion = stage.content.mcqs?.find(q => q.id === questionId);
    if (!mcqQuestion) {
      res.status(404).json({ error: 'MCQ question not found' });
      return;
    }

    const selectedOption = mcqQuestion.options.find(o => o.id === selectedOptionId);
    if (!selectedOption) {
      res.status(404).json({ error: 'Selected option not found' });
      return;
    }

    const isCorrect = selectedOption.isCorrect;

    // Find or create stage progress
    let stageProgress = await UserStageProgress.findOne({
      userId,
      stageId: stage._id
    });

    if (!stageProgress) {
      res.status(404).json({ error: 'Stage progress not found' });
      return;
    }

    // Add or update MCQ attempt
    const existingAttempt = stageProgress.mcqAttempts.find(a => a.questionId === questionId);
    if (existingAttempt) {
      existingAttempt.selectedOptionId = selectedOptionId;
      existingAttempt.isCorrect = isCorrect;
      existingAttempt.timeSpent = req.body.timeSpent || existingAttempt.timeSpent;
      existingAttempt.completedAt = new Date();
    } else {
      stageProgress.mcqAttempts.push({
        questionId,
        selectedOptionId,
        isCorrect,
        timeSpent: req.body.timeSpent || 0,
        completedAt: new Date()
      });
    }

    await stageProgress.save();

    res.json({
      isCorrect,
      explanation: isCorrect ? mcqQuestion.explanation : undefined,
      correctOption: isCorrect ? undefined : mcqQuestion.options.find(o => o.isCorrect)?.id
    });
  } catch (error) {
    console.error('Error submitting MCQ answer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
