'use client';

import { use, useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { SupabaseClient } from '@supabase/supabase-js';
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
};

export default function ResultsPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const [partyMembers, setPartyMembers] = useState<PartyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient() as unknown as SupabaseClient;

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const { data: partyData, error: partyError } = await supabase
          .from('parties')
          .select('id')
          .eq('code', code)
          .single();

        if (partyError) throw partyError;
        if (!partyData) throw new Error('Party not found.');

        const partyId = partyData.id;

        const { data: membersData, error: membersError } = await supabase
          .from('party_members')
          .select('id, first_name, strength, dexterity, charisma, intelligence, wisdom, constitution, class')
          .eq('party_id', partyId);

        if (membersError) throw membersError;
        setPartyMembers(membersData || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    const pollForResults = async () => {
      let attempts = 0;
      const maxAttempts = 10;
      const interval = 3000; // 3 seconds

      const poll = async (resolve: (value: unknown) => void, reject: (reason?: any) => void) => {
        if (attempts >= maxAttempts) {
          return reject(new Error('Timeout waiting for results.'));
        }

        const { data: party, error } = await supabase
          .from('parties')
          .select('status')
          .eq('code', code)
          .single();

        if (error) return reject(error);

        if (party?.status === 'ResultsReady') {
          return resolve(true);
        } else {
          attempts++;
          setTimeout(() => poll(resolve, reject), interval);
        }
      };

      return new Promise(poll);
    };

    pollForResults()
      .then(() => {
        fetchResults();
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [code, supabase]);

  if (loading) {
    return <div>Loading...</div>;
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