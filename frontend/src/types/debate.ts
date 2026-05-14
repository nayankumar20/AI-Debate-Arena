export type DebateStatus = 'pending' | 'in_progress' | 'completed';

export interface DebateTurn {
  id?: string;
  round: number;
  side: 'A' | 'B';
  modelId: string;
  modelLabel: string;
  content: string;
  usedFallback: boolean;
  completedAt?: string;
}

export type JudgeWinner = 'A' | 'B' | 'tie';

export interface JudgeScores {
  logic: { A: number; B: number };
  clarity: { A: number; B: number };
  relevance: { A: number; B: number };
  persuasiveness: { A: number; B: number };
}

export interface JudgeEvaluation {
  status: 'pending' | 'complete' | 'failed';
  winner: JudgeWinner;
  summary: string;
  reasoning: string;
  scores: JudgeScores;
  usedFallback: boolean;
  evaluatedAt?: string;
}

export interface VoteSummary {
  A: number;
  B: number;
  total: number;
}

export type AudienceReaction = 'fire' | 'smart' | 'insight' | 'bias';

export interface UserVote {
  side: 'A' | 'B';
  comment: string;
  audienceReaction?: AudienceReaction;
  createdAt?: string;
}

export interface DebateCommentItem {
  id: string;
  body: string;
  createdAt?: string;
  user: { id?: string; name: string };
}

export interface DebateEngagement {
  heatScore: number;
  reactionTotals: Record<AudienceReaction, number>;
  commentCount: number;
  audienceWinner: 'A' | 'B' | 'tie';
  judgeVersusAudience: {
    judgeWinner: JudgeWinner;
    audienceWinner: 'A' | 'B' | 'tie';
    aligned: boolean;
  };
}

export interface Debate {
  id: string;
  topic: string;
  category?: string;
  sideAModelId: string;
  sideBModelId: string;
  sideALabel: string;
  sideBLabel: string;
  totalRounds: number;
  turns: DebateTurn[];
  hasAnyFallback?: boolean;
  judge: JudgeEvaluation | null;
  status: DebateStatus;
  processing: boolean;
  createdAt?: string;
  updatedAt?: string;
  voteSummary?: VoteSummary;
  userVote?: UserVote | null;
  engagement?: DebateEngagement;
  comments?: DebateCommentItem[];
}

export interface DebateListItem {
  id: string;
  topic: string;
  category?: string;
  status: DebateStatus;
  totalRounds: number;
  createdAt?: string;
  sideALabel?: string;
  sideBLabel?: string;
  hasAnyFallback?: boolean;
  judgeWinner?: JudgeWinner | null;
  judgeReady?: boolean;
}

export interface LeaderboardRow {
  modelId: string;
  label: string;
  value?: number;
  debates?: number;
  audienceVotes?: number;
  judgeWins?: number;
  kind?: string;
}

export interface CommunityAnalytics {
  categoryPopularity: { category: string; count: number }[];
  trendingDebates: {
    debateId: string;
    topic: string;
    category: string;
    heatScore: number;
    votes: number;
    comments: number;
  }[];
  mostActiveUsers: { userId: string; name: string; debates: number }[];
  activityFeed: DebateListItem[];
}

export interface LeaderboardsPayload {
  mostPersuasiveWhenWinning: LeaderboardRow[];
  mostLogicalWhenWinning: LeaderboardRow[];
  highestJudgeCompositeWhenWinning: LeaderboardRow[];
  highestAudienceApproval: LeaderboardRow[];
  mostJudgeWins: LeaderboardRow[];
}

export interface PersonalInsights {
  heatOnMyDebates: number;
  votesOnMyDebates: number;
  commentsOnMyDebates: number;
  voteSidePreference: { A: number; B: number };
  reactionSignature: Record<AudienceReaction, number>;
  myCategoryMix: { category: string; count: number }[];
  favoriteTopics: { topic: string; count: number }[];
  judgeAgreementPercent: number | null;
  judgeAgreements: number;
  judgeComparableDebates: number;
}

/** Personal command center only (see Arena Pulse for global analytics). */
export interface DashboardAnalytics {
  totalDebates: number;
  completedDebates: number;
  activeDebates: number;
  votesCast: number;
  judgeWins: { A: number; B: number; tie: number };
  modelUsage: { modelId: string; count: number }[];
  recentDebates: DebateListItem[];
  personalInsights: PersonalInsights;
}

export interface ArenaPulsePayload {
  community: CommunityAnalytics;
  leaderboards: LeaderboardsPayload;
  trendingTopics: {
    trending: TopicCard[];
    popular: TopicCard[];
    controversial: TopicCard[];
  };
}

export interface ProfileActivityItem {
  id: string;
  topic: string;
  status: DebateStatus;
  updatedAt?: string;
  judgeWinner?: JudgeWinner | null;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  themePreference: string;
  isGuest: boolean;
  createdAt?: string;
  stats: {
    debatesParticipated: number;
    completedDebates: number;
    votesCast: number;
    debatesAlignedWithJudge: number;
    favoriteModelId: string | null;
    avgJudgeScoreOnCompleted: number | null;
    recentActivity: ProfileActivityItem[];
  };
}

export interface TopicCard {
  topic: string;
  category?: string;
  blurb?: string;
}

export interface TopicSuggestionsResponse {
  categories: Record<string, TopicCard[]>;
  trending: TopicCard[];
  popular: TopicCard[];
  controversial: TopicCard[];
}
