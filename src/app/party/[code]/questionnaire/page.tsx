'use client';

import { useParams } from 'next/navigation';
import { UnifiedQuestionnaire } from '@/components/common/UnifiedQuestionnaire';
import usePartyStore from '@/store/partyStore';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function SelfAssessmentPage() {
  const router = useRouter();
  const params = useParams();
  const code = params.code as string;
  const { party, getPartyByCode } = usePartyStore();

  useEffect(() => {
    if (!party?.code && code) {
      getPartyByCode(code);
    }
  }, [code, getPartyByCode]);

  if (!code) {
    return <div>Loading...</div>;
  }

  return (
    <div className="self-assessment-container">
      <h1 className="self-assessment-title">Self Assessment</h1>
      <UnifiedQuestionnaire partyCode={code} questionType="self-assessment" />
    </div>
  );
}