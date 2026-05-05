// /api/complete-session.ts
import clientPromise from "../lib/mongodb.js";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { sessionId } = req.body;

  if (!sessionId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const client = await clientPromise;
    const db = client.db("playtrace");

    // Fetch all decisions for this session
    const events = await db.collection("events")
      .find({ sessionId })
      .sort({ timestamp: 1 })
      .toArray();

    if (events.length === 0) {
      return res.status(200).json({ success: true, message: "No events to process" });
    }

    const total = events.length;
    
    const avgDecisionTime = events.reduce((acc, e) => acc + (e.decisionTimeMs || 0), 0) / total;
    const avgHesitation = events.reduce((acc, e) => acc + (e.hesitationMs || 0), 0) / total;

    const riskCount = events.filter(e => e.tags?.includes("risk")).length;
    const riskScore = riskCount / total;

    // Consistency Score
    const mid = Math.ceil(total / 2);
    const firstHalf = events.slice(0, mid);
    const secondHalf = events.slice(mid);
    
    const getDominantPattern = (subset: any[]) => {
      const counts: Record<string, number> = {};
      subset.forEach(e => {
        e.tags?.forEach((t: string) => {
          counts[t] = (counts[t] || 0) + 1;
        });
      });
      return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
    };
    
    const domStart = getDominantPattern(firstHalf);
    const domEnd = getDominantPattern(secondHalf);
    const consistencyScore = (domStart && domEnd && domStart === domEnd) ? 1 : 0;

    // Variance
    const variance = events.reduce((acc, e) => acc + Math.pow((e.decisionTimeMs || 0) - avgDecisionTime, 2), 0) / total;

    // Pressure Sensitivity
    const pressureCount = events.filter(e => e.tags?.includes("pressure_sensitive") || e.tags?.includes("pressure")).length;
    const pressureSensitivity = pressureCount / total;

    // Summary fields
    let highestRiskDecision = "None";
    let minRiskTime = Infinity; // We use fastest risk decision as highest instinctual risk
    events.forEach(e => {
      if (e.tags?.includes("risk") && (e.decisionTimeMs || Infinity) < minRiskTime) {
        minRiskTime = e.decisionTimeMs || Infinity;
        highestRiskDecision = e.scenarioText || e.stepId;
      }
    });

    let longestPause = "None";
    let maxPause = -1;
    events.forEach(e => {
      if ((e.hesitationMs || 0) > maxPause) {
        maxPause = e.hesitationMs || 0;
        longestPause = e.scenarioText || e.stepId;
      }
    });

    let biggestBehaviorShift = "None";
    if (domStart && domEnd && domStart !== domEnd) {
      biggestBehaviorShift = `${domStart} → ${domEnd}`;
    }

    const metrics = {
      avgDecisionTime,
      avgHesitation,
      riskScore,
      consistencyScore,
      variance,
      pressureSensitivity
    };

    const summary = {
      highestRiskDecision,
      longestPause,
      biggestBehaviorShift
    };

    await db.collection("sessions").updateOne(
      { sessionId },
      {
        $set: {
          metrics,
          summary,
          completedAt: new Date()
        }
      }
    );

    res.status(200).json({ success: true, metrics, summary });
  } catch (error: any) {
    console.error("Complete Session Error:", error);
    res.status(500).json({ error: error.message });
  }
}
