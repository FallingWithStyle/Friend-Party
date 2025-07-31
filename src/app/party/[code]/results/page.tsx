'use client';

import { use, useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { SupabaseClient } from '@supabase/supabase-js';
import usePartyStore from '@/store/partyStore';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { logDebug } from '@/lib/debug';
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
    const [waitingOn, setWaitingOn] = useState<any[]>([]);
    const [isCalculating, setIsCalculating] = useState(false);
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

            if (party?.status === 'Results' || party?.status === 'ResultsReady') {
                setCurrentStep(3); // Fetching results
                await fetchResults(currentPartyId);
                return true; // Stop polling
            } else {
                setCurrentStep(1); // Waiting for party members
                const { data: members, error: membersError } = await supabase
                    .from('party_members')
                    .select('first_name, assessment_status, is_npc')
                    .eq('party_id', currentPartyId)
                    .eq('is_npc', false);

                if (membersError) throw membersError;

                const unfinishedMembers = members.filter(m => m.assessment_status !== 'PeerAssessmentCompleted');
                logDebug('Unfinished members:', unfinishedMembers);
                setWaitingOn(unfinishedMembers);

                if (unfinishedMembers.length > 0) {
                    // Still waiting, no message change needed as the step indicates this.
                    return false; // Continue polling
                } else {
                    // All members are finished, but results are not ready. Trigger calculation.
                    if (!isCalculating) {
                        const { user } = usePartyStore.getState();
                        if (user) {
                            setCurrentStep(2); // Calculating results
                            await handleCheckResults(); // This will trigger the API call
                        }
                    }
                    return false; // Continue polling, let the interval handle it
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

        // Prefer ResultsReady if already computed; otherwise allow Results as well
        const { data: party, error: partyErr } = await supabase
          .from('parties')
          .select('status')
          .eq('id', currentPartyId)
          .single();
        if (partyErr) throw partyErr;

        // Always fetch members for display (including NPCs)
        const { data: membersData, error: membersError } = await supabase
            .from('party_members')
            .select('id, first_name, strength, dexterity, charisma, intelligence, wisdom, constitution, class, status, exp, is_npc')
            .eq('party_id', currentPartyId);

        if (membersError) throw membersError;

        setPartyMembers(membersData || []);
        logDebug('Final results displayed:', membersData);

        // If the party just reached Results (not yet ResultsReady), invoke results calculation once
        if (party?.status === 'Results') {
          try {
            const { party: storeParty, user } = usePartyStore.getState();
            if (storeParty && user && !isCalculating) {
              setCurrentStep(2); // Calculating results
              await handleCheckResults();
            }
          } catch (e) {
            console.error('Failed to trigger calculation from fetchResults:', e);
          }
        }

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

    useEffect(() => {
        console.log('waitingOn changed:', waitingOn);
    }, [waitingOn]);

    const handleCheckResults = async () => {
        if (isCalculating) return;
        setIsCalculating(true);

        const { party } = usePartyStore.getState();
        if (!party || !supabase) {
            console.error("handleCheckResults: partyId or supabase is not set.", { party, supabase });
            setIsCalculating(false);
            return;
        }
        const partyId = party.id;

        console.log("Getting user and members from store...");
        const { user, members } = usePartyStore.getState();
        if (!user) {
            console.error("handleCheckResults: User not found in store.");
            setError("User not found. Please ensure you are logged in.");
            setIsCalculating(false);
            return;
        }
        console.log("User found:", user);

        const currentMember = members.find(m => m.user_id === user.id);
        if (!currentMember) {
            console.error("handleCheckResults: Could not find current member in party.", { members });
            setError("Could not identify the current user within this party.");
            setIsCalculating(false);
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
                body: JSON.stringify({ member_id: memberId, assessment_type: 'peer-assessment' }),
            });
            console.log("Fetch response received:", response);

            if (!response.ok) {
                const apiError = await response.json().catch(() => ({ error: 'Failed to parse error response.' }));
                console.error("API Error:", apiError);
                throw new Error(apiError.error || 'Failed to trigger result calculation.');
            }

            console.log("API call successful, checking status...");
            // After triggering, bump the party status locally so polling can advance to fetch
            try {
              const { error: partyUpdateErr } = await supabase
                .from('parties')
                .update({ status: 'Results' })
                .eq('id', partyId);
              if (partyUpdateErr) {
                console.warn('Non-fatal: failed to bump party status to Results locally:', partyUpdateErr);
              }
            } catch (e) {
              console.warn('Non-fatal: party status bump threw:', e);
            }


        } catch (err: any) {
            console.error("Error in handleCheckResults:", err);
            setError(err.message);
            setLoading(false);
            setIsCalculating(false);
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
                    {waitingOn.length > 0 && (
                        <div className="waiting-on-list">
                            <h3>Waiting for:</h3>
                            <ul>
                                {waitingOn.map((member, index) => (
                                    <li key={index}>
                                        {member.first_name} - {member.assessment_status}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
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