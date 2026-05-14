import mongoose from 'mongoose';

const debateCommentSchema = new mongoose.Schema(
  {
    debate: { type: mongoose.Schema.Types.ObjectId, ref: 'Debate', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    body: { type: String, required: true, trim: true, maxlength: 1200 },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

debateCommentSchema.index({ debate: 1, createdAt: -1 });

export const DebateComment = mongoose.model('DebateComment', debateCommentSchema);
