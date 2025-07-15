'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import usePartyStore from '@/store/partyStore';
import { createClient } from '@/lib/supabase/client'; // Use the singleton client
import Auth from '@/components/Auth';
import { SupabaseClient } from '@supabase/supabase-js'; // Keep for type casting if needed
import { useAuth } from '@/hooks/useAuth'; // Import useAuth
import './page.css';

export default function JoinPartyPage() {
  const [profile, setProfile] = useState<any>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
  });
  const [isMember, setIsMember] = useState(false); // New state to track membership
  const [checkingMembership, setCheckingMembership] = useState(true); // New state for loading
  const router = useRouter();
  const { code } = useParams();
  const { loading, error, joinParty } = usePartyStore();
  const supabase = createClient() as unknown as SupabaseClient; // Get supabase client
  const { user, loading: userLoading } = useAuth(); // Get user and userLoading from useAuth

  useEffect(() => {
    const checkUserAndMembership = async () => {
      setCheckingMembership(true);
      if (userLoading) return; // Wait for user loading to complete

      if (!user) {
        setCheckingMembership(false); // Not logged in, show Auth component
        return;
      }

      // User is logged in, check if they are already a member of this party
      if (typeof code === 'string') {
        // First, get the party ID from the party code
        const { data: partyData, error: partyError } = await supabase
          .from('parties')
          .select('id')
          .eq('code', code)
          .single();

        if (partyError || !partyData) {
          console.error('Error fetching party or party not found:', partyError);
          router.push('/'); // Redirect if party not found
          return;
        }

        const { data: memberData, error: memberError } = await supabase
          .from('party_members')
          .select('id')
          .eq('party_id', partyData.id)
          .eq('user_id', user.id)
          .single();

        if (memberData) {
          setIsMember(true);
          router.push(`/party/${code}`); // Redirect to lobby if already a member
        } else if (memberError && memberError.code !== 'PGRST116') {
          console.error('Error checking membership:', memberError);
          // Handle error, maybe redirect to an error page or show a message
        }
      }

      // Fetch profile if user is logged in and not already a member
      const response = await fetch('/api/profile');
      const data = await response.json();
      setProfile(data);

      // If profile has names, pre-fill the form
      if (data && data.first_name && data.last_name) {
        setFormData({
          firstName: data.first_name,
          lastName: data.last_name
        });
      }
      setCheckingMembership(false);
    };

    checkUserAndMembership();
  }, [user, userLoading, code, router, supabase]); // Dependencies

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof code === 'string') {
      await joinParty(code, formData);
      router.push(`/party/${code}`);
    }
  };

  if (userLoading || checkingMembership) {
    return <div className="text-center p-8">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="auth-required-container">
        <div className="auth-required-card">
          <h1 className="auth-required-title">You need to be logged in to join a party.</h1>
          <Auth redirectUrl={typeof code === 'string' ? `/party/${code}/join` : '/'} />
        </div>
      </div>
    );
  }

  if (isMember) {
    // This case should ideally be handled by the redirect in useEffect,
    // but as a fallback, if somehow we reach here and isMember is true
    return <div className="text-center p-8">Redirecting to party lobby...</div>;
  }

  return (
    <div className="join-party-container">
      <div className="join-party-card">
        <h1 className="join-party-title">Join the Party!</h1>
        <p className="user-email-text">You are signed in as {user?.email}.</p>
        <form onSubmit={handleSubmit} className="join-party-form">
          {!profile?.first_name && (
            <div className="form-group">
              <label htmlFor="firstName" className="form-label">
                First Name
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required={!profile?.first_name}
                className="form-input"
            />
          </div>
          )}
          {!profile?.last_name && (
            <div className="form-group">
              <label htmlFor="lastName" className="form-label">
                Last Name (optional)
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="form-input"
              />
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="submit-button"
          >
            {loading ? 'Joining...' : 'Join Party'}
          </button>
        </form>
      </div>
    </div>
  );
}