'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import usePartyStore from '@/store/partyStore';
import { createClient } from '@/utils/supabase/client';

interface Member {
  id: string;
  first_name: string;
  last_name: string | null;
  is_leader: boolean;
  adventurer_name: string | null;
}

interface ProposedName {
  id: string;
  party_member_id: string;
  proposed_name: string;
  proposer_id: string;
}

const supabase = createClient();

export default function PartyLobbyPage() {
  const { code } = useParams();
  const { party, loading, error, getPartyByCode } = usePartyStore();
  const [members, setMembers] = useState<Member[]>([]);
  const [proposedNames, setProposedNames] = useState<ProposedName[]>([]);
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);

  // Effect to get the current user
  useEffect(() => {
    const getUser = async () => {
      if (!party) return; // Add a guard clause here
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // This is a simplified user object. You might need to fetch the full party_member profile
        // if you need more details like first_name, etc. for the current user.
        // For now, we just need the ID to check if they are the leader or can propose names.
        const { data: memberData } = await supabase
          .from('party_members')
          .select('id')
          .eq('email', user.email)
          .eq('party_id', party.id)
          .single();
        setCurrentUser(memberData);
      }
    };
    getUser();
  }, []);

  // Effect for fetching initial party data
  useEffect(() => {
    if (code && typeof code === 'string') {
      getPartyByCode(code);
    }
  }, [code, getPartyByCode]);

  // Effect for fetching members and setting up subscription
  useEffect(() => {
    // Do nothing until the party is loaded
    if (!party) return;

    // Fetch initial members and proposed names
    const fetchData = async () => {
      const { data: memberData } = await supabase
        .from('party_members')
        .select('*')
        .eq('party_id', party.id);
      if (memberData) {
        setMembers(memberData);
      }

      const { data: proposedNamesData } = await supabase
        .from('proposed_names')
        .select('*')
        .in('party_member_id', memberData?.map(m => m.id) || []);
      if (proposedNamesData) {
        setProposedNames(proposedNamesData);
      }
    };

    fetchData();

    // Set up real-time subscriptions
    const membersChannel = supabase
      .channel(`realtime-party-members:${party.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'party_members', filter: `party_id=eq.${party.id}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setMembers((current) => [...current, payload.new as Member]);
          }
          if (payload.eventType === 'UPDATE') {
            setMembers((current) => current.map(m => m.id === (payload.new as Member).id ? (payload.new as Member) : m));
          }
        }
      )
      .subscribe();

    const proposedNamesChannel = supabase
      .channel(`realtime-proposed-names:${party.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'proposed_names' },
        (payload) => {
          setProposedNames((current) => [...current, payload.new as ProposedName]);
        }
      )
      .subscribe();

    // Cleanup function to remove the channel subscriptions when the component unmounts
    return () => {
      supabase.removeChannel(membersChannel);
      supabase.removeChannel(proposedNamesChannel);
    };
  }, [party]); // This effect runs whenever the party object changes

  const handleProposeName = async (partyMemberId: string, name: string) => {
    if (!currentUser) return;
    await supabase.from('proposed_names').insert({
      party_member_id: partyMemberId,
      proposed_name: name,
      proposer_id: currentUser.id,
    });
  };

  const handleSelectName = async (partyMemberId: string, name: string) => {
    await supabase
      .from('party_members')
      .update({ adventurer_name: name })
      .eq('id', partyMemberId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
        <p className="text-white text-2xl">Loading Party...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
        <p className="text-white text-2xl">{error}</p>
      </div>
    );
  }

  if (!party) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-500 to-gray-700 flex items-center justify-center">
        <p className="text-white text-2xl">Party not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 to-pink-500 p-8">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl p-6">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">{party.name}</h1>
        <p className="text-center text-gray-500 mb-6">Party Code: <span className="font-bold text-purple-600">{party.code}</span></p>
        
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-700">Description</h2>
            <p className="text-gray-600">{party.description || 'No description provided.'}</p>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-700">Party Members</h2>
            <div className="space-y-6">
              {members.map((member: Member) => (
                <div key={member.id} className="p-4 border rounded-lg">
                  <h3 className="text-xl font-bold">{member.first_name} {member.last_name} {member.is_leader && '(Leader)'}</h3>
                  {member.adventurer_name ? (
                    <p className="text-lg text-green-600">Adventurer Name: {member.adventurer_name}</p>
                  ) : (
                    <div>
                      <p className="text-sm text-gray-500">No adventurer name selected yet.</p>
                      <div className="mt-2">
                        <h4 className="font-semibold">Proposed Names:</h4>
                        <ul className="list-disc list-inside ml-4">
                          {proposedNames.filter(pn => pn.party_member_id === member.id).map(pn => (
                            <li key={pn.id}>
                              {pn.proposed_name}
                              {members.find(m => m.is_leader)?.id === currentUser?.id && (
                                <button
                                  onClick={() => handleSelectName(member.id, pn.proposed_name)}
                                  className="ml-2 px-2 py-1 text-xs text-white bg-green-500 rounded hover:bg-green-600"
                                >
                                  Select
                                </button>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                      {currentUser && currentUser.id !== member.id && (
                        <form
                          className="mt-2 flex gap-2"
                          onSubmit={(e) => {
                            e.preventDefault();
                            const form = e.target as HTMLFormElement;
                            const input = form.elements.namedItem('name') as HTMLInputElement;
                            handleProposeName(member.id, input.value);
                            form.reset();
                          }}
                        >
                          <input
                            name="name"
                            type="text"
                            placeholder="Propose a name"
                            className="border p-1 rounded w-full"
                          />
                          <button type="submit" className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">
                            Propose
                          </button>
                        </form>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}