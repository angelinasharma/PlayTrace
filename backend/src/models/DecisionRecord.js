import mongoose from 'mongoose';

const decisionRecordSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    index: true // indexed for faster queries by sessionId
  },
  profileType: {
    type: String,
    required: true
  },
  levelId: {
    type: String,
    required: true
  },
  phase: {
    type: Number,
    required: true,
    enum: [1, 2, 3]
  },
  decision: {
    type: String,
    required: true
  },
  decisionType: {
    type: String,
    required: true,
    enum: ['safe', 'risky', 'neutral']
  },
  decisionTime: {
    type: Number,
    required: true
  },
  energy: { type: Number, required: true },
  supplies: { type: Number, required: true },
  morale: { type: Number, required: true },
  riskLevel: { type: Number, required: true },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const DecisionRecord = mongoose.model('DecisionRecord', decisionRecordSchema);

export default DecisionRecord;
