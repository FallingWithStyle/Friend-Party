'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import usePartyStore from '@/store/partyStore';

export const UserInfoHandler = () => {
  const [mounted, setMounted] = useState(false);
  const { members, user, setUser } = usePartyStore();
  const [emailVerified, setEmailVerified] = useState(false);
  const [email, setEmail] = useState('');
  const [nameVerified, setNameVerified] = useState(false);
  const [name, setName] = useState('');
  const currentMember = members.find((member: any) => member.user_id === user?.id);

  useEffect(() => {
    setMounted(true);
    const supabase = createClient();
    const fetchUser = async () => {
      const { data: { user: supabaseUser } } = await supabase.auth.getUser();
      if (supabaseUser) {
        setUser({ id: supabaseUser.id, email: supabaseUser.email || undefined });
      }
    };
    fetchUser();

    if (currentMember) {
      if (currentMember.email) {
        setEmail(currentMember.email);
        setEmailVerified(true);
      }
      if (currentMember.first_name) {
        setName(currentMember.first_name);
        setNameVerified(true);
      }
    } else if (user?.email) {
      setEmail(user.email);
      setEmailVerified(true);
    }
  }, [currentMember, user, setUser, members]);

  if (!mounted) {
    return null;
  }

  if (!emailVerified && !currentMember?.email) {
    return (
      <div className="email-verification">
        <h2>Verify Your Email</h2>
        <p>Please confirm your email address for this party</p>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
        />
        <button
          onClick={() => setEmailVerified(true)}
          disabled={!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)}
        >
          Next
        </button>
      </div>
    );
  }

  if (!nameVerified) {
    return (
      <div className="name-verification">
        <h2>Enter Your Name</h2>
        <p>Please enter your name for this party</p>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
        />
        <button
          onClick={() => {
            setNameVerified(true);
            const updateMemberName = async () => {
              const supabase = createClient();
              await supabase
                .from('party_members')
                .update({ first_name: name })
                .eq('id', currentMember?.id);
            };
            updateMemberName();
          }}
          disabled={!name || name.trim().length === 0}
        >
          Confirm Name
        </button>
      </div>
    );
  }

  return null;
};