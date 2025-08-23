'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import usePartyStore from '@/store/partyStore';
import { createClient } from '@/lib/supabase/client'; // Use the singleton client
import { useAuth } from '@/hooks/useAuth'; // Import useAuth
import './page.css';
import { SupabaseClient } from '@supabase/supabase-js'; // Keep for type casting if needed
import { UserInfoHandler } from '@/components/common/UserInfoHandler';

// --- Interfaces ---
interface Member {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string | null;
  is_leader: boolean;
  status: string;
  adventurer_name: string | null;
  is_npc: boolean;
  created_at: string; // Add missing fields that might be needed
}

interface NameProposal {
  id: string;
  target_member_id: string;
  proposed_name: string;
  proposer_member_id: string;
  created_at: string;
}

interface NameProposalVote {
  id: string;
  proposal_id: string;
  voter_member_id: string;
  created_at: string;
}

interface VotingStatus {
  hasProposals: boolean;
  userHasVoted: boolean;
  userProposedName: string | null;
  winningName: string | null;
  voteCount: number;
  proposalCount: number;
}

export default function PartyLobbyPage() {
  const { code } = useParams();
  const { party, loading, error, getPartyByCode } = usePartyStore();
  const router = useRouter();
  const supabase = createClient() as unknown as SupabaseClient; // Keep for direct Supabase calls
  const { user, loading: userLoading } = useAuth(); // Get user and userLoading from useAuth
  // --- State ---
  const [members, setMembers] = useState<Member[]>([]);
  const [proposals, setProposals] = useState<NameProposal[]>([]);
  const [votes, setVotes] = useState<NameProposalVote[]>([]);
  // For motto voting and display
  const [partyMotto, setPartyMotto] = useState<string | null>(null);
  const [mottoProposals, setMottoProposals] = useState<Array<{ id: string; text: string; vote_count: number; is_finalized: boolean; active: boolean }>>([]);
  const [myMottoVoteProposalId, setMyMottoVoteProposalId] = useState<string | null>(null);
  const [newMottoText, setNewMottoText] = useState('');
  const [showMottoPanel, setShowMottoPanel] = useState(false);
  const [partyMorale, setPartyMorale] = useState<{ score: number | null; level: string | null }>({ score: null, level: null });
  // Track hireling votes as a stable count map keyed by target member id
  const [hirelingVoteCountsMap, setHirelingVoteCountsMap] = useState<{ [key: string]: number }>({});
  const [nameProposalInput, setNameProposalInput] = useState<{ [key: string]: string }>({});
  const [currentUserMember, setCurrentUserMember] = useState<Member | null>(null);

  return (
    <div>
      <h1>Test</h1>
    </div>
  );
}
