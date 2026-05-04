// /api/start-session.ts
import clientPromise from "../lib/mongodb.js";
import { randomUUID } from "node:crypto";

export default async function handler(req, res) {
    const client = await clientPromise;
    const db = client.db("playtrace");

    const sessionId = randomUUID();

    await db.collection("sessions").insertOne({
        sessionId,
        startedAt: new Date()
    });

    res.status(200).json({ sessionId });
}