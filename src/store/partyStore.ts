import { create } from 'zustand';

interface Party {
  id: string;
  code: string;
  name: string;
  description: string;
  date: string;
  location: string;
}

interface PartyState {
  party: Party | null;
  loading: boolean;
  error: string | null;
  createParty: (partyData: Omit<Party, 'id' | 'code'>) => Promise<void>;
  getPartyByCode: (code: string) => Promise<void>;
}

const usePartyStore = create<PartyState>((set) => ({
  party: null,
  loading: false,
  error: null,
  createParty: async (partyData) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('/api/party', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(partyData),
      });
      if (!response.ok) {
        throw new Error('Failed to create party');
      }
      const party = await response.json();
      set({ party, loading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      set({ loading: false, error: errorMessage });
    }
  },
  getPartyByCode: async (code) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/party?code=${code}`);
      if (!response.ok) {
        throw new Error('Party not found');
      }
      const party = await response.json();
      set({ party, loading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      set({ loading: false, error: errorMessage });
    }
  },
}));

export default usePartyStore;