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
  is_npc: boolean; // Add is_npc property
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
  const supabase = createClient() as unknown as SupabaseClient; // Keep for direct Supabase calls
  const { user, loading: userLoading } = useAuth(); // Get user and userLoading from useAuth
  // --- State ---
  const [members, setMembers] = useState<Member[]>([]);
  const [proposals, setProposals] = useState<NameProposal[]>([]);
  const [votes, setVotes] = useState<NameProposalVote[]>([]);
  // Motto state
  const [partyMotto, setPartyMotto] = useState<string | null>(null);
  const [mottoProposals, setMottoProposals] = useState<Array<{ id: string; text: string; vote_count: number; is_finalized: boolean; active: boolean }>>([]);
  const [myMottoVoteProposalId, setMyMottoVoteProposalId] = useState<string | null>(null);
  const [newMottoText, setNewMottoText] = useState('');
  const [showMottoPanel, setShowMottoPanel] = useState(false);
  // Track hireling votes as a stable count map keyed by target member id
  const [hirelingVoteCountsMap, setHirelingVoteCountsMap] = useState<{ [key: string]: number }>({});
  const [nameProposalInput, setNameProposalInput] = useState<{ [key: string]: string }>({});
  const [currentUserMember, setCurrentUserMember] = useState<Member | null>(null);

  // Track my vote per target member for quick lookup and UI styling
  const myVotesByTarget = useMemo(() => {
    if (!currentUserMember) return {} as Record<string, string | undefined>;
    const map: Record<string, string | undefined> = {};
    // For each target, find my vote (if any)
    const proposalsByTarget = proposals.reduce<Record<string, string[]>>((acc, p) => {
      (acc[p.target_member_id] ||= []).push(p.id);
      return acc;
    }, {});
    for (const targetId of Object.keys(proposalsByTarget)) {
      const ids = proposalsByTarget[targetId];
      const my = votes.find(v => v.voter_member_id === currentUserMember.id && ids.includes(v.proposal_id));
      if (my) map[targetId] = my.proposal_id;
    }
    return map;
  }, [votes, proposals, currentUserMember]);
  const [assessmentsCompleted, setAssessmentsCompleted] = useState(false);
  // Expand/collapse per-member name panel (single declaration)
  const [openNamePanels, setOpenNamePanels] = useState<Record<string, boolean>>({});
  // Toggle for showing Hireling vote panel per member
  const [openHirelingPanels, setOpenHirelingPanels] = useState<Record<string, boolean>>({});

  // Add these at the top level
  const [selfCompleted, setSelfCompleted] = useState(false);
  const [peerCompleted, setPeerCompleted] = useState(false);
  const [peerAssessmentLoading, setPeerAssessmentLoading] = useState(false);
  // Expand/collapse per-member name panel (single source of truth)

  // --- Effects ---
  useEffect(() => {
    if (code && typeof code === 'string') getPartyByCode(code);
  }, [code, getPartyByCode]);

  useEffect(() => {
    const fetchUserMember = async () => {
      if (user && party) { // Only fetch if user and party are available
        const { data } = await supabase.from('party_members').select('*').eq('party_id', party.id).eq('user_id', user.id).single();
        setCurrentUserMember(data);
      } else if (!user && !userLoading) {
        // If no user and not loading, redirect to home (login)
        router.push('/');
      }
    };
    if (party && !userLoading) fetchUserMember(); // Fetch when party is loaded and user loading is complete
  }, [party, user, userLoading, supabase, router]); // Add user, userLoading, router to dependencies

  useEffect(() => {
    if (!party) return;

    const fetchData = async () => {
       const { data: memberData } = await supabase.from('party_members').select('*').eq('party_id', party.id).order('created_at');
       if (memberData) setMembers(memberData);

       const { data: proposalData } = await supabase.from('name_proposals').select('*').eq('party_id', party.id).eq('is_active', true);
       if (proposalData) setProposals(proposalData);

       const { data: voteData } = await supabase.from('name_proposal_votes').select('*, proposal:name_proposals!inner(party_id)').eq('proposal.party_id', party.id);
       if (voteData) setVotes(voteData as VoteWithProposalParty[]);

       // Fetch motto data via API aggregator
       try {
         const resp = await fetch(`/api/party/${code}/mottos`, { cache: 'no-store' });
         if (resp.ok) {
           const json = await resp.json();
           setPartyMotto(json.partyMotto ?? null);
           setMottoProposals((json.proposals ?? []).map((p: any) => ({
             id: p.id, text: p.text, vote_count: p.vote_count ?? 0, is_finalized: !!p.is_finalized, active: !!p.active
           })));
           setMyMottoVoteProposalId(json.myVoteProposalId ?? null);
           // stash leader proposal id for UI pinning
           (window as any).__leaderProposalId = json.leaderProposalId ?? null;
         } else if (resp.status === 401 || resp.status === 403) {
           // Ignore unauthorized/forbidden to avoid wiping optimistic state
         } else {
           // Non-ok error: do not clear optimistic items
           console.warn('Failed to load mottos:', resp.status);
         }
       } catch (e) {
         console.warn('Failed to load mottos:', e);
       }

       const { data: hirelingVoteData, error: hirelingVoteError } = await supabase
         .from('hireling_conversion_votes')
         .select('party_member_id_being_voted_on, vote');
       if (hirelingVoteError) console.error('Error fetching hireling votes:', hirelingVoteError);
       if (hirelingVoteData) {
         const initialCounts = hirelingVoteData.reduce((acc: { [key: string]: number }, row: any) => {
           if (row.vote) {
             acc[row.party_member_id_being_voted_on] = (acc[row.party_member_id_being_voted_on] || 0) + 1;
           }
           return acc;
         }, {});
         setHirelingVoteCountsMap(initialCounts);
       }
     };

    fetchData();

    // Align channel with backend broadcasts which use `party-${code}`
    const channel = supabase.channel(`party-${code}`);

    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'party_members', filter: `party_id=eq.${party.id}` }, (payload: any) => {
      if (payload.eventType === 'INSERT') setMembers(current => [...current, payload.new as Member]);
      if (payload.eventType === 'UPDATE') setMembers(current => current.map(m => m.id === (payload.new as Member).id ? (payload.new as Member) : m));
    }).on('postgres_changes', { event: '*', schema: 'public', table: 'name_proposals', filter: `party_id=eq.${party.id}` }, (payload: any) => {
      if (payload.eventType === 'INSERT') {
        const np = payload.new as NameProposal;
        setProposals(current => {
          // If an optimistic placeholder exists for same proposer/target/name, replace it
          const idx = current.findIndex(p =>
            p.id.startsWith('optimistic-') &&
            p.target_member_id === np.target_member_id &&
            p.proposing_member_id === np.proposing_member_id &&
            p.proposed_name === np.proposed_name
          );
          if (idx >= 0) {
            const copy = current.slice();
            copy[idx] = np;
            return copy;
          }
          return [...current, np];
        });
      }
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
      setVotes(current => [...current, payload.new as NameProposalVote]);
    })
    // Motto proposals and votes realtime
    .on('postgres_changes', { event: '*', schema: 'public', table: 'party_motto_proposals', filter: `party_id=eq.${party.id}` }, (payload: any) => {
      const row = payload.new;
      if (payload.eventType === 'INSERT') {
        // Merge-safe: replace optimistic placeholder (id starts with 'optimistic-')
        setMottoProposals(curr => {
          // If we already have this canonical id, upsert/update
          if (curr.some(p => p.id === row.id)) {
            return curr.map(p => p.id === row.id
              ? { id: row.id, text: row.text, vote_count: row.vote_count ?? 0, is_finalized: !!row.is_finalized, active: !!row.active }
              : p);
          }
          // Try to find an optimistic item with the same text OR a close match of trimmed/lowercased text
          const norm = (s: any) => (typeof s === 'string' ? s.trim().toLowerCase() : '');
          const idx = curr.findIndex(p =>
            p.id.startsWith('optimistic-') &&
            (norm(p.text) === norm(row.text))
          );
          if (idx >= 0) {
            const copy = curr.slice();
            copy[idx] = { id: row.id, text: row.text, vote_count: row.vote_count ?? 0, is_finalized: !!row.is_finalized, active: !!row.active };
            return copy;
          }
          // Otherwise append canonical
          return [
            ...curr,
            { id: row.id, text: row.text, vote_count: row.vote_count ?? 0, is_finalized: !!row.is_finalized, active: !!row.active }
          ];
        });
      } else if (payload.eventType === 'UPDATE') {
        setMottoProposals(curr => curr.map(p => p.id === row.id ? { id: row.id, text: row.text, vote_count: row.vote_count ?? 0, is_finalized: !!row.is_finalized, active: !!row.active } : p));
        if (row.is_finalized) setPartyMotto(row.text);
      } else if (payload.eventType === 'DELETE') {
        setMottoProposals(curr => curr.filter(p => p.id !== payload.old.id));
      }
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'party_motto_votes' }, (_payload: any) => {
      // Soft re-sync vote state, but preserve optimistic placeholders if present
      fetch(`/api/party/${code}/mottos`, { cache: 'no-store' })
        .then(async r => {
          if (r.ok) return r.json();
          if (r.status === 401 || r.status === 403) return null; // ignore auth failures
          console.warn('Resync mottos failed:', r.status);
          return null;
        })
        .then(json => {
          if (!json) return;
          const incoming: { id: string; text: string; vote_count: number; is_finalized: boolean; active: boolean }[] =
            (json.proposals ?? []).map((p: any) => ({
              id: String(p.id),
              text: String(p.text ?? ''),
              vote_count: typeof p.vote_count === 'number' ? p.vote_count : 0,
              is_finalized: !!p.is_finalized,
              active: !!p.active
            }));
          setMottoProposals((prev: { id: string; text: string; vote_count: number; is_finalized: boolean; active: boolean }[]) => {
            const byId = new Map<string, { id: string; text: string; vote_count: number; is_finalized: boolean; active: boolean }>(
              incoming.map((p) => [p.id, p])
            );
            // Replace existing by id; keep any optimistic entries not yet materialized
            return prev.map((p) => byId.get(p.id) ?? p);
          });
          setMyMottoVoteProposalId(json.myVoteProposalId ?? null);
          setPartyMotto(json.partyMotto ?? null);
          (window as any).__leaderProposalId = json.leaderProposalId ?? null;
        })
        .catch(() => {});
    })
    // Listen to backend broadcasts for hireling voting updates
    .on('broadcast', { event: 'hireling_vote_updated' }, (payload: any) => {
      const { target_party_member_id, current_yes_votes } = payload?.payload || {};
      if (!target_party_member_id || typeof current_yes_votes !== 'number') return;
      setHirelingVoteCountsMap((prev) => ({
        ...prev,
        [target_party_member_id]: current_yes_votes,
      }));
    })
    .on('broadcast', { event: 'hireling_converted' }, (payload: any) => {
      const { party_member_id } = payload?.payload || {};
      if (!party_member_id) return;
      // Update members to reflect is_npc=true
      setMembers((prev) =>
        prev.map((m) =>
          m.id === party_member_id ? { ...m, is_npc: true } : m
        )
      );
      // Remove any vote status UI by clearing counts for this member
      setHirelingVoteCountsMap((prev) => {
        if (!prev[party_member_id]) return prev;
        const next = { ...prev };
        delete next[party_member_id];
        return next;
      });
    })
    .subscribe();
 
     return () => {
       supabase.removeChannel(channel);
     };
  // Subscribe to party status to auto-navigate to results when ready
  useEffect(() => {
    if (!party) return;
    const channel = supabase
      .channel(`party-status-${party.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'parties',
          filter: `id=eq.${party.id}`,
        },
        (payload: any) => {
          const newStatus = payload?.new?.status;
          if (newStatus === 'Results' || newStatus === 'ResultsReady') {
            router.push(`/party/${code}/results`);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [party, supabase, router, code]);
   }, [party, supabase]); // Removed members from dependencies to avoid re-subscription issues with filter
 
   // Expose the memoized map directly for rendering
   const hirelingVoteCounts = useMemo(() => hirelingVoteCountsMap, [hirelingVoteCountsMap]);
 
   // Memoized eligible hireling voter counts
   const eligibleHirelingVoterCounts = useMemo(() => {
     return members.reduce((acc, member) => {
       // Eligible voters are non-NPCs excluding target
       acc[member.id] = members.filter(m => !m.is_npc && m.id !== member.id).length;
       return acc;
     }, {} as { [key: string]: number });
   }, [members]);
 

  // --- Memoized Vote Counts ---
  const voteCounts = useMemo(() => {
    return proposals.reduce((acc, proposal) => {
      acc[proposal.id] = votes.filter(v => v.proposal_id === proposal.id).length;
      return acc;
    }, {} as { [key: string]: number });
  }, [proposals, votes]);

  // --- API Handlers ---
  const handleProposeName = async (targetMemberId: string) => {
    const proposedName = (nameProposalInput[targetMemberId] ?? '').trim();
    if (!proposedName || !currentUserMember) return;

    // Optimistic: append proposal immediately for snappy UX
    const optimisticId = `optimistic-${Date.now()}`;
    const optimisticProposal: NameProposal = {
      id: optimisticId,
      target_member_id: targetMemberId,
      proposing_member_id: currentUserMember.id,
      proposed_name: proposedName,
      is_active: true,
    };
    setProposals(prev => [...prev, optimisticProposal]);
    setNameProposalInput(prev => ({ ...prev, [targetMemberId]: '' }));

    try {
      const response = await fetch(`/api/party/${code}/propose-name`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_member_id: targetMemberId, proposed_name: proposedName }),
      });

      if (response.ok) {
        const created = await response.json();
        // Replace optimistic with real
        setProposals(prev =>
          prev.map(p => (p.id === optimisticId ? created : p))
        );
        // Also reflect auto-vote in local voteCounts by pushing a vote record
        // The backend inserts a vote; realtime may take a moment so we mirror locally
        setVotes(prev => [
          ...prev,
          { id: `optimistic-v-${Date.now()}`, proposal_id: created.id, voter_member_id: currentUserMember.id },
        ]);
      } else {
        // Revert optimistic insert on failure
        setProposals(prev => prev.filter(p => p.id !== optimisticId));
        console.error('Failed to propose name');
      }
    } catch (e) {
      setProposals(prev => prev.filter(p => p.id !== optimisticId));
      console.error('Failed to propose name', e);
    }
  };

  // Switch my vote to a different proposal for the same target (optimistic; realtime will reconcile)
  const handleChangeVote = async (proposalId: string) => {
    const target = proposals.find((p) => p.id === proposalId)?.target_member_id;
    if (!currentUserMember || !target) return;

    setVotes((prev) => {
      const idsForTarget = proposals.filter(p => p.target_member_id === target).map(p => p.id);
      const withoutMine = prev.filter(
        (v) => v.voter_member_id !== currentUserMember.id || !idsForTarget.includes(v.proposal_id)
      );
      return [
        ...withoutMine,
        {
          id: `optimistic-v-${Date.now()}`,
          proposal_id: proposalId,
          voter_member_id: currentUserMember.id,
        } as NameProposalVote,
      ];
    });

    try {
      await fetch(`/api/party/${code}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposal_id: proposalId }),
      });
    } catch {
      // ignore; subscription will resync
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

  const handleVoteToMakeHireling = async (targetMemberId: string) => {
    if (!currentUserMember) return;

    const response = await fetch(`/api/party/${code}/vote-hireling-conversion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_party_member_id: targetMemberId, vote: true }),
    });

    if (!response.ok) {
      console.error('Failed to cast vote for hireling conversion');
      // TODO: Display user-friendly error message
    }
  };

  const handleStartQuest = async () => {
    if (!currentUserMember) return;

    // Optimistically navigate, then update status
    router.push(`/party/${code}/questionnaire`);

    if (currentUserMember.status === 'Lobby') {
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
        // Check for self-assessment completion
        const { data: selfAnswers, error: selfError } = await supabase
          .from('answers')
          .select('id')
          .eq('voter_member_id', currentUserMember.id)
          .eq('subject_member_id', currentUserMember.id);

        if (selfError) throw selfError;
        setSelfCompleted(!!(selfAnswers && selfAnswers.length > 0));

        // Check for peer-assessment completion
        const { data: peerAnswers, error: peerError } = await supabase
          .from('answers')
          .select('id')
          .eq('voter_member_id', currentUserMember.id)
          .not('subject_member_id', 'eq', currentUserMember.id);

        if (peerError) throw peerError;
        setPeerCompleted(!!(peerAnswers && peerAnswers.length > 0));

        setAssessmentsCompleted(!!(selfAnswers && selfAnswers.length > 0) && !!(peerAnswers && peerAnswers.length > 0));
      } catch (error) {
        console.error('Error checking assessment status:', error);
      }
    };

    checkAssessmentStatus();
  }, [currentUserMember, party, code]);

  // --- Render Logic ---
  if (loading || userLoading) return <div className="text-center p-8">Loading Party...</div>;
  if (error) return <div className="text-center p-8 text-red-500">{error}</div>;
  if (!party) return <div className="text-center p-8">Party not found.</div>;
  if (!user) return <div className="text-center p-8">Please log in to view this party.</div>; // Message if not logged in

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

  const handleProposeMotto = async () => {
    const t = newMottoText.trim();
    if (!t) return;

    // Optimistically append immediately for snappy UX
    const tempId = `optimistic-m-${Date.now()}`;
    const optimistic = {
      id: tempId,
      text: t,
      vote_count: 0,
      is_finalized: false,
      active: true,
    };
    setMottoProposals((prev) => [...prev, optimistic]);
    setNewMottoText('');

    try {
      const resp = await fetch(`/api/party/${code}/propose-motto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: t }),
      });
      if (resp.ok) {
        const json = await resp.json();
        const created = json?.proposal;
        if (created?.id) {
          // Replace optimistic with canonical row from server (works for both legacy/new schema normalized by API)
          setMottoProposals((prev) =>
            prev.map((p) =>
              p.id === tempId
                ? {
                    id: created.id,
                    text: created.text,
                    vote_count: created.vote_count ?? 0,
                    is_finalized: !!created.is_finalized,
                    active: created.active ?? true,
                  }
                : p
            )
          );
        } else {
          // No direct row returned; allow realtime to reconcile. As a guard, keep the optimistic row and soft-refetch in background.
          fetch(`/api/party/${code}/mottos`, { cache: 'no-store' })
            .then(async (r) => {
              if (r.ok) return r.json();
              if (r.status === 401 || r.status === 403) return null;
              console.warn('Background refetch mottos failed:', r.status);
              return null;
            })
            .then((data) => {
              if (!data) return;
              // Merge incoming list without dropping optimistic if its text isn't present yet
              const incoming = (data.proposals ?? []).map((p: any) => ({
                id: String(p.id),
                text: String(p.text ?? ''),
                vote_count: typeof p.vote_count === 'number' ? p.vote_count : 0,
                is_finalized: !!p.is_finalized,
                active: !!p.active,
              }));
              setMottoProposals((prev: { id: string; text: string; vote_count: number; is_finalized: boolean; active: boolean }[]) => {
                // If any server item has the same normalized text as our optimistic, replace it
                const norm = (s: string) => s.trim().toLowerCase();
                const match = incoming.find((p: { id: string; text: string }) => norm(p.text) === norm(t));
                if (match) {
                  return prev.map((p: { id: string; text: string; vote_count: number; is_finalized: boolean; active: boolean }) => (p.id === tempId ? match : p));
                }
                // Otherwise, append any server items we don't already have; keep optimistic
                const existingIds = new Set(prev.map((p: { id: string }) => p.id));
                return [
                  ...prev,
                  ...incoming.filter((p: { id: string }) => !existingIds.has(p.id)),
                ];
              });
              setMyMottoVoteProposalId(data.myVoteProposalId ?? null);
              setPartyMotto(data.partyMotto ?? null);
              (window as any).__leaderProposalId = data.leaderProposalId ?? null;
            })
            .catch(() => {});
        }
      } else {
        // Revert optimistic item if server rejected
        setMottoProposals((prev) => prev.filter((p) => p.id !== tempId));
        console.error('Failed to propose motto');
      }
    } catch (e) {
      // Network or unexpected error: keep optimistic until realtime/next fetch arrives
      console.error('Failed to propose motto', e);
    }
  };

  // Resolve to canonical id when needed and optimistically update UI
  const handleVoteMotto = async (proposalId: string | null, proposalText?: string) => {
    // If attempting to vote and proposalId looks optimistic, try to resolve to canonical id first
    let resolvedId: string | null = proposalId;
    if (proposalId && proposalId.startsWith && proposalId.startsWith('optimistic-')) {
      try {
        const r = await fetch(`/api/party/${code}/mottos`, { cache: 'no-store' });
        if (r.ok) {
          const data = await r.json();
          const match = (data?.proposals ?? []).find((p: any) => (p.text ?? '') === (proposalText ?? ''));
          if (match?.id && typeof match.id === 'string') {
            resolvedId = match.id;
            // Immediately swap optimistic id to canonical in local state to prevent future stale posts
            setMottoProposals(prev => prev.map(p => p.id === proposalId ? { ...p, id: match.id } : p));
          }
        }
      } catch {
        // ignore resolution failure; will fail fast below if still invalid
      }
      // If still not resolved, bail to avoid 400s; let realtime bring canonical row then user can vote
      if (resolvedId && resolvedId.startsWith('optimistic-')) {
        return;
      }
    }

    // Optimistic update for instant feedback
    const prevSelection = myMottoVoteProposalId;
    const idToUse = resolvedId;

    setMottoProposals(prev => {
      if (!idToUse && prevSelection) {
        // Unvote: decrement previous selection
        return prev.map(p =>
          p.id === prevSelection ? { ...p, vote_count: Math.max((p.vote_count ?? 0) - 1, 0) } : p
        );
      }
      if (idToUse) {
        // Vote new: increment chosen and decrement previous if different
        return prev.map(p => {
          if (p.id === idToUse) return { ...p, vote_count: (p.vote_count ?? 0) + 1 };
          if (prevSelection && p.id === prevSelection) return { ...p, vote_count: Math.max((p.vote_count ?? 0) - 1, 0) };
          return p;
        });
      }
      return prev;
    });
    setMyMottoVoteProposalId(idToUse ?? null);

    try {
      const resp = await fetch(`/api/party/${code}/vote-motto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Provide both id and text so API can resolve in edge cases
        body: JSON.stringify({ proposal_id: idToUse, proposal_text: proposalText ?? null }),
      });
      if (!resp.ok) {
        // Revert optimistic change
        setMottoProposals(prev => {
          if (!proposalId && prevSelection) {
            return prev.map(p =>
              p.id === prevSelection ? { ...p, vote_count: (p.vote_count ?? 0) + 1 } : p
            );
          }
          if (proposalId) {
            return prev.map(p => {
              // Revert using resolved canonical id if server provided one
              const target = (async () => {
                try {
                  const r = await fetch(`/api/party/${code}/mottos`, { cache: 'no-store' });
                  if (r.ok) {
                    const d = await r.json();
                    const match = (d?.proposals ?? []).find((pp: any) => pp.text === proposalText);
                    return match?.id ?? proposalId;
                  }
                } catch {}
                return proposalId;
              })();
              // Since we cannot await in setState, fall back immediately to proposalId here;
              // a following soft re-sync below will correct counts by id.
              if (p.id === proposalId) return { ...p, vote_count: Math.max((p.vote_count ?? 0) - 1, 0) };
              if (prevSelection && p.id === prevSelection) return { ...p, vote_count: (p.vote_count ?? 0) + 1 };
              return p;
            });
          }
          return prev;
        });
        setMyMottoVoteProposalId(prevSelection);
        // Soft re-sync
        fetch(`/api/party/${code}/mottos`, { cache: 'no-store' })
          .then(async r => {
            if (r.ok) return r.json();
            if (r.status === 401 || r.status === 403) return null; // ignore to preserve optimistic state
            console.warn('Soft resync mottos failed:', r.status);
            return null;
          })
          .then(json => {
            if (!json) return;
            setMottoProposals((json.proposals ?? []).map((p: any) => ({
              id: p.id, text: p.text, vote_count: p.vote_count ?? 0, is_finalized: !!p.is_finalized, active: !!p.active
            })));
            setMyMottoVoteProposalId(json.myVoteProposalId ?? null);
            setPartyMotto(json.partyMotto ?? null);
            (window as any).__leaderProposalId = json.leaderProposalId ?? null;
          })
          .catch(() => {});
      }
    } catch (e) {
      // Network failure: revert and re-sync
      setMottoProposals(prev => {
        if (!proposalId && prevSelection) {
          return prev.map(p =>
            p.id === prevSelection ? { ...p, vote_count: (p.vote_count ?? 0) + 1 } : p
          );
        }
        if (proposalId) {
          return prev.map(p => {
            if (p.id === proposalId) return { ...p, vote_count: Math.max((p.vote_count ?? 0) - 1, 0) };
            if (prevSelection && p.id === prevSelection) return { ...p, vote_count: (p.vote_count ?? 0) + 1 };
            return p;
          });
        }
        return prev;
      });
      setMyMottoVoteProposalId(prevSelection);
      fetch(`/api/party/${code}/mottos`, { cache: 'no-store' })
        .then(async r => {
          if (r.ok) return r.json();
          if (r.status === 401 || r.status === 403) return null; // ignore to preserve optimistic state
          console.warn('Soft resync mottos failed:', r.status);
          return null;
        })
        .then(json => {
          if (!json) return;
          setMottoProposals((json.proposals ?? []).map((p: any) => ({
            id: p.id, text: p.text, vote_count: p.vote_count ?? 0, is_finalized: !!p.is_finalized, active: !!p.active
          })));
          setMyMottoVoteProposalId(json.myVoteProposalId ?? null);
          setPartyMotto(json.partyMotto ?? null);
          (window as any).__leaderProposalId = json.leaderProposalId ?? null;
        })
        .catch(() => {});
    }
  };

  // Finalization is automatic on majority; keep stub for backward compatibility (no-op).
  const handleFinalizeMotto = async (_proposalId: string) => {};

  const copyJoinLink = () => {
    if (typeof window === 'undefined') return;
    const url = `${window.location.origin}/party/${code}/join`;
    navigator.clipboard.writeText(url).catch(() => {});
  };

  return (
    <div className="party-lobby-container">
      <div className="party-lobby-card">
        <h1 className="party-lobby-title">{party.name}</h1>
        <div className="party-motto-row">
          {partyMotto ? (
            <div className="party-motto-text">“{partyMotto}”</div>
          ) : (
            <div className="party-motto-text party-motto-empty">“No motto selected yet.”</div>
          )}
          <button
            aria-label="Motto voting"
            title="Motto voting"
            className="party-motto-vote-btn party-motto-vote-btn--red"
            onClick={() => setShowMottoPanel((v) => !v)}
          >
            🏛️
          </button>
        </div>
        <p className="party-code">
          Party Code: <span className="party-code-span">{party.code}</span>
          <button
            aria-label="Copy join link"
            title="Copy join link"
            className="party-motto-vote-btn party-motto-vote-btn--red"
            style={{ marginLeft: '0.5rem', verticalAlign: 'middle' }}
            onClick={copyJoinLink}
          >
            🔗
          </button>
        </p>
        <UserInfoHandler />
 
        {/* Motto accordion panel */}
        {showMottoPanel && (
          <div className="motto-panel">
            <div className="motto-panel__header">Party Motto Voting</div>
            <div className="motto-panel__body">
              {/* If there was a leader-suggested motto at creation time but it's not finalized yet,
                  surface it first as a pinned suggestion so it doesn't get lost. We infer this
                  as: party.motto is null AND there exists exactly one proposal created early.
                  Since we do not have created_by/created_at context here, we simply pin the
                  first proposal if not finalized. */}
              {/* Pin leader-proposed motto (from server) when available and not finalized */}
              {!partyMotto && Array.isArray(mottoProposals) && (window as any).__leaderProposalId && (() => {
                const lpId = (window as any).__leaderProposalId as string;
                const lp = mottoProposals.find(p => p.id === lpId);
                if (!lp || lp.is_finalized === true || lp.active === false) return null;
                return (
                  <div className="proposal-item motto-item motto-item--pinned" style={{ marginBottom: '0.5rem' }}>
                    <span className="motto-text">Leader’s suggested motto</span>
                    <span className="vote-count" style={{ marginLeft: 'auto' }}>{lp.text}</span>
                  </div>
                );
              })()}
              {currentUserMember && (
                <form
                  className="motto-panel__propose"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleProposeMotto();
                  }}
                >
                  <input
                    className="propose-name-input motto-input"
                    placeholder="Propose a party motto…"
                    value={newMottoText}
                    onChange={(e) => setNewMottoText(e.target.value)}
                  />
                  <button type="submit" className="propose-name-button motto-propose-btn">Propose</button>
                </form>
              )}

              <div className="proposals-container">
                {mottoProposals.length === 0 ? (
                  <p className="no-proposals-text">No motto proposals yet.</p>
                ) : (
                  mottoProposals.map((p) => {
                    // Skip duplicate rendering of pinned leader proposal
                    const lpId = (window as any).__leaderProposalId as string | null;
                    if (!partyMotto && lpId && p.id === lpId) return null;
                    const isMine = myMottoVoteProposalId === p.id;
                    const eligible = members.filter(m => !m.is_npc).length || 0;
                    const threshold = Math.floor(eligible / 2) + 1;
                    const finalized = p.is_finalized || !p.active;
                    return (
                      <div key={p.id} className={`proposal-item motto-item ${finalized ? 'motto-item--final' : ''}`}>
                        <span className="motto-text">{p.text}</span>
                        <div className="flex items-center gap-3">
                          <span className="vote-count">
                            {p.vote_count || 0}{eligible > 0 ? `/${threshold}` : ''}
                          </span>
                          {!finalized ? (
                            // If this is still an optimistic placeholder, disable voting until canonical id arrives
                            p.id.startsWith('optimistic-') ? (
                              <button className="vote-button motto-vote-btn" disabled title="Saving…">Pending…</button>
                            ) : isMine ? (
                              <button className="vote-button motto-vote-btn" onClick={() => handleVoteMotto(null)}>Unvote</button>
                            ) : (
                              <button
                                className="vote-button motto-vote-btn"
                                onClick={() => handleVoteMotto(p.id, p.text)}
                                data-proposal-id={p.id}
                                data-proposal-text={p.text}
                              >
                                Vote
                              </button>
                            )
                          ) : (
                            <span className="vote-count" title="Finalized">✔</span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        <h2 className="members-title" style={{ marginTop: '1rem' }}>Party Members</h2>
        <div className="members-container">
          {members.map((member) => {
            if (member.adventurer_name) {
              return (
                <div key={member.id} className="member-card">
                  <div className="member-card__header">
                    <h3 className="member-name">
                      {member.first_name}
                      {member.is_leader && (
                        <span className="icon" role="img" aria-label="Party Leader" title="Party Leader">👑</span>
                      )}
                      {member.is_npc && (
                        <span className="icon" role="img" aria-label="Hireling" title="Hireling">🛡️</span>
                      )}
                    </h3>
                    <div className="member-meta">
                      <div className="member-exp-badge">EXP {typeof (member as any).exp === 'number' ? (member as any).exp : 0}</div>
                    </div>
                  </div>
                  <div className="member-card__body">
                    <div className="member-adventureline">
                      <p className="adventurer-name">"{member.adventurer_name}"</p>
                    </div>
                  </div>
                </div>
              );
            }

            const { proposals: memberProposals, userHasVoted, isTie, tieProposals } = getVotingStatusForMember(member.id);
            const canVote = currentUserMember?.id !== member.id && !userHasVoted;
            const canBreakTie = (currentUserMember?.id === member.id || (currentUserMember?.is_leader && isTie));

            return (
              <div key={member.id} className="member-card">
                <h3 className="member-name">
                  {member.first_name}{' '}
                  {member.is_leader && (
                    <span className="icon" role="img" aria-label="Party Leader" title="Party Leader">👑</span>
                  )}
                  {member.is_npc && (
                    <span className="icon" role="img" aria-label="Hireling" title="Hireling">🛡️</span>
                  )}
                </h3>
                <div className="member-subline">
                  <span className="needs-name-text">Needs a Hero Name</span>
                  <button
                    className="party-motto-vote-btn party-motto-vote-btn--red"
                    aria-label="Name voting"
                    title="Name voting"
                    onClick={() => {
                      setOpenNamePanels((prev) => ({ ...prev, [member.id]: !prev[member.id] }));
                    }}
                  >
                    🏷️
                  </button>
                  {!member.is_npc && currentUserMember?.id !== member.id && (
                    <div className="member-options" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <button
                        className="party-motto-vote-btn party-motto-vote-btn--red"
                        aria-label="Hireling voting"
                        title="Hireling voting"
                        onClick={() => {
                          setOpenHirelingPanels((prev) => ({ ...prev, [member.id]: !prev[member.id] }));
                        }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                          focusable="false"
                        >
                          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>

                {/* Display hireling vote status (hidden once member becomes NPC) */}
                {!member.is_npc && eligibleHirelingVoterCounts[member.id] > 0 && openHirelingPanels[member.id] && (
                  <div className="member-section">
                    <div className="proposals-container">
                      <div className="proposal-item proposal-item--dotted">
                        <span>Hireling Vote</span>
                        <div className="flex items-center gap-3">
                          {(hirelingVoteCounts[member.id] || 0) > 0 && (
                            <span className="vote-count">
                              {hirelingVoteCounts[member.id] || 0}/{eligibleHirelingVoterCounts[member.id]}
                            </span>
                          )}
                          {currentUserMember?.id !== member.id && (
                            <button onClick={() => handleVoteToMakeHireling(member.id)} className="vote-button">
                              Vote
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Always show EXP, defaulting to 0 if missing */}
                <div className="member-exp-badge" style={{ marginTop: '0.25rem', fontSize: '0.9rem' }}>
                  EXP {typeof (member as any).exp === 'number' ? (member as any).exp : 0}
                </div>

                {/* Collapsible name voting/proposal area */}
                {openNamePanels[member.id] && (
                  <div className="name-panel">
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
                      {memberProposals.map(p => {
                        const iVoted = myVotesByTarget[member.id] === p.id;
                        return (
                          <div
                            key={p.id}
                            className="proposal-item"
                            style={iVoted ? { borderColor: 'var(--secondary)', boxShadow: '0 0 0 2px rgba(0,0,0,0.03) inset' } : undefined}
                          >
                            <span>
                              {p.proposed_name}
                              {iVoted ? <span className="icon" title="Your vote" aria-label="Your vote"> ✅</span> : null}
                            </span>
                            <div className="flex items-center gap-3">
                              <span className="vote-count">{voteCounts[p.id] || 0}</span>
                              {/* If I already voted for a different proposal on this same target, allow changing vote */}
                              {currentUserMember?.id !== member.id ? (
                                myVotesByTarget[member.id] && myVotesByTarget[member.id] !== p.id ? (
                                  <button onClick={() => handleChangeVote(p.id)} className="vote-button">Change vote</button>
                                ) : !myVotesByTarget[member.id] ? (
                                  <button onClick={() => handleCastVote(p.id)} className="vote-button">Vote</button>
                                ) : (
                                  // Already voted this one; no button, highlight is enough
                                  <span className="text-xs" style={{ color: 'var(--muted)' }}>Your choice</span>
                                )
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                      {memberProposals.length === 0 && <p className="no-proposals-text">No names proposed yet.</p>}
                    </div>

                    {currentUserMember && currentUserMember.id !== member.id && (() => {
                      // Hide propose UI if the current user already proposed a name for this target
                      const alreadyProposedByMe = proposals.some(
                        p => p.target_member_id === member.id && p.proposing_member_id === currentUserMember.id && p.is_active
                      );
                      if (alreadyProposedByMe) return null;
                      return (
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
                      );
                    })()}
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