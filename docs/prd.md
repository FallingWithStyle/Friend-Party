# Friend Party Product Requirements Document (PRD)

## 1. Goals and Background Context

### Goals

*   Allow a user to create a "party" of friends ("Adventurers").
*   Allow users to join an existing party using a unique 6-letter code.
*   Gather user opinions about fellow party members through a questionnaire.
*   Generate D&D-style stats and classes for each party member based on collective input.
*   Provide a fun, engaging way for friends to see how they perceive each other.
*   Achieve a rapid MVP deployment to validate the core concept.

### Background Context

"Friend Party" is a lightweight social web application designed for quick, fun interactions between friends. The core idea is to gamify personality profiling within a friend group, using the familiar framework of D&D stats and classes. Users collaboratively "vote" on each other's traits by answering a series of questions, creating a shared, humorous, and insightful look at their group dynamics.

The MVP aims to deliver this core voting and profile-reveal experience quickly, leveraging an existing Supabase backend (avoros) to minimize development time and validate the concept's appeal.

### Change Log

| Date | Version | motto | Author |
| :--- | :--- | :--- | :--- |
| 2025-07-11 | 1.0 | Initial draft | John (PM) |


## 2. Requirements

### Functional Requirements

1.  **FR1**: A user must be able to create a new "Party" which generates a unique, shareable 6-letter code.
2.  **FR2**: A user must be able to join an existing Party by entering its 6-letter code.
3.  **FR3**: The Party creator must be able to add members to the Party by providing their names.
4.  **FR4**: The Party creator can optionally provide an email address for each member.
5.  **FR5**: The system must identify the Party creator as the "Party Leader".
6.  **FR6**: Once in a Party, a user must answer a series of questions about themselves to establish baseline stats.
7.  **FR7**: A user must answer a series of questions about their fellow party members to vote on their stats.
8.  **FR8**: The system shall calculate and assign D&D-style stats and a class to each member based on the collective answers.
9.  **FR9**: The final party results, including stats and classes for all members, shall only be visible after all members have completed their questions.
10. **FR10**: The system must provide a shareable invite link or the code for others to join the party.
11. **FR11**: Party members will be able to propose one or more "adventurer names" for every other member in the party.
12. **FR12**: The Party Leader serves only to create the initial party and act as a tie-breaker in split voting decisions; leader does not select final adventurer names.
13. **FR13**: Users will earn Experience Points (EXP) for answering questions, which will be displayed on their profile.
14. **FR14**: Party members can nominate "hirelings"—non-participating individuals—to be included in the party. Hirelings do not answer questions but can be assessed by other members.
15. **FR15**: Party members can suggest renames for the party name, triggering a voting event where other members can vote on the new name or propose alternatives.
16. **FR16**: Provide a direct Join Party URL for easier sharing, available to quickly copy/paste with a single click from within the party screen.
17. **FR17**: Save preferred names for authenticated users and auto-fill them for future use.
18. **FR18**: Prevent duplicate email requests for returning users who have already provided their email for a given party.
19. **FR19**: Implement special invite processes for email and Discord integration.
20. **FR20**: Allow voting to turn invitees into "hirelings" or remove them from the party to proceed.

### Non-Functional Requirements

1.  **NFR1**: The application must be a responsive web application, accessible on modern desktop and mobile browsers.
2.  **NFR2**: All interactions with the Supabase backend must be performed securely over HTTPS.
3.  **NFR3**: The user interface must be intuitive, guiding the user through the process with minimal friction.
4.  **NFR4**: The application's performance must be optimized for fast page loads and quick responses to user input.
5.  **NFR5**: The system must gracefully handle concurrent voting from multiple users within the same party, ensuring data integrity.


### 3. User Interface Design Goals

#### Overall UX Vision

The user experience should feel like a fun, lightweight party game. It should be engaging, intuitive, and quick to complete. The design should encourage a sense of discovery and friendly competition as users vote on each other's traits. The final reveal of the party's stats should be a climactic, shareable moment.

#### Key Interaction Paradigms

*   **Wizard-style Flow**: Guide users step-by-step through party creation, joining, and answering questions.
*   **Card-based Questions**: Present questions one at a time in a card format that is easy to interact with on both mobile and desktop.
*   **Real-time Progress**: Show users how many people in the party have completed their questions to build anticipation for the final reveal.

#### Core Screens and Views

*   **Landing/Entry Screen**: A simple screen with two clear options: "Create a Party" or "Join a Party" (with a field for the 6-letter code).
*   **Party Creation Screen**: A form to name the party, optionally set an initial motto, and add members' names and optional emails.
*   **Questionnaire Screen**: The main interface for answering questions about oneself and others.
*   **Waiting/Lobby Screen**: A screen shown after a user finishes their questions, displaying who has and has not yet voted.
*   **Results/Party View Screen**: The final screen displaying the "character sheets" for all party members with their generated stats, class, and EXP.

#### Accessibility: WCAG AA

We will aim for WCAG 2.1 Level AA compliance to ensure the application is usable by people with a wide range of disabilities.

#### Branding

The branding should be playful and modern, with a visual theme that hints at fantasy and adventure without being overly complex or "nerdy." The tone should be lighthearted and fun.

#### Target Device and Platforms: Web Responsive

The application must work seamlessly across all modern web browsers on desktop, tablet, and mobile devices.


### 4. Technical Assumptions

#### Repository Structure: Polyrepo

The project will be contained within a single, dedicated Git repository. This is the simplest approach for a standalone frontend application.

#### Service Architecture: Serverless (BaaS)

The application will utilize a Backend-as-a-Service (BaaS) model, with all backend logic and data persistence handled by the existing Supabase project (`avoros`). The frontend will communicate directly with Supabase APIs.

#### Testing Requirements: Deferred
 
*   **Testing Deferral**: Per the project sponsor's directive on 2025-07-11, all unit and integration testing will be deferred until after the initial MVP release.
*   **Rationale**: This decision was made to accelerate the initial deployment and validate the core product concept with users as quickly as possible.
*   **Risk**: This introduces a higher risk of bugs and regressions in the initial release. A dedicated testing and stabilization phase will be required post-launch.

#### Additional Technical Assumptions and Requests

*   **Frontend Framework**: **React** (with a framework like Next.js or Vite) is recommended.
    *   *Rationale*: React has a massive ecosystem, excellent community support, and a vast number of pre-built components and libraries, which aligns with our goal of rapid development. Frameworks like Next.js offer features like server-side rendering and routing out-of-the-box, which can simplify development.
*   **Deployment Target**: **Vercel** or **Netlify**.
    *   *Rationale*: Both platforms offer seamless, Git-based deployment workflows for modern frontend applications, with generous free tiers and excellent integration with frameworks like Next.js. This supports our goal of rapid, easy deployment.
*   **Backend Interaction**: The official `supabase-js` client library will be used for all communication with the Supabase backend.
    *   *Rationale*: Using the official library is the most reliable and well-supported method for interacting with Supabase, providing features like authentication, real-time subscriptions, and data access.


### 5. Epic List

*   **Epic 1: Foundation & Party Management**: Establish the project foundation and implement the core user flows for creating and joining a party. This epic delivers the initial framework and gets users into the game.
*   **Epic 2: The Questionnaire Engine**: Develop the full question-and-answer experience, including the UI for presenting questions, capturing user input for themselves and others, and tracking completion status. This epic delivers the core "gameplay" loop.
*   **Epic 3: The Big Reveal & Results**: Implement the logic for calculating stats and classes based on user input and build the final results screen where the entire party's "character sheets" are displayed. This epic delivers the final payoff and the shareable result.
*   **Epic 4: UI Modernization & Polish**: A post-MVP epic to transform the application's visual design into a modern, polished user experience.


### 6. Epic 1: Foundation & Party Management

**Epic Goal**: This epic focuses on establishing the foundational frontend project and implementing the core user flows for creating a new party and joining an existing one. By the end of this epic, users will be able to initiate a "Friend Party," invite others with a unique code, and land in a waiting area, setting the stage for the questionnaire.

#### Story 1.1: Project Foundation Setup

*   **Story**: As a Developer, I want a new React project initialized with basic dependencies and folder structure, so that I can begin building the application efficiently.
*   **Acceptance Criteria**:
    1.  A new React project is created using Vite.
    2.  The `supabase-js》 client library is installed as a dependency.
    3.  A basic folder structure (`components`, `pages`, `services`, `styles`) is created.
    4.  A connection to the Supabase project is configured using environment variables.
    5.  The application runs locally without errors.

#### Story 1.2: Landing Page Implementation

*   **Story**: As a new User, I want to see a landing page with clear options to either create a new party or join an existing one, so that I can easily start the experience.
*   **Acceptance Criteria**:
    1.  The landing page displays the application name, "Friend Party".
    2.  A "Create Party" button is prominently displayed.
    3.  An input field for a 6-letter party code is displayed.
    4.  A "Join Party" button is displayed, enabled only when the input field contains 6 characters.

#### Story 1.3: Create Party Flow

*   **Story**: As a Party Creator, I want to create a new party, so that I can get a unique code to share with my friends.
*   **Acceptance Criteria**:
    1.  Clicking "Create Party" navigates the user to a party creation screen.
    2.  Upon submission, a new record is created in the `parties》 table in Supabase with a unique, randomly generated 6-letter code.
    3.  The creator is automatically added as the first member and designated as the "Party Leader".
    4.  After successful creation, the user is redirected to the Lobby, and the party code is displayed.

#### Story 1.4: Join Party Flow

*   **Story**: As a User, I want to join an existing party using a code, so that I can participate with my friends.
*   **Acceptance Criteria》:
    1.  On the landing page, a user enters a 6-letter code and clicks "Join Party".
    2.  The application queries the Supabase `parties》 table to find a party with a matching code.
    3.  If the code is valid, the user is prompted to enter their name and is added as a member to the party in Supabase.
    4.  If the code is invalid, an error message is displayed.
    5.  After successfully joining, the user is redirected to the Lobby screen.

#### Story 1.5: Lobby/Waiting Screen

*   **Story》: As a Party Member, I want to see who has joined the party while I wait for everyone to be ready, so that I know the status of the game.
*   **Acceptance Criteria》:
    1.  The Lobby screen displays the Party Name, the current Party Motto, and the unique Party Code.
    2.  A list of all party members is displayed with their status (e.g., "Joined").
    3.  The view updates in real-time as new members join, using Supabase real-time subscriptions.

#### Story 1.6: Propose Adventurer Names
*   **Story》: As a Party Member, I want to propose cool adventurer names for my friends, so that we can have fun creating our party's identity.
*   **Acceptance Criteria》:
    1.  In the Lobby screen, there is a section next to each member's name to view and propose adventurer names.
    2.  A user can submit one or more name suggestions for every other member.
    3.  Proposed names are visible to all party members in the lobby in real-time.
    4.  Final adventurer names are determined via party voting; the leader does not directly select names.


### 7. Epic 2: The Questionnaire Engine

**Epic Goal》: This epic delivers the core interactive experience of "Friend Party." It focuses on building the entire questionnaire flow, from presenting questions to capturing user answers about themselves and their friends. By the end of this epic, the application will have a functional "game" loop, and all the data needed for the final results will be collected.

#### Story 2.1: Question Data Model & Seeding

*   **Story》: As a Developer, I need a way to store and retrieve questions, so that the application can display them to users.
*   **Acceptance Criteria》:
    1.  A `questions》 table is created in Supabase with columns for the question text and question type (e.g., 'self-assessment', 'peer-assessment').
    2.  A seed script is created to populate the `questions》 table with an initial set of 10-15 questions.
    3.  The application can successfully fetch all questions from the Supabase table.

#### Story 2.2: Self-Assessment Questionnaire

*   **Story》: As a Party Member, I want to answer questions about myself, so that I can establish my baseline personality profile.
*   **Acceptance Criteria》:
    1.  After joining a party, the user is presented with a series of 'self-assessment' questions fetched from the database.
    2.  The UI presents one question at a time in a clear, card-based format.
    3.  User answers are saved to an `answers》 table in Supabase, linked to the user and the specific question.
    4.  Upon completing the last question, the user is automatically advanced to the peer-assessment step.

#### Story 2.3: Peer-Assessment Questionnaire

*   **Story》: As a Party Member, I want to answer questions about my fellow party members, so that I can contribute to the group's perception of their stats.
*   **Acceptance Criteria》:
    1.  After the self-assessment, the user is presented with a series of 'peer-assessment' questions.
    2.  For each question, the user must provide an answer for every *other* member of the party.
    3.  The UI allows the user to easily cycle through party members to answer the same question for each of them.
    4.  All answers are saved to the `answers》 table, linked to the voting user, the subject user, and the question.
    5.  Upon completion, the user is taken to the Lobby/Waiting screen.

#### Story 2.4: Update Lobby with Voting Status

*   **Story》: As a Party Member in the lobby, I want to see who has finished answering their questions, so that I know when the results will be ready.
*   **Acceptance Criteria》:
    1.  A `status》 field is added to the `party_members》 table in Supabase (e.g., 'Joined', 'Voting', 'Finished').
    2.  The user's status is updated to 'Finished' in the database after they complete the peer-assessment.
    3.  The Lobby screen now displays the current status for each party member.
    4.  The status updates in real-time for all connected clients.


#### Story 2.5: Propose and Vote on Party Motto

*   **Story》: As a Party Member, I want to propose and vote on a motto for our party, so that we can collectively define our group's identity.
*   **Acceptance Criteria》:
    1.  During the peer-assessment phase, a section is available for proposing a party motto.
    2.  All party members can submit one or more motto proposals.
    3.  All proposed mottos are displayed for voting.
    4.  Each party member can cast one vote for their favorite motto.
    5.  The motto with the most votes becomes the official Party Motto and is displayed in the lobby and on the final results screen.
    6.  In the case of a tie, the Party Leader acts as final decision maker per party morale rules (see FR21–FR23).


#### Story 2.6: Add and Assess Hirelings

*   **Story》: As a Party Member, I want to add a "hireling" to the party, so that we can include friends who aren't present in the fun.
*   **Acceptance Criteria》:
    1.  In the Lobby, there is an option to "Add a Hireling".
    2.  Any party member can add a hireling by providing a name.
    3.  Hirelings are displayed in the party list with a distinct visual indicator (e.g., a "Hireling" tag).
    4.  Hirelings skip the self-assessment step.
    5.  During the peer-assessment phase, hirelings appear as subjects for all questions, just like regular members.
    6.  For calculation purposes, a hireling's self-assessment data is pre-filled with a neutral baseline (e.g., all stats are average).


### 8. Epic 3: The Big Reveal & Results

**Epic Goal》: This epic delivers the final, shareable payoff for the "Friend Party" experience. It covers the logic for calculating the D&D-style stats and classes from the collected answers and presenting them in a fun, engaging "character sheet" format. By the end of this epic, the core gameplay loop will be complete, and the MVP will be feature-complete.

#### Story 3.1: Results Calculation Logic

*   **Story》: As a Developer, I need to implement the logic that calculates a user's final stats and class based on the collected answers, so that the results can be displayed.
*   **Acceptance Criteria》:
    1.  A Supabase Edge Function or client-side script is created to process the data from the `answers》 table.
    2.  The logic aggregates all self-assessment and peer-assessment answers for each user.
    3.  A defined algorithm translates the aggregated answers into D&D-style stats (e.g., Strength, Dexterity, Charisma).
    4.  A defined algorithm assigns a D&D class (e.g., Bard, Fighter, Wizard) based on the final stats.
    5.  The calculated stats and class are saved to the `party_members》 table for each user.
*   **Status**: Completed
*   **Notes**:
    - Tunables centralized in [supabase/functions/calculate-results/index.ts](supabase/functions/calculate-results/index.ts:66): PEER_SCALE=5, PEER_CLAMP=5, DEFAULT_BASELINE and NPC_BASELINE defined; comments added for calibration.
    - Added sparse-data guards per stat and enriched debug inserts (peer_points, raters, scale, clamp) to `debug_stat_changes` for QA.
    - Normalization continues to use unique non-NPC raters per subject and questions-per-stat denominator; adjustments are scaled and clamped.

#### Story 3.2: Automatic Results Trigger

*   **Story》: As a Party Member, I want the results to be automatically calculated and revealed once the last person has finished their questions, so that we can all see them at the same time.
*   **Acceptance Criteria》:
    1.  The system can detect when all members in a party have a status of 'Finished'.
    2.  When the last member's status changes to 'Finished', the results calculation logic from Story 3.1 is automatically triggered.
    3.  After calculation is complete, the overall party status is updated to 'ResultsReady'.
    4.  The Lobby screen automatically navigates all connected users to the Results Screen when the party status becomes 'ResultsReady'.
*   **Status**: Completed
*   **Notes**:
    - Auto-trigger implemented in [friend-party-app/src/app/api/party/[code]/finish-questionnaire/route.ts](friend-party-app/src/app/api/party/%5Bcode%5D/finish-questionnaire/route.ts:1) which sets `Results` and invokes the Edge function; the function then sets `ResultsReady`.
    - Lobby auto-navigation implemented via realtime subscription in [friend-party-app/src/app/party/[code]/page.tsx](friend-party-app/src/app/party/%5Bcode%5D/page.tsx:176).

#### Story 3.3: Results Display Screen

*   **Story》: As a Party Member, I want to see a fun, visually appealing "character sheet" for each member of my party, so that I can see how the group perceived everyone.
*   **Acceptance Criteria》:
    1.  A new Results Screen is created.
    2.  The screen displays a "character sheet" for each party member.
    3.  Each sheet clearly shows the member's name, their assigned D&D class, and their final stats.
    4.  The layout is easy to read and visually engaging.
*   **Status**: Completed
*   **Notes**:
    - Polished layout with class badge, EXP badge, and compact stats grid in [friend-party-app/src/app/party/[code]/results/page.tsx](friend-party-app/src/app/party/%5Bcode%5D/results/page.tsx:299).

#### Story 3.4: Share Results

*   **Story》: As a Party Member, I want to be able to easily share a link to our party's results, so that I can show them off to others.
*   **Acceptance Criteria》:
    1.  The Results Screen has a "Share" button.
    2.  Clicking the button copies a unique, public URL for the party's results page to the user's clipboard.
    3.  Anyone with the link can view a read-only version of the Results Screen.
*   **Status**: Completed
*   **Notes**:
    - Added “Copy Public Results Link” which appends `view=public` and copies to clipboard in [friend-party-app/src/app/party/[code]/results/page.tsx](friend-party-app/src/app/party/%5Bcode%5D/results/page.tsx:299). The page displays a “Public, read-only view” indicator when active.

#### Story 3.5: Display EXP on Profiles

*   **Story》: As a Party Member, I want to see the EXP I and others have earned, so that there is a fun, simple progression system.
*   **Acceptance Criteria》:
    1.  The results calculation logic also calculates EXP earned by each user.
    2.  A user's total EXP is displayed on their "character sheet" on the Results Screen.
    3.  The EXP has no gameplay function but serves as a cosmetic indicator of participation.


### 9. Party Morale and Leader Vote Weighting

#### New Functional Requirements
21. **FR21**: The system must maintain a Party Morale score for each party, updated over time based on member participation signals (e.g., completion rates, proposal/vote engagement, and simple sentiment toggles).
22. **FR22**: Leader tie-break behavior must be modulated by Party Morale:
    - When morale is high (at or above a defined threshold), the Leader’s tie-breaking vote is counted positively toward their chosen option.
    - When morale is low (below the threshold), the Leader’s tie-breaking vote is applied negatively against their chosen option, flipping the tie in favor of the opposing option.
23. **FR23**: Party Morale must be surfaced in the Lobby and Results views with a simple indicator (e.g., Low/Neutral/High) and an info tooltip explaining the impact on tie-breaks.
24. **FR24**: The morale threshold(s) and weighting behavior must be tunable constants.

#### Implementation Notes
- A simple morale computation can be derived from normalized participation metrics:
  - e.g., morale = weighted_sum(completion_rate, voting_rate, proposal_rate) with clamping [0..1].
- Tunables to define:
  - MORALE_HIGH_THRESHOLD (e.g., 0.66), MORALE_LOW_THRESHOLD (e.g., 0.33)
  - Optional hysteresis to avoid rapid flipping.
- For tie-scenarios (e.g., 2v2), apply FR22 to decide final outcome.

### 10. Epic 4: UI Modernization & Polish

**Epic Goal》: This epic is dedicated to transforming the application's visual design from a functional, proof-of-concept MVP to a modern, polished, and highly engaging user experience. This work will be undertaken after the core functionality of Epics 1-3 is complete and validated.

#### Story 4.1: Modern UI Implementation

*   **Story》: As a User, I want the application to have a visually appealing, modern design with improved aesthetics, so that the experience is more enjoyable, professional, and memorable.
*   **Acceptance Criteria》:
    1.  The application's color palette, typography, and spacing are updated based on a professional design system or style guide.
    2.  All UI components (buttons, inputs, cards, etc.) are redesigned to have a modern look and feel that is consistent across the application.
    3.  Subtle micro-interactions and animations are added to enhance user feedback and create a more dynamic experience.
    4.  The overall layout of all screens is refined to improve visual hierarchy, readability, and aesthetic appeal.

#### Story 4.2: Add Discord Login Option

*   **Story》: As a User, I want to be able to log in or sign up using my Discord account, so that I can join a party more quickly without creating a new account.
*   **Acceptance Criteria》:
    1.  A "Login with Discord" button is added to the landing page.
    2.  Clicking the button initiates the Supabase OAuth flow for Discord.
    3.  Upon successful authentication, the user is logged into the application.
    4.  If it's a new user, a corresponding record is created in the `auth.users》 table.
    5.  The user's Discord username and avatar are available to be used within the application.


### 11. Checklist Results Report

**Overall PRD Completeness》: 96%
**MVP Scope Appropriateness》: Just Right
**Readiness for Architecture Phase》: Ready**

**Executive Summary》: The PRD for "Friend Party" remains comprehensive and aligned with the implemented MVP scope. Recent implementation completed Story 3.2 (Automatic Results Trigger): when all non-NPC members finish peer assessment, the system automatically triggers results calculation, updates party status to Results/ResultsReady, and lobby clients auto-navigate to the Results screen via realtime subscription. Remaining ambiguity is limited to detailed weighting nuances for Story 3.1, which are acceptable for MVP given current implementation.**

| Category | Status | Critical Issues |
| :--- | :--- | :--- |
| 1. Problem Definition & Context | PASS | None |
| 2. MVP Scope Definition | PASS | None |
| 3. User Experience Requirements | PASS | None |
| 4. Functional Requirements | PASS | None |
| 5. Non-Functional Requirements | PASS | None |
| 6. Epic & Story Structure | PASS | None |
| 7. Technical Guidance | PASS | None |
| 8. Cross-Functional Requirements | PASS | None |
| 9. Clarity & Communication | PASS | None |

Implementation Notes (MVP delta):
- Story 3.2 implemented:
  - Backend triggers calculation and sets party status to Results/ResultsReady.
  - Frontend lobby listens to party status changes and auto-navigates to Results.
- Results calculation function persists final stats, class, and EXP and sets ResultsReady.

**Recommendations》:
- High Priority: Validate Story 3.1 final algorithm against sample parties. The current logic aggregates self baselines (including NPC baselines) and normalizes peer votes by unique non-NPC raters per subject.
- Medium Priority: UX review for Results and Lobby transitions.

**Final Decision》: READY – continue with next PRD story implementation**


### 12. Next Steps

This document is now ready for the next phase of the project. The following prompts should be used to engage the appropriate specialist agents.

#### UX Expert Prompt

"Using the attached Product Requirements Document (`docs/prd.md`), please initiate the `create-doc` task to develop the UI/UX Specification for the 'Friend Party' application. Pay close attention to the User Interface Design Goals (Section 3) and the defined user flows within the epics."

#### Architect Prompt

"Using the attached Product Requirements Document (`docs/prd.md`), please initiate the `create-doc` task to develop the Frontend Architecture Document for the 'Friend Party' application. Adhere to the Technical Assumptions (Section 4) and ensure the architecture supports all defined functional requirements and stories."

## 13. Release Preparation

### File Cleanup and Optimization

*   **Task》: As part of the pre-release checklist, perform a comprehensive cleanup of the project directories.
*   **Description》: Recursively check the `friend-party-app` directory and the root project directory (`/Users/patrick/Documents/VS Projects/FriendParty`) for actively used or needed files. Identify and remove any excess, unused, or redundant files to optimize the project size and maintain a clean file structure.
*   **Rationale》: The file structure has become disorganized during development, and a thorough cleanup is essential to ensure a lean, efficient, and maintainable codebase for the final release.
*   **Acceptance Criteria》:
    1.  All files within `friend-party-app` and the root project directory are reviewed for necessity.
    2.  Unused or redundant files are safely removed.
    3.  The project's overall footprint is reduced without impacting functionality.

## 14. Appendix: Database Schema Alignment for Party Motto Proposals

Context
- Party motto schema unified to the “New” model across code and database:
  - Canonical: `party_motto_proposals` (proposed_by_member_id, text, vote_count, is_finalized, active) and `party_motto_votes`
  - `init.sql` and APIs updated; no legacy-column fallbacks remain

Problem
- Environments initialized with init.sql create the legacy columns, while environments applying the newer migration expect the new columns.
- This mismatch causes API runtime errors if the code assumes only one variant.

Interim Solution Implemented
- API routes support both schemas:
  - Inserts attempt the new columns first; if PostgREST returns PGRST204 (missing column), fall back to legacy columns.
  - Reads select with aliases and normalize to a unified shape for the frontend.

Unification Status
- New schema adopted and applied in APIs (`propose-motto`, `vote-motto`, `mottos`, `finalize-motto`).
- `init.sql` defines normalized tables and RLS; triggers maintain `vote_count`.

Operational Notes
1) Ensure migration execution in non-local environments
   - Run `20250731160000_add_party_motto_proposals_and_votes.sql`.

2) If an environment still has legacy columns, apply ALTERs accordingly
   - Example: `ALTER TABLE public.party_motto_proposals RENAME COLUMN proposing_member_id TO proposed_by_member_id;`
     - ALTER TABLE public.party_motto_proposals RENAME COLUMN proposed_motto TO text;
     - ALTER TABLE public.party_motto_proposals RENAME COLUMN votes TO vote_count;
     - ALTER TABLE public.party_motto_proposals ADD COLUMN IF NOT EXISTS is_finalized BOOLEAN NOT NULL DEFAULT FALSE;
     - ALTER TABLE public.party_motto_proposals ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE;

3) Update RLS policies
   - Replace references to proposing_member_id with proposed_by_member_id in policies.

4) Update init.sql
   - Make party_motto_proposals match the new schema and remove duplicate/legacy DO blocks.

5) Clean up compatibility code
   - Once all environments are unified, remove dual-path insert/select logic from:
     - [friend-party-app/src/app/api/party/[code]/propose-motto/route.ts](friend-party-app/src/app/api/party/%5Bcode%5D/propose-motto/route.ts:1)
     - [friend-party-app/src/app/api/party/[code]/mottos/route.ts](friend-party-app/src/app/api/party/%5Bcode%5D/mottos/route.ts:1)

Acceptance Criteria for “Unified Schema Done”
- All environments accept/return the new column names without fallback.
- init.sql and migrations are consistent and idempotent for the new schema.
- API routes no longer contain legacy fallbacks for party_motto_proposals.
