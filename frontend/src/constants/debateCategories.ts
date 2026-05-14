export const DEBATE_CATEGORIES = [
  'Technology',
  'AI Ethics',
  'Education',
  'Healthcare',
  'Politics',
  'Future of Work',
  'Society',
] as const;

export type DebateCategory = (typeof DEBATE_CATEGORIES)[number];
