'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth'; // Reintroduce useAuth
import './page.css';

interface Party {
  code: string;
  name: string;
}



export default function Home() {
  const [partyCode, setPartyCode] = useState('');
  const [joinedParties, setJoinedParties] = useState<Party[]>([]);
  const [email, setEmail] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const { user } = useAuth(); // Get user from useAuth

  useEffect(() => {
    const fetchJoinedParties = async () => {
      if (user) { // Only fetch if user is logged in
        try {
          const { data: partyMembers, error } = await supabase
            .from('party_members')
            .select(`
              party:parties (
                code,
                name
              )
            `)
            .eq('user_id', user.id);

          if (error) {
            throw error;
          }

          const parties = (partyMembers || []).flatMap((pm: { party?: Party | Party[] }) => {
            const party = Array.isArray(pm.party) ? pm.party[0] : pm.party;
            return party ? [party] : [];
          });
          setJoinedParties(parties);

        } catch (error) {
          console.error('Failed to fetch joined parties:', error);
        }
      } else {
        setJoinedParties([]); // Clear parties if user logs out
      }
    };

    fetchJoinedParties();
  }, [user, supabase]);


  const handleJoinParty = (e: React.FormEvent) => {
    e.preventDefault();
    if (partyCode.trim().length === 6) {
      const isMember = joinedParties.some(party => party.code === partyCode);
      if (isMember) {
        router.push(`/party/${partyCode}`); // Redirect to lobby if already a member
      } else {
        router.push(`/party/${partyCode}/join`); // Redirect to join page if not a member
      }
    } else {
      alert('Please enter a valid 6-character party code.');
    }
  };


  const handleMagicLinkSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          emailRedirectTo: `${location.origin}/auth/callback`,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      setMagicLinkSent(true);
    } catch (error) {
      console.error('Error sending magic link:', error);
      alert('Failed to send magic link. Please try again.');
    }
  };

  return (
    <>
      <div className="home-container">
        <h1 className="home-title">Friend Party</h1>

        {user ? (
          <div className="magic-link-section">
            <p className="text-lg text-gray-700">Signed in as {user.email}</p>
            <Link href="/profile" className="home-link mt-2">
              » View Profile «
            </Link>
          </div>
        ) : (
          <div className="magic-link-section">
            <form onSubmit={handleMagicLinkSignIn} className="magic-link-form">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email for magic link"
                className="magic-link-input"
                required
              />
              <button type="submit" className="magic-link-button">
                {magicLinkSent ? 'Link Sent - Check Email' : 'Send Magic Link'}
              </button>
            </form>
            {magicLinkSent && <p className="magic-link-success">Check your email for the login link!</p>}
          </div>
        )}

        <Link href="/create" className="home-link">
          » Forge a New Party «
        </Link>

              <p className="home-join-text">Or, Join an Existing Party:</p>
        <form onSubmit={handleJoinParty} className="home-form">
          <label htmlFor="partyCode" style={{ display: 'none' }}>
            Party Code
          </label>
          <input
            type="text"
            id="partyCode"
            value={partyCode}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPartyCode(e.target.value.toUpperCase())}
            maxLength={6}
            className="home-input"
            placeholder="Enter Party Code"
            required
          />
          <button type="submit" className="home-button">Join</button>
        </form>

        {user && ( // Only show "Your Parties" if user is logged in
              <div className="home-parties">
            <h2>Your Parties</h2>
            {joinedParties.length > 0 ? (
              <div className="party-list">
                {joinedParties.map((party) => (
                  <div key={party.code} className="party-list-item">
                    <Link href={`/party/${party.code}`}>
                      {party.name} ({party.code})
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p>You haven&apos;t joined any parties yet.</p>
            )}
          </div>
        )}

        <div className="home-footer">
          <div className="home-footer-divider" />
             <p className="home-footer-text">&copy; 2025 Friend Party</p>
        </div>
      </div>
    </>
  );
}