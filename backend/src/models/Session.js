import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  profileType: {
    type: String,
    required: true
  },
  consentToDataCollection: {
    type: Boolean,
    default: true
  },
  character: {
    type: String,
    required: true
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  endedAt: {
    type: Date
  },
  completed: {
    type: Boolean,
    default: false
  },
  failureType: {
    type: String,
    enum: ['resource', 'risk', null],
    default: null
  },
  finalResources: {
    energy: { type: Number, default: 0 },
    supplies: { type: Number, default: 0 },
    morale: { type: Number, default: 0 }
  },
  finalRiskLevel: {
    type: Number,
    default: 0
  },
  metrics: {
    avgDecisionTime: { type: Number, default: 0 },
    riskRatio: { type: Number, default: 0 },
    consistency: { type: Number, default: 0 },
    exploration: { type: Number, default: 0 },
    playerType: { type: String, default: 'Balanced' },
    totalTimeSpentMs: { type: Number, default: 0 },
    riskyDecisions: { type: Number, default: 0 },
    safeDecisions: { type: Number, default: 0 },
    neutralDecisions: { type: Number, default: 0 }
  }
});

const Session = mongoose.model('Session', sessionSchema);

export default Session;
