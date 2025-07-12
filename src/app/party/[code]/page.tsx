'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import usePartyStore from '@/store/partyStore';
import { createClient } from '@/utils/supabase/client';

// --- Interfaces ---
interface Member {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string | null;
  is_leader: boolean;
  status: string;
  adventurer_name: string | null;
}

interface NameProposal {
  id: string;
  target_member_id: string;
  proposing_member_id: string;
  proposed_name: string;
  is_active: boolean;
}

interface NameProposalVote {
  id: string;
  proposal_id: string;
  voter_member_id: string;
}

// Type for the data returned from the votes query
type VoteWithProposalParty = NameProposalVote & {
  proposal: {
    party_id: string;
  }
};

interface VotingStatus {
  proposals: NameProposal[];
  userHasVoted: boolean;
  isTie: boolean;
  tieProposals: NameProposal[];
}

const supabase = createClient();

// --- Main Component ---
export default function PartyLobbyPage() {
  const { code } = useParams();
  const { party, loading, error, getPartyByCode } = usePartyStore();
  
  // --- State ---
  const [members, setMembers] = useState<Member[]>([]);
  const [proposals, setProposals] = useState<NameProposal[]>([]);
  const [votes, setVotes] = useState<NameProposalVote[]>([]);
  const [nameProposalInput, setNameProposalInput] = useState<{ [key: string]: string }>({});
  const [currentUserMember, setCurrentUserMember] = useState<Member | null>(null);

  // --- Effects ---
  useEffect(() => {
    if (code && typeof code === 'string') getPartyByCode(code);
  }, [code, getPartyByCode]);

  useEffect(() => {
    const fetchUserMember = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && party) {
        const { data } = await supabase.from('party_members').select('*').eq('party_id', party.id).eq('user_id', user.id).single();
        setCurrentUserMember(data);
      }
    };
    if (party) fetchUserMember();
  }, [party]);

  useEffect(() => {
    if (!party) return;

    const fetchData = async () => {
      const { data: memberData } = await supabase.from('party_members').select('*').eq('party_id', party.id).order('created_at');
      if (memberData) setMembers(memberData);

      const { data: proposalData } = await supabase.from('name_proposals').select('*').eq('party_id', party.id).eq('is_active', true);
      if (proposalData) setProposals(proposalData);

      const { data: voteData } = await supabase.from('name_proposal_votes').select('*, proposal:name_proposals!inner(party_id)').eq('proposal.party_id', party.id);
      if (voteData) setVotes(voteData as VoteWithProposalParty[]);
    };

    fetchData();

    const membersSub = supabase.channel(`members:${party.id}`).on('postgres_changes', { event: '*', schema: 'public', table: 'party_members', filter: `party_id=eq.${party.id}` }, payload => {
      if (payload.eventType === 'INSERT') setMembers(current => [...current, payload.new as Member]);
      if (payload.eventType === 'UPDATE') setMembers(current => current.map(m => m.id === (payload.new as Member).id ? (payload.new as Member) : m));
    }).subscribe();

    const proposalsSub = supabase.channel(`proposals:${party.id}`).on('postgres_changes', { event: '*', schema: 'public', table: 'name_proposals', filter: `party_id=eq.${party.id}` }, payload => {
      if (payload.eventType === 'INSERT') setProposals(current => [...current, payload.new as NameProposal]);
      if (payload.eventType === 'UPDATE') {
        const updated = payload.new as NameProposal;
        if (!updated.is_active) { // If proposal becomes inactive, remove it and its votes
          setProposals(current => current.filter(p => p.id !== updated.id));
          setVotes(current => current.filter(v => v.proposal_id !== updated.id));
        } else {
          setProposals(current => current.map(p => p.id === updated.id ? updated : p));
        }
      }
    }).subscribe();

    const votesSub = supabase.channel(`votes:${party.id}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'name_proposal_votes' }, payload => {
      // We need to fetch the proposal party_id to ensure it belongs to this party
      // This is a simplified approach for the subscription payload
      setVotes(current => [...current, payload.new as NameProposalVote]);
    }).subscribe();

    return () => {
      supabase.removeChannel(membersSub);
      supabase.removeChannel(proposalsSub);
      supabase.removeChannel(votesSub);
    };
  }, [party]);

  // --- Memoized Vote Counts ---
  const voteCounts = useMemo(() => {
    return proposals.reduce((acc, proposal) => {
      acc[proposal.id] = votes.filter(v => v.proposal_id === proposal.id).length;
      return acc;
    }, {} as { [key: string]: number });
  }, [proposals, votes]);

  // --- API Handlers ---
  const handleProposeName = async (targetMemberId: string) => {
    const proposedName = nameProposalInput[targetMemberId];
    if (!proposedName || !currentUserMember) return;

    const response = await fetch(`/api/party/${code}/propose-name`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_member_id: targetMemberId, proposed_name: proposedName }),
    });

    if (response.ok) {
      setNameProposalInput(prev => ({ ...prev, [targetMemberId]: '' }));
    } else {
      console.error('Failed to propose name');
    }
  };

  const handleCastVote = async (proposalId: string) => {
    await fetch(`/api/party/${code}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proposal_id: proposalId }),
    });
  };

  const handleFinalizeName = async (proposalId: string) => {
    await fetch(`/api/party/${code}/finalize-name`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proposal_id: proposalId }),
    });
  };

  // --- Render Logic ---
  if (loading) return <div className="text-center p-8">Loading Party...</div>;
  if (error) return <div className="text-center p-8 text-red-500">{error}</div>;
  if (!party) return <div className="text-center p-8">Party not found.</div>;

  const getVotingStatusForMember = (memberId: string): VotingStatus => {
    const memberProposals = proposals.filter(p => p.target_member_id === memberId);

    const maxVotes = Math.max(0, ...memberProposals.map(p => voteCounts[p.id] || 0));
    const winningProposals = memberProposals.filter(p => (voteCounts[p.id] || 0) === maxVotes && maxVotes > 0);
    
    const userHasVoted = votes.some(v => v.voter_member_id === currentUserMember?.id && memberProposals.some(p => p.id === v.proposal_id));

    return {
      proposals: memberProposals,
      userHasVoted,
      isTie: winningProposals.length > 1,
      tieProposals: winningProposals,
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 to-pink-500 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md overflow-hidden p-6">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">{party.name}</h1>
        <p className="text-center text-gray-500 mb-6">Party Code: <span className="font-bold text-purple-600">{party.code}</span></p>
        
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Party Members</h2>
        <div className="space-y-6">
          {members.map((member) => {
            if (member.adventurer_name) {
              return (
                <div key={member.id} className="p-4 border rounded-lg bg-gray-50">
                  <h3 className="text-xl font-bold text-gray-800">{member.first_name} {member.is_leader && '👑'}</h3>
                  <p className="text-lg text-purple-600 font-semibold">"{member.adventurer_name}"</p>
                </div>
              );
            }

            const { proposals: memberProposals, userHasVoted, isTie, tieProposals } = getVotingStatusForMember(member.id);
            const canVote = currentUserMember?.id !== member.id && !userHasVoted;
            const canBreakTie = (currentUserMember?.id === member.id || (currentUserMember?.is_leader && isTie));

            return (
              <div key={member.id} className="p-4 border rounded-lg bg-gray-50">
                <h3 className="text-xl font-bold text-gray-800 mb-4">{member.first_name} {member.is_leader && '👑'} - Needs a Name!</h3>
                
                {isTie && canBreakTie && (
                  <div className="my-4 p-3 bg-yellow-100 border-l-4 border-yellow-500">
                    <h4 className="font-bold text-yellow-800">Tie-breaker!</h4>
                    <p className="text-sm text-yellow-700">As the one being named (or Party Leader), you must choose the final name.</p>
                    <div className="flex gap-2 mt-2">
                      {tieProposals.map(p => (
                        <button key={p.id} onClick={() => handleFinalizeName(p.id)} className="px-3 py-1 text-sm text-white bg-green-600 hover:bg-green-700 rounded">
                          Choose "{p.proposed_name}"
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {memberProposals.map(p => (
                    <div key={p.id} className="flex items-center justify-between">
                      <span>{p.proposed_name}</span>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-lg text-purple-700">{voteCounts[p.id] || 0}</span>
                        {canVote && (
                          <button onClick={() => handleCastVote(p.id)} className="px-3 py-1 text-sm text-white bg-blue-500 hover:bg-blue-600 rounded">Vote</button>
                        )}
                      </div>
                    </div>
                  ))}
                  {memberProposals.length === 0 && <p className="text-sm text-gray-500">No names proposed yet.</p>}
                </div>

                {currentUserMember && currentUserMember.id !== member.id && (
                  <div className="flex items-center space-x-2 pt-4 mt-4 border-t">
                    <input
                      type="text"
                      value={nameProposalInput[member.id] || ''}
                      onChange={(e) => setNameProposalInput(prev => ({ ...prev, [member.id]: e.target.value }))}
                      placeholder="Propose a name..."
                      className="flex-grow p-2 border rounded"
                    />
                    <button onClick={() => handleProposeName(member.id)} className="px-4 py-2 text-white bg-purple-600 hover:bg-purple-700 rounded">
                      Propose
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}