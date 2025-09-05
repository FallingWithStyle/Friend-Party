# Friend Party Product Requirements Document (PRD)

## Project Metadata
- **Project Name**: Friend Party
- **Project ID**: FP-001
- **Version**: 2.0
- **Last Updated**: August 31, 2025
- **Status**: In Progress

## 1. Executive Summary
- **Problem Statement**: Friends want a fun, engaging way to see how they perceive each other through gamified personality profiling using D&D-style stats and classes.
- **Solution Overview**: A lightweight social web application where users create parties, answer questionnaires about themselves and each other, and receive calculated D&D-style character sheets based on collective input.
- **Key Benefits**: Quick social interaction, gamified personality insights, shareable results, and a fun group bonding experience.
- **Success Metrics**: User engagement, party completion rates, social sharing, and positive user feedback on the experience.

## 2. Goals and Background Context
- **Primary Goals**: 
  - Allow users to create and join "parties" of friends
  - Gather user opinions through questionnaires
  - Generate D&D-style stats and classes based on collective input
  - Provide a fun, engaging way for friends to see how they perceive each other
  - Achieve rapid MVP deployment to validate the core concept
- **Background Context**: "Friend Party" is a lightweight social web application designed for quick, fun interactions between friends. The core idea is to gamify personality profiling within a friend group, using the familiar framework of D&D stats and classes. Users collaboratively "vote" on each other's traits by answering a series of questions, creating a shared, humorous, and insightful look at their group dynamics.
- **Stakeholders**: Development team, end users (friend groups), project sponsors
- **Timeline**: MVP completed, ongoing enhancements and polish

## 3. Requirements
### 3.1 Functional Requirements
- **FR1**: A user must be able to create a new "Party" which generates a unique, shareable 6-letter code.
- **FR2**: A user must be able to join an existing Party by entering its 6-letter code.
- **FR3**: The Party creator must be able to add members to the Party by providing their names.
- **FR4**: The Party creator can optionally provide an email address for each member.
- **FR5**: The system must identify the Party creator as the "Party Leader".
- **FR6**: Once in a Party, a user must answer a series of questions about themselves to establish baseline stats.
- **FR7**: A user must answer a series of questions about their fellow party members to vote on their stats.
- **FR8**: The system shall calculate and assign D&D-style stats and a class to each member based on the collective answers.
- **FR9**: The final party results, including stats and classes for all members, shall only be visible after all members have completed their questions.
- **FR10**: The system must provide a shareable invite link or the code for others to join the party.
- **FR11**: Party members will be able to propose one or more "adventurer names" for every other member in the party.
- **FR12**: The Party Leader serves only to create the initial party and act as a tie-breaker in split voting decisions; leader does not select final adventurer names.
- **FR13**: Users will earn Experience Points (EXP) for answering questions, which will be displayed on their profile.
- **FR14**: Party members can nominate "hirelings"—non-participating individuals—to be included in the party. Hirelings do not answer questions but can be assessed by other members.
- **FR15**: Party members can suggest renames for the party name, triggering a voting event where other members can vote on the new name or propose alternatives.
- **FR16**: Provide a direct Join Party URL for easier sharing, available to quickly copy/paste with a single click from within the party screen.
- **FR17**: Save preferred names for authenticated users and auto-fill them for future use.
- **FR18**: Prevent duplicate email requests for returning users who have already provided their email for a given party.
- **FR19**: Implement special invite processes for email and Discord integration.
- **FR20**: Allow voting to turn invitees into "hirelings" or remove them from the party to proceed.
- **FR21**: The system must maintain a Party Morale score for each party, updated over time based on member participation signals.
- **FR22**: Leader tie-break behavior must be modulated by Party Morale (positive when high, negative when low).
- **FR23**: Party Morale must be surfaced in the Lobby and Results views with a simple indicator and info tooltip.
- **FR24**: The morale threshold(s) and weighting behavior must be tunable constants.

### 3.2 Non-Functional Requirements
- **NFR1**: The application must be a responsive web application, accessible on modern desktop and mobile browsers.
- **NFR2**: All interactions with the Supabase backend must be performed securely over HTTPS.
- **NFR3**: The user interface must be intuitive, guiding the user through the process with minimal friction.
- **NFR4**: The application's performance must be optimized for fast page loads and quick responses to user input.
- **NFR5**: The system must gracefully handle concurrent voting from multiple users within the same party, ensuring data integrity.

## 4. User Experience
- **Target Users**: Friend groups looking for fun social interactions, D&D enthusiasts, people interested in personality profiling
- **User Stories**: 
  - As a user, I want to create a party and invite friends to join
  - As a user, I want to answer questions about myself and my friends
  - As a user, I want to see the final D&D-style character sheets for everyone
  - As a user, I want to share our party results with others
- **User Interface Requirements**: 
  - Wizard-style flow for party creation and joining
  - Card-based questions presentation
  - Real-time progress updates
  - Responsive design for mobile and desktop
  - WCAG 2.1 Level AA compliance
  - Playful, modern branding with fantasy/adventure hints

## 5. Technical Specifications
- **Technology Stack**: React with Next.js, Supabase backend, TypeScript, Tailwind CSS
- **Architecture**: Single-page application with serverless backend (BaaS model using Supabase)
- **Integration Points**: Supabase database, authentication, real-time subscriptions, Edge Functions
- **Deployment**: Vercel or Netlify with Git-based deployment workflows

## 6. Epics and Stories
### Epic 1: Foundation & Party Management
**Goal**: Establish the project foundation and implement the core user flows for creating and joining a party.

#### Story 1.1: Project Foundation Setup
- **User Story**: As a Developer, I want a new React project initialized with basic dependencies and folder structure, so that I can begin building the application efficiently.
- **Acceptance Criteria**:
  - AC1: A new React project is created using Vite
  - AC2: The `supabase-js` client library is installed as a dependency
  - AC3: A basic folder structure (`components`, `pages`, `services`, `styles`) is created
  - AC4: A connection to the Supabase project is configured using environment variables
  - AC5: The application runs locally without errors
- **Technical Notes**: Project foundation setup with Vite and Supabase integration
- **Dependencies**: None

#### Story 1.2: Landing Page Implementation
- **User Story**: As a new User, I want to see a landing page with clear options to either create a new party or join an existing one, so that I can easily start the experience.
- **Acceptance Criteria**:
  - AC1: The landing page displays the application name, "Friend Party"
  - AC2: A "Create Party" button is prominently displayed
  - AC3: An input field for a 6-letter party code is displayed
  - AC4: A "Join Party" button is displayed, enabled only when the input field contains 6 characters
- **Technical Notes**: Landing page with clear call-to-action buttons
- **Dependencies**: Story 1.1

#### Story 1.3: Create Party Flow
- **User Story**: As a Party Creator, I want to create a new party, so that I can get a unique code to share with my friends.
- **Acceptance Criteria**:
  - AC1: Clicking "Create Party" navigates the user to a party creation screen
  - AC2: Upon submission, a new record is created in the `parties` table in Supabase with a unique, randomly generated 6-letter code
  - AC3: The creator is automatically added as the first member and designated as the "Party Leader"
  - AC4: After successful creation, the user is redirected to the Lobby, and the party code is displayed
- **Technical Notes**: Party creation with unique code generation and database persistence
- **Dependencies**: Story 1.2

#### Story 1.4: Join Party Flow
- **User Story**: As a User, I want to join an existing party using a code, so that I can participate with my friends.
- **Acceptance Criteria**:
  - AC1: On the landing page, a user enters a 6-letter code and clicks "Join Party"
  - AC2: The application queries the Supabase `parties` table to find a party with a matching code
  - AC3: If the code is valid, the user is prompted to enter their name and is added as a member to the party in Supabase
  - AC4: If the code is invalid, an error message is displayed
  - AC5: After successfully joining, the user is redirected to the Lobby screen
- **Technical Notes**: Party joining with code validation and member addition
- **Dependencies**: Story 1.2

#### Story 1.5: Lobby/Waiting Screen
- **User Story**: As a Party Member, I want to see who has joined the party while I wait for everyone to be ready, so that I know the status of the game.
- **Acceptance Criteria**:
  - AC1: The Lobby screen displays the Party Name, the current Party Motto, and the unique Party Code
  - AC2: A list of all party members is displayed with their status (e.g., "Joined")
  - AC3: The view updates in real-time as new members join, using Supabase real-time subscriptions
- **Technical Notes**: Real-time lobby with member status tracking
- **Dependencies**: Story 1.3, Story 1.4

#### Story 1.6: Propose Adventurer Names
- **User Story**: As a Party Member, I want to propose cool adventurer names for my friends, so that we can have fun creating our party's identity.
- **Acceptance Criteria**:
  - AC1: In the Lobby screen, there is a section next to each member's name to view and propose adventurer names
  - AC2: A user can submit one or more name suggestions for every other member
  - AC3: Proposed names are visible to all party members in the lobby in real-time
  - AC4: Final adventurer names are determined via party voting; the leader does not directly select names
- **Technical Notes**: Adventurer name proposal and voting system
- **Dependencies**: Story 1.5

### Epic 2: The Questionnaire Engine
**Goal**: Deliver the core interactive experience of "Friend Party" with the complete questionnaire flow.

#### Story 2.1: Question Data Model & Seeding
- **User Story**: As a Developer, I need a way to store and retrieve questions, so that the application can display them to users.
- **Acceptance Criteria**:
  - AC1: A `questions` table is created in Supabase with columns for the question text and question type (e.g., 'self-assessment', 'peer-assessment')
  - AC2: A seed script is created to populate the `questions` table with an initial set of 10-15 questions
  - AC3: The application can successfully fetch all questions from the Supabase table
- **Technical Notes**: Database schema for questions and seeding script
- **Dependencies**: Epic 1 completion

#### Story 2.2: Self-Assessment Questionnaire
- **User Story**: As a Party Member, I want to answer questions about myself, so that I can establish my baseline personality profile.
- **Acceptance Criteria**:
  - AC1: After joining a party, the user is presented with a series of 'self-assessment' questions fetched from the database
  - AC2: The UI presents one question at a time in a clear, card-based format
  - AC3: User answers are saved to an `answers` table in Supabase, linked to the user and the specific question
  - AC4: Upon completing the last question, the user is automatically advanced to the peer-assessment step
- **Technical Notes**: Self-assessment questionnaire with card-based UI
- **Dependencies**: Story 2.1

#### Story 2.3: Peer-Assessment Questionnaire
- **User Story**: As a Party Member, I want to answer questions about my fellow party members, so that I can contribute to the group's perception of their stats.
- **Acceptance Criteria**:
  - AC1: After the self-assessment, the user is presented with a series of 'peer-assessment' questions
  - AC2: For each question, the user must provide an answer for every *other* member of the party
  - AC3: The UI allows the user to easily cycle through party members to answer the same question for each of them
  - AC4: All answers are saved to the `answers` table, linked to the voting user, the subject user, and the question
  - AC5: Upon completion, the user is taken to the Lobby/Waiting screen
- **Technical Notes**: Peer-assessment questionnaire with member cycling
- **Dependencies**: Story 2.2

#### Story 2.4: Update Lobby with Voting Status
- **User Story**: As a Party Member in the lobby, I want to see who has finished answering their questions, so that I know when the results will be ready.
- **Acceptance Criteria**:
  - AC1: A `status` field is added to the `party_members` table in Supabase (e.g., 'Joined', 'Voting', 'Finished')
  - AC2: The user's status is updated to 'Finished' in the database after they complete the peer-assessment
  - AC3: The Lobby screen now displays the current status for each party member
  - AC4: The status updates in real-time for all connected clients
- **Technical Notes**: Real-time status tracking for questionnaire completion
- **Dependencies**: Story 2.3

#### Story 2.5: Propose and Vote on Party Motto
- **User Story**: As a Party Member, I want to propose and vote on a motto for our party, so that we can collectively define our group's identity.
- **Acceptance Criteria**:
  - AC1: During the peer-assessment phase, a section is available for proposing a party motto
  - AC2: All party members can submit one or more motto proposals
  - AC3: All proposed mottos are displayed for voting
  - AC4: Each party member can cast one vote for their favorite motto
  - AC5: The motto with the most votes becomes the official Party Motto and is displayed in the lobby and on the final results screen
  - AC6: In the case of a tie, the Party Leader acts as final decision maker per party morale rules
- **Technical Notes**: Party motto proposal and voting system with tie-breaking
- **Dependencies**: Story 2.3

#### Story 2.6: Add and Assess Hirelings
- **User Story**: As a Party Member, I want to add a "hireling" to the party, so that we can include friends who aren't present in the fun.
- **Acceptance Criteria**:
  - AC1: In the Lobby, there is an option to "Add a Hireling"
  - AC2: Any party member can add a hireling by providing a name
  - AC3: Hirelings are displayed in the party list with a distinct visual indicator (e.g., a "Hireling" tag)
  - AC4: Hirelings skip the self-assessment step
  - AC5: During the peer-assessment phase, hirelings appear as subjects for all questions, just like regular members
  - AC6: For calculation purposes, a hireling's self-assessment data is pre-filled with a neutral baseline
- **Technical Notes**: Hireling system with neutral baseline data
- **Dependencies**: Story 1.5

### Epic 3: The Big Reveal & Results
**Goal**: Deliver the final, shareable payoff for the "Friend Party" experience with calculated results and character sheets.

#### Story 3.1: Results Calculation Logic
- **User Story**: As a Developer, I need to implement the logic that calculates a user's final stats and class based on the collected answers, so that the results can be displayed.
- **Acceptance Criteria**:
  - AC1: A Supabase Edge Function or client-side script is created to process the data from the `answers` table
  - AC2: The logic aggregates all self-assessment and peer-assessment answers for each user
  - AC3: A defined algorithm translates the aggregated answers into D&D-style stats (e.g., Strength, Dexterity, Charisma)
  - AC4: A defined algorithm assigns a D&D class (e.g., Bard, Fighter, Wizard) based on the final stats
  - AC5: The calculated stats and class are saved to the `party_members` table for each user
- **Technical Notes**: Results calculation with tunable parameters and normalization
- **Dependencies**: Story 2.3
- **Status**: Completed

#### Story 3.2: Automatic Results Trigger
- **User Story**: As a Party Member, I want the results to be automatically calculated and revealed once the last person has finished their questions, so that we can all see them at the same time.
- **Acceptance Criteria**:
  - AC1: The system can detect when all members in a party have a status of 'Finished'
  - AC2: When the last member's status changes to 'Finished', the results calculation logic from Story 3.1 is automatically triggered
  - AC3: After calculation is complete, the overall party status is updated to 'ResultsReady'
  - AC4: The Lobby screen automatically navigates all connected users to the Results Screen when the party status becomes 'ResultsReady'
- **Technical Notes**: Auto-trigger system with real-time navigation
- **Dependencies**: Story 3.1
- **Status**: Completed

#### Story 3.3: Results Display Screen
- **User Story**: As a Party Member, I want to see a fun, visually appealing "character sheet" for each member of my party, so that I can see how the group perceived everyone.
- **Acceptance Criteria**:
  - AC1: A new Results Screen is created
  - AC2: The screen displays a "character sheet" for each party member
  - AC3: Each sheet clearly shows the member's name, their assigned D&D class, and their final stats
  - AC4: The layout is easy to read and visually engaging
- **Technical Notes**: Character sheet display with class badges and EXP
- **Dependencies**: Story 3.2
- **Status**: Completed

#### Story 3.4: Share Results
- **User Story**: As a Party Member, I want to be able to easily share a link to our party's results, so that I can show them off to others.
- **Acceptance Criteria**:
  - AC1: The Results Screen has a "Share" button
  - AC2: Clicking the button copies a unique, public URL for the party's results page to the user's clipboard
  - AC3: Anyone with the link can view a read-only version of the Results Screen
- **Technical Notes**: Public sharing with read-only view mode
- **Dependencies**: Story 3.3
- **Status**: Completed

#### Story 3.5: Display EXP on Profiles
- **User Story**: As a Party Member, I want to see the EXP I and others have earned, so that there is a fun, simple progression system.
- **Acceptance Criteria**:
  - AC1: The results calculation logic also calculates EXP earned by each user
  - AC2: A user's total EXP is displayed on their "character sheet" on the Results Screen
  - AC3: The EXP has no gameplay function but serves as a cosmetic indicator of participation
- **Technical Notes**: EXP calculation and display system
- **Dependencies**: Story 3.1
- **Status**: Completed

### Epic 4: UI Modernization & Polish
**Goal**: Transform the application's visual design into a modern, polished, and highly engaging user experience.

#### Story 4.1: Modern UI Implementation
- **User Story**: As a User, I want the application to have a visually appealing, modern design with improved aesthetics, so that the experience is more enjoyable, professional, and memorable.
- **Acceptance Criteria**:
  - AC1: The application's color palette, typography, and spacing are updated based on a professional design system or style guide
  - AC2: All UI components (buttons, inputs, cards, etc.) are redesigned to have a modern look and feel that is consistent across the application
  - AC3: Subtle micro-interactions and animations are added to enhance user feedback and create a more dynamic experience
  - AC4: The overall layout of all screens is refined to improve visual hierarchy, readability, and aesthetic appeal
- **Technical Notes**: UI modernization with design system implementation
- **Dependencies**: Epic 3 completion

#### Story 4.2: Add Discord Login Option
- **User Story**: As a User, I want to be able to log in or sign up using my Discord account, so that I can join a party more quickly without creating a new account.
- **Acceptance Criteria**:
  - AC1: A "Login with Discord" button is added to the landing page
  - AC2: Clicking the button initiates the Supabase OAuth flow for Discord
  - AC3: Upon successful authentication, the user is logged into the application
  - AC4: If it's a new user, a corresponding record is created in the `auth.users` table
  - AC5: The user's Discord username and avatar are available to be used within the application
- **Technical Notes**: Discord OAuth integration with Supabase
- **Dependencies**: Epic 1 completion

#### Story 4.3: Achievement System
- **User Story**: As a User, I want to earn achievements for various activities and milestones, so that I have additional goals and recognition for my participation in parties.
- **Acceptance Criteria**:
  - AC1: An `achievements` table is created with columns for achievement_id, name, description, icon, category, and unlock_conditions
  - AC2: A `user_achievements` table tracks which users have earned which achievements with timestamps
  - AC3: Achievement categories include: Party Participation, Social Interaction, Questionnaire Completion, and Special Events
  - AC4: Users can view their earned achievements on their profile page with visual indicators
  - AC5: Achievement notifications appear when users unlock new achievements during party activities
  - AC6: Achievement progress is tracked and displayed for multi-step achievements
  - AC7: Achievements are automatically awarded based on user actions (completing questionnaires, joining parties, etc.)
- **Technical Notes**: Achievement system with automatic tracking and visual feedback
- **Dependencies**: Epic 1 completion

#### Story 4.4: Avatar System
- **User Story**: As a User, I want to customize my avatar appearance, so that I can express my personality and make my character more unique in parties.
- **Acceptance Criteria**:
  - AC1: An `avatars` table is created with columns for avatar_id, name, category, image_url, and unlock_requirements
  - AC2: A `user_avatars` table tracks which avatars each user owns and their currently selected avatar
  - AC3: Avatar categories include: Base Characters, Accessories, Backgrounds, and Special Effects
  - AC4: Users can browse and select from their owned avatars on their profile page
  - AC5: Selected avatars are displayed next to user names in party lobbies and results screens
  - AC6: Some avatars are unlocked through achievements or special events
  - AC7: Default avatars are available to all users, with premium avatars available through achievements or future monetization
- **Technical Notes**: Avatar customization system with unlockable content
- **Dependencies**: Story 4.3 (Achievement System)
- **Test Coverage Requirements**:
  - TC1: Unit tests for avatar part selection and equipping logic
  - TC2: Integration tests for avatar display in party lobbies and results
  - TC3: API tests for avatar unlock and purchase endpoints
  - TC4: Component tests for avatar editor and selection interfaces
  - TC5: Database tests for avatar part relationships and user ownership

#### Story 4.5: Dragon's Hoard Minigame
- **User Story**: As a User, I want to play a fun minigame called "Dragon's Hoard" to earn bonus rewards and enhance my party experience.
- **Acceptance Criteria**:
  - AC1: A "Dragon's Hoard" minigame is accessible from the main menu or party lobby
  - AC2: The minigame features a treasure collection mechanic where users can find and collect various items
  - AC3: Collected items can be used to unlock special avatar parts, achievements, or party bonuses
  - AC4: The minigame has a simple, engaging interface that works well on both desktop and mobile
  - AC5: Progress in the minigame is saved and persists across sessions
  - AC6: The minigame includes multiple levels or difficulty settings to maintain engagement
  - AC7: Rewards from the minigame integrate with the existing achievement and avatar systems
- **Technical Notes**: Standalone minigame with reward integration into existing systems
- **Dependencies**: Story 4.3 (Achievement System), Story 4.4 (Avatar System)

#### Story 4.6: Changeling Minigame
- **User Story**: As a User, I want to play a "Changeling" minigame that tests my knowledge of my friends, so that I can earn rewards while having fun.
- **Acceptance Criteria**:
  - AC1: A "Changeling" minigame is accessible from the main menu or party lobby
  - AC2: The minigame presents scenarios where users must guess how their friends would respond to various situations
  - AC3: Correct guesses earn points and unlock special rewards or achievements
  - AC4: The minigame uses data from previous party questionnaires to create personalized questions
  - AC5: The interface is intuitive and provides immediate feedback on answers
  - AC6: Scores are tracked and can be compared with other party members
  - AC7: The minigame integrates with the party system to create a social, competitive experience
- **Technical Notes**: Social minigame leveraging existing questionnaire data for personalized content
- **Dependencies**: Epic 2 (Questionnaire Engine), Story 4.3 (Achievement System)

### Epic 5: Early Access Mode
**Goal**: Implement a controlled early access system that allows for user feedback collection while gating premium features during the initial launch phase.

#### Story 5.1: Early Access Feature Flag System
- **User Story**: As a System Administrator, I want to control early access mode globally, so that I can manage the application's launch phase and feature availability.
- **Acceptance Criteria**:
  - AC1: An `early_access.enabled` setting is added to the `app_settings` table (boolean)
  - AC2: An optional `early_access.feedback_destination` setting is added to configure feedback collection method (e.g., 'table', 'email', 'webhook')
  - AC3: The system can read and respect these settings across all application components
  - AC4: Settings can be updated via admin interface or direct database access
- **Technical Notes**: Global feature flag system with configurable feedback collection
- **Dependencies**: Epic 1 completion

#### Story 5.2: Premium Feature Gating
- **User Story**: As a User in Early Access Mode, I want to understand which features are temporarily restricted, so that I know what to expect during the early access period.
- **Acceptance Criteria**:
  - AC1: All premium/paid features are identified and catalogued
  - AC2: When early access is enabled, premium features are hidden or disabled with clear tooltips explaining Early Access restrictions
  - AC3: Server-side enforcement ensures premium features cannot be accessed even if UI is bypassed
  - AC4: Clear messaging indicates when early access mode is active
- **Technical Notes**: Feature gating with both UI and server-side enforcement
- **Dependencies**: Story 5.1

#### Story 5.3: User Feedback Collection System
- **User Story**: As an Early Access User, I want to easily report issues or provide feedback, so that I can help improve the application.
- **Acceptance Criteria**:
  - AC1: A global "Send Feedback" affordance is available (e.g., toolbar button or floating widget)
  - AC2: Feedback form automatically captures: page URL/route, query parameters, party ID/code, member ID, current step/status, `is_npc` flag, browser/User Agent
  - AC3: Users can provide a description and optionally attach a screenshot
  - AC4: An `early_access_feedback` table is created with RLS for secure feedback storage
  - AC5: A `POST /api/feedback` endpoint accepts and persists feedback reports
  - AC6: Admin interface allows browsing and exporting collected feedback
- **Technical Notes**: Comprehensive feedback collection with automatic context capture
- **Dependencies**: Story 5.1

#### Story 5.4: Early Access Mode Management
- **User Story**: As a System Administrator, I want to easily toggle early access mode and manage feedback, so that I can control the application's launch phase effectively.
- **Acceptance Criteria**:
  - AC1: Toggling Early Access ON disables all premium features for all users globally
  - AC2: Feedback submissions include automatic page context and appear in admin view
  - AC3: When Early Access is OFF, full application functionality is restored and feedback UI is hidden
  - AC4: Admin can configure feedback destination (database, email, webhook)
  - AC5: System provides clear status indicators for early access mode state
- **Technical Notes**: Admin controls for early access lifecycle management
- **Dependencies**: Story 5.2, Story 5.3

#### Story 5.5: Test Coverage Improvements
- **User Story**: As a Developer, I want to improve test coverage across the application, so that we can ensure reliability and maintainability as we add new features.
- **Acceptance Criteria**:
  - AC1: Achieve minimum 40% overall test coverage (statements and lines)
  - AC2: Add comprehensive test coverage for avatar system components and APIs
  - AC3: Add test coverage for achievement system functionality
  - AC4: Add integration tests for minigame systems (Dragon's Hoard and Changeling)
  - AC5: Add component tests for all major UI components
  - AC6: Add API tests for all remaining untested endpoints
  - AC7: Fix existing test warnings and improve test reliability
- **Technical Notes**: Comprehensive test coverage improvement focusing on business logic and critical user flows
- **Dependencies**: Epic 4 completion

## 7. Constraints and Assumptions
- **Technical Constraints**: 
  - Single Git repository structure (polyrepo)
  - Supabase backend dependency
  - Testing deferred until post-MVP
  - React/Next.js frontend framework requirement
- **Business Constraints**: 
  - Rapid MVP deployment priority
  - Post-MVP testing and stabilization phase required
- **Assumptions**: 
  - Existing Supabase backend (avoros) will be used
  - Vercel or Netlify deployment target
  - Modern browser compatibility
- **Risks**: 
  - Higher bug risk due to deferred testing
  - Database schema alignment challenges
  - Performance optimization requirements

## 8. Success Criteria
- **Minimum Viable Product (MVP)**: 
  - Complete party creation and joining flow
  - Functional questionnaire system
  - Results calculation and display
  - Basic sharing capabilities
- **Success Metrics**: 
  - User engagement rates
  - Party completion rates
  - Social sharing metrics
  - User feedback scores
- **Quality Gates**: 
  - All core user flows functional
  - Database operations working correctly
  - Real-time updates functioning
  - Results calculation accurate

## 9. Timeline and Milestones
- **Phase 1**: Foundation & Party Management (Completed)
- **Phase 2**: Questionnaire Engine (Completed)
- **Phase 3**: Results & Big Reveal (Completed)
- **Phase 4**: UI Modernization & Polish (In Progress)
- **Phase 5**: Early Access Mode (Pending)
- **Final Release**: MVP Complete, ongoing enhancements

## 10. Appendices
- **Glossary**: 
  - Party: A group of friends participating in the Friend Party experience
  - Adventurer: A party member with calculated D&D-style stats
  - Hireling: A non-participating individual included in party assessments
  - Party Leader: The creator of a party with tie-breaking authority
  - Party Morale: A score affecting leader vote weighting
  - Early Access Mode: A controlled launch phase that gates premium features and enables feedback collection
  - Feature Flag: A system setting that controls the availability of specific application features
- **References**: 
  - Supabase documentation
  - D&D 5e rules and classes
  - WCAG 2.1 accessibility guidelines
- **Change Log**: 
  - 2025-07-11: Initial draft (John PM)
  - 2025-08-31: Restructured to match standardized template format
  - 2025-01-27: Added Epic 5: Early Access Mode with comprehensive feature flag and feedback collection system

---

## Template Usage Notes

This template provides:
- **Consistent structure** across all projects
- **Standardized data fields** for easy parsing
- **Clear hierarchy** (Epic → Story → Acceptance Criteria)
- **Parseable format** for automation
- **Universal applicability** across different project types

### How to Use:
1. Copy this template for each new project
2. Fill in the bracketed sections with project-specific information
3. Remove sections that don't apply to your project
4. Add custom sections as needed
5. Save with a descriptive filename (e.g., `project-name-prd.md`)

### For Automation:
- Use consistent formatting for easy parsing
- Keep acceptance criteria in a standardized format
- Maintain clear hierarchy for story relationships
- Use consistent metadata fields across all PRDs
