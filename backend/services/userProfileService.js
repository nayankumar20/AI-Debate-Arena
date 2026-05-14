import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Debate } from '../models/Debate.js';
import { DebateVote } from '../models/DebateVote.js';

async function extendedProfileStats(userId) {
  const oid = new mongoose.Types.ObjectId(userId);
  const [completed, recentActivity, voteCount] = await Promise.all([
    Debate.find({
      createdBy: oid,
      status: 'completed',
      'judgeEvaluation.status': 'complete',
    }).lean(),
    Debate.find({ createdBy: oid })
      .sort({ updatedAt: -1 })
      .limit(8)
      .select('topic status updatedAt judgeEvaluation.winner')
      .lean(),
    DebateVote.countDocuments({ user: oid }),
  ]);

  const debateIds = completed.map((d) => d._id);
  const votes = await DebateVote.find({ user: oid, debate: { $in: debateIds } }).lean();
  const voteByDebate = new Map(votes.map((v) => [v.debate.toString(), v]));

  const modelUsage = {};
  let alignedWithJudge = 0;
  let scoreSum = 0;
  let scoreN = 0;

  for (const d of completed) {
    modelUsage[d.sideAModelId] = (modelUsage[d.sideAModelId] || 0) + 1;
    modelUsage[d.sideBModelId] = (modelUsage[d.sideBModelId] || 0) + 1;

    const jw = d.judgeEvaluation?.winner;
    const sc = d.judgeEvaluation?.scores;
    if (jw && jw !== 'tie' && sc) {
      const keys = ['logic', 'clarity', 'relevance', 'persuasiveness'];
      let rowSum = 0;
      for (const k of keys) {
        rowSum += Number(sc[k]?.[jw]) || 0;
      }
      scoreSum += rowSum / keys.length;
      scoreN += 1;
    }

    const v = voteByDebate.get(d._id.toString());
    if (v && jw && jw !== 'tie' && v.side === jw) alignedWithJudge += 1;
  }

  const favoriteModelId =
    Object.entries(modelUsage).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  return {
    debatesParticipated: await Debate.countDocuments({ createdBy: oid }),
    completedDebates: completed.length,
    votesCast: voteCount,
    debatesAlignedWithJudge: alignedWithJudge,
    favoriteModelId,
    avgJudgeScoreOnCompleted:
      scoreN > 0 ? Math.round((scoreSum / scoreN) * 10) / 10 : null,
    recentActivity: recentActivity.map((d) => ({
      id: d._id.toString(),
      topic: d.topic,
      status: d.status,
      updatedAt: d.updatedAt,
      judgeWinner: d.judgeEvaluation?.winner ?? null,
    })),
  };
}

export async function getProfileBundle(userId) {
  const user = await User.findById(userId).lean();
  if (!user) return null;

  const stats = await extendedProfileStats(userId);

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    avatar: user.avatar || '',
    themePreference: user.themePreference,
    isGuest: Boolean(user.isGuest),
    createdAt: user.createdAt,
    stats,
  };
}

export async function updateUserProfile(userId, { name, avatar, themePreference }) {
  const updates = {};
  if (name != null) {
    const n = String(name).trim();
    if (n.length < 2 || n.length > 80) {
      const err = new Error('Name must be 2–80 characters');
      err.statusCode = 400;
      throw err;
    }
    updates.name = n;
  }
  if (avatar != null) {
    const raw = String(avatar).trim();
    const maxLen = raw.startsWith('data:image') ? 120000 : 800;
    if (raw.length > maxLen) {
      const err = new Error(
        raw.startsWith('data:image')
          ? 'Image data is too large — try a smaller file or use a hosted URL / DiceBear.'
          : 'Avatar URL is too long'
      );
      err.statusCode = 400;
      throw err;
    }
    updates.avatar = raw.slice(0, maxLen);
  }
  if (themePreference != null) {
    if (!['light', 'dark', 'system'].includes(themePreference)) {
      const err = new Error('Invalid themePreference');
      err.statusCode = 400;
      throw err;
    }
    updates.themePreference = themePreference;
  }

  if (Object.keys(updates).length === 0) {
    const err = new Error('No valid fields to update');
    err.statusCode = 400;
    throw err;
  }

  const user = await User.findByIdAndUpdate(userId, { $set: updates }, { new: true }).lean();
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }
  return getProfileBundle(user._id.toString());
}
