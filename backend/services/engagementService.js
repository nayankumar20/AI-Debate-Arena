import mongoose from 'mongoose';
import { DebateVote } from '../models/DebateVote.js';
import { DebateComment } from '../models/DebateComment.js';

export async function buildEngagementForDebate(debateId, judgeWinner) {
  const rows = await DebateVote.find({ debate: debateId }).lean();
  let a = 0;
  let b = 0;
  const reactionTotals = { fire: 0, smart: 0, insight: 0, bias: 0 };
  for (const v of rows) {
    if (v.side === 'A') a += 1;
    if (v.side === 'B') b += 1;
    if (v.audienceReaction && reactionTotals[v.audienceReaction] != null) {
      reactionTotals[v.audienceReaction] += 1;
    }
  }
  const commentCount = await DebateComment.countDocuments({ debate: debateId });
  const totalVotes = a + b;
  let audienceWinner = 'tie';
  if (a > b) audienceWinner = 'A';
  if (b > a) audienceWinner = 'B';

  const reactionSum = reactionTotals.fire + reactionTotals.smart + reactionTotals.insight + reactionTotals.bias;
  const heatScore = Math.round(totalVotes * 2 + commentCount * 3 + reactionSum * 2);

  return {
    heatScore,
    reactionTotals,
    commentCount,
    audienceWinner,
    judgeVersusAudience: {
      judgeWinner: judgeWinner || 'tie',
      audienceWinner,
      aligned:
        judgeWinner &&
        judgeWinner !== 'tie' &&
        audienceWinner !== 'tie' &&
        judgeWinner === audienceWinner,
    },
  };
}

export async function listCommentsForDebate(debateId, limit = 40) {
  const rows = await DebateComment.find({ debate: debateId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('user', 'name')
    .lean();

  return rows.map((c) => ({
    id: c._id.toString(),
    body: c.body,
    createdAt: c.createdAt,
    user: {
      id: c.user?._id?.toString(),
      name: c.user?.name || 'Member',
    },
  }));
}
