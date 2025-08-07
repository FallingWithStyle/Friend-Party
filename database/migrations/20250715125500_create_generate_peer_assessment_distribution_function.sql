-- Migration: Create generate_peer_assessment_distribution function
-- This function creates an equitable distribution of peer assessment assignments.

CREATE OR REPLACE FUNCTION public.generate_peer_assessment_distribution(p_party_id UUID)
RETURNS void AS $$
DECLARE
    members UUID[];
    questions_to_assign UUID[];
    assessor UUID;
    subject UUID;
    q_id UUID;
    assignments_created BOOLEAN;
BEGIN
    -- Check if assignments have already been created for this party
    SELECT EXISTS (
        SELECT 1
        FROM public.peer_assessment_assignments
        WHERE party_id = p_party_id
    ) INTO assignments_created;

    IF assignments_created THEN
        RAISE NOTICE 'Peer assessment assignments have already been generated for party %.', p_party_id;
        RETURN;
    END IF;

    -- Get all members of the party
    SELECT array_agg(id) INTO members
    FROM public.party_members
    WHERE party_id = p_party_id;

    -- Get all peer-assessment questions
    SELECT array_agg(id) INTO questions_to_assign
    FROM public.questions
    WHERE question_type = 'peer-assessment';

    -- Loop through each question and create assignments
    FOREACH q_id IN ARRAY questions_to_assign
    LOOP
        -- For each member, assign them to assess every other member
        FOREACH assessor IN ARRAY members
        LOOP
            FOREACH subject IN ARRAY members
            LOOP
                -- A member does not assess themselves in peer-assessment
                IF assessor <> subject THEN
                    INSERT INTO public.peer_assessment_assignments
                        (party_id, question_id, assessor_member_id, subject_member_id)
                    VALUES
                        (p_party_id, q_id, assessor, subject)
                    ON CONFLICT DO NOTHING;
                END IF;
            END LOOP;
        END LOOP;
    END LOOP;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.generate_peer_assessment_distribution(UUID) IS 'Generates a round-robin distribution of peer assessment assignments for a given party, ensuring each member assesses every other member for each peer-assessment question.';
