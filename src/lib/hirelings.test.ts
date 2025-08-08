import { describe, it, expect } from 'vitest';
import { computeEligibleVoterCount, applyVoteBroadcast, applyConversion, MemberLike } from './hirelings';

describe('hirelings helpers', () => {
  const members: MemberLike[] = [
    { id: 'A', is_npc: false },
    { id: 'B', is_npc: false },
    { id: 'C', is_npc: true },
  ];

  it('computes eligible voter count (exclude NPCs and target)', () => {
    expect(computeEligibleVoterCount(members, 'A')).toBe(1); // B only
    expect(computeEligibleVoterCount(members, 'B')).toBe(1); // A only
    expect(computeEligibleVoterCount(members, 'C')).toBe(2); // A and B (both non-NPC; target C is excluded)
  });

  it('applies vote broadcast to counts map', () => {
    const next = applyVoteBroadcast({}, { targetId: 'B', yesCount: 2 });
    expect(next['B']).toBe(2);
  });

  it('applies conversion: sets is_npc and clears counts for target', () => {
    const prevCounts = { B: 2 } as Record<string, number>;
    const { members: updated, counts } = applyConversion(members, 'B', prevCounts);
    expect(updated.find(m => m.id === 'B')?.is_npc).toBe(true);
    expect(counts['B']).toBeUndefined();
  });
});


