import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSupabaseMock, makeRequest, makeParams } from '@/test/utils';

// Mock the Supabase server client
vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn(),
}));

// Import after mock
import { POST } from './route';
import { createClient } from '@/utils/supabase/server';

describe('POST /api/party/[code]/join', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when first name is missing', async () => {
    const mockClient = createSupabaseMock({ user: { id: 'user-A' } });
    vi.mocked(createClient).mockResolvedValue(mockClient as any);

    const res = await POST(makeRequest('/api/party/ABCDEF/join', { lastName: 'Smith' }), makeParams());
    
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('First name is required');
  });

  it('returns 401 when user not authenticated', async () => {
    const mockClient = createSupabaseMock({ user: null });
    vi.mocked(createClient).mockResolvedValue(mockClient as any);

    const res = await POST(makeRequest('/api/party/ABCDEF/join', { firstName: 'John', lastName: 'Smith' }), makeParams());
    
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe('You must be logged in to join a party');
  });

  it('returns 404 when party not found', async () => {
    const mockClient = createSupabaseMock({ 
      user: { id: 'user-A' },
      error: { message: 'Party not found' }
    });
    vi.mocked(createClient).mockResolvedValue(mockClient as any);

    const res = await POST(makeRequest('/api/party/INVALID/join', { firstName: 'John', lastName: 'Smith' }), makeParams('INVALID'));
    
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe('Party not found');
  });

  it('successfully joins user to party when not already a member', async () => {
    const mockClient = createSupabaseMock({ 
      user: { id: 'user-A', email: 'john@example.com' }
    });
    
    // Mock the profiles table upsert
    mockClient.from = vi.fn().mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          upsert: vi.fn().mockResolvedValue({ error: null }),
        };
      }
      if (table === 'parties') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ 
            data: { id: 'party-1' }, 
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
            error: { code: 'PGRST116' } // Not found error
          }),
          insert: vi.fn().mockResolvedValue({ error: null }),
        };
      }
      return mockClient.from(table);
    });

    vi.mocked(createClient).mockResolvedValue(mockClient as any);

    const res = await POST(makeRequest('/api/party/ABCDEF/join', { firstName: 'John', lastName: 'Smith' }), makeParams());
    
    expect(res.status).toBe(201);
  });

  it('handles existing member gracefully', async () => {
    const mockClient = createSupabaseMock({ 
      user: { id: 'user-A', email: 'john@example.com' }
    });
    
    mockClient.from = vi.fn().mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          upsert: vi.fn().mockResolvedValue({ error: null }),
        };
      }
      if (table === 'parties') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ 
            data: { id: 'party-1' }, 
            error: null 
          }),
        };
      }
      if (table === 'party_members') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ 
            data: { id: 'member-1' }, 
            error: null 
          }),
        };
      }
      return mockClient.from(table);
    });

    vi.mocked(createClient).mockResolvedValue(mockClient as any);

    const res = await POST(makeRequest('/api/party/ABCDEF/join', { firstName: 'John', lastName: 'Smith' }), makeParams());
    
    expect(res.status).toBe(201);
  });

  it('handles profile update errors gracefully', async () => {
    const mockClient = createSupabaseMock({ 
      user: { id: 'user-A', email: 'john@example.com' }
    });
    
    mockClient.from = vi.fn().mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          upsert: vi.fn().mockResolvedValue({ error: { message: 'Profile error' } }),
        };
      }
      if (table === 'parties') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ 
            data: { id: 'party-1' }, 
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
            error: { code: 'PGRST116' }
          }),
          insert: vi.fn().mockResolvedValue({ error: null }),
        };
      }
      return mockClient.from(table);
    });

    vi.mocked(createClient).mockResolvedValue(mockClient as any);

    const res = await POST(makeRequest('/api/party/ABCDEF/join', { firstName: 'John', lastName: 'Smith' }), makeParams());
    
    // Should still succeed even with profile error
    expect(res.status).toBe(201);
  });

  it('handles member insertion errors', async () => {
    const mockClient = createSupabaseMock({ 
      user: { id: 'user-A', email: 'john@example.com' }
    });
    
    mockClient.from = vi.fn().mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          upsert: vi.fn().mockResolvedValue({ error: null }),
        };
      }
      if (table === 'parties') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ 
            data: { id: 'party-1' }, 
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
            error: { code: 'PGRST116' }
          }),
          insert: vi.fn().mockResolvedValue({ error: { message: 'Insert error' } }),
        };
      }
      return mockClient.from(table);
    });

    vi.mocked(createClient).mockResolvedValue(mockClient as any);

    const res = await POST(makeRequest('/api/party/ABCDEF/join', { firstName: 'John', lastName: 'Smith' }), makeParams());
    
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toContain('Internal server error');
  });

  it('handles party fetch errors after successful join', async () => {
    const mockClient = createSupabaseMock({ 
      user: { id: 'user-A', email: 'john@example.com' }
    });
    
    mockClient.from = vi.fn().mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          upsert: vi.fn().mockResolvedValue({ error: null }),
        };
      }
      if (table === 'parties') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ 
                data: { id: 'party-1' }, 
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
              single: vi.fn().mockResolvedValue({ 
                data: null, 
                error: { code: 'PGRST116' }
              })
            })
          }),
          insert: vi.fn().mockResolvedValue({ error: null }),
        };
      }
      // Default mock to prevent recursion
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: null })
          })
        }),
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
        upsert: vi.fn().mockResolvedValue({ data: null, error: null })
      };
    });

    // Mock the final party fetch to fail
    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'parties') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ 
            data: null, 
            error: { message: 'Fetch error' }
          }),
        };
      }
      return mockClient.from(table);
    });

    mockClient.from = mockFrom;

    vi.mocked(createClient).mockResolvedValue(mockClient as any);

    const res = await POST(makeRequest('/api/party/ABCDEF/join', { firstName: 'John', lastName: 'Smith' }), makeParams());
    
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toContain('Internal server error');
  });

  it('trims whitespace from names correctly', async () => {
    const mockClient = createSupabaseMock({ 
      user: { id: 'user-A', email: 'john@example.com' }
    });
    
    mockClient.from = vi.fn().mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          upsert: vi.fn().mockImplementation((data) => {
            // Verify the name is trimmed
            expect(data.name).toBe('John Smith');
            return { error: null };
          }),
        };
      }
      if (table === 'parties') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ 
            data: { id: 'party-1' }, 
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
            error: { code: 'PGRST116' }
          }),
          insert: vi.fn().mockResolvedValue({ error: null }),
        };
      }
      return mockClient.from(table);
    });

    vi.mocked(createClient).mockResolvedValue(mockClient as any);

    const res = await POST(makeRequest('/api/party/ABCDEF/join', { firstName: '  John  ', lastName: '  Smith  ' }), makeParams());
    
    expect(res.status).toBe(201);
  });
});
