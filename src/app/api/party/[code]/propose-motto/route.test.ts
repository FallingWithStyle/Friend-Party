import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSupabaseMock, makeRequest, makeParams } from '@/test/utils';

// Mock the Supabase server client
vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn(),
}));

// Mock the morale functions
vi.mock('@/lib/morale', () => ({
  computeMoraleScore: vi.fn(() => 75),
  resolveMoraleLevel: vi.fn(() => 'High'),
}));

// Import after mocks
import { POST } from './route';
import { createClient } from '@/utils/supabase/server';
import { computeMoraleScore, resolveMoraleLevel } from '@/lib/morale';

describe('POST /api/party/[code]/propose-motto', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when text is missing or empty', async () => {
    const mockClient = createSupabaseMock({ user: { id: 'user-A' } });
    vi.mocked(createClient).mockResolvedValue(mockClient as any);

    const res = await POST(makeRequest('/api/party/ABCDEF/propose-motto', {}), makeParams());
    
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('Invalid text');
  });

  it('returns 400 when text is only whitespace', async () => {
    const mockClient = createSupabaseMock({ user: { id: 'user-A' } });
    vi.mocked(createClient).mockResolvedValue(mockClient as any);

    const res = await POST(makeRequest('/api/party/ABCDEF/propose-motto', { text: '   ' }), makeParams());
    
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('Invalid text');
  });

  it('returns 401 when unauthorized', async () => {
    const mockClient = createSupabaseMock({ user: null });
    vi.mocked(createClient).mockResolvedValue(mockClient as any);

    const res = await POST(makeRequest('/api/party/ABCDEF/propose-motto', { text: 'Test motto' }), makeParams());
    
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

    const res = await POST(makeRequest('/api/party/INVALID/propose-motto', { text: 'Test motto' }), makeParams('INVALID'));
    
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe('Party not found');
  });

  it('returns 403 when user not in party', async () => {
    const mockClient = createSupabaseMock({ 
      user: { id: 'user-A' },
      partyMembers: [] // Empty party members
    });
    vi.mocked(createClient).mockResolvedValue(mockClient as any);

    const res = await POST(makeRequest('/api/party/ABCDEF/propose-motto', { text: 'Test motto' }), makeParams());
    
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toBe('Not a member of this party');
  });

  it('successfully creates a motto proposal', async () => {
    const mockClient = createSupabaseMock({ 
      user: { id: 'user-A' },
      partyMembers: [{ id: 'A', user_id: 'user-A', is_npc: false }]
    });
    
    const mockProposal = {
      id: 'proposal-1',
      party_id: 'party-1',
      proposed_by_member_id: 'A',
      text: 'Test motto',
      vote_count: 0,
      is_finalized: false,
      active: true,
      created_at: '2025-01-01T00:00:00Z'
    };

    mockClient.from = vi.fn().mockImplementation((table: string) => {
      if (table === 'party_members') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { id: 'A' }, error: null })
            })
          })
        };
      }
      if (table === 'party_motto_proposals') {
        return {
          insert: vi.fn().mockResolvedValue({ data: null, error: null }),
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ 
              data: mockProposal, 
              error: null 
            })
          })
        };
      }
      // Use default mock for other tables
      return mockClient.from(table);
    });

    vi.mocked(createClient).mockResolvedValue(mockClient as any);

    const res = await POST(makeRequest('/api/party/ABCDEF/propose-motto', { text: 'Test motto' }), makeParams());
    
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.proposal.id).toBe('proposal-1');
    expect(json.proposal.text).toBe('Test motto');
    expect(json.proposal.proposed_by_member_id).toBe('A');
  });

  it('trims whitespace from motto text', async () => {
    const mockClient = createSupabaseMock({ 
      user: { id: 'user-A' },
      partyMembers: [{ id: 'A', user_id: 'user-A', is_npc: false }]
    });
    
    mockClient.from = vi.fn().mockImplementation((table: string) => {
      if (table === 'party_members') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { id: 'A' }, error: null })
            })
          })
        };
      }
      if (table === 'party_motto_proposals') {
        return {
          insert: vi.fn().mockImplementation((data) => {
            // Verify the text is trimmed
            expect(data.text).toBe('Test motto');
            return { error: null };
          }),
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ 
              data: { id: 'proposal-1', text: 'Test motto' }, 
              error: null 
            })
          })
        };
      }
      // Use default mock for other tables
      return mockClient.from(table);
    });

    vi.mocked(createClient).mockResolvedValue(mockClient as any);

    const res = await POST(makeRequest('/api/party/ABCDEF/propose-motto', { text: '  Test motto  ' }), makeParams());
    
    expect(res.status).toBe(201);
  });

  it('handles proposal insertion errors', async () => {
    const mockClient = createSupabaseMock({ 
      user: { id: 'user-A' },
      partyMembers: [{ id: 'A', user_id: 'user-A', is_npc: false }]
    });
    
    mockClient.from = vi.fn().mockImplementation((table: string) => {
      if (table === 'party_members') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ 
            data: { id: 'A' }, 
            error: null 
          }),
        };
      }
      if (table === 'party_motto_proposals') {
        return {
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ 
            data: null, 
            error: { message: 'Insert error' }
          }),
        };
      }
      return mockClient.from(table);
    });

    vi.mocked(createClient).mockResolvedValue(mockClient as any);

    const res = await POST(makeRequest('/api/party/ABCDEF/propose-motto', { text: 'Test motto' }), makeParams());
    
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe('Failed to propose motto');
  });

  it('updates party morale after successful proposal', async () => {
    const mockClient = createSupabaseMock({ 
      user: { id: 'user-A' },
      partyMembers: [{ id: 'A', user_id: 'user-A', is_npc: false }]
    });
    
    mockClient.from = vi.fn().mockImplementation((table: string) => {
      if (table === 'party_members') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ 
            data: { id: 'A' }, 
            error: null 
          }),
        };
      }
      if (table === 'party_motto_proposals') {
        return {
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ 
            data: { id: 'proposal-1' }, 
            error: null 
          }),
        };
      }
      return mockClient.from(table);
    });

    vi.mocked(createClient).mockResolvedValue(mockClient as any);

    const res = await POST(makeRequest('/api/party/ABCDEF/propose-motto', { text: 'Test motto' }), makeParams());
    
    expect(res.status).toBe(201);
    expect(computeMoraleScore).toHaveBeenCalled();
    expect(resolveMoraleLevel).toHaveBeenCalled();
  });

  it('handles morale update errors gracefully', async () => {
    const mockClient = createSupabaseMock({ 
      user: { id: 'user-A' },
      partyMembers: [{ id: 'A', user_id: 'user-A', is_npc: false }]
    });
    
    // Mock the morale calculation to throw an error
    vi.mocked(computeMoraleScore).mockImplementation(() => {
      throw new Error('Morale calculation error');
    });
    
    mockClient.from = vi.fn().mockImplementation((table: string) => {
      if (table === 'party_members') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ 
            data: { id: 'A' }, 
            error: null 
          }),
        };
      }
      if (table === 'party_motto_proposals') {
        return {
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ 
            data: { id: 'proposal-1' }, 
            error: null 
          }),
        };
      }
      return mockClient.from(table);
    });

    vi.mocked(createClient).mockResolvedValue(mockClient as any);

    const res = await POST(makeRequest('/api/party/ABCDEF/propose-motto', { text: 'Test motto' }), makeParams());
    
    // Should still succeed even with morale error
    expect(res.status).toBe(201);
  });

  it('handles malformed JSON gracefully', async () => {
    const mockClient = createSupabaseMock({ user: { id: 'user-A' } });
    vi.mocked(createClient).mockResolvedValue(mockClient as any);

    // Create a request with malformed JSON
    const request = new Request('http://localhost/api/party/ABCDEF/propose-motto', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid json',
    });

    const res = await POST(request, makeParams());
    
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('Invalid text');
  });
});
