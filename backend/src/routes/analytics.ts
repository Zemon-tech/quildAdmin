import { Router, Request, Response } from 'express';
import { UserProfile } from '../models/UserProfile';
import { Problem } from '../models/Problem';
import { Pod } from '../models/Pod';
import { PodStage } from '../models/PodStage';
import { ProblemAttempt } from '../models/ProblemAttempt';
import { PodAttempt } from '../models/PodAttempt';
import { UserStageProgress } from '../models/UserStageProgress';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/admin/analytics/users', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [totalUsers, activeUsers7Days, activeUsers30Days, tierDistribution] = await Promise.all([
      UserProfile.countDocuments(),
      UserProfile.countDocuments({ updatedAt: { $gte: sevenDaysAgo } }),
      UserProfile.countDocuments({ updatedAt: { $gte: thirtyDaysAgo } }),
      UserProfile.aggregate([
        {
          $group: {
            _id: '$subscriptionTier',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const userGrowth = await UserProfile.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 },
      },
      {
        $limit: 12,
      },
    ]);

    res.json({
      totalUsers,
      activeUsers: {
        last7Days: activeUsers7Days,
        last30Days: activeUsers30Days,
      },
      userGrowth,
      tierDistribution: tierDistribution.reduce((acc: any, item: any) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
    });
  } catch (error) {
    console.error('Error fetching user analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/admin/analytics/problems', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [totalProblems, publicProblems, difficultyDistribution, problemStats] = await Promise.all([
      Problem.countDocuments(),
      Problem.countDocuments({ isPublic: true }),
      Problem.aggregate([
        {
          $group: {
            _id: '$difficulty',
            count: { $sum: 1 },
          },
        },
      ]),
      ProblemAttempt.aggregate([
        {
          $group: {
            _id: '$problem',
            totalAttempts: { $sum: 1 },
            completedAttempts: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
            },
          },
        },
        {
          $lookup: {
            from: 'problems',
            localField: '_id',
            foreignField: '_id',
            as: 'problem',
          },
        },
        {
          $unwind: '$problem',
        },
        {
          $project: {
            problemSlug: '$problem.slug',
            problemTitle: '$problem.title',
            totalAttempts: 1,
            completedAttempts: 1,
            completionRate: {
              $multiply: [
                { $divide: ['$completedAttempts', '$totalAttempts'] },
                100,
              ],
            },
          },
        },
      ]),
    ]);

    res.json({
      totalProblems,
      publicProblems,
      privateProblems: totalProblems - publicProblems,
      difficultyDistribution: difficultyDistribution.reduce((acc: any, item: any) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      completionRates: problemStats,
    });
  } catch (error) {
    console.error('Error fetching problem analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/admin/analytics/pods', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [totalPods, phaseDistribution, podStats] = await Promise.all([
      Pod.countDocuments(),
      Pod.aggregate([
        {
          $group: {
            _id: '$phase',
            count: { $sum: 1 },
          },
        },
      ]),
      PodAttempt.aggregate([
        {
          $group: {
            _id: '$pod',
            totalAttempts: { $sum: 1 },
            completedAttempts: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
            },
            avgTimeSpent: {
              $avg: {
                $cond: [
                  { $and: [{ $ne: ['$completedAt', null] }, { $ne: ['$startedAt', null] }] },
                  { $divide: [{ $subtract: ['$completedAt', '$startedAt'] }, 1000 * 60] },
                  0,
                ],
              },
            },
          },
        },
        {
          $lookup: {
            from: 'pods',
            localField: '_id',
            foreignField: '_id',
            as: 'pod',
          },
        },
        {
          $unwind: '$pod',
        },
        {
          $project: {
            podTitle: '$pod.title',
            podPhase: '$pod.phase',
            totalAttempts: 1,
            completedAttempts: 1,
            completionRate: {
              $multiply: [
                { $divide: ['$completedAttempts', '$totalAttempts'] },
                100,
              ],
            },
            avgTimeSpent: { $round: ['$avgTimeSpent', 2] },
          },
        },
      ]),
    ]);

    res.json({
      totalPods,
      phaseDistribution: phaseDistribution.reduce((acc: any, item: any) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      completionRates: podStats,
      avgTimeSpent: podStats.reduce((acc: number, item: any) => acc + (item.avgTimeSpent || 0), 0) / podStats.length || 0,
    });
  } catch (error) {
    console.error('Error fetching pod analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/admin/analytics/stages', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [totalStages, typeDistribution, stageStats] = await Promise.all([
      PodStage.countDocuments(),
      PodStage.aggregate([
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
          },
        },
      ]),
      UserStageProgress.aggregate([
        {
          $group: {
            _id: '$stageId',
            totalAttempts: { $sum: 1 },
            completedAttempts: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
            },
            avgAssessmentScore: {
              $avg: '$assessmentScore',
            },
            avgTimeSpent: {
              $avg: '$timeSpent',
            },
          },
        },
        {
          $lookup: {
            from: 'podstages',
            localField: '_id',
            foreignField: '_id',
            as: 'stage',
          },
        },
        {
          $unwind: '$stage',
        },
        {
          $project: {
            stageTitle: '$stage.title',
            stageType: '$stage.type',
            totalAttempts: 1,
            completedAttempts: 1,
            completionRate: {
              $multiply: [
                { $divide: ['$completedAttempts', '$totalAttempts'] },
                100,
              ],
            },
            avgAssessmentScore: { $round: ['$avgAssessmentScore', 2] },
            avgTimeSpent: { $round: ['$avgTimeSpent', 2] },
          },
        },
      ]),
    ]);

    res.json({
      totalStages,
      typeDistribution: typeDistribution.reduce((acc: any, item: any) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      assessmentScores: stageStats,
    });
  } catch (error) {
    console.error('Error fetching stage analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/admin/analytics/progress', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [totalAttempts, completedAttempts, abandonedAttempts, progressStats] = await Promise.all([
      ProblemAttempt.countDocuments(),
      ProblemAttempt.countDocuments({ status: 'completed' }),
      ProblemAttempt.countDocuments({ status: 'abandoned' }),
      ProblemAttempt.aggregate([
        {
          $group: {
            _id: null,
            totalAttempts: { $sum: 1 },
            completedAttempts: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
            },
            avgCompletionTime: {
              $avg: {
                $cond: [
                  { $and: [{ $ne: ['$completedAt', null] }, { $ne: ['$startedAt', null] }] },
                  { $divide: [{ $subtract: ['$completedAt', '$startedAt'] }, 1000 * 60 * 60] },
                  null,
                ],
              },
            },
          },
        },
      ]),
    ]);

    const completionRate = totalAttempts > 0 ? (completedAttempts / totalAttempts) * 100 : 0;
    const abandonmentRate = totalAttempts > 0 ? (abandonedAttempts / totalAttempts) * 100 : 0;

    res.json({
      completionRate: Math.round(completionRate * 100) / 100,
      abandonmentRate: Math.round(abandonmentRate * 100) / 100,
      avgCompletionTime: progressStats[0]?.avgCompletionTime
        ? Math.round(progressStats[0].avgCompletionTime * 100) / 100
        : 0,
      activeAttempts: totalAttempts - completedAttempts - abandonedAttempts,
      abandonedAttempts,
    });
  } catch (error) {
    console.error('Error fetching progress analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
