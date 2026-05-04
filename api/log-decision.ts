// /api/log-decision.ts
import clientPromise from "../lib/mongodb";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { sessionId, stepId, decision, tags } = req.body;

  if (!sessionId || !stepId || !decision) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const client = await clientPromise;
    const db = client.db("playtrace");

    await db.collection("events").insertOne({
      sessionId,
      stepId,
      decision,
      tags,
      timestamp: new Date()
    });

    res.status(200).json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
