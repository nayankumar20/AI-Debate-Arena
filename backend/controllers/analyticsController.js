import mongoose from 'mongoose';
import { Debate } from '../models/Debate.js';
import { DebateVote } from '../models/DebateVote.js';
import { DebateComment } from '../models/DebateComment.js';
import { debateSummaryToClient } from '../services/debateEngineService.js';
import { getCommunitySnapshot, computeLeaderboards } from '../services/communityAnalyticsService.js';
import { readTopicCatalog } from './topicController.js';

async function buildPersonalInsights(userId) {
  const myDebateIdRows = await Debate.find({ createdBy: userId }).select('_id').lean();
  const myIds = myDebateIdRows.map((d) => d._id);

  const completedForAgreement = await Debate.find({
    createdBy: userId,
    status: 'completed',
    'judgeEvaluation.status': 'complete',
  })
    .select('_id judgeEvaluation.winner')
    .lean();
  const completedIds = completedForAgreement.map((d) => d._id);
  const agreementVotes =
    completedIds.length > 0
      ? await DebateVote.find({ user: userId, debate: { $in: completedIds } }).select('debate side').lean()
      : [];

  const [
    votesOnMyDebates,
    commentsOnMyDebates,
    mySideVotes,
    myReactionRows,
    myCategoryRows,
    favoriteTopicRows,
  ] = await Promise.all([
    myIds.length ? DebateVote.countDocuments({ debate: { $in: myIds } }) : 0,
    myIds.length ? DebateComment.countDocuments({ debate: { $in: myIds } }) : 0,
    DebateVote.aggregate([
      { $match: { user: userId } },
      { $group: { _id: '$side', count: { $sum: 1 } } },
    ]),
    DebateVote.aggregate([
      {
        $match: {
          user: userId,
          audienceReaction: { $in: ['fire', 'smart', 'insight', 'bias'] },
        },
      },
      { $group: { _id: '$audienceReaction', count: { $sum: 1 } } },
    ]),
    Debate.aggregate([
      { $match: { createdBy: userId } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]),
    Debate.aggregate([
      { $match: { createdBy: userId } },
      { $group: { _id: '$topic', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 6 },
    ]),
  ]);

  const voteSidePreference = { A: 0, B: 0 };
  for (const r of mySideVotes) {
    if (r._id === 'A') voteSidePreference.A = r.count;
    if (r._id === 'B') voteSidePreference.B = r.count;
  }
  const reactionSignature = { fire: 0, smart: 0, insight: 0, bias: 0 };
  for (const r of myReactionRows) {
    if (r._id && reactionSignature[r._id] != null) reactionSignature[r._id] = r.count;
  }

  const voteByDebate = new Map(agreementVotes.map((v) => [v.debate.toString(), v.side]));
  let judgeComparable = 0;
  let judgeAgreements = 0;
  for (const d of completedForAgreement) {
    const jw = d.judgeEvaluation?.winner;
    if (!jw || jw === 'tie') continue;
    const side = voteByDebate.get(d._id.toString());
    if (side == null) continue;
    judgeComparable += 1;
    if (side === jw) judgeAgreements += 1;
  }

  const judgeAgreementPercent =
    judgeComparable > 0 ? Math.round((judgeAgreements / judgeComparable) * 1000) / 10 : null;

  return {
    heatOnMyDebates: votesOnMyDebates * 2 + commentsOnMyDebates * 3,
    votesOnMyDebates,
    commentsOnMyDebates,
    voteSidePreference,
    reactionSignature,
    myCategoryMix: myCategoryRows.map((r) => ({
      category: r._id || 'Technology',
      count: r.count,
    })),
    favoriteTopics: favoriteTopicRows.map((r) => ({
      topic: r._id,
      count: r.count,
    })),
    judgeAgreementPercent,
    judgeAgreements,
    judgeComparableDebates: judgeComparable,
  };
}

export async function getDashboardAnalytics(req, res) {
  const userId = new mongoose.Types.ObjectId(req.user.id);

  const [
    totalDebates,
    completedDebates,
    pendingLike,
    voteCount,
    judgeAgg,
    modelRows,
    recent,
    personalInsights,
  ] = await Promise.all([
    Debate.countDocuments({ createdBy: userId }),
    Debate.countDocuments({ createdBy: userId, status: 'completed' }),
    Debate.countDocuments({ createdBy: userId, status: { $in: ['pending', 'in_progress'] } }),
    DebateVote.countDocuments({ user: userId }),
    Debate.aggregate([
      { $match: { createdBy: userId, status: 'completed', 'judgeEvaluation.status': 'complete' } },
      { $group: { _id: '$judgeEvaluation.winner', count: { $sum: 1 } } },
    ]),
    Debate.aggregate([
      { $match: { createdBy: userId } },
      {
        $project: {
          models: ['$sideAModelId', '$sideBModelId'],
        },
      },
      { $unwind: '$models' },
      { $group: { _id: '$models', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]),
    Debate.find({ createdBy: userId })
      .sort({ createdAt: -1 })
      .limit(6)
      .lean(),
    buildPersonalInsights(userId),
  ]);

  const judgeWins = { A: 0, B: 0, tie: 0 };
  for (const row of judgeAgg) {
    if (row._id === 'A') judgeWins.A = row.count;
    if (row._id === 'B') judgeWins.B = row.count;
    if (row._id === 'tie') judgeWins.tie = row.count;
  }

  const modelUsage = modelRows.map((r) => ({ modelId: r._id, count: r.count }));
  const recentDebates = recent.map((d) => debateSummaryToClient(d));

  res.json({
    success: true,
    analytics: {
      totalDebates,
      completedDebates,
      activeDebates: pendingLike,
      votesCast: voteCount,
      judgeWins,
      modelUsage,
      recentDebates,
      personalInsights,
    },
  });
}

export async function getArenaPulseAnalytics(req, res) {
  const [community, leaderboards, catalog] = await Promise.all([
    getCommunitySnapshot(),
    computeLeaderboards(),
    Promise.resolve(readTopicCatalog()),
  ]);

  res.json({
    success: true,
    pulse: {
      community,
      leaderboards,
      trendingTopics: {
        trending: catalog.trending || [],
        popular: catalog.popular || [],
        controversial: catalog.controversial || [],
      },
    },
  });
}
