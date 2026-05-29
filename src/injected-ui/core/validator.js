// ============================================================
//  KidBrainBreak — Answer Validator & XP System
// ============================================================

const BASE_XP     = 10;
const STREAK_MULT = 1.5;
const TIME_BONUS  = 5;

export function calculateXP({ correct, timeLeft, totalTime, streakDays = 0 }) {
  if (!correct) return 0;
  let xp = BASE_XP;
  // Time bonus: +5 XP if answered in the first half of allotted time
  if (timeLeft > totalTime / 2) xp += TIME_BONUS;
  // Streak multiplier
  if (streakDays >= 3)  xp = Math.floor(xp * STREAK_MULT);
  if (streakDays >= 7)  xp = Math.floor(xp * 2);
  return xp;
}

export function getResultData(correct) {
  if (correct) {
    const msgs = [
      { emoji: '🎉', title: 'Brilliant!' },
      { emoji: '🚀', title: 'Nailed it!' },
      { emoji: '⭐', title: 'Superstar!' },
      { emoji: '🏆', title: 'Champion!' },
      { emoji: '🎯', title: 'Spot on!' },
      { emoji: '💡', title: 'Genius!' },
      { emoji: '🌟', title: 'Outstanding!' },
    ];
    return msgs[Math.floor(Math.random() * msgs.length)];
  } else {
    const msgs = [
      { emoji: '🤔', title: "Not quite…" },
      { emoji: '💪', title: "Keep going!" },
      { emoji: '📖', title: "Almost there!" },
      { emoji: '🌱', title: "You're learning!" },
    ];
    return msgs[Math.floor(Math.random() * msgs.length)];
  }
}
