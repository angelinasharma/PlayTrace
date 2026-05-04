import express from 'express';
import Session from '../models/Session.js';
import DecisionRecord from '../models/DecisionRecord.js';

const router = express.Router();

// GET /api/analytics/summary - simple aggregations
router.get('/summary', async (req, res) => {
  try {
    const totalSessions = await Session.countDocuments();
    
    const completedSessions = await Session.countDocuments({ completed: true });
    const completionRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;

    // Calculate average risk ratio
    const avgRiskResult = await Session.aggregate([
      { $group: { _id: null, avgRisk: { $avg: '$metrics.riskRatio' } } }
    ]);
    const avgRiskRatio = avgRiskResult.length > 0 ? avgRiskResult[0].avgRisk : 0;

    // Most common player type
    const playerTypeResult = await Session.aggregate([
      { $group: { _id: '$metrics.playerType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]);
    const mostCommonPlayerType = playerTypeResult.length > 0 ? playerTypeResult[0]._id : 'Unknown';

    // Decision type breakdown (counts of safe/risky/neutral)
    const decisionBreakdownResult = await DecisionRecord.aggregate([
      { $group: { _id: '$decisionType', count: { $sum: 1 } } }
    ]);
    
    const decisionTypeBreakdown = {
      safe: 0,
      risky: 0,
      neutral: 0
    };

    decisionBreakdownResult.forEach(item => {
      if (item._id && decisionTypeBreakdown[item._id] !== undefined) {
        decisionTypeBreakdown[item._id] = item.count;
      }
    });

    res.json({
      totalSessions,
      completionRate,
      avgRiskRatio,
      mostCommonPlayerType,
      decisionTypeBreakdown
    });
  } catch (error) {
    console.error('Error fetching analytics summary:', error);
    res.status(500).json({ error: 'Server error fetching analytics' });
  }
});

export default router;
