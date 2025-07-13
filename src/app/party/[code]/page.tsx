'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import usePartyStore from '@/store/partyStore';
import { createClient } from '@/utils/supabase/client';
import './page.css';
import { SupabaseClient } from '@supabase/supabase-js';

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

// --- Main Component ---
export default function PartyLobbyPage() {
  const { code } = useParams();
  const { party, loading, error, getPartyByCode } = usePartyStore();
  const router = useRouter();
  const supabase = createClient() as unknown as SupabaseClient;
  // --- State ---
  const [members, setMembers] = useState<Member[]>([]);
  const [proposals, setProposals] = useState<NameProposal[]>([]);
  const [votes, setVotes] = useState<NameProposalVote[]>([]);
  const [nameProposalInput, setNameProposalInput] = useState<{ [key: string]: string }>({});
  const [currentUserMember, setCurrentUserMember] = useState<Member | null>(null);
  const [assessmentsCompleted, setAssessmentsCompleted] = useState(false);

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
  }, [party, supabase]);

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

    const channel = supabase.channel(`party-lobby-${party.id}`);

    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'party_members', filter: `party_id=eq.${party.id}` }, (payload: any) => {
      if (payload.eventType === 'INSERT') setMembers(current => [...current, payload.new as Member]);
      if (payload.eventType === 'UPDATE') setMembers(current => current.map(m => m.id === (payload.new as Member).id ? (payload.new as Member) : m));
    }).on('postgres_changes', { event: '*', schema: 'public', table: 'name_proposals', filter: `party_id=eq.${party.id}` }, (payload: any) => {
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
    }).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'name_proposal_votes' }, (payload: any) => {
      // We need to fetch the proposal party_id to ensure it belongs to this party
      // This is a simplified approach for the subscription payload
      setVotes(current => [...current, payload.new as NameProposalVote]);
    }).subscribe();


    return () => {
      supabase.removeChannel(channel);
    };
  }, [party, supabase]);

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

  const handleStartQuest = async () => {
    if (!currentUserMember) return;

    // Optimistically navigate, then update status
    router.push(`/party/${code}/questionnaire`);

    if (currentUserMember.status === 'Joined') {
        await fetch(`/api/party/${code}/start-questionnaire`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member_id: currentUserMember.id }),
      });
    }
  };

  // Check assessment completion status
  useEffect(() => {
    const checkAssessmentStatus = async () => {
      if (!currentUserMember || !party) return;

      try {
        const response = await fetch(`/api/party/${code}/assessment-status`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (response.ok) {
          const data = await response.json();
          setAssessmentsCompleted(data.selfCompleted && data.peerCompleted);
        }
      } catch (error) {
        console.error('Error checking assessment status:', error);
      }
    };

    checkAssessmentStatus();
  }, [currentUserMember, party, code]);

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
    <div className="party-lobby-container">
      <div className="party-lobby-card">
        <h1 className="party-lobby-title">{party.name}</h1>
        <p className="party-code">Party Code: <span className="party-code-span">{party.code}</span></p>
        
        {currentUserMember && (
          <div className="navigation-container">
            {assessmentsCompleted ? (
              <div className="navigation-buttons">
                <button
                  onClick={() => router.push(`/party/${code}/results`)}
                  className="navigation-button"
                >
                  View Results
                </button>
              </div>
            ) : (
              <div className="navigation-buttons">
                <button
                  onClick={handleStartQuest}
                  className="navigation-button"
                >
                  {currentUserMember.status === 'Joined' ? 'Start QUESTionnaire' : 'Continue QUESTionnaire'}
                </button>
              </div>
            )}
          </div>
        )}

        <h2 className="members-title">Party Members</h2>
        <div className="members-container">
          {members.map((member) => {
            if (member.adventurer_name) {
              return (
                <div key={member.id} className="member-card">
                  <h3 className="member-name">{member.first_name} {member.is_leader && '👑'}</h3>
                  <p className="adventurer-name">"{member.adventurer_name}"</p>
                </div>
              );
            }

            const { proposals: memberProposals, userHasVoted, isTie, tieProposals } = getVotingStatusForMember(member.id);
            const canVote = currentUserMember?.id !== member.id && !userHasVoted;
            const canBreakTie = (currentUserMember?.id === member.id || (currentUserMember?.is_leader && isTie));

            return (
              <div key={member.id} className="member-card">
                <h3 className="member-name">{member.first_name} {member.is_leader && '👑'} - Needs a Name!</h3>
                
                {isTie && canBreakTie && (
                  <div className="tie-breaker-card">
                    <h4 className="tie-breaker-title">Tie-breaker!</h4>
                    <p className="tie-breaker-text">As the one being named (or Party Leader), you must choose the final name.</p>
                    <div className="tie-breaker-buttons">
                      {tieProposals.map(p => (
                        <button key={p.id} onClick={() => handleFinalizeName(p.id)} className="choose-name-button">
                          Choose "{p.proposed_name}"
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="proposals-container">
                  {memberProposals.map(p => (
                    <div key={p.id} className="proposal-item">
                      <span>{p.proposed_name}</span>
                      <div className="flex items-center gap-3">
                        <span className="vote-count">{voteCounts[p.id] || 0}</span>
                        {canVote && (
                          <button onClick={() => handleCastVote(p.id)} className="vote-button">Vote</button>
                        )}
                      </div>
                    </div>
                  ))}
                  {memberProposals.length === 0 && <p className="no-proposals-text">No names proposed yet.</p>}
                </div>

                {currentUserMember && currentUserMember.id !== member.id && (
                  <div className="propose-name-container">
                    <input
                      type="text"
                      value={nameProposalInput[member.id] || ''}
                      onChange={(e) => setNameProposalInput(prev => ({ ...prev, [member.id]: e.target.value }))}
                      placeholder="Propose a name..."
                      className="propose-name-input"
                    />
                    <button onClick={() => handleProposeName(member.id)} className="propose-name-button">
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