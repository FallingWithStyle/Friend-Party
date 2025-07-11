'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import usePartyStore from '@/store/partyStore';
import { createClient } from '@/utils/supabase/client';

interface Member {
  id: string;
  first_name: string;
  last_name: string | null;
}

export default function PartyLobbyPage() {
  const { code } = useParams();
  const { party, loading, error, getPartyByCode } = usePartyStore();
  const [members, setMembers] = useState<Member[]>([]);

  useEffect(() => {
    const supabase = createClient();
    if (code && typeof code === 'string') {
      getPartyByCode(code);

      const fetchMembers = async () => {
        const { data: partyData } = await supabase.from('parties').select('id').eq('code', code).single();
        if (partyData) {
          const { data: memberData, error: memberError } = await supabase
            .from('party_members')
            .select('*')
            .eq('party_id', partyData.id);
          if (memberData) {
            setMembers(memberData);
          }
        }
      };
      fetchMembers();
    }
  }, [code, getPartyByCode]);

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
            <ul className="list-disc list-inside">
              {members.map((member: Member) => (
                <li key={member.id} className="text-gray-600">
                  {member.first_name} {member.last_name}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}