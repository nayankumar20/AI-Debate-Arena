import mongoose from 'mongoose';
import { Debate } from '../models/Debate.js';
import { DebateVote } from '../models/DebateVote.js';
import { DebateComment } from '../models/DebateComment.js';
import { User } from '../models/User.js';
import { assertValidModelId, getModelLabel } from '../config/aiModels.js';
import {
  computeNextTurn,
  debateSummaryToClient,
  debateToClient,
  produceNextTurnContent,
} from '../services/debateEngineService.js';
import { evaluateAndSaveJudge } from '../services/judgeService.js';
import { buildEngagementForDebate, listCommentsForDebate } from '../services/engagementService.js';

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function voteSummaryForDebate(debateId) {
  const rows = await DebateVote.aggregate([
    { $match: { debate: new mongoose.Types.ObjectId(debateId) } },
    { $group: { _id: '$side', count: { $sum: 1 } } },
  ]);
  const counts = { A: 0, B: 0, total: 0 };
  for (const r of rows) {
    if (r._id === 'A') counts.A = r.count;
    if (r._id === 'B') counts.B = r.count;
  }
  counts.total = counts.A + counts.B;
  return counts;
}

async function attachVotesToPayload(debateDoc, userId) {
  const base = debateToClient(debateDoc);
  const jw = debateDoc.judgeEvaluation?.winner;
  const [summary, userVoteDoc, engagement, comments] = await Promise.all([
    voteSummaryForDebate(debateDoc._id),
    DebateVote.findOne({ debate: debateDoc._id, user: userId }).lean(),
    buildEngagementForDebate(debateDoc._id, jw),
    listCommentsForDebate(debateDoc._id),
  ]);
  return {
    ...base,
    voteSummary: summary,
    userVote: userVoteDoc
      ? {
          side: userVoteDoc.side,
          comment: userVoteDoc.comment || '',
          audienceReaction: userVoteDoc.audienceReaction,
          createdAt: userVoteDoc.createdAt,
        }
      : null,
    engagement,
    comments,
  };
}

export async function listDebates(req, res) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 12));
  const skip = (page - 1) * limit;
  const status = req.query.status;
  const search = req.query.search;

  const filter = { createdBy: req.user.id };
  if (status && ['pending', 'in_progress', 'completed'].includes(status)) {
    filter.status = status;
  }
  if (search && String(search).trim()) {
    filter.topic = new RegExp(escapeRegex(String(search).trim()), 'i');
  }

  const [items, total] = await Promise.all([
    Debate.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Debate.countDocuments(filter),
  ]);

  const debates = items.map((d) => debateSummaryToClient(d));
  res.json({
    success: true,
    debates,
    page,
    limit,
    total,
    pages: Math.ceil(total / limit) || 1,
  });
}

export async function createDebate(req, res) {
  const { topic, sideAModelId, sideBModelId, totalRounds, category } = req.body;

  if (!topic || !sideAModelId || !sideBModelId || !totalRounds) {
    return res.status(400).json({
      success: false,
      message: 'topic, sideAModelId, sideBModelId, and totalRounds are required',
    });
  }

  const roundsNum = Number(totalRounds);
  if (![3, 5, 7].includes(roundsNum)) {
    return res.status(400).json({ success: false, message: 'totalRounds must be 3, 5, or 7' });
  }

  assertValidModelId(sideAModelId);
  assertValidModelId(sideBModelId);

  const cat = category != null ? String(category).trim().slice(0, 64) : 'Technology';

  const debate = await Debate.create({
    topic: String(topic).trim(),
    category: cat || 'Technology',
    sideAModelId,
    sideBModelId,
    sideALabel: getModelLabel(sideAModelId),
    sideBLabel: getModelLabel(sideBModelId),
    totalRounds: roundsNum,
    turns: [],
    status: 'pending',
    processing: false,
    createdBy: req.user.id,
  });

  res.status(201).json({ success: true, debate: debateToClient(debate) });
}

export async function requestJudge(req, res) {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ success: false, message: 'Invalid debate id' });
  }
  const debate = await Debate.findOne({ _id: id, createdBy: req.user.id });
  if (!debate) {
    return res.status(404).json({ success: false, message: 'Debate not found' });
  }
  if (debate.status !== 'completed') {
    return res.status(400).json({ success: false, message: 'Debate not completed yet' });
  }
  await evaluateAndSaveJudge(debate._id);
  const fresh = await Debate.findById(debate._id);
  const payload = await attachVotesToPayload(fresh, req.user.id);
  res.json({ success: true, debate: payload });
}

export async function getDebate(req, res) {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ success: false, message: 'Invalid debate id' });
  }

  const debate = await Debate.findOne({ _id: id, createdBy: req.user.id });
  if (!debate) {
    return res.status(404).json({ success: false, message: 'Debate not found' });
  }

  const payload = await attachVotesToPayload(debate, req.user.id);
  res.json({ success: true, debate: payload });
}

export async function voteDebate(req, res) {
  const { id } = req.params;
  const { side, comment, audienceReaction } = req.body;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ success: false, message: 'Invalid debate id' });
  }
  if (!side || !['A', 'B'].includes(side)) {
    return res.status(400).json({ success: false, message: 'side must be A or B' });
  }

  const debate = await Debate.findOne({ _id: id, createdBy: req.user.id });
  if (!debate) {
    return res.status(404).json({ success: false, message: 'Debate not found' });
  }

  const c = comment != null ? String(comment).trim().slice(0, 500) : '';
  const allowedReactions = ['fire', 'smart', 'insight', 'bias'];
  const $set = { side, comment: c };
  if (audienceReaction && allowedReactions.includes(audienceReaction)) {
    $set.audienceReaction = audienceReaction;
  }
  const update =
    audienceReaction === null || audienceReaction === ''
      ? { $set, $unset: { audienceReaction: '' } }
      : { $set };

  await DebateVote.findOneAndUpdate({ debate: debate._id, user: req.user.id }, update, {
    upsert: true,
    new: true,
    setDefaultsOnInsert: true,
  });

  const fresh = await Debate.findById(debate._id);
  const payload = await attachVotesToPayload(fresh, req.user.id);
  res.json({ success: true, debate: payload });
}

export async function addDebateComment(req, res) {
  const { id } = req.params;
  const { body } = req.body;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ success: false, message: 'Invalid debate id' });
  }
  const text = body != null ? String(body).trim() : '';
  if (text.length < 2) {
    return res.status(400).json({ success: false, message: 'Comment must be at least 2 characters' });
  }
  if (text.length > 1200) {
    return res.status(400).json({ success: false, message: 'Comment is too long' });
  }

  const debate = await Debate.findOne({ _id: id, createdBy: req.user.id });
  if (!debate) {
    return res.status(404).json({ success: false, message: 'Debate not found' });
  }
  if (debate.status !== 'completed') {
    return res.status(400).json({ success: false, message: 'Comments unlock when the debate is completed' });
  }

  await DebateComment.create({
    debate: debate._id,
    user: req.user.id,
    body: text,
  });

  const fresh = await Debate.findById(debate._id);
  const payload = await attachVotesToPayload(fresh, req.user.id);
  res.status(201).json({ success: true, debate: payload });
}

async function pushDebateHistoryEntry(userId, debate) {
  try {
    await User.findByIdAndUpdate(userId, {
      $push: {
        debateHistory: {
          debateId: debate._id,
          topic: debate.topic,
          status: debate.status,
          totalRounds: debate.totalRounds,
          completedAt: new Date(),
        },
      },
    });
  } catch {
    // non-fatal
  }
}

/**
 * Advances the debate by exactly one AI turn (sequential engine step).
 * Frontend should call this once per turn with pacing/typing UX between calls.
 */
export async function startDebateStep(req, res) {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ success: false, message: 'Invalid debate id' });
  }

  const debate = await Debate.findOne({ _id: id, createdBy: req.user.id });
  if (!debate) {
    return res.status(404).json({ success: false, message: 'Debate not found' });
  }

  const cap = debate.totalRounds * 2;
  if (debate.turns.length >= cap) {
    const payload = await attachVotesToPayload(debate, req.user.id);
    return res.json({
      success: true,
      completed: true,
      debate: payload,
    });
  }

  if (debate.processing) {
    return res.status(409).json({
      success: false,
      code: 'PROCESSING',
      message: 'A turn is already being generated. Retry shortly.',
      debate: debateToClient(debate),
    });
  }

  debate.processing = true;
  if (debate.status === 'pending') debate.status = 'in_progress';
  await debate.save();

  try {
    const next = computeNextTurn(debate);
    const { content, usedFallback } = await produceNextTurnContent(debate, next);
    const modelId = next.side === 'A' ? debate.sideAModelId : debate.sideBModelId;
    const modelLabel = next.side === 'A' ? debate.sideALabel : debate.sideBLabel;

    debate.turns.push({
      round: next.round,
      side: next.side,
      modelId,
      modelLabel: modelLabel || getModelLabel(modelId),
      content,
      usedFallback,
      completedAt: new Date(),
    });

    const done = debate.turns.length >= cap;
    if (done) {
      debate.status = 'completed';
      await pushDebateHistoryEntry(req.user.id, debate);
    }

    debate.processing = false;
    await debate.save();

    if (done) {
      await evaluateAndSaveJudge(debate._id);
    }

    const fresh = await Debate.findById(debate._id);
    const payload = await attachVotesToPayload(fresh, req.user.id);

    return res.json({
      success: true,
      completed: done,
      debate: payload,
    });
  } catch (err) {
    debate.processing = false;
    await debate.save();
    throw err;
  }
}
