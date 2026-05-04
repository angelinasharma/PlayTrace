// /api/start-session.ts
import clientPromise from "../lib/mongodb";

export default async function handler(req, res) {
    const client = await clientPromise;
    const db = client.db("playtrace");

    const sessionId = crypto.randomUUID();

    await db.collection("sessions").insertOne({
        sessionId,
        startedAt: new Date()
    });

    res.status(200).json({ sessionId });
}