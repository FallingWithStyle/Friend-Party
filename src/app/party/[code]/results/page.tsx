'use client';

import { use, useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { SupabaseClient } from '@supabase/supabase-js';
import usePartyStore from '@/store/partyStore';
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
};

export default function ResultsPage({ params }: { params: Promise<{ code: string }> }) {
    const { code } = use(params);
    const [partyId, setPartyId] = useState<string | null>(null);
    const [partyMembers, setPartyMembers] = useState<PartyMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMessage, setLoadingMessage] = useState('Checking party status');
    const [error, setError] = useState<string | null>(null);
    const supabase = createClient() as unknown as SupabaseClient;
    const { setUserInfoFlowComplete } = usePartyStore();

    const checkStatus = async (currentPartyId: string) => {
        if (!currentPartyId) return;

        try {
            const { data: party, error: partyStatusError } = await supabase
                .from('parties')
                .select('status')
                .eq('id', currentPartyId)
                .single();

            if (partyStatusError) throw partyStatusError;

            if (party?.status === 'ResultsReady') {
                setLoadingMessage('All assessments are in. Calculating your party\'s results.');
                await fetchResults(currentPartyId);
            } else {
                const { data: members, error: membersError } = await supabase
                    .from('party_members')
                    .select('first_name, status')
                    .eq('party_id', currentPartyId);

                if (membersError) throw membersError;

                const waitingOn = members.filter(m => m.status !== 'Finished');
                if (waitingOn.length > 0) {
                    const names = waitingOn.map(m => m.first_name).join(', ');
                    setLoadingMessage(`Waiting for ${names} to finish the assessment.`);
                } else {
                    setLoadingMessage('All assessments are in. Calculating results.');
                }
                // Keep loading true to show the message and button
                setLoading(true);
            }
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    const fetchResults = async (currentPartyId: string) => {
        const { data: membersData, error: membersError } = await supabase
            .from('party_members')
            .select('id, first_name, strength, dexterity, charisma, intelligence, wisdom, constitution, class, status')
            .eq('party_id', currentPartyId);

        if (membersError) throw membersError;
        setPartyMembers(membersData || []);
        setLoading(false);
    };

    useEffect(() => {
        setUserInfoFlowComplete(true);
        const getPartyId = async () => {
            try {
                const { data: partyData, error: partyError } = await supabase
                    .from('parties')
                    .select('id')
                    .eq('code', code)
                    .single();

                if (partyError) throw partyError;
                if (!partyData) throw new Error('Party not found.');

                setPartyId(partyData.id);
                await checkStatus(partyData.id);
            } catch (err: any) {
                setError(err.message);
                setLoading(false);
            }
        };

        getPartyId();
    }, [code, supabase, setUserInfoFlowComplete]);

    if (loading) {
        return (
            <div className="loading-message">
                <p>{loadingMessage}</p>
                <button onClick={() => partyId && checkStatus(partyId)} className="check-again-button">
                    Check Again
                </button>
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
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}