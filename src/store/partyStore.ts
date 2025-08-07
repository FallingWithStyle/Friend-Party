import { create } from 'zustand';
import { createClient } from '@/utils/supabase/client';

interface Party {
  id: string;
  code: string;
  name: string;
  motto: string;
}

interface PartyMember {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string | null;
  status: 'Lobby' | 'Self Assessment' | 'Peer Assessment' | 'Results';
  is_leader: boolean;
  email?: string; // Add optional email property
}

interface User {
    id: string;
    email?: string; // Add email property
}

interface PartyState {
  party: Party | null;
  members: PartyMember[];
  user: User | null;
  loading: boolean;
  error: string | null;
  createParty: (partyData: Omit<Party, 'id' | 'code'> & { creatorName: string }) => Promise<void>;
  getPartyByCode: (code: string) => Promise<void>;
  joinParty: (code: string, memberData: { firstName: string; lastName: string }) => Promise<void>;
  setParty: (party: Party, members: PartyMember[]) => void;
  addMember: (member: PartyMember) => void;
  updateMemberStatus: (memberId: string, status: PartyMember['status']) => void;
  setUser: (user: User) => void;
  isUserInfoFlowComplete: boolean;
  setUserInfoFlowComplete: (isComplete: boolean) => void;
  resetPartyState: () => void; // Add reset function
}

const usePartyStore = create<PartyState>((set) => ({
  party: null,
  members: [],
  user: null,
  loading: true,
  error: null,
  isUserInfoFlowComplete: false,
  createParty: async (partyData) => {
    const supabase = createClient();
    set({ loading: true, error: null });
    try {
      // We call the API route to handle party creation securely on the server
      const response = await fetch('/api/party', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partyData),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create party');
      }
      const { members, ...party } = result;
      set({ party, members, loading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      set({ loading: false, error: errorMessage });
    }
  },
  getPartyByCode: async (code) => {
    const supabase = createClient();
    set({ loading: true, error: null });
    try {
      const { data: party, error: partyError } = await supabase
        .from('parties')
        .select('*')
        .eq('code', code)
        .single();

      if (partyError) {
        if (partyError.code === 'PGRST116') {
          throw new Error('Party not found');
        }
        throw partyError;
      }

      const { data: members, error: membersError } = await supabase
        .from('party_members')
        .select('*')
        .eq('party_id', party.id);

      if (membersError) {
        throw membersError;
      }

      set({ party, members: members || [], loading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      set({ loading: false, error: errorMessage });
    }
  },
  joinParty: async (code, memberData) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/party/${code}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(memberData),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to join party');
      }
      const { members, ...party } = result;
      set({ party, members, loading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      set({ loading: false, error: errorMessage });
    }
  },
  setParty: (party, members) => set({ party, members, loading: false }),
  addMember: (member) => set((state) => ({ members: [...state.members, member] })),
  updateMemberStatus: (memberId, status) =>
    set((state) => ({
      members: state.members.map((m) =>
        m.id === memberId ? { ...m, status } : m
      ),
    })),
  setUser: (user) => set({ user }),
  setUserInfoFlowComplete: (isComplete) => set({ isUserInfoFlowComplete: isComplete }),
  resetPartyState: () => set({ party: null, members: [], error: null }), // Implement reset function
}));

export default usePartyStore;