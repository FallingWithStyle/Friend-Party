export interface MemberLike {
  id: string;
  is_npc: boolean;
}

export function computeEligibleVoterCount(members: MemberLike[], targetId: string): number {
  return members.filter(m => !m.is_npc && m.id !== targetId).length;
}

export function applyVoteBroadcast(
  prevCounts: Record<string, number>,
  payload: { targetId: string; yesCount: number }
): Record<string, number> {
  const next = { ...prevCounts };
  next[payload.targetId] = payload.yesCount;
  return next;
}

export function applyConversion(
  members: MemberLike[],
  targetId: string,
  prevCounts: Record<string, number>
): { members: MemberLike[]; counts: Record<string, number> } {
  const updatedMembers = members.map(m => (m.id === targetId ? { ...m, is_npc: true } : m));
  if (!(targetId in prevCounts)) return { members: updatedMembers, counts: prevCounts };
  const nextCounts = { ...prevCounts };
  delete nextCounts[targetId];
  return { members: updatedMembers, counts: nextCounts };
}


