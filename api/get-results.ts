// /api/get-results.ts
import clientPromise from "../lib/mongodb.js";

/**
 * API Route: /api/get-results
 * Aggregates raw decision data into high-level behavioral metrics.
 */
export default async function handler(req: any, res: any) {
  const { sessionId } = req.query;

  if (!sessionId) {
    return res.status(400).json({ error: "Missing sessionId" });
  }

  try {
    const client = await clientPromise;
    const db = client.db("playtrace");
    
    // Fetch all decisions for this session, ordered by time
    const events = await db.collection("events")
      .find({ sessionId })
      .sort({ timestamp: 1 })
      .toArray();

    if (events.length === 0) {
      return res.status(200).json({
        riskScore: 0,
        ethicsScore: 0.5,
        consistencyScore: 0,
        totalDecisions: 0,
      });
    }

    const total = events.length;

    // 1. Risk Score: Density of decisions tagged as high-risk
    const riskCount = events.filter(e => e.tags?.includes("risk")).length;
    const riskScore = riskCount / total;

    // 2. Ethics Score: Ratio of ethical vs selfish choices
    const ethicalCount = events.filter(e => e.tags?.includes("ethical")).length;
    const selfishCount = events.filter(e => e.tags?.includes("selfish")).length;
    const ethicsBase = ethicalCount + selfishCount;
    const ethicsScore = ethicsBase > 0 ? ethicalCount / ethicsBase : 0.5;

    // 3. Consistency Score: Comparative analysis of behavioral patterns over time
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
      // Find the tag with highest frequency
      return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
    };

    const domStart = getDominantPattern(firstHalf);
    const domEnd = getDominantPattern(secondHalf);
    
    // Simple binary consistency: did the primary behavioral drive stay the same?
    const consistencyScore = (domStart && domEnd && domStart === domEnd) ? 1 : 0;

    return res.status(200).json({
      riskScore,
      ethicsScore,
      consistencyScore,
      totalDecisions: total,
    });
  } catch (error: any) {
    console.error("Aggregation Error:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
}
