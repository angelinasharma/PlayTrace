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
    
    // Fetch the completed session
    const session = await db.collection("sessions").findOne({ sessionId });

    if (!session || !session.metrics) {
      return res.status(404).json({ error: "Session metrics not found or session not completed" });
    }

    return res.status(200).json({
      metrics: session.metrics,
      summary: session.summary,
    });
  } catch (error: any) {
    console.error("Aggregation Error:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
}
