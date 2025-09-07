import { createClient } from '@/lib/supabase/client';

interface AchievementData {
  [key: string]: number;
}

class AchievementService {
  private supabase = createClient();

  async awardAchievement(achievementType: string, data: AchievementData = {}) {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) return [];

      const response = await fetch('/api/achievements/award', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          achievementType,
          data,
        }),
      });

      if (!response.ok) {
        console.error('Failed to award achievement:', await response.text());
        return [];
      }

      const result = await response.json();
      return result.awardedAchievements || [];
    } catch (error) {
      console.error('Error awarding achievement:', error);
      return [];
    }
  }

  // Specific achievement awarding methods
  async awardPartyJoined() {
    return this.awardAchievement('parties_joined', { parties_joined: 1 });
  }

  async awardPartyCreated() {
    return this.awardAchievement('parties_created', { parties_created: 1 });
  }

  async awardNameProposed() {
    return this.awardAchievement('names_proposed', { names_proposed: 1 });
  }

  async awardMottoProposed() {
    return this.awardAchievement('mottos_proposed', { mottos_proposed: 1 });
  }

  async awardVoteCast() {
    return this.awardAchievement('votes_cast', { votes_cast: 1 });
  }

  async awardSelfAssessmentCompleted() {
    return this.awardAchievement('self_assessments_completed', { self_assessments_completed: 1 });
  }

  async awardPeerAssessmentCompleted() {
    return this.awardAchievement('peer_assessments_completed', { peer_assessments_completed: 1 });
  }

  async awardHirelingConverted() {
    return this.awardAchievement('hirelings_converted', { hirelings_converted: 1 });
  }

  async awardResultsViewed() {
    return this.awardAchievement('results_viewed', { results_viewed: 1 });
  }

  async awardProfileCompleted() {
    return this.awardAchievement('profile_completed', { profile_completed: 1 });
  }

  // Batch update achievements based on user stats
  async updateUserStats() {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) return [];

      // Get user's party statistics
      const { data: partyStats } = await this.supabase
        .from('friendparty.party_members')
        .select('party_id, is_leader')
        .eq('user_id', user.id);

      if (!partyStats) return [];

      const partiesJoined = partyStats.length;
      const partiesCreated = partyStats.filter(p => p.is_leader).length;

      // Get user's voting statistics
      const { data: votes } = await this.supabase
        .from('friendparty.name_proposal_votes')
        .select('id')
        .eq('voter_member_id', user.id);

      const { data: mottoVotes } = await this.supabase
        .from('friendparty.party_motto_votes')
        .select('id')
        .eq('voter_member_id', user.id);

      const votesCast = (votes?.length || 0) + (mottoVotes?.length || 0);

      // Get user's proposal statistics
      const { data: nameProposals } = await this.supabase
        .from('friendparty.name_proposals')
        .select('id')
        .eq('proposing_member_id', user.id);

      const { data: mottoProposals } = await this.supabase
        .from('friendparty.party_motto_proposals')
        .select('id')
        .eq('proposed_by_member_id', user.id);

      const namesProposed = nameProposals?.length || 0;
      const mottosProposed = mottoProposals?.length || 0;

      // Get user's assessment statistics
      const { data: selfAssessments } = await this.supabase
        .from('friendparty.answers')
        .select('id')
        .eq('voter_member_id', user.id)
        .eq('subject_member_id', user.id);

      const { data: peerAssessments } = await this.supabase
        .from('answers')
        .select('id')
        .eq('voter_member_id', user.id)
        .neq('subject_member_id', user.id);

      const selfAssessmentsCompleted = selfAssessments?.length || 0;
      const peerAssessmentsCompleted = peerAssessments?.length || 0;

      // Award achievements based on stats
      const awardedAchievements = [];

      // Party participation achievements
      if (partiesJoined > 0) {
        const achievements = await this.awardAchievement('parties_joined', { parties_joined: partiesJoined });
        awardedAchievements.push(...achievements);
      }

      if (partiesCreated > 0) {
        const achievements = await this.awardAchievement('parties_created', { parties_created: partiesCreated });
        awardedAchievements.push(...achievements);
      }

      // Social interaction achievements
      if (namesProposed > 0) {
        const achievements = await this.awardAchievement('names_proposed', { names_proposed: namesProposed });
        awardedAchievements.push(...achievements);
      }

      if (mottosProposed > 0) {
        const achievements = await this.awardAchievement('mottos_proposed', { mottos_proposed: mottosProposed });
        awardedAchievements.push(...achievements);
      }

      if (votesCast > 0) {
        const achievements = await this.awardAchievement('votes_cast', { votes_cast: votesCast });
        awardedAchievements.push(...achievements);
      }

      // Questionnaire completion achievements
      if (selfAssessmentsCompleted > 0) {
        const achievements = await this.awardAchievement('self_assessments_completed', { self_assessments_completed: selfAssessmentsCompleted });
        awardedAchievements.push(...achievements);
      }

      if (peerAssessmentsCompleted > 0) {
        const achievements = await this.awardAchievement('peer_assessments_completed', { peer_assessments_completed: peerAssessmentsCompleted });
        awardedAchievements.push(...achievements);
      }

      const totalAssessments = selfAssessmentsCompleted + peerAssessmentsCompleted;
      if (totalAssessments > 0) {
        const achievements = await this.awardAchievement('total_assessments_completed', { total_assessments_completed: totalAssessments });
        awardedAchievements.push(...achievements);
      }

      return awardedAchievements;
    } catch (error) {
      console.error('Error updating user stats:', error);
      return [];
    }
  }
}

export const achievementService = new AchievementService();
