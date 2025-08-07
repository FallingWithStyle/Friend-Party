'use client';

type Profile = {
  firstName: string;
  lastName: string;
};

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import './page.css'; // Import the new CSS file

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile>({ firstName: '', lastName: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Profile>({ firstName: '', lastName: '' });
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true); // Ensure loading state is true when fetching
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        console.log('No user found or error fetching user:', userError);
        router.push('/'); // Redirect to home if not authenticated
        setIsLoading(false);
        return;
      }

      console.log('User found:', user.id);

      const { data, error } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
      } else if (data) {
        console.log('Profile data found:', data);
        setProfile({
          firstName: (data.first_name as string) || '',
          lastName: (data.last_name as string) || ''
        });
        setFormData({
          firstName: (data.first_name as string) || '',
          lastName: (data.last_name as string) || ''
        });
      } else {
        console.log('No profile found for user.');
        setProfile({ firstName: '', lastName: '' }); // Ensure empty if no profile
        setFormData({ firstName: '', lastName: '' }); // Ensure empty if no profile
      }
      setIsLoading(false);
    };

    fetchProfile();
  }, [router, supabase]); // Added supabase to dependencies

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      router.push('/'); // Redirect to home if not authenticated
      return;
    }

    console.log('Attempting to save profile:', { user_id: user.id, firstName: formData.firstName, lastName: formData.lastName });

    const { error } = await supabase
      .from('profiles')
      .upsert({
        user_id: user.id,
        first_name: formData.firstName,
        last_name: formData.lastName
      }, { onConflict: 'user_id' });

    if (error) {
      console.error('Error updating profile:', error);
      console.error('Supabase upsert error details:', error);
    } else {
      console.log('Profile saved successfully.');
      setProfile({
        firstName: formData.firstName,
        lastName: formData.lastName
      });
      setIsEditing(false);
    }

    setIsLoading(false);
  };

  if (isLoading) {
    return <div className="container mx-auto p-4">Loading...</div>;
  }

  const isProfileEmpty = !profile.firstName && !profile.lastName;

  return (
    <div className="profile-page-container">
      <div className="profile-card">
        <h1 className="profile-title">Your Profile</h1>

        {(isEditing || isProfileEmpty) ? (
          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-group">
              <label htmlFor="firstName" className="form-label">
                First Name
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="lastName" className="form-label">
                Last Name
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                className="form-input"
              />
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="profile-button primary"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setFormData({
                    firstName: profile.firstName,
                    lastName: profile.lastName
                  });
                }}
                className="profile-button secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="profile-display">
            <div className="profile-field">
              <p className="profile-label">First Name</p>
              <p className="profile-value">{profile.firstName || 'Not set'}</p>
            </div>

            <div className="profile-field">
              <p className="profile-label">Last Name</p>
              <p className="profile-value">{profile.lastName || 'Not set'}</p>
            </div>

            <button
              onClick={() => setIsEditing(true)}
              className="profile-button primary full-width"
            >
              Edit Profile
            </button>
          </div>
        )}
        {!isEditing && (
          <div className="profile-back-link-container">
            <Link
              href="/"
              className="profile-back-link"
            >
              Back to Home
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}