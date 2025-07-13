'use client';

import { PeerQuestionnaire } from '@/components/common/PeerQuestionnaire';
import usePartyStore from '@/store/partyStore';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import './page.css';

export default function PeerAssessmentPage({ params }: { params: { code: string } }) {
  const router = useRouter();
  const { members, party } = usePartyStore();

  useEffect(() => {
    if (!party?.code) {
      router.push(`/party/${params.code}/join`);
    }
  }, [party, params.code, router]);

  return (
    <div className="peer-assessment-container">
      <h1 className="peer-assessment-title">Peer Assessment</h1>
      <PeerQuestionnaire partyCode={params.code} />
    </div>
  );
}