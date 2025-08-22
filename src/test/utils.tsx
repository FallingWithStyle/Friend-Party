import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';

// Simple, non-recursive Supabase mock factory
export function createSimpleSupabaseMock(opts: {
  user: { id: string } | null;
  partyMembers?: Array<{ id: string; user_id: string; is_npc: boolean }>;
  party?: any;
  error?: any;
}) {
  const mockClient = {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: opts.user }, error: opts.error }),
    },
    from: vi.fn().mockImplementation((table: string) => {
      // Return a simple mock object for each table
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: opts.party, error: null }),
            maybeSingle: vi.fn().mockResolvedValue({ data: opts.party, error: null }),
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: [], error: null })
            })
          }),
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: [], error: null })
          }),
          in: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: [], error: null })
          })
        }),
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
        update: vi.fn().mockResolvedValue({ data: null, error: null }),
        upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
        delete: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    }),
  };
  return mockClient;
}

// Legacy mock for backward compatibility
export function createSupabaseMock(opts: any) {
  return createSimpleSupabaseMock(opts);
}

// Test renderer with providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Export everything
export * from '@testing-library/react';
export { customRender as render };

// Helper functions for API route tests
export function makeRequest(url: string, body?: any, method = 'POST') {
  const init: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    init.body = JSON.stringify(body);
  }

  return new Request(`http://localhost:3000${url}`, init);
}

export function makeParams(code = 'ABCDEF') {
  return { params: { code } };
}