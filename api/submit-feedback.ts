// /api/submit-feedback.ts
import clientPromise from "../lib/mongodb.js";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { sessionId, rating, feedback } = req.body;

  if (!sessionId || rating === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const client = await clientPromise;
    const db = client.db("playtrace");

    await db.collection("feedback").insertOne({
      sessionId,
      rating,
      feedback,
      createdAt: new Date()
    });

    res.status(200).json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
