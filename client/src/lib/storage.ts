import { UserPool, UserData, GameScore, LOCAL_STORAGE_KEY, UserStats } from './types';

// Helper to get initial empty stats
const getInitialStats = (): UserStats => ({
  totalGames: 0,
  averageScore: 0,
  totalTrainingTime: 0,
  streak: 0,
  scores: [],
});

// Helper to get initial user data
const getInitialUserData = (): UserData => ({
  stats: getInitialStats(),
  lastUpdated: new Date().toISOString(),
});

// Load all users from local storage
export const loadUserPool = (): UserPool => {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('Failed to load user pool:', error);
    return {};
  }
};

// Save all users to local storage
export const saveUserPool = (pool: UserPool): void => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(pool));
  } catch (error) {
    console.error('Failed to save user pool:', error);
  }
};

// Get a specific user's data
export const getUserData = (username: string): UserData | null => {
  const pool = loadUserPool();
  return pool[username] || null;
};

// Create or login a user
export const loginUser = (username: string): UserData => {
  const pool = loadUserPool();
  if (!pool[username]) {
    pool[username] = getInitialUserData();
    saveUserPool(pool);
  }
  return pool[username];
};

// Save a game score for a user
export const saveGameScore = (username: string, score: GameScore): void => {
  const pool = loadUserPool();
  if (!pool[username]) {
    pool[username] = getInitialUserData();
  }

  const user = pool[username];
  user.stats.scores.push(score);
  
  // Update aggregate stats
  user.stats.totalGames = user.stats.scores.length;
  user.stats.totalTrainingTime += score.time;
  
  const totalScore = user.stats.scores.reduce((sum, s) => sum + s.score, 0);
  user.stats.averageScore = totalScore / user.stats.totalGames;
  
  // Calculate streak (simplified logic: check if last game was today or yesterday)
  // A more robust implementation would sort by date and check consecutive days
  const today = new Date().toISOString().split('T')[0];
  const lastGameDate = user.stats.scores.length > 1 
    ? user.stats.scores[user.stats.scores.length - 2].date.split('T')[0] 
    : null;
    
  if (score.date.startsWith(today)) {
    if (lastGameDate !== today) {
       // If this is the first game today, and we had a game yesterday, increment streak
       // For now, we'll just keep it simple or implement a proper streak calc function later
       // This is a placeholder for the complex streak logic
    }
  }
  
  // Recalculate streak properly
  user.stats.streak = calculateStreak(user.stats.scores);

  user.lastUpdated = new Date().toISOString();
  saveUserPool(pool);
};

function calculateStreak(scores: GameScore[]): number {
  if (scores.length === 0) return 0;
  
  // Sort scores by date descending
  const sortedScores = [...scores].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  const uniqueDates = new Set<string>();
  sortedScores.forEach(s => uniqueDates.add(s.date.split('T')[0]));
  
  const sortedDates = Array.from(uniqueDates).sort().reverse();
  
  if (sortedDates.length === 0) return 0;
  
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  
  // If no game today or yesterday, streak is broken (unless we want to be lenient)
  if (sortedDates[0] !== today && sortedDates[0] !== yesterday) {
    return 0;
  }
  
  let streak = 1;
  let currentDate = new Date(sortedDates[0]);
  
  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = new Date(sortedDates[i]);
    const diffTime = Math.abs(currentDate.getTime() - prevDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    
    if (diffDays === 1) {
      streak++;
      currentDate = prevDate;
    } else {
      break;
    }
  }
  
  return streak;
}

// Import data logic
export const importData = (jsonContent: string): { added: number, merged: number } => {
  try {
    const importedPool: UserPool = JSON.parse(jsonContent);
    const currentPool = loadUserPool();
    let added = 0;
    let merged = 0;

    Object.keys(importedPool).forEach(username => {
      if (!currentPool[username]) {
        currentPool[username] = importedPool[username];
        added++;
      } else {
        // Merge logic
        const currentScores = currentPool[username].stats.scores;
        const importedScores = importedPool[username].stats.scores;
        
        let newScoresAdded = false;
        
        importedScores.forEach(importedScore => {
          // Check for duplicates
          const isDuplicate = currentScores.some(existingScore => 
            existingScore.date === importedScore.date && 
            existingScore.game === importedScore.game && 
            existingScore.score === importedScore.score
          );
          
          if (!isDuplicate) {
            currentScores.push(importedScore);
            newScoresAdded = true;
          }
        });
        
        if (newScoresAdded) {
          merged++;
          // Re-sort and re-calculate stats
          currentScores.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          
          const stats = currentPool[username].stats;
          stats.totalGames = currentScores.length;
          stats.totalTrainingTime = currentScores.reduce((sum, s) => sum + s.time, 0);
          stats.averageScore = currentScores.reduce((sum, s) => sum + s.score, 0) / stats.totalGames;
          stats.streak = calculateStreak(currentScores);
          currentPool[username].lastUpdated = new Date().toISOString();
        }
      }
    });

    saveUserPool(currentPool);
    return { added, merged };
  } catch (error) {
    console.error('Import failed:', error);
    throw new Error('Invalid JSON file');
  }
};
