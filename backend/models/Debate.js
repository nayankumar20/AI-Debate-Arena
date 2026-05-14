import mongoose from 'mongoose';

const turnSchema = new mongoose.Schema(
  {
    round: { type: Number, required: true, min: 1 },
    side: { type: String, enum: ['A', 'B'], required: true },
    modelId: { type: String, required: true },
    modelLabel: { type: String, default: '' },
    content: { type: String, required: true },
    usedFallback: { type: Boolean, default: false },
    completedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const scoreSideSchema = new mongoose.Schema(
  {
    A: { type: Number, min: 0, max: 10, default: 5 },
    B: { type: Number, min: 0, max: 10, default: 5 },
  },
  { _id: false }
);

const judgeEvaluationSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['pending', 'complete', 'failed'],
      default: 'pending',
    },
    winner: { type: String, enum: ['A', 'B', 'tie'], default: 'tie' },
    reasoning: { type: String, default: '' },
    summary: { type: String, default: '' },
    scores: {
      logic: { type: scoreSideSchema, default: () => ({}) },
      clarity: { type: scoreSideSchema, default: () => ({}) },
      relevance: { type: scoreSideSchema, default: () => ({}) },
      persuasiveness: { type: scoreSideSchema, default: () => ({}) },
    },
    usedFallback: { type: Boolean, default: false },
    evaluatedAt: { type: Date },
  },
  { _id: false }
);

const debateSchema = new mongoose.Schema(
  {
    topic: {
      type: String,
      required: true,
      trim: true,
      minlength: 4,
      maxlength: 600,
    },
    category: {
      type: String,
      trim: true,
      maxlength: 64,
      default: 'Technology',
    },
    sideAModelId: { type: String, required: true },
    sideBModelId: { type: String, required: true },
    sideALabel: { type: String, default: '' },
    sideBLabel: { type: String, default: '' },
    totalRounds: { type: Number, enum: [3, 5, 7], required: true },
    turns: { type: [turnSchema], default: [] },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed'],
      default: 'pending',
    },
    processing: { type: Boolean, default: false },
    judgeEvaluation: { type: judgeEvaluationSchema, default: undefined },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

debateSchema.index({ createdBy: 1, createdAt: -1 });

export const Debate = mongoose.model('Debate', debateSchema);
