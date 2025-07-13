'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import usePartyStore from '@/store/partyStore';
import './page.css';

export default function CreatePartyPage() {
  const [formData, setFormData] = useState({
    name: '',
    motto: '',
    creatorName: ''
  });
  const router = useRouter();
  const { createParty, party, loading, error } = usePartyStore();
  const [formErrors, setFormErrors] = useState({
    name: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = { name: '' };
    let hasErrors = false;

    if (!formData.name.trim()) {
      errors.name = 'Party name is required.';
      hasErrors = true;
    }
    if (!formData.creatorName.trim()) {
      alert('Your name is required to create a party.');
      hasErrors = true;
    }

    setFormErrors(errors);

    if (!hasErrors) {
      await createParty(formData);
    }
  };

  useEffect(() => {
    if (party?.code) {
      router.push(`/party/${party.code}`);
    }
  }, [party, router]);

  return (
    <div className="create-party-container">
      <div className="create-party-card">
        <h1 className="create-party-title">Create Your Party</h1>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="create-party-form">
          <div className="form-group">
            <label htmlFor="name" className="form-label">
              Party Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className={`form-input ${formErrors.name ? 'form-error-outline' : ''}`}
            />
            {formErrors.name && <p className="form-error">{formErrors.name}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="creatorName" className="form-label">
              Your Name (Party Leader)
            </label>
            <input
              type="text"
              id="creatorName"
              name="creatorName"
              value={formData.creatorName}
              onChange={handleChange}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="motto" className="form-label">
              Motto (optional)
            </label>
            <textarea
              id="motto"
              name="motto"
              value={formData.motto}
              onChange={handleChange}
              rows={3}
              className="form-textarea"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="submit-button"
          >
            {loading ? 'Creating Party...' : 'Create Party'}
          </button>
        </form>
      </div>
    </div>
  );
}