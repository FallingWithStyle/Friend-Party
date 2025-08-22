import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSupabaseMock, makeRequest, makeParams } from '@/test/utils';

// Mock the Supabase server client
vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn(),
}));

// Import after mock
import { POST } from './route';
import { createClient } from '@/utils/supabase/server';

describe('POST /api/party/[code]/vote', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when unauthorized', async () => {
    const mockClient = createSupabaseMock({ user: null });
    vi.mocked(createClient).mockResolvedValue(mockClient as any);

    const res = await POST(makeRequest('/api/party/ABCDEF/vote', { proposal_id: 'proposal-1' }), makeParams());
    
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe('Unauthorized');
  });

  it('returns 400 when proposal_id is missing', async () => {
    const mockClient = createSupabaseMock({ user: { id: 'user-A' } });
    vi.mocked(createClient).mockResolvedValue(mockClient as any);

    const res = await POST(makeRequest('/api/party/ABCDEF/vote', {}), makeParams());
    
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('Missing proposal_id');
  });

  it('returns 404 when proposal not found', async () => {
    const mockClient = createSupabaseMock({ user: { id: 'user-A' } });
    
    mockClient.from = vi.fn().mockImplementation((table: string) => {
      if (table === 'name_proposals') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ 
            data: null, 
            error: { message: 'Proposal not found' }
          }),
        };
      }
      return mockClient.from(table);
    });

    vi.mocked(createClient).mockResolvedValue(mockClient as any);

    const res = await POST(makeRequest('/api/party/ABCDEF/vote', { proposal_id: 'invalid-proposal' }), makeParams());
    
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe('Proposal not found');
  });

  it('returns 403 when voter not in party', async () => {
    const mockClient = createSupabaseMock({ user: { id: 'user-A' } });
    
    mockClient.from = vi.fn().mockImplementation((table: string) => {
      if (table === 'name_proposals') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ 
            data: { party_id: 'party-1', target_member_id: 'member-B' }, 
            error: null
          }),
        };
      }
      if (table === 'party_members') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ 
            data: null, 
            error: { message: 'Voter not found' }
          }),
        };
      }
      return mockClient.from(table);
    });

    vi.mocked(createClient).mockResolvedValue(mockClient as any);

    const res = await POST(makeRequest('/api/party/ABCDEF/vote', { proposal_id: 'proposal-1' }), makeParams());
    
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toBe('Voter not found in this party');
  });

  it('returns 403 when voter tries to vote for their own name', async () => {
    const mockClient = createSupabaseMock({ user: { id: 'user-A' } });
    
    mockClient.from = vi.fn().mockImplementation((table: string) => {
      if (table === 'name_proposals') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ 
            data: { party_id: 'party-1', target_member_id: 'member-A' }, 
            error: null
          }),
        };
      }
      if (table === 'party_members') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ 
            data: { id: 'member-A' }, 
            error: null
          }),
        };
      }
      return mockClient.from(table);
    });

    vi.mocked(createClient).mockResolvedValue(mockClient as any);

    const res = await POST(makeRequest('/api/party/ABCDEF/vote', { proposal_id: 'proposal-1' }), makeParams());
    
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toBe('You cannot vote for your own name');
  });

  it('returns 409 when voter has already voted', async () => {
    const mockClient = createSupabaseMock({ user: { id: 'user-A' } });
    
    mockClient.from = vi.fn().mockImplementation((table: string) => {
      if (table === 'name_proposals') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ 
            data: { party_id: 'party-1', target_member_id: 'member-B' }, 
            error: null
          }),
        };
      }
      if (table === 'party_members') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ 
            data: { id: 'member-A' }, 
            error: null
          }),
        };
      }
      if (table === 'name_proposal_votes') {
        return {
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ 
            data: null, 
            error: { code: '23505', message: 'Unique constraint violation' }
          }),
        };
      }
      return mockClient.from(table);
    });

    vi.mocked(createClient).mockResolvedValue(mockClient as any);

    const res = await POST(makeRequest('/api/party/ABCDEF/vote', { proposal_id: 'proposal-1' }), makeParams());
    
    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.error).toBe('You have already voted for this proposal.');
  });

  it('successfully casts a vote', async () => {
    const mockClient = createSupabaseMock({ user: { id: 'user-A' } });
    
    const mockVote = {
      id: 'vote-1',
      proposal_id: 'proposal-1',
      voter_member_id: 'member-A',
      created_at: '2025-01-01T00:00:00Z'
    };
    
    mockClient.from = vi.fn().mockImplementation((table: string) => {
      if (table === 'name_proposals') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ 
            data: { party_id: 'party-1', target_member_id: 'member-B' }, 
            error: null
          }),
        };
      }
      if (table === 'party_members') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ 
            data: { id: 'member-A' }, 
            error: null
          }),
        };
      }
      if (table === 'name_proposal_votes') {
        return {
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ 
            data: mockVote, 
            error: null
          }),
        };
      }
      return mockClient.from(table);
    });

    vi.mocked(createClient).mockResolvedValue(mockClient as any);

    const res = await POST(makeRequest('/api/party/ABCDEF/vote', { proposal_id: 'proposal-1' }), makeParams());
    
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.id).toBe('vote-1');
    expect(json.proposal_id).toBe('proposal-1');
    expect(json.voter_member_id).toBe('member-A');
  });

  it('handles other database errors gracefully', async () => {
    const mockClient = createSupabaseMock({ user: { id: 'user-A' } });
    
    mockClient.from = vi.fn().mockImplementation((table: string) => {
      if (table === 'name_proposals') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ 
            data: { party_id: 'party-1', target_member_id: 'member-B' }, 
            error: null
          }),
        };
      }
      if (table === 'party_members') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ 
            data: { id: 'member-A' }, 
            error: null
          }),
        };
      }
      if (table === 'name_proposal_votes') {
        return {
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ 
            data: null, 
            error: { message: 'Database error' }
          }),
        };
      }
      return mockClient.from(table);
    });

    vi.mocked(createClient).mockResolvedValue(mockClient as any);

    const res = await POST(makeRequest('/api/party/ABCDEF/vote', { proposal_id: 'proposal-1' }), makeParams());
    
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe('Failed to cast vote');
    expect(json.details).toBe('Database error');
  });
});
