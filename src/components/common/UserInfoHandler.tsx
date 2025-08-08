'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import usePartyStore from '@/store/partyStore';
import { useAuth } from '@/hooks/useAuth';

export const UserInfoHandler = () => {
  const [mounted, setMounted] = useState(false);
  const { members, isUserInfoFlowComplete, loading: partyLoading, setUser } = usePartyStore();
  const { user, loading: authLoading } = useAuth();
  const [nameVerified, setNameVerified] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const currentMember = members.find((member: { user_id: string }) => member.user_id === user?.id);

  useEffect(() => {
    setMounted(true);
    if (currentMember?.first_name) {
      setNameVerified(true);
    }
  }, [currentMember]);

  useEffect(() => {
    if (user) {
      setUser({ id: user.id, email: user.email });
    }
  }, [user, setUser]);

  if (!mounted || partyLoading || authLoading || isUserInfoFlowComplete || nameVerified) {
    return null;
  }

  return (
    <div className="name-verification">
      <h2>Enter Your Name</h2>
      <p>Please enter your name for this party</p>
      <input
        type="text"
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
        placeholder="First Name"
      />
      <input
        type="text"
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
        placeholder="Last Name"
      />
      <button
        onClick={() => {
          setNameVerified(true);
          const updateMemberName = async () => {
            const supabase = createClient();
            await supabase
              .from('party_members')
              .update({ first_name: firstName, last_name: lastName })
              .eq('id', currentMember?.id);
          };
          updateMemberName();
        }}
        disabled={!firstName || firstName.trim().length === 0}
      >
        Confirm Name
      </button>
    </div>
  );

  return null;
};