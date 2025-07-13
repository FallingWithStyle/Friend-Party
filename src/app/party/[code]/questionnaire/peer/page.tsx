'use client';

import { PeerQuestionnaire } from '@/components/common/PeerQuestionnaire';
import usePartyStore from '@/store/partyStore';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function PeerAssessmentPage({ params }: { params: { code: string } }) {
  const router = useRouter();
  const { members, party } = usePartyStore();

  useEffect(() => {
    if (!party?.code) {
      router.push(`/party/${params.code}/join`);
    }
  }, [party, params.code, router]);

  return (
    <div className="container mx-auto flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-4xl font-bold mb-8">Peer Assessment</h1>
      <PeerQuestionnaire partyCode={params.code} />
    </div>
  );
}