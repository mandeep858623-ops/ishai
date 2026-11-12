import { GameVerseProfile } from './GameVerseTypes';

const PROFILE_STORAGE_KEY = 'SUPERAI_GAMEVERSE_PROFILE_V2';

export const DEFAULT_USER_PROFILE: GameVerseProfile = {
  username: 'CyberGamer',
  avatar: '🎮',
  xp: 150,
  level: 2,
  streakDays: 3,
  unlockedAchievements: ['first_win'],
  favoriteGames: ['neondash', 'cybersnake'],
  recentlyPlayed: ['neondash', 'cybersnake', '2048challenge'],
  customBookmarks: [
    { id: 'bm_1', title: 'CrazyGames Arcade', url: 'https://www.crazygames.com', icon: '🎮' },
    { id: 'bm_2', title: 'Poki Playground', url: 'https://poki.com', icon: '🎯' },
  ],
  gameStats: {
    neondash: { highScore: 420, victories: 2, played: 5 },
    cybersnake: { highScore: 180, victories: 1, played: 3 },
    memorymatrix: { highScore: 8, victories: 1, played: 2 },
    spacedefender: { highScore: 650, victories: 2, played: 4 },
    '2048challenge': { highScore: 1024, victories: 1, played: 3 },
  },
  completedDailyChallenges: [],
};

export function loadGameVerseProfile(): GameVerseProfile {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_USER_PROFILE,
        ...parsed,
        gameStats: {
          ...DEFAULT_USER_PROFILE.gameStats,
          ...(parsed.gameStats || {}),
        },
      };
    }
  } catch (e) {
    console.warn('[GameVerseService] Failed to load profile from storage:', e);
  }
  return DEFAULT_USER_PROFILE;
}

export function saveGameVerseProfile(profile: GameVerseProfile): void {
  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.warn('[GameVerseService] Failed to save profile to storage:', e);
  }
}

export function recordGameSession(
  profile: GameVerseProfile,
  gameId: string,
  score: number,
  victory: boolean
): { updatedProfile: GameVerseProfile; xpGained: number } {
  let xpGained = victory ? 100 : 30;

  const currentStats = profile.gameStats[gameId] || { highScore: 0, victories: 0, played: 0 };
  const isNewHighScore = score > currentStats.highScore;

  if (isNewHighScore) {
    xpGained += 50; // Bonus XP for high score!
  }

  const updatedStats = {
    highScore: Math.max(currentStats.highScore, score),
    victories: currentStats.victories + (victory ? 1 : 0),
    played: currentStats.played + 1,
  };

  const newXp = profile.xp + xpGained;
  const newLevel = Math.floor(newXp / 100) + 1;

  // Check achievements
  const newAchievements = [...profile.unlockedAchievements];
  if (!newAchievements.includes('first_win')) {
    newAchievements.push('first_win');
  }
  if (isNewHighScore && !newAchievements.includes('speed_demon')) {
    newAchievements.push('speed_demon');
  }
  if (gameId === '2048challenge' && score >= 1024 && !newAchievements.includes('2048_master')) {
    newAchievements.push('2048_master');
  }

  const updatedProfile: GameVerseProfile = {
    ...profile,
    xp: newXp,
    level: newLevel,
    unlockedAchievements: newAchievements,
    gameStats: {
      ...profile.gameStats,
      [gameId]: updatedStats,
    },
    recentlyPlayed: [
      gameId,
      ...profile.recentlyPlayed.filter((id) => id !== gameId),
    ].slice(0, 10),
  };

  saveGameVerseProfile(updatedProfile);

  return { updatedProfile, xpGained };
}

export function claimDailyChallenge(
  profile: GameVerseProfile,
  challengeId: string,
  xpReward: number
): GameVerseProfile {
  if (profile.completedDailyChallenges.includes(challengeId)) {
    return profile;
  }

  const newCompleted = [...profile.completedDailyChallenges, challengeId];
  const newXp = profile.xp + xpReward;
  const newLevel = Math.floor(newXp / 100) + 1;

  const newAchievements = [...profile.unlockedAchievements];
  if (newCompleted.length >= 3 && !newAchievements.includes('challenge_hero')) {
    newAchievements.push('challenge_hero');
  }

  const updatedProfile: GameVerseProfile = {
    ...profile,
    xp: newXp,
    level: newLevel,
    completedDailyChallenges: newCompleted,
    unlockedAchievements: newAchievements,
  };

  saveGameVerseProfile(updatedProfile);

  return updatedProfile;
}

export function resetGameVerseProfile(): GameVerseProfile {
  try {
    localStorage.removeItem(PROFILE_STORAGE_KEY);
  } catch (e) {
    console.warn('[GameVerseService] Failed to reset profile storage:', e);
  }
  return DEFAULT_USER_PROFILE;
}
