import clientPromise from "../lib/mongodb.js";

/**
 * API Route: /api/test-db
 * Verifies the MongoDB connection by inserting a test document.
 */
export default async function handler(req: any, res: any) {
  try {
    const client = await clientPromise;
    const db = client.db();
    const collection = db.collection("test");

    const result = await collection.insertOne({
      event: "connection_test",
      timestamp: new Date(),
      status: "success",
      environment: process.env.NODE_ENV,
    });

    console.log("Successfully inserted test document:", result.insertedId);

    return res.status(200).json({
      success: true,
      message: "MongoDB connection verified",
      insertedId: result.insertedId,
    });
  } catch (error: any) {
    console.error("Database connection failed:", error);
    
    return res.status(500).json({
      success: false,
      error: error.message || "Internal Server Error",
    });
  }
}
