'use client';

import { use, useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { SupabaseClient } from '@supabase/supabase-js';
import usePartyStore from '@/store/partyStore';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import './page.css';

type PartyMember = {
  id: string;
  first_name: string;
  strength: number;
  dexterity: number;
  charisma: number;
  intelligence: number;
  wisdom: number;
  constitution: number;
  class: string;
  status: 'Joined' | 'Voting' | 'Finished';
  exp?: number; // Add exp property
};

export default function ResultsPage({ params }: { params: Promise<{ code: string }> }) {
    const { code } = use(params);
    const [partyId, setPartyId] = useState<string | null>(null);
    const [partyMembers, setPartyMembers] = useState<PartyMember[]>([]);
    const [loading, setLoading] = useState(true);
    const progressSteps = [
        'Checking party status',
        'Waiting for party members',
        'Calculating results',
        'Fetching results'
    ];
    const [currentStep, setCurrentStep] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [supabase, setSupabase] = useState<SupabaseClient | null>(null);

    useEffect(() => {
        const initSupabase = async () => {
            const client = await createClient();
            setSupabase(client as unknown as SupabaseClient);
        };
        initSupabase();
    }, []);
    const { setUserInfoFlowComplete } = usePartyStore();

    const checkStatus = async (currentPartyId: string): Promise<boolean> => {
        if (!currentPartyId || !supabase) return false;

        try {
            const { data: party, error: partyStatusError } = await supabase
                .from('parties')
                .select('status')
                .eq('id', currentPartyId)
                .single();

            if (partyStatusError) throw partyStatusError;

            if (party?.status === 'ResultsReady') {
                setCurrentStep(3); // Fetching results
                await fetchResults(currentPartyId);
                return true; // Stop polling
            } else {
                setCurrentStep(1); // Waiting for party members
                const { data: members, error: membersError } = await supabase
                    .from('party_members')
                    .select('first_name, status')
                    .eq('party_id', currentPartyId);

                if (membersError) throw membersError;

                const waitingOn = members.filter(m => m.status !== 'Finished');
                if (waitingOn.length > 0) {
                    // Still waiting, no message change needed as the step indicates this.
                    return false; // Continue polling
                } else {
                    // All members are finished, but results are not ready. Trigger calculation.
                    setCurrentStep(2); // Calculating results
                    await handleCheckResults(); // This will trigger the API call
                    return false; // Continue polling, the next check should find the results
                }
            }
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
            return true; // Stop polling on error
        }
    };

    const fetchResults = async (currentPartyId: string) => {
        if (!supabase) return;
        const { data: membersData, error: membersError } = await supabase
            .from('party_members')
            .select('id, first_name, strength, dexterity, charisma, intelligence, wisdom, constitution, class, status, exp')
            .eq('party_id', currentPartyId);

        if (membersError) throw membersError;
        setPartyMembers(membersData || []);
        setLoading(false);
    };

    const { getPartyByCode } = usePartyStore();
    useEffect(() => {
        if (!supabase) return;
        setUserInfoFlowComplete(true);

        const initializePage = async () => {
            try {
                setCurrentStep(0); // Start with the first step
                // First, fetch the party data which includes members and set it in the store
                await getPartyByCode(code);
                
                // Now that the store is populated, get the partyId from the store
                const { party } = usePartyStore.getState();
                if (!party) {
                    throw new Error('Party not found after fetch.');
                }
                const currentPartyId = party.id;
                setPartyId(currentPartyId);

                // Start polling for results
                const isDoneInitially = await checkStatus(currentPartyId);
                if (isDoneInitially) {
                    return; // Results are already ready
                }

                const statusCheck = setInterval(async () => {
                    const isDone = await checkStatus(currentPartyId);
                    if (isDone) {
                        clearInterval(statusCheck);
                    }
                }, 5000); // Check every 5 seconds

                return () => clearInterval(statusCheck);
            } catch (err: any) {
                setError(err.message);
                setLoading(false);
            }
        };

        if (code && supabase) {
            initializePage();
        }
    }, [code, supabase, setUserInfoFlowComplete, getPartyByCode]);

    const handleCheckResults = async () => {
        console.log("handleCheckResults called");
        if (!partyId || !supabase) {
            console.error("handleCheckResults: partyId or supabase is not set.", { partyId, supabase });
            return;
        }

        console.log("Getting user and members from store...");
        const { user, members } = usePartyStore.getState();
        if (!user) {
            console.error("handleCheckResults: User not found in store.");
            setError("User not found. Please ensure you are logged in.");
            return;
        }
        console.log("User found:", user);

        const currentMember = members.find(m => m.user_id === user.id);
        if (!currentMember) {
            console.error("handleCheckResults: Could not find current member in party.", { members });
            setError("Could not identify the current user within this party.");
            return;
        }
        const memberId = currentMember.id;
        console.log("Current member found:", currentMember);


        setLoading(true);

        try {
            console.log(`Fetching /api/party/${code}/finish-questionnaire with member_id: ${memberId}`);
            const response = await fetch(`/api/party/${code}/finish-questionnaire`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ member_id: memberId }),
            });
            console.log("Fetch response received:", response);

            if (!response.ok) {
                const apiError = await response.json().catch(() => ({ error: 'Failed to parse error response.' }));
                console.error("API Error:", apiError);
                throw new Error(apiError.error || 'Failed to trigger result calculation.');
            }

            console.log("API call successful, checking status...");
            await checkStatus(partyId);


        } catch (err: any) {
            console.error("Error in handleCheckResults:", err);
            setError(err.message);
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <LoadingSpinner />
                <div className="progress-indicator">
                    <h2 className="progress-title">Calculating Your Party's Destiny</h2>
                    <ul className="progress-steps">
                        {progressSteps.map((step, index) => (
                            <li key={index} className={`progress-step ${index <= currentStep ? 'completed' : ''}`}>
                                {step}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        );
    }

  if (error) {
    return <div>Error: {error}</div>;
  }


  return (
    <div className="results-container">
      <h1 className="results-title">Party Results</h1>
      <div className="results-grid">
        {partyMembers.map((member) => (
          <div key={member.id} className="member-results-card">
            <h2 className="member-name">{member.first_name}</h2>
            <p><strong className="member-class">Class:</strong> {member.class}</p>
            <ul className="stats-list">
              <li><strong>Strength:</strong> {member.strength}</li>
              <li><strong>Dexterity:</strong> {member.dexterity}</li>
              <li><strong>Charisma:</strong> {member.charisma}</li>
              <li><strong>Intelligence:</strong> {member.intelligence}</li>
              <li><strong>Wisdom:</strong> {member.wisdom}</li>
              <li><strong>Constitution:</strong> {member.constitution}</li>
              {member.exp !== undefined && <li><strong>EXP:</strong> {member.exp}</li>}
            </ul>
          </div>
        ))}
      </div>
      <div className="share-results-section">
        <button onClick={() => {
          navigator.clipboard.writeText(window.location.href);
          alert('Link copied to clipboard!');
        }} className="share-button">
          Share Results
        </button>
      </div>
    </div>
  );
}