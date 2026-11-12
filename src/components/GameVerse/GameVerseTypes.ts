export interface AIGeneratedGameData {
  id: string;
  title: string;
  description: string;
  instructions: string;
  codeHtml: string;
  createdAt: string;
  prompt: string;
}

export interface BuiltInGame {
  id: string;
  title: string;
  tagline?: string;
  thumbnailUrl?: string;
  description: string;
  category: string;
  icon: string;
  rating: number;
  playersCount: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert';
  controlsDescription: string;
  isBuiltIn: boolean;
  xpReward: number;
}

export type PlayableGame = BuiltInGame;

export interface WebPortalHub {
  id: string;
  title: string;
  url: string;
  category: string;
  description: string;
  icon: string;
  supportsEmbedding: boolean;
  alternativeGameId?: string;
}

export interface GameAchievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
}

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  gameId: string;
  targetScore: number;
  xpReward: number;
}

export interface CustomBookmark {
  id: string;
  title: string;
  url: string;
  icon?: string;
  addedAt?: string;
}

export interface GameVerseProfile {
  username: string;
  avatar: string;
  xp: number;
  level: number;
  streakDays: number;
  unlockedAchievements: string[];
  favoriteGames: string[];
  recentlyPlayed: string[];
  customBookmarks: CustomBookmark[];
  gameStats: Record<string, { highScore: number; victories: number; played: number }>;
  completedDailyChallenges: string[];
}

export const GAME_CATEGORIES: string[] = [
  'All',
  'Arcade',
  'Puzzle',
  'Action',
  'Multiplayer',
  'Strategy',
  'Brain Training',
  'Casual',
  'Vocabulary',
];

export const BUILT_IN_GAMES: BuiltInGame[] = [
  {
    id: 'neondash',
    title: 'Neon Dash',
    tagline: 'Cyberpunk obstacle runner',
    description: 'Dodge glowing neon hazards, jump over plasma traps, slide under energy barriers, and collect bonus cores in high-speed cyber runner mode!',
    category: 'Arcade',
    icon: '⚡',
    rating: 4.9,
    playersCount: '24.2k Plays',
    difficulty: 'Hard',
    controlsDescription: 'Spacebar / Up (Jump), Down (Slide) or Touch controls',
    isBuiltIn: true,
    xpReward: 150,
  },
  {
    id: 'cybersnake',
    title: 'Cyber Snake',
    tagline: 'Glowing arcade grid classic',
    description: 'Control a glowing cybernetic snake, devour energy nodes, accelerate speed, and avoid colliding into walls or your growing tail!',
    category: 'Arcade',
    icon: '🐍',
    rating: 4.8,
    playersCount: '18.5k Plays',
    difficulty: 'Medium',
    controlsDescription: 'Arrow Keys or On-Screen D-Pad',
    isBuiltIn: true,
    xpReward: 100,
  },
  {
    id: 'memorymatrix',
    title: 'Memory Matrix',
    tagline: 'Visual recall pattern challenge',
    description: 'Memorize flashing matrix coordinates, recall increasingly complex pattern sequences, and push your visual memory limits!',
    category: 'Brain Training',
    icon: '🧠',
    rating: 4.7,
    playersCount: '12.1k Plays',
    difficulty: 'Medium',
    controlsDescription: 'Click or Tap flashing tiles in sequence',
    isBuiltIn: true,
    xpReward: 120,
  },
  {
    id: 'spacedefender',
    title: 'Space Defender',
    tagline: 'Galactic plasma space shooter',
    description: 'Pilot your fighter starship through space asteroid storms, blast enemy fighter fleets, collect shield powerups, and survive!',
    category: 'Action',
    icon: '🚀',
    rating: 4.9,
    playersCount: '21.0k Plays',
    difficulty: 'Hard',
    controlsDescription: 'Arrow keys / Mouse to move, Spacebar to shoot lasers',
    isBuiltIn: true,
    xpReward: 150,
  },
  {
    id: 'puzzlemaster',
    title: 'Puzzle Master',
    tagline: '15-sliding tile matrix puzzle',
    description: 'Arrange numbered matrix tiles in ascending numerical order with minimum moves and top clock timing speed!',
    category: 'Puzzle',
    icon: '🧩',
    rating: 4.6,
    playersCount: '14.3k Plays',
    difficulty: 'Medium',
    controlsDescription: 'Click or Tap adjacent tiles to slide',
    isBuiltIn: true,
    xpReward: 110,
  },
  {
    id: 'tictactoex',
    title: 'Tic-Tac-Toe X',
    tagline: '3x3 and 4x4 smart Minimax duel',
    description: 'Play Tic-Tac-Toe with local 2-player mode or challenge unbeatable Minimax AI across 3x3 and tactical 4x4 matrix grids!',
    category: 'Multiplayer',
    icon: '❌',
    rating: 4.5,
    playersCount: '16.8k Plays',
    difficulty: 'Easy',
    controlsDescription: 'Click or Tap grid squares',
    isBuiltIn: true,
    xpReward: 80,
  },
  {
    id: 'rockpaperscissors',
    title: 'Rock Paper Scissors X',
    tagline: 'Streak multiplier decision duel',
    description: 'Duel AI in Rock Paper Scissors with animated hands, streak multipliers, sound effects, and victory statistics!',
    category: 'Casual',
    icon: '✂️',
    rating: 4.4,
    playersCount: '11.9k Plays',
    difficulty: 'Easy',
    controlsDescription: 'Select Rock, Paper, or Scissors buttons',
    isBuiltIn: true,
    xpReward: 70,
  },
  {
    id: '2048challenge',
    title: '2048 Challenge',
    tagline: 'Merge matching tile numbers',
    description: 'Slide numbered tiles on a 4x4 grid. Merge matching values (2+2, 4+4, 8+8) to reach the legendary 2048 tile and beyond!',
    category: 'Strategy',
    icon: '🔢',
    rating: 4.9,
    playersCount: '28.4k Plays',
    difficulty: 'Hard',
    controlsDescription: 'Arrow keys, Swipe, or On-Screen direction controls',
    isBuiltIn: true,
    xpReward: 160,
  },
  {
    id: 'reactionrush',
    title: 'Reaction Rush',
    tagline: 'Microsecond reflex benchmark',
    description: 'Measure human reflex speed in milliseconds! Wait for the visual matrix trigger and click instantly without false starts.',
    category: 'Brain Training',
    icon: '⚡',
    rating: 4.7,
    playersCount: '9.8k Plays',
    difficulty: 'Easy',
    controlsDescription: 'Click or Tap as fast as possible on visual trigger',
    isBuiltIn: true,
    xpReward: 90,
  },
  {
    id: 'wordquest',
    title: 'Word Quest',
    tagline: 'Cyber vocabulary anagram solver',
    description: 'Solve jumbled cyber anagrams, use letter clues, maintain streak multipliers, and expand your vocabulary in Game X!',
    category: 'Vocabulary',
    icon: '🔤',
    rating: 4.8,
    playersCount: '13.6k Plays',
    difficulty: 'Medium',
    controlsDescription: 'Keyboard typing or On-Screen Virtual Keyboard',
    isBuiltIn: true,
    xpReward: 110,
  },
];

export const EXTERNAL_WEBSITES = [
  {
    id: 'crazygames',
    name: 'CrazyGames Arcade',
    url: 'https://www.crazygames.com',
    category: '3D Web Games',
    description: 'Massive browser gaming hub featuring free 3D action, multiplayer, and arcade web games.',
    supportsEmbedding: false,
    recommendedAlternativeGameId: 'neondash',
    bannerGradient: 'from-purple-900 via-slate-900 to-indigo-950',
  },
  {
    id: 'poki',
    name: 'Poki Playground',
    url: 'https://poki.com',
    category: 'Casual & Arcade',
    description: 'Popular web gaming platform offering free instant games for desktop and mobile devices.',
    supportsEmbedding: false,
    recommendedAlternativeGameId: 'cybersnake',
    bannerGradient: 'from-cyan-900 via-slate-900 to-blue-950',
  },
  {
    id: 'itchio',
    name: 'itch.io Indie Hub',
    url: 'https://itch.io',
    category: 'Indie & Experimental',
    description: 'Open marketplace for independent developers with creative HTML5 web games.',
    supportsEmbedding: false,
    recommendedAlternativeGameId: 'spacedefender',
    bannerGradient: 'from-pink-900 via-slate-900 to-rose-950',
  },
  {
    id: 'armorgames',
    name: 'Armor Games',
    url: 'https://armorgames.com',
    category: 'Strategy & RPG',
    description: 'Classic web portal specializing in deep strategy, puzzle, and tactical RPG web games.',
    supportsEmbedding: false,
    recommendedAlternativeGameId: 'puzzlemaster',
    bannerGradient: 'from-amber-900 via-slate-900 to-orange-950',
  },
  {
    id: 'gamepix',
    name: 'GamePix',
    url: 'https://www.gamepix.com',
    category: 'HTML5 Web Games',
    description: 'Global distributor of light, fast HTML5 games for browsers.',
    supportsEmbedding: false,
    recommendedAlternativeGameId: '2048challenge',
    bannerGradient: 'from-emerald-900 via-slate-900 to-teal-950',
  },
];

export type ExternalGamingWebsite = typeof EXTERNAL_WEBSITES[0];
export type UserGameProfile = GameVerseProfile;

export const WEB_PORTAL_HUBS: WebPortalHub[] = [

  {
    id: 'crazygames',
    title: 'CrazyGames Arcade',
    url: 'https://www.crazygames.com',
    category: '3D Web Games',
    description: 'Massive browser gaming hub featuring free 3D action, multiplayer, and arcade web games.',
    icon: '🎮',
    supportsEmbedding: false,
    alternativeGameId: 'neondash',
  },
  {
    id: 'poki',
    title: 'Poki Playground',
    url: 'https://poki.com',
    category: 'Casual & Arcade',
    description: 'Popular web gaming platform offering free instant games for desktop and mobile devices.',
    icon: '🎯',
    supportsEmbedding: false,
    alternativeGameId: 'cybersnake',
  },
  {
    id: 'itchio',
    title: 'itch.io Indie Hub',
    url: 'https://itch.io',
    category: 'Indie & Experimental',
    description: 'Open marketplace for independent developers with creative HTML5 web games.',
    icon: '🕹️',
    supportsEmbedding: false,
    alternativeGameId: 'spacedefender',
  },
  {
    id: 'armorgames',
    title: 'Armor Games',
    url: 'https://armorgames.com',
    category: 'Strategy & RPG',
    description: 'Classic web portal specializing in deep strategy, puzzle, and tactical RPG web games.',
    icon: '🛡️',
    supportsEmbedding: false,
    alternativeGameId: 'puzzlemaster',
  },
  {
    id: 'gamepix',
    title: 'GamePix',
    url: 'https://www.gamepix.com',
    category: 'HTML5 Web Games',
    description: 'Global distributor of light, fast HTML5 games for browsers.',
    icon: '✨',
    supportsEmbedding: false,
    alternativeGameId: '2048challenge',
  },
];

export const GAME_ACHIEVEMENTS: GameAchievement[] = [
  {
    id: 'first_win',
    title: 'First Victory',
    description: 'Win or complete your first game session in Game X',
    icon: '🏆',
    xpReward: 100,
  },
  {
    id: 'puzzle_master_ach',
    title: 'Matrix Mind',
    description: 'Score 100+ points in Puzzle Master or Memory Matrix',
    icon: '🧩',
    xpReward: 150,
  },
  {
    id: 'speed_demon',
    title: 'Speed Demon',
    description: 'Reach 300+ points in Neon Dash or Cyber Snake',
    icon: '⚡',
    xpReward: 200,
  },
  {
    id: 'challenge_hero',
    title: 'Quest Champion',
    description: 'Claim all daily challenge rewards for today',
    icon: '📅',
    xpReward: 250,
  },
  {
    id: '2048_master',
    title: '2048 Architect',
    description: 'Reach tile 1024 or higher in 2048 Challenge',
    icon: '🔢',
    xpReward: 300,
  },
  {
    id: 'ai_creator_ach',
    title: 'Game Creator',
    description: 'Generate a custom game with AI Game Creator',
    icon: '🤖',
    xpReward: 200,
  },
];

export function getRankTitle(level: number): string {
  if (level >= 20) return 'Omni Legend';
  if (level >= 15) return 'Matrix Master';
  if (level >= 10) return 'Cyber Champion';
  if (level >= 5) return 'Neon Veteran';
  return 'Cyber Novice';
}

export function getLevelProgress(xp: number) {
  const level = Math.floor(xp / 100) + 1;
  const currentLevelXp = xp % 100;
  const xpForNext = 100;
  const progressPct = Math.min(100, Math.round((currentLevelXp / xpForNext) * 100));
  return { level, currentLevelXp, xpForNext, progressPct };
}
