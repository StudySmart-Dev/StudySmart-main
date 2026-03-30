const TIER_STEPS = [
  { tier: 1, name: 'Novice Notebook', thresholdXp: 0 },
  { tier: 2, name: 'Foundation Scholar', thresholdXp: 100 },
  { tier: 3, name: 'Learning Explorer', thresholdXp: 350 },
  { tier: 4, name: 'Course Cultivator', thresholdXp: 650 },
  { tier: 5, name: 'Study Virtuoso', thresholdXp: 1100 },
  { tier: 6, name: 'Tutor Triumph', thresholdXp: 1700 },
  { tier: 7, name: 'Seminar Strategist', thresholdXp: 2450 },
  { tier: 8, name: 'Knowledge Knight', thresholdXp: 3350 },
  { tier: 9, name: 'Research Ready', thresholdXp: 4400 },
  { tier: 10, name: 'Mentor Mastery', thresholdXp: 5600 },
  { tier: 11, name: 'Scholar Apex', thresholdXp: 6950 },
  { tier: 12, name: 'Legendary Educator', thresholdXp: 8450 }
];

export const BADGES = {
  STRICT_MONITOR: 'Strict monitor',
  FIRST_UPLOAD: 'First Upload',
  FIRST_JOIN: 'First Room Join'
};

export function normalizeUser(user) {
  return {
    ...user,
    institution: user?.institution != null ? String(user.institution) : '',
    xp: Number(user?.xp || 0),
    rankTier: Number(user?.rankTier || 1),
    upvoteCount: Number(user?.upvoteCount || 0),
    downvoteCount: Number(user?.downvoteCount || 0),
    notesCreatedCount: Number(user?.notesCreatedCount || 0),
    joinedRoomsCount: Number(user?.joinedRoomsCount || 0),
    chatMessagesCount: Number(user?.chatMessagesCount || 0),
    boardStrokesCount: Number(user?.boardStrokesCount || 0),
    badges: Array.isArray(user?.badges) ? user.badges : []
  };
}

export function getTierByXp(xp) {
  const n = Number(xp || 0);
  let best = TIER_STEPS[0];
  for (const step of TIER_STEPS) {
    if (n >= step.thresholdXp) best = step;
  }
  return best;
}

export function hasBadge(user, badgeName) {
  return (user?.badges || []).some((b) => {
    if (typeof b === 'string') return b === badgeName;
    return b?.name === badgeName;
  });
}

export function awardForUpvote({ user, xpDelta = 2 }) {
  const next = normalizeUser(user);
  next.upvoteCount += 1;
  next.xp += xpDelta;

  const tier = getTierByXp(next.xp);
  next.rankTier = tier.tier;

  return { user: next, earned: { xpDelta } };
}

export function awardForDownvote({ user, xpPerMilestone = 5, milestoneSize = 5 }) {
  const prev = normalizeUser(user);
  const prevDown = prev.downvoteCount;
  const nextDown = prevDown + 1;

  const prevMilestones = Math.floor(prevDown / milestoneSize);
  const nextMilestones = Math.floor(nextDown / milestoneSize);
  const milestoneXp = (nextMilestones - prevMilestones) * xpPerMilestone;

  const next = {
    ...prev,
    downvoteCount: nextDown,
    xp: prev.xp + milestoneXp
  };

  const tier = getTierByXp(next.xp);
  next.rankTier = tier.tier;

  const earnedBadges = [];
  if (nextDown >= 10 && !hasBadge(next, BADGES.STRICT_MONITOR)) {
    earnedBadges.push(BADGES.STRICT_MONITOR);
    next.badges = [...(next.badges || []), { name: BADGES.STRICT_MONITOR, earnedAt: new Date().toISOString() }];
  }

  return { user: next, earned: { xpDelta: milestoneXp, badges: earnedBadges } };
}

export function awardForNoteUpload({ user, xp = 15 }) {
  const prev = normalizeUser(user);
  const next = { ...prev, notesCreatedCount: prev.notesCreatedCount + 1, xp: prev.xp + xp };

  const tier = getTierByXp(next.xp);
  next.rankTier = tier.tier;

  const earnedBadges = [];
  if (next.notesCreatedCount === 1 && !hasBadge(next, BADGES.FIRST_UPLOAD)) {
    earnedBadges.push(BADGES.FIRST_UPLOAD);
    next.badges = [...(next.badges || []), { name: BADGES.FIRST_UPLOAD, earnedAt: new Date().toISOString() }];
  }

  return { user: next, earned: { xpDelta: xp, badges: earnedBadges } };
}

export function awardForRoomJoin({ user, xp = 8 }) {
  const prev = normalizeUser(user);
  const next = { ...prev, joinedRoomsCount: prev.joinedRoomsCount + 1, xp: prev.xp + xp };

  const tier = getTierByXp(next.xp);
  next.rankTier = tier.tier;

  const earnedBadges = [];
  if (next.joinedRoomsCount === 1 && !hasBadge(next, BADGES.FIRST_JOIN)) {
    earnedBadges.push(BADGES.FIRST_JOIN);
    next.badges = [...(next.badges || []), { name: BADGES.FIRST_JOIN, earnedAt: new Date().toISOString() }];
  }

  return { user: next, earned: { xpDelta: xp, badges: earnedBadges } };
}

export function awardForChatMessage({ user, xp = 1 }) {
  const prev = normalizeUser(user);
  const next = { ...prev, chatMessagesCount: prev.chatMessagesCount + 1, xp: prev.xp + xp };
  const tier = getTierByXp(next.xp);
  next.rankTier = tier.tier;
  return { user: next, earned: { xpDelta: xp } };
}

export function awardForBoardStroke({ user, xp = 2 }) {
  const prev = normalizeUser(user);
  const next = { ...prev, boardStrokesCount: prev.boardStrokesCount + 1, xp: prev.xp + xp };
  const tier = getTierByXp(next.xp);
  next.rankTier = tier.tier;
  return { user: next, earned: { xpDelta: xp } };
}

export function awardForPomodoroComplete({ user, xp = 3 }) {
  const prev = normalizeUser(user);
  const next = { ...prev, xp: prev.xp + xp };
  const tier = getTierByXp(next.xp);
  next.rankTier = tier.tier;
  return { user: next, earned: { xpDelta: xp } };
}

