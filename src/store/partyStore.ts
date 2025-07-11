import { create } from 'zustand';
import { createClient } from '@/utils/supabase/client';

interface Party {
  id: string;
  code: string;
  name: string;
  description: string;
}

interface PartyState {
  party: Party | null;
  loading: boolean;
  error: string | null;
  createParty: (partyData: Omit<Party, 'id' | 'code'>) => Promise<void>;
  getPartyByCode: (code: string) => Promise<void>;
  joinParty: (code: string, memberData: { firstName: string; lastName: string }) => Promise<void>;
}

const usePartyStore = create<PartyState>((set) => ({
  party: null,
  loading: false,
  error: null,
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
      set({ party: result, loading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      set({ loading: false, error: errorMessage });
    }
  },
  getPartyByCode: async (code) => {
    const supabase = createClient();
    set({ loading: true, error: null });
    try {
      const { data: party, error } = await supabase
        .from('parties')
        .select('*')
        .eq('code', code)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('Party not found');
        }
        throw error;
      }
      set({ party, loading: false });
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
      // We don't need to set the party here, as the user will be redirected
      // to the lobby, which will fetch the party details.
      set({ loading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      set({ loading: false, error: errorMessage });
    }
  },
}));

export default usePartyStore;