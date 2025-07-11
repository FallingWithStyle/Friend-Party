'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import usePartyStore from '@/store/partyStore';

export default function CreatePartyPage() {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
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
    const errors = { name: '', date: '', location: '' };
    let hasErrors = false;

    if (!formData.name.trim()) {
      errors.name = 'Party name is required.';
      hasErrors = true;
    }
    if (!formData.creatorName.trim()) {
      // This is a new field, so we'll add a simple error message for it.
      // In a real app, this might be part of the formErrors state.
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
    <div className="min-h-screen bg-gradient-to-br from-purple-500 to-pink-500 p-8">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl p-6">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">Create Your Party</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Party Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 p-2 border ${formErrors.name ? 'border-red-500' : ''}`}
            />
            {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
          </div>

          <div>
            <label htmlFor="creatorName" className="block text-sm font-medium text-gray-700">
              Your Name (Party Leader)
            </label>
            <input
              type="text"
              id="creatorName"
              name="creatorName"
              value={formData.creatorName}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 p-2 border"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description (optional)
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 p-2 border"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Party...' : 'Create Party'}
          </button>
        </form>
      </div>
    </div>
  );
}