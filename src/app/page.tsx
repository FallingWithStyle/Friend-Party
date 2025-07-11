'use client';

import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function Home() {
  const [partyCode, setPartyCode] = useState('');
  const router = useRouter();

  const handleJoinParty = (e: React.FormEvent) => {
    e.preventDefault();
    if (partyCode.trim()) {
      router.push(`/party/${partyCode}`);
    }
  };

  return (
    <>
      <Head>
        <title>Friend Party</title>
        <meta name="description" content="Discover your friends' inner adventurers" />
      </Head>

      <main className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 bg-neutral text-primary">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-7xl font-display mb-4">Friend Party</h1>
            <p className="text-xl md:text-2xl font-body mb-8">
              Discover your friends' inner adventurers.
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-1/2 bg-neutral border-2 border-secondary rounded-lg p-6 md:p-8 shadow-lg">
              <h2 className="text-2xl font-display mb-4">Create New Party</h2>
              <p className="font-body mb-6">
                Gather your adventurers and begin your quest to uncover hidden truths about your party.
              </p>
              <Link
                href="/create"
                className="w-full bg-primary hover:bg-opacity-90 text-neutral font-display py-3 px-6 rounded-md transition-all hover:shadow-[0_0_10px_#FFD700] block text-center"
              >
                Create New Party
              </Link>
            </div>

            <div className="w-full md:w-1/2 bg-neutral border-2 border-secondary rounded-lg p-6 md:p-8 shadow-lg">
              <h2 className="text-2xl font-display mb-4">Join Existing Party</h2>
              <p className="font-body mb-6">
                Enter the secret code provided by your party leader to join the adventure.
              </p>
              <form onSubmit={handleJoinParty} className="space-y-4">
                <div>
                  <label htmlFor="partyCode" className="block font-body mb-2">
                    Party Code
                  </label>
                  <input
                    type="text"
                    id="partyCode"
                    value={partyCode}
                    onChange={(e) => setPartyCode(e.target.value)}
                    maxLength={6}
                    className="w-full bg-neutral border border-secondary rounded-md py-2 px-3 font-body focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder="6-letter code"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-primary hover:bg-opacity-90 text-neutral font-display py-3 px-6 rounded-md transition-all hover:shadow-[0_0_10px_#FFD700] block"
                >
                  Join Party
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}