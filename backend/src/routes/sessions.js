import express from 'express';
import crypto from 'crypto';
import Session from '../models/Session.js';
import DecisionRecord from '../models/DecisionRecord.js';

const router = express.Router();

// POST /api/sessions - create a new session
router.post('/', async (req, res) => {
  try {
    const { profileType, character, consentToDataCollection } = req.body;

    if (!profileType || !character) {
      return res.status(400).json({ error: 'profileType and character are required' });
    }

    const sessionId = crypto.randomUUID();

    const session = new Session({
      sessionId,
      profileType,
      character,
      consentToDataCollection: consentToDataCollection !== undefined ? consentToDataCollection : true
    });

    await session.save();
    res.status(201).json({ sessionId });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: 'Server error creating session' });
  }
});

// PATCH /api/sessions/:sessionId - update session on game end
router.patch('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const {
      endedAt,
      completed,
      failureType,
      finalResources,
      finalRiskLevel,
      metrics
    } = req.body;

    const session = await Session.findOneAndUpdate(
      { sessionId },
      {
        $set: {
          endedAt,
          completed,
          failureType,
          finalResources,
          finalRiskLevel,
          metrics
        }
      },
      { new: true }
    );

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.consentToDataCollection === false) {
      // We can null out metrics to be absolutely sure no behavioral data is saved, or just return.
      // Since they opted out, we still know the session ended, but let's clear the metrics.
      session.metrics = undefined;
      await session.save();
    }

    res.json(session);
  } catch (error) {
    console.error('Error updating session:', error);
    res.status(500).json({ error: 'Server error updating session' });
  }
});

// GET /api/sessions - get all sessions
router.get('/', async (req, res) => {
  try {
    const sessions = await Session.find().sort({ startedAt: -1 });
    res.json(sessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Server error fetching sessions' });
  }
});

// GET /api/sessions/:sessionId - get one session with all its decisions
router.get('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await Session.findOne({ sessionId });
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const decisions = await DecisionRecord.find({ sessionId }).sort({ timestamp: 1 });
    
    res.json({
      session,
      decisions
    });
  } catch (error) {
    console.error('Error fetching session details:', error);
    res.status(500).json({ error: 'Server error fetching session details' });
  }
});

// POST /api/sessions/:sessionId/decisions - save a single decision record
router.post('/:sessionId/decisions', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const {
      profileType,
      levelId,
      phase,
      decision,
      decisionType,
      decisionTime,
      energy,
      supplies,
      morale,
      riskLevel
    } = req.body;

    // Validate required fields
    const requiredFields = ['profileType', 'levelId', 'phase', 'decision', 'decisionType', 'decisionTime', 'energy', 'supplies', 'morale', 'riskLevel'];
    const missingFields = requiredFields.filter(field => req.body[field] === undefined);

    if (missingFields.length > 0) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        missingFields 
      });
    }

    // Check if the session exists and if the user consented to data collection
    const session = await Session.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.consentToDataCollection === false) {
      // Return 200 OK to the frontend so it doesn't break, but do NOT save the data.
      return res.status(200).json({ message: 'Data collection is disabled for this session' });
    }

    const decisionRecord = new DecisionRecord({
      sessionId,
      profileType,
      levelId,
      phase,
      decision,
      decisionType,
      decisionTime,
      energy,
      supplies,
      morale,
      riskLevel
    });

    await decisionRecord.save();
    res.status(201).json(decisionRecord);
  } catch (error) {
    console.error('Error saving decision:', error);
    res.status(500).json({ error: 'Server error saving decision' });
  }
});

// GET /api/sessions/:sessionId/decisions - get all decisions for a session
router.get('/:sessionId/decisions', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const decisions = await DecisionRecord.find({ sessionId }).sort({ timestamp: 1 });
    res.json(decisions);
  } catch (error) {
    console.error('Error fetching decisions:', error);
    res.status(500).json({ error: 'Server error fetching decisions' });
  }
});

export default router;
