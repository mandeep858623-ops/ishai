export type NewsCategoryId =
  | 'top'
  | 'latest'
  | 'india'
  | 'world'
  | 'politics'
  | 'business'
  | 'technology'
  | 'ai'
  | 'science'
  | 'health'
  | 'sports'
  | 'cricket'
  | 'entertainment'
  | 'movies'
  | 'education'
  | 'environment'
  | 'startups'
  | 'finance'
  | 'travel'
  | 'lifestyle'
  | 'gaming'
  | 'cybersecurity'
  | 'policy'
  | 'opinion'
  | 'explainers';

export interface NewsCategory {
  id: NewsCategoryId;
  label: string;
  iconName: string;
  description: string;
  topicTag?: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  description: string;
  snippet?: string;
  content: string;
  url: string;
  link?: string;
  sourceName: string;
  source?: string;
  sourceUrl?: string;
  category: NewsCategoryId;
  publishedAt: string;
  imageUrl?: string;
  urlToImage?: string;
  author?: string;
  readTimeMinutes: number;
  isBreaking?: boolean;
  region: 'india' | 'us' | 'uk' | 'global' | string;
  tags: string[];
  canonicalUrl: string;
}

export type NewsRegion = 'india' | 'global' | 'us' | 'uk';

export interface NewsFilterOptions {
  searchQuery?: string;
  category?: NewsCategoryId | string;
  region?: NewsRegion | string;
  dateRange?: 'all' | 'today' | 'week' | 'month';
  sortBy?: 'newest' | 'relevance';
  query?: string;
}

export interface UserNewsPreferences {
  favoriteCategories: NewsCategoryId[];
  favoriteTopics?: string[];
  followedRegions: NewsRegion[];
  region?: string;
  hiddenCategories: NewsCategoryId[];
  followedTopics: string[];
  followedState?: string;
  savedArticleIds: string[];
  readingHistory: { articleId: string; readAt: string; progressPercent: number }[];
  articleNotes: Record<string, string>;
  customCollections: { id: string; name: string; articleIds: string[] }[];
  compactView: boolean;
  defaultLayout?: 'card' | 'compact';
  playbackSpeed?: number;
  textSize: 'sm' | 'md' | 'lg';
  readingTextSize?: 'sm' | 'base' | 'lg';
  theme: 'dark' | 'light';
  notificationsEnabled: boolean;
  notificationTopics: string[];
}

export type NewsPreferences = UserNewsPreferences;

export interface AISummary {
  summary30s: string;
  summaryDetailed: string;
  keyTakeaways: string[];
  whyItMatters: string;
  background: string;
  keyEntities: { name: string; type: string; description: string }[];
  timeline: { time: string; event: string }[];
  whatIsKnown: string[];
  whatIsUnclear: string[];
  glossary: { term: string; definition: string }[];
  readingTimeMinutes: number;
}

export interface ClaimVerificationResult {
  statement: string;
  verdict: 'supported' | 'contradicted' | 'mixed' | 'insufficient';
  confidenceScore: number;
  summaryReasoning: string;
  supportingEvidence: string[];
  conflictingEvidence: string[];
  missingInformation: string[];
  sources: { title: string; publisher: string; url: string; date: string }[];
}

export interface StoryComparison {
  topicTitle: string;
  overview: string;
  sharedFacts: string[];
  perspectiveDifferences: { publisher: string; headline: string; focusAngle: string; url: string }[];
  keyDisagreements: string[];
  balancedConclusion: string;
}

export interface DailyBriefingData {
  title?: string;
  date?: string;
  topBullets?: string[];
  sections?: { category: string; topicTitle: string; summary: string; articles: NewsArticle[] }[];
  audioScript?: string;
  timeOfDay: 'Morning' | 'Evening';
  format: 'Short' | 'Medium' | 'Detailed';
  generatedAt: string;
  topHighlights: string[];
  categorySummaries: { categoryLabel: string; articles: NewsArticle[]; summary: string }[];
}

export type DailyBriefing = DailyBriefingData;

export interface ArticleNote {
  articleId: string;
  note: string;
  updatedAt: string;
}

export const CATEGORIES_LIST: NewsCategory[] = [
  { id: 'top', label: 'Top Stories', iconName: 'Flame', description: 'Headline stories from across the globe' },
  { id: 'latest', label: 'Latest News', iconName: 'Zap', description: 'Real-time breaking updates' },
  { id: 'india', label: 'India', iconName: 'Flag', description: 'National, state & regional reporting' },
  { id: 'world', label: 'World', iconName: 'Globe', description: 'International news and geopolitics' },
  { id: 'politics', label: 'Politics', iconName: 'Landmark', description: 'Governance, elections & policy' },
  { id: 'business', label: 'Business & Economy', iconName: 'TrendingUp', description: 'Markets, finance & macroeconomics' },
  { id: 'technology', label: 'Technology', iconName: 'Cpu', description: 'Gadgets, software & tech industry' },
  { id: 'ai', label: 'Artificial Intelligence', iconName: 'Bot', description: 'LLMs, AI research & model launches' },
  { id: 'science', label: 'Science & Space', iconName: 'Atom', description: 'Discoveries, astronomy & research' },
  { id: 'health', label: 'Health & Wellness', iconName: 'Activity', description: 'Medicine, wellness & public health' },
  { id: 'sports', label: 'Sports', iconName: 'Trophy', description: 'Global sports events and athletics' },
  { id: 'cricket', label: 'Cricket', iconName: 'CircleDot', description: 'IPL, Test matches & international cricket' },
  { id: 'entertainment', label: 'Entertainment', iconName: 'Film', description: 'Culture, cinema & celebrity updates' },
  { id: 'movies', label: 'Movies & TV', iconName: 'Tv', description: 'Reviews, streaming & box office' },
  { id: 'education', label: 'Education', iconName: 'GraduationCap', description: 'Exams, universities & policy' },
  { id: 'environment', label: 'Environment & Climate', iconName: 'Leaf', description: 'Climate change, ecology & energy' },
  { id: 'startups', label: 'Startups', iconName: 'Rocket', description: 'Venture funding, unicorns & founders' },
  { id: 'finance', label: 'Personal Finance', iconName: 'DollarSign', description: 'Investments, taxes & savings' },
  { id: 'travel', label: 'Travel', iconName: 'Compass', description: 'Destinations, tourism & guides' },
  { id: 'lifestyle', label: 'Lifestyle', iconName: 'Smile', description: 'Fashion, food & living' },
  { id: 'gaming', label: 'Gaming', iconName: 'Gamepad2', description: 'Esports, consoles & game releases' },
  { id: 'cybersecurity', label: 'Cybersecurity', iconName: 'ShieldAlert', description: 'Threats, hacks & privacy' },
  { id: 'policy', label: 'Policy & Gov', iconName: 'FileText', description: 'Government schemes & announcements' },
  { id: 'opinion', label: 'Opinion & Editorials', iconName: 'MessageSquare', description: 'Columnists & analytical perspectives' },
  { id: 'explainers', label: 'Explainers', iconName: 'HelpCircle', description: 'Deep-dive breakdowns of complex topics' },
];

export const INDIA_STATES = [
  'All States',
  'Maharashtra',
  'Delhi NCR',
  'Karnataka',
  'Tamil Nadu',
  'Uttar Pradesh',
  'Punjab',
  'Gujarat',
  'West Bengal',
  'Telangana',
  'Kerala',
  'Rajasthan',
  'Bihar',
  'Madhya Pradesh',
  'Haryana',
  'Assam',
];

export const NEWS_CATEGORIES = CATEGORIES_LIST.map((c) => ({
  id: c.id,
  title: c.label,
  label: c.label,
  icon: c.iconName,
}));
