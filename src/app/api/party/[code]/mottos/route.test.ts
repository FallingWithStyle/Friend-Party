import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSupabaseMock, makeRequest, makeParams } from '@/test/utils';

// Mock the Supabase server client
vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn(),
}));

// Import after mock
import { GET } from './route';
import { createClient } from '@/utils/supabase/server';

describe('GET /api/party/[code]/mottos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when unauthorized', async () => {
    const mockClient = createSupabaseMock({ user: null });
    vi.mocked(createClient).mockResolvedValue(mockClient as any);

    const res = await GET(makeRequest('/api/party/ABCDEF/mottos', undefined, 'GET'), makeParams());
    
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe('Unauthorized');
  });

  it('returns 404 when party not found', async () => {
    const mockClient = createSupabaseMock({ 
      user: { id: 'user-A' },
      error: { message: 'Party not found' }
    });
    vi.mocked(createClient).mockResolvedValue(mockClient as any);

    const res = await GET(makeRequest('/api/party/INVALID/mottos', undefined, 'GET'), makeParams('INVALID'));
    
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe('Party not found');
  });

  it('returns 403 when user not in party', async () => {
    const mockClient = createSupabaseMock({ 
      user: { id: 'user-A' },
      partyMembers: [] // Empty party members
    });
    
    // Override the from mock to handle the specific chaining pattern
    mockClient.from = vi.fn().mockImplementation((table: string) => {
      if (table === 'parties') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ 
                data: { id: 'party-1', motto: null, morale_score: null, morale_level: null }, 
                error: null 
              })
            })
          })
        };
      }
      if (table === 'party_members') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null })
              })
            })
          })
        };
      }
      // Default mock
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: null })
          })
        })
      };
    });
    
    vi.mocked(createClient).mockResolvedValue(mockClient as any);

    const res = await GET(makeRequest('/api/party/ABCDEF/mottos', undefined, 'GET'), makeParams());
    
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toBe('Forbidden');
  });

  it('returns empty proposals when no proposals exist', async () => {
    const mockClient = createSupabaseMock({ 
      user: { id: 'user-A' },
      partyMembers: [{ id: 'A', user_id: 'user-A', is_npc: false }]
    });
    
    // Use simple mock system
    mockClient.from = vi.fn().mockImplementation((table: string) => {
      if (table === 'parties') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ 
                data: { id: 'party-1', motto: null, morale_score: null, morale_level: null }, 
                error: null 
              })
            })
          })
        };
      }
      if (table === 'party_motto_proposals') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: [], error: null })
              })
            })
          })
        };
      }
      if (table === 'party_members') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'A' }, error: null })
              })
            })
          })
        };
      }
      if (table === 'party_motto_votes') {
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: [], error: null })
            })
          })
        };
      }
      // Default mock
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: null })
          })
        })
      };
    });

    vi.mocked(createClient).mockResolvedValue(mockClient as any);

    const res = await GET(makeRequest('/api/party/ABCDEF/mottos', undefined, 'GET'), makeParams());
    
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.proposals).toEqual([]);
    expect(json.partyMotto).toBeNull();
    expect(json.myVoteProposalId).toBeNull();
    expect(json.leaderProposalId).toBeNull();
  });

  it('returns proposals with user vote and leader info', async () => {
    const mockClient = createSupabaseMock({ 
      user: { id: 'user-A' },
      partyMembers: [
        { id: 'A', user_id: 'user-A', is_npc: false },
        { id: 'B', user_id: 'user-B', is_leader: true } // Leader
      ]
    });
    
    const mockProposals = [
      {
        id: 'proposal-1',
        party_id: 'party-1',
        proposed_by_member_id: 'A',
        text: 'Test motto 1',
        vote_count: 2,
        is_finalized: false,
        active: true,
        created_at: '2025-01-01T00:00:00Z'
      },
      {
        id: 'proposal-2',
        party_id: 'party-1',
        proposed_by_member_id: 'B',
        text: 'Test motto 2',
        vote_count: 1,
        is_finalized: false,
        active: false,
        created_at: '2025-01-02T00:00:00Z'
      }
    ];

    const mockVotes = [{ proposal_id: 'proposal-1' }];

    // Use simple mock system with call tracking  
    let partyMembersCallCount = 0;
    mockClient.from = vi.fn().mockImplementation((table: string) => {
      if (table === 'parties') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ 
                data: { id: 'party-1', motto: null, morale_score: null, morale_level: null }, 
                error: null 
              })
            })
          })
        };
      }
      if (table === 'party_motto_proposals') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: mockProposals, error: null })
              })
            })
          })
        };
      }
      if (table === 'party_members') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockImplementation(() => {
                  partyMembersCallCount++;
                  // First call is user membership check, second call is leader lookup
                  if (partyMembersCallCount === 1) {
                    return Promise.resolve({ data: { id: 'A' }, error: null });
                  } else {
                    return Promise.resolve({ data: { id: 'B' }, error: null });
                  }
                })
              })
            })
          })
        };
      }
      if (table === 'party_motto_votes') {
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({ data: mockVotes, error: null })
              })
            })
          })
        };
      }
      // Default mock
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: null })
          })
        })
      };
    });

    vi.mocked(createClient).mockResolvedValue(mockClient as any);

    const res = await GET(makeRequest('/api/party/ABCDEF/mottos', undefined, 'GET'), makeParams());
    
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.proposals).toHaveLength(2);
    expect(json.proposals[0].text).toBe('Test motto 1');
    expect(json.proposals[0].active).toBe(true);
    expect(json.myVoteProposalId).toBe('proposal-1');
    expect(json.leaderProposalId).toBe('proposal-2');
  });

  it('handles database errors gracefully', async () => {
    const mockClient = createSupabaseMock({ 
      user: { id: 'user-A' },
      partyMembers: [{ id: 'A', user_id: 'user-A', is_npc: false }]
    });
    
    mockClient.from = vi.fn().mockImplementation((table: string) => {
      if (table === 'parties') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ 
                data: { id: 'party-1', motto: null, morale_score: null, morale_level: null }, 
                error: null 
              })
            })
          })
        };
      }
      if (table === 'party_motto_proposals') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } })
              })
            })
          })
        };
      }
      if (table === 'party_members') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'A' }, error: null })
              })
            })
          })
        };
      }
      // Default mock
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: null })
          })
        })
      };
    });

    vi.mocked(createClient).mockResolvedValue(mockClient as any);

    const res = await GET(makeRequest('/api/party/ABCDEF/mottos', undefined, 'GET'), makeParams());
    
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe('Failed to fetch proposals');
  });

  it('returns party motto and morale info when available', async () => {
    const mockClient = createSupabaseMock({ 
      user: { id: 'user-A' },
      partyMembers: [{ id: 'A', user_id: 'user-A', is_npc: false }],
      party: {
        id: 'party-1',
        motto: 'Test Party Motto',
        morale_score: 85,
        morale_level: 'High'
      }
    });
    
    mockClient.from = vi.fn().mockImplementation((table: string) => {
      if (table === 'parties') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ 
                data: { id: 'party-1', code: 'ABCDEF', motto: 'Test Party Motto', morale_score: 85, morale_level: 'High' }, 
                error: null 
              })
            })
          })
        };
      }
      if (table === 'party_motto_proposals') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: [], error: null })
              })
            })
          })
        };
      }
      if (table === 'party_members') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'A' }, error: null })
              })
            })
          })
        };
      }
      // Default mock
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: null })
          })
        })
      };
    });

    vi.mocked(createClient).mockResolvedValue(mockClient as any);

    const res = await GET(makeRequest('/api/party/ABCDEF/mottos', undefined, 'GET'), makeParams());
    
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.partyMotto).toBe('Test Party Motto');
    expect(json.moraleScore).toBe(85);
    expect(json.moraleLevel).toBe('High');
  });
});
