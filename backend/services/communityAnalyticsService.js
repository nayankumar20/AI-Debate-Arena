import { Debate } from '../models/Debate.js';
import { DebateVote } from '../models/DebateVote.js';
import { DebateComment } from '../models/DebateComment.js';
import { User } from '../models/User.js';
import { debateSummaryToClient } from './debateEngineService.js';
import { getModelLabel } from '../config/aiModels.js';

function avgScoreForWinner(scores, winner) {
  if (!scores || !winner || winner === 'tie') return null;
  const keys = ['logic', 'clarity', 'relevance', 'persuasiveness'];
  let sum = 0;
  for (const k of keys) {
    const row = scores[k];
    if (!row) return null;
    sum += Number(row[winner]) || 0;
  }
  return Math.round((sum / keys.length) * 10) / 10;
}

export async function computeLeaderboards() {
  const completed = await Debate.find({
    status: 'completed',
    'judgeEvaluation.status': 'complete',
  }).lean();

  const persuasive = new Map();
  const logical = new Map();
  const judgeComposite = new Map();
  const judgeWinCounts = new Map();

  for (const d of completed) {
    const w = d.judgeEvaluation?.winner;
    const sc = d.judgeEvaluation?.scores;
    if (w && w !== 'tie' && sc) {
      const mid = w === 'A' ? d.sideAModelId : d.sideBModelId;
      const p = sc.persuasiveness?.[w];
      const lg = sc.logic?.[w];
      if (p != null) {
        const cur = persuasive.get(mid) || { sum: 0, n: 0 };
        cur.sum += p;
        cur.n += 1;
        persuasive.set(mid, cur);
      }
      if (lg != null) {
        const cur = logical.get(mid) || { sum: 0, n: 0 };
        cur.sum += lg;
        cur.n += 1;
        logical.set(mid, cur);
      }
      const comp = avgScoreForWinner(sc, w);
      if (comp != null) {
        const cur = judgeComposite.get(mid) || { sum: 0, n: 0 };
        cur.sum += comp;
        cur.n += 1;
        judgeComposite.set(mid, cur);
      }
      judgeWinCounts.set(mid, (judgeWinCounts.get(mid) || 0) + 1);
    }
  }

  const toRanked = (map, label) =>
    [...map.entries()]
      .map(([modelId, v]) => ({
        modelId,
        label: getModelLabel(modelId),
        value: Math.round((v.sum / v.n) * 10) / 10,
        debates: v.n,
        kind: label,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

  const audienceRows = await DebateVote.aggregate([
    {
      $lookup: {
        from: 'debates',
        localField: 'debate',
        foreignField: '_id',
        as: 'd',
      },
    },
    { $unwind: '$d' },
    {
      $addFields: {
        pickedModel: {
          $cond: [{ $eq: ['$side', 'A'] }, '$d.sideAModelId', '$d.sideBModelId'],
        },
      },
    },
    { $group: { _id: '$pickedModel', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 8 },
  ]);

  const audienceApproval = audienceRows.map((r) => ({
    modelId: r._id,
    label: getModelLabel(r._id),
    audienceVotes: r.count,
    kind: 'audience_picks',
  }));

  const judgeWinsRanked = [...judgeWinCounts.entries()]
    .map(([modelId, wins]) => ({
      modelId,
      label: getModelLabel(modelId),
      judgeWins: wins,
      kind: 'judge_wins',
    }))
    .sort((a, b) => b.judgeWins - a.judgeWins)
    .slice(0, 8);

  return {
    mostPersuasiveWhenWinning: toRanked(persuasive, 'persuasion_on_wins'),
    mostLogicalWhenWinning: toRanked(logical, 'logic_on_wins'),
    highestJudgeCompositeWhenWinning: toRanked(judgeComposite, 'composite_on_wins'),
    highestAudienceApproval: audienceApproval,
    mostJudgeWins: judgeWinsRanked,
  };
}

export async function getCommunitySnapshot() {
  const [categoryRows, voteAgg, commentAgg, recentPlatform] = await Promise.all([
    Debate.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 12 },
    ]),
    DebateVote.aggregate([{ $group: { _id: '$debate', votes: { $sum: 1 } } }]),
    DebateComment.aggregate([{ $group: { _id: '$debate', comments: { $sum: 1 } } }]),
    Debate.find({ status: 'completed' })
      .sort({ updatedAt: -1 })
      .limit(12)
      .select('topic category updatedAt createdBy')
      .lean(),
  ]);

  const voteMap = new Map(voteAgg.map((r) => [r._id.toString(), r.votes]));
  const commentMap = new Map(commentAgg.map((r) => [r._id.toString(), r.comments]));

  const heatList = recentPlatform.map((d) => {
    const id = d._id.toString();
    const v = voteMap.get(id) || 0;
    const c = commentMap.get(id) || 0;
    const heatScore = v * 2 + c * 3;
    return { debateId: id, topic: d.topic, category: d.category || 'Technology', heatScore, votes: v, comments: c };
  });
  heatList.sort((a, b) => b.heatScore - a.heatScore);

  const creatorRows = await Debate.aggregate([
    { $group: { _id: '$createdBy', debates: { $sum: 1 } } },
    { $sort: { debates: -1 } },
    { $limit: 6 },
  ]);
  const creatorIds = creatorRows.map((r) => r._id).filter(Boolean);
  const users = await User.find({ _id: { $in: creatorIds } })
    .select('name')
    .lean();
  const nameById = new Map(users.map((u) => [u._id.toString(), u.name]));

  const mostActiveUsers = creatorRows.map((r) => ({
    userId: r._id.toString(),
    name: nameById.get(r._id.toString()) || 'Member',
    debates: r.debates,
  }));

  const activityFeed = await Debate.find({})
    .sort({ updatedAt: -1 })
    .limit(12)
    .lean();

  return {
    categoryPopularity: categoryRows.map((r) => ({ category: r._id || 'General', count: r.count })),
    trendingDebates: heatList.slice(0, 8),
    mostActiveUsers,
    activityFeed: activityFeed.map((d) => debateSummaryToClient(d)),
  };
}
