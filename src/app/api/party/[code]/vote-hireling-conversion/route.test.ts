import { describe, it, expect, vi, beforeEach } from 'vitest';

// Provide a global hook for the mocked supabase client
declare global {
  // eslint-disable-next-line no-var
  var __fakeSupabase: any;
}

vi.mock('@/utils/supabase/server', () => {
  return {
    createClient: async () => global.__fakeSupabase,
  };
});

// Import after mock so the route uses our mocked client
import { POST } from './route';

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/party/ABCDEF/vote-hireling-conversion', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function makeParams(code = 'ABCDEF') {
  return { params: Promise.resolve({ code }) } as unknown as {
    params: Promise<Record<string, string | string[] | undefined>>;
  };
}

function createSupabaseMock(opts: {
  user: { id: string } | null;
  partyMembers?: Array<{ id: string; user_id: string; is_npc: boolean }>;
  yesVotesCount?: number;
}) {
  const sent: any[] = [];
  const partyMembers = opts.partyMembers ?? [];
  const yesVotesCount = typeof opts.yesVotesCount === 'number' ? opts.yesVotesCount : 0;

  const client = {
    auth: {
      getUser: async () => ({ data: { user: opts.user } }),
    },
    from(table: string) {
      if (table === 'parties') {
        const chain = {
          select: (_sel: string) => chain,
          eq: (_col: string, _val: unknown) => chain,
          async single() {
            return { data: { id: 'party-1', party_members: partyMembers }, error: null };
          },
        };
        return chain;
      }
      if (table === 'hireling_conversion_votes') {
        const chain = {
          select: (_sel: string) => chain,
          eq: (_col: string, _val: unknown) => chain,
          // Upsert path
          async upsert(_row: unknown) {
            return { error: null };
          },
          // When awaited after select().eq().eq(), return current count
          get data() {
            return Array.from({ length: yesVotesCount }, (_, i) => ({ id: String(i + 1) }));
          },
          get error() {
            return null;
          },
        } as any;
        return chain;
      }
      if (table === 'party_members' || table === 'answers' || table === 'questions') {
        // Only used in unanimous path; return no-ops for now
        return {
          update: async () => ({ error: null }),
          insert: async () => ({ error: null }),
          select: () => ({ eq: () => ({}) }),
        } as any;
      }
      return {} as any;
    },
    channel(_name: string) {
      return {
        async send(payload: any) {
          sent.push(payload);
          return { error: null };
        },
      };
    },
    __sent: sent,
  };
  return client;
}

describe('POST /api/party/[code]/vote-hireling-conversion', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns 401 when unauthorized', async () => {
    global.__fakeSupabase = createSupabaseMock({ user: null });
    const res = await POST(makeRequest({ target_party_member_id: 'B', vote: true }), makeParams());
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid body', async () => {
    global.__fakeSupabase = createSupabaseMock({ user: { id: 'user-A' }, partyMembers: [] });
    const res = await POST(makeRequest({ target_party_member_id: 123 }), makeParams());
    expect(res.status).toBe(400);
  });

  it('returns 403 when voter not in party', async () => {
    global.__fakeSupabase = createSupabaseMock({ user: { id: 'user-A' }, partyMembers: [] });
    const res = await POST(makeRequest({ target_party_member_id: 'B', vote: true }), makeParams());
    expect(res.status).toBe(403);
  });

  it('returns 400 when target not found', async () => {
    const members = [
      { id: 'A', user_id: 'user-A', is_npc: false },
    ];
    global.__fakeSupabase = createSupabaseMock({ user: { id: 'user-A' }, partyMembers: members });
    const res = await POST(makeRequest({ target_party_member_id: 'B', vote: true }), makeParams());
    expect(res.status).toBe(400);
  });

  it('returns 400 when self-voting', async () => {
    const members = [
      { id: 'A', user_id: 'user-A', is_npc: false },
    ];
    global.__fakeSupabase = createSupabaseMock({ user: { id: 'user-A' }, partyMembers: members });
    const res = await POST(makeRequest({ target_party_member_id: 'A', vote: true }), makeParams());
    expect(res.status).toBe(400);
  });

  it('returns 403 when NPC voter tries to vote', async () => {
    const members = [
      { id: 'A', user_id: 'user-A', is_npc: true },
      { id: 'B', user_id: 'user-B', is_npc: false },
    ];
    global.__fakeSupabase = createSupabaseMock({ user: { id: 'user-A' }, partyMembers: members });
    const res = await POST(makeRequest({ target_party_member_id: 'B', vote: true }), makeParams());
    expect(res.status).toBe(403);
  });

  it('non-unanimous path broadcasts vote update and returns tallies', async () => {
    // Party: voter A (non-NPC), other D (non-NPC), target B (non-NPC), NPC C (ignored)
    const members = [
      { id: 'A', user_id: 'user-A', is_npc: false },
      { id: 'D', user_id: 'user-D', is_npc: false },
      { id: 'B', user_id: 'user-B', is_npc: false },
      { id: 'C', user_id: 'user-C', is_npc: true },
    ];
    // After upsert, yes votes should be 1 (non-unanimous because eligible=2)
    const client = createSupabaseMock({ user: { id: 'user-A' }, partyMembers: members, yesVotesCount: 1 });
    global.__fakeSupabase = client;

    const res = await POST(makeRequest({ target_party_member_id: 'B', vote: true }), makeParams('FELLOW'));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json?.tallies?.yes).toBe(1);
    expect(json?.tallies?.eligible).toBe(2);

    // Confirm a broadcast for vote update was sent
    const sent = (client as any).__sent as any[];
    expect(sent.length).toBeGreaterThan(0);
    const last = sent[sent.length - 1];
    expect(last?.event).toBe('hireling_vote_updated');
    expect(last?.payload?.current_yes_votes).toBe(1);
    expect(last?.payload?.eligible_voter_count).toBe(2);
  });
});


