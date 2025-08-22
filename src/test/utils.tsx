import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';

// Simple Supabase mock factory that avoids recursive calls
export function createSupabaseMock(opts: {
  user: { id: string } | null;
  partyMembers?: Array<{ id: string; user_id: string; is_npc: boolean }>;
  party?: any;
  error?: any;
}) {
  const sent: any[] = [];
  const partyMembers = opts.partyMembers ?? [];
  const party = opts.party ?? { id: 'party-1', party_members: partyMembers };

  // Create a simple chainable mock that returns the expected data
  const createSimpleChain = (data: any) => {
    // Define all possible methods that return the chain itself
    const chainMethods = {
      select: vi.fn(),
      eq: vi.fn(),
      in: vi.fn(),
      order: vi.fn(),
      limit: vi.fn(),
      insert: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
    };

    // Define terminal methods that return promises
    const terminalMethods = {
      single: vi.fn().mockResolvedValue({ data, error: opts.error }),
      maybeSingle: vi.fn().mockResolvedValue({ data, error: opts.error }),
    };

    // Create the chain object
    const chain = {
      ...chainMethods,
      ...terminalMethods,
    };

    // Make chain methods return the chain (but not recursively)
    Object.keys(chainMethods).forEach(method => {
      chainMethods[method].mockReturnValue(chain);
    });

    // Handle special cases for insert/update/upsert
    chainMethods.insert.mockResolvedValue({ data, error: opts.error });
    chainMethods.update.mockResolvedValue({ data, error: opts.error });
    chainMethods.upsert.mockResolvedValue({ data, error: opts.error });
    chainMethods.delete.mockResolvedValue({ data: null, error: opts.error });

    return chain;
  };

  const client = {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: opts.user }, error: opts.error }),
    },
    from: vi.fn().mockImplementation((table: string) => {
      switch (table) {
        case 'parties':
          return createSimpleChain(party);
        case 'party_members':
          return createSimpleChain(partyMembers.find(m => m.id === 'A') || null);
        default:
          return createSimpleChain(null);
      }
    }),
    channel: vi.fn().mockReturnValue({
      send: vi.fn().mockImplementation((payload: any) => {
        sent.push(payload);
        return Promise.resolve({ error: null });
      }),
    }),
    __sent: sent,
  };

  return client;
}

// Test wrapper with providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

// Custom render function
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllTheProviders, ...options });
}

// Mock request helpers
export function makeRequest(url: string, body?: unknown, method = 'POST') {
  // Convert relative URLs to absolute URLs for JSDOM compatibility
  const absoluteUrl = url.startsWith('http') ? url : `http://localhost${url}`;
  return new Request(absoluteUrl, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
}

export function makeParams(code = 'ABCDEF') {
  return { params: Promise.resolve({ code }) } as unknown as {
    params: Promise<Record<string, string | string[] | undefined>>;
  };
}

// Test data factories
export const testPartyMembers = [
  { id: 'A', user_id: 'user-A', is_npc: false, name: 'Alice' },
  { id: 'B', user_id: 'user-B', is_npc: false, name: 'Bob' },
  { id: 'C', user_id: 'user-C', is_npc: true, name: 'NPC Charlie' },
];

export const testParty = {
  id: 'party-1',
  code: 'ABCDEF',
  name: 'Test Party',
  party_members: testPartyMembers,
  status: 'active',
};