import mongoose from 'mongoose';

const debateVoteSchema = new mongoose.Schema(
  {
    debate: { type: mongoose.Schema.Types.ObjectId, ref: 'Debate', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    side: { type: String, enum: ['A', 'B'], required: true },
    comment: { type: String, default: '', trim: true, maxlength: 500 },
    audienceReaction: {
      type: String,
      enum: ['fire', 'smart', 'insight', 'bias'],
      default: undefined,
    },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

debateVoteSchema.index({ debate: 1, user: 1 }, { unique: true });

export const DebateVote = mongoose.model('DebateVote', debateVoteSchema);
