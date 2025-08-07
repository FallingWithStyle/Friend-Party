# Friend Party UI/UX Specification

## 1. Introduction

This document defines the user experience goals, information architecture, user flows, and visual design specifications for Friend Party's user interface. It serves as the foundation for visual design and frontend development, ensuring a cohesive and user-centered experience.

### 1.1. Overall UX Goals & Principles

#### 1.1.1. Target User Personas

*   **The Social Organizer (Party Creator):** This user enjoys bringing friends together for new activities. They are motivated to initiate the game and need a simple, quick way to set up a party and invite others.
*   **The Curious Participant (Party Member):** This user is invited by a friend. They are looking for a fun, low-commitment social experience. They value ease-of-use and a clear, engaging process that leads to a fun payoff.

#### 1.1.2. Usability Goals

*   **Effortless Onboarding:** A new user can create or join a party and understand the goal within 60 seconds.
*   **Engaging Flow:** The questionnaire process feels like a fun game, not a chore, encouraging completion.
*   **Clear Anticipation:** Users should always know the party's status and feel a sense of excitement building towards the final results reveal.
*   **Shareable Climax:** The final results are presented in a fun, visually appealing, and easily shareable format.

#### 1.1.3. Design Principles

1.  **Fun Over Function:** Every design choice should prioritize a playful and delightful user experience.
2.  **Guided Simplicity:** Use a clear, step-by-step process to eliminate confusion and guide users effortlessly from start to finish.
3.  **Build Momentum:** The experience should build anticipation, making the final reveal feel like a rewarding event.
4.  **Mobile-First, Social-Always:** Design for the context of friends sharing a link and joining from their phones.
5.  **Clarity and Feedback:** Every user action should have an immediate and clear reaction from the interface.

### 1.2. Change Log

| Date | Version | Description | Author |
| :--- | :--- | :--- | :--- |
| 2025-07-13 | 1.0 | Initial Draft | Sally (UX Expert) |


## 2. Information Architecture (IA)

The application follows a linear, task-based flow rather than a traditional hierarchical site structure. The IA is designed to guide the user through the process of creating/joining a party, completing the questionnaire, and viewing the results with minimal distractions.

### 2.1. Site Map / Screen Flow

The following diagram illustrates the primary user journey through the application's screens.

```mermaid
graph TD
    A[/"Landing Page"/] --> B{"Create or Join?"};
    B --&gt; C["Create Party Screen"];
    B --&gt; D["Join Party Screen"];
    C --&gt; E["Lobby / Waiting Screen"];
    D --&gt; E;
    E --&gt; F["Questionnaire Flow"];
    F --&gt; G{"1. Self-Assessment"};
    G --&gt; H{"2. Peer-Assessment"};
    H --&gt; I["Lobby / Waiting Screen"];
    I --&gt; J[/"Results Page"/];

    subgraph "Automatic Transition"
    direction LR
    I -- "All members finished" --&gt; J
    end

    style A fill:#f9f,stroke:#333,stroke-width:2px
    style J fill:#f9f,stroke:#333,stroke-width:2px
```

### 2.2. Navigation Structure

*   **Primary Navigation:** None. The application is a sequential wizard. Users are guided from one step to the next without the ability to freely navigate between disconnected sections.
*   **Secondary Navigation:** None.
*   **Breadcrumb Strategy:** A progress indicator will be used during the multi-step questionnaire phase (Self and Peer Assessment). This will show the user their current stage (e.g., "Step 2 of 3") rather than a traditional breadcrumb trail. This reinforces the linear flow and manages user expectations.


## 3. User Flows

This section details the step-by-step paths for the application's most critical user tasks.

### 3.1. Flow: Create a New Party

**User Goal:** To start a new game and get a unique code to share with friends.

**Entry Points:** Clicking the "Create Party" button on the Landing Page.

**Success Criteria:** The user successfully creates a party, receives a unique code, and lands in the lobby where they can see their own name.

#### Flow Diagram
```mermaid
graph TD
    A[Start: Landing Page] --> B{User clicks "Create Party"};
    B --> C["Navigate to Create Party Screen"];
    C --> D["User enters Party Name"];
    D --> E{User clicks "Create"};
    E --> F["System generates 6-letter code"];
    F --> G["Creates 'parties' record in DB"];
    G --> H["Adds creator as 'Party Leader'"];
    H --> I["Redirect to Lobby Screen"];
    I --> J[End: Lobby displays Party Code & Leader's name];

    style J fill:#c9ffc9,stroke:#333,stroke-width:2px
```

#### Edge Cases & Error Handling:
- **Network Error:** If the application cannot communicate with the backend to create the party, a user-friendly error message (e.g., "Oops! Could not create the party. Please try again.") should be displayed.
- **Invalid Input:** The "Create" button should be disabled until a Party Name is entered.

**Notes:** The PRD mentions adding members during creation. For MVP simplicity, this flow defers adding members until the lobby to streamline the initial creation process. This can be revisited post-MVP. The lobby must prominently display both the 6-letter code AND a "Copy Invite Link" button for the creator to share.


### 3.2. Flow: Join an Existing Party

**User Goal:** To join a party created by a friend using a 6-letter code.

**Entry Points:**
- Navigating directly to a shareable URL (e.g., `friend.party/join/ABCDEF`).
- Entering a code in the input field on the Landing Page and clicking "Join Party".

**Success Criteria:** The user successfully joins the party, provides their name, and lands in the lobby where they can see their name and the names of other members.

#### Flow Diagram
```mermaid
graph TD
    subgraph "URL Entry"
        A[Start: User navigates to /join/ABCDEF] --> D;
    end
    subgraph "Manual Entry"
        B[Start: Landing Page] --> C{User enters 6-letter code};
        C --> C2{User clicks "Join Party"};
        C2 --> D;
    end
    D["System validates code from URL or input"];
    D -- Invalid Code --> E["Display error: 'Invalid Party Code'"];
    D -- Valid Code --> F["Prompt for User's Name"];
    F --> G{User enters name & submits};
    G --> H["Adds user as member to party in DB"];
    H --> I["Redirect to Lobby Screen"];
    I --> J[End: Lobby displays new member];

    style J fill:#c9ffc9,stroke:#333,stroke-width:2px
    style E fill:#ffc9c9,stroke:#333,stroke-width:2px
```

#### Edge Cases & Error Handling:
- **Invalid Code Format:** The "Join Party" button should be disabled until exactly 6 characters are entered in the code field.
- **Non-existent Code:** If the 6-letter code does not match any existing party, a clear error message is shown.
- **Party Full/Locked:** (Future consideration) If a party is no longer accepting new members, a message like "This party is already in session!" should be displayed.
- **Name Conflict:** If a user tries to join with a name that is already taken in that specific party, prompt them with "That name is already taken in this party. Please choose another."

**Notes:** This flow is the primary entry point for most users. It must be as frictionless as possible. The single input field for the name after code validation prevents cluttering the initial landing page.


### 3.3. Flow: Complete the Questionnaire

**User Goal:** To answer questions about myself and my friends to determine our party's stats.

**Entry Points:** A "Start Questionnaire" button in the Lobby, likely enabled by the Party Leader.

**Success Criteria:** The user answers all self-assessment and peer-assessment questions, their status is updated to "Finished", and they are returned to the lobby to await the results.

#### Flow Diagram
```mermaid
graph TD
    A[Start: Lobby Screen] --> B{User clicks "Start Questionnaire"};
    B --> C["Begin Self-Assessment"];
    C --> D["Present Question 1 (Self)"];
    D --> E{User answers};
    E --> F{"More self-questions?"};
    F -- Yes --> D;
    F -- No --> G["Begin Peer-Assessment"];
    G --> H["For each Party Member (and Hireling)..."];
    H --> I["Present Question 1 (Peer)"];
    I --> J{User answers for Member X};
    J --> K{"Assessed all members for this question?"};
    K -- No --> J;
    K -- Yes --> L{"More peer-questions?"};
    L -- Yes --> I;
    L -- No --> M["All questions complete"];
    M --> N["Update user status to 'Finished' in DB"];
    N --> O["Redirect to Lobby Screen"];
    O --> P[End: Lobby shows user as 'Finished'];

    style P fill:#c9ffc9,stroke:#333,stroke-width:2px
```

#### UI & Interaction Notes:
- **Card-Based UI:** Questions will be presented one at a time on individual "cards" to maintain focus.
- **Peer-Assessment UI:** For each peer question, the UI must make it easy to switch between the different members being assessed. A tab-like interface or a carousel of member portraits could work well.
- **Hireling Distinction:** Hirelings in the peer-assessment list should have a clear visual marker to differentiate them from active players.
- **Dynamic Backgrounds:** The background imagery will subtly change as the user progresses, creating a sense of journey.
- **Immediate Feedback Loop:** Each answered question will provide instant, satisfying feedback (e.g., a small `+10 EXP` animation).
- **Gamified Milestones:** At key progress points (e.g., every 5 questions), the user will be rewarded with a "milestone" event. This could include:
    - A "Level Up!" notification.
    - The awarding of a piece of "random loot" (a fun, non-functional cosmetic item or badge, like "Boots of Swift Answering" or "The Amulet of Friendship").

#### Edge Cases & Error Handling:
- **Losing Connection:** If the user loses their connection mid-questionnaire, their progress should be saved. Upon returning, they should be able to resume where they left off.
- **New Member Joins:** If a new member joins the party *after* a user has started the questionnaire, the system needs a rule for how to handle this. **Recommendation:** The new member is added to the queue for the current user's peer-assessment to ensure everyone is assessed.

**Notes:** This is the longest and most involved part of the user journey. The UI must be exceptionally clear, responsive, and engaging to prevent user drop-off. The transition between self and peer assessment should be seamless.


## 4. Component Library / Design System

### 4.1. Design System Approach

For the MVP, we will adopt a lean approach by using a pre-built, production-ready component library and customizing its theme to match our branding. This accelerates development while ensuring a high-quality, accessible, and consistent UI.

**Recommended Library:** **Shadcn/UI**
*   **Rationale:** It is not a traditional component library. It's a collection of reusable components that you can copy and paste into your apps and customize to your heart's content. This provides maximum flexibility while leveraging well-architected, accessible components. It integrates perfectly with Tailwind CSS, which is ideal for a modern React/Next.js application.

### 4.2. Core Components

The following are the foundational UI components required for the MVP.

#### 4.2.1. Button
*   **Purpose:** To trigger actions like creating a party, joining, submitting answers, etc.
*   **Variants:**
    *   `Primary`: For the main call-to-action on a screen (e.g., "Create Party").
    *   `Secondary`: For less prominent actions (e.g., "Propose Name").
    *   `Destructive`: For actions that have negative consequences, though none are anticipated for the MVP.
*   **States:** `Default`, `Hover`, `Pressed`, `Disabled`, `Loading`.
*   **Usage Guidelines:** A screen should ideally have only one primary button.

#### 4.2.2. Input Field
*   **Purpose:** To capture text from the user, such as party code, user name, or party name.
*   **Variants:** Standard text input.
*   **States:** `Default`, `Focused`, `Error`, `Disabled`.
*   **Usage Guidelines:** Must have a clear label. Error messages should appear below the field.

#### 4.2.3. Card
*   **Purpose:** To act as a container for distinct sections of content. It will be the primary component for displaying questions.
*   **Variants:**
    *   `Question Card`: Contains the question text and answer options.
    *   `Member Card`: Displays a party member's name and status in the lobby.
    *   `Results Card`: The final "character sheet" for each user.
*   **States:** `Default`, `Hover` (for interactive cards).
*   **Usage Guidelines:** Cards should have consistent padding and a subtle shadow or border to lift them from the background.

#### 4.2.4. Progress Indicator
*   **Purpose:** To show the user their progress through the questionnaire.
*   **Variants:**
    *   `Bar`: A simple bar that fills as the user progresses.
    *   `Steps`: A series of dots or icons representing the stages of the questionnaire.
*   **States:** `Current`, `Completed`, `Upcoming`.
*   **Usage Guidelines:** Should be visually prominent but not distracting during the questionnaire flow.


## 5. Branding & Style Guide

This section defines the visual identity for Friend Party, ensuring a consistent and thematic user experience.

### 5.1. Visual Identity

The brand will evoke the feeling of a classic 90s D&D 3rd Edition rulebook. The aesthetic should be rich with texture, using parchment backgrounds, book-style typography, and a more subdued, classic color palette. It should feel authentic and nostalgic, not like a modern app with a fantasy skin.

**Brand Guidelines:** This document will serve as the initial brand guide.

### 5.2. Color Palette

The palette is inspired by aged paper, ink, and the classic blue and red accents found in early RPG books.

| Color Type | Hex Code | Usage |
| :--- | :--- | :--- |
| Primary | `#8B0000` | Dark Red. Main calls-to-action, headings, key highlights. Evokes classic RPG book covers. |
| Secondary | `#00008B` | Dark Blue. Secondary actions, links, and decorative elements. |
| Accent | `#556B2F` | Dark Olive Green. For subtle highlights, success states, or positive feedback. |
| Neutrals | | |
| - Background | `#F5DEB3` | Wheat/Parchment. The primary background for the entire app. A parchment texture image is recommended. |
| - Surface | `#D2B48C` | Tan. For card backgrounds and modals, to create a subtle layering effect on the parchment. |
| - Text | `#3A241D` | Very Dark Brown. The primary text color, resembling dark ink on parchment. |
| - Text Muted | `#6F4E37` | Coffee Brown. For secondary text, labels, and hints. |
| - Border | `#855E42` | Dark Tan. For borders, dividers, and creating definition between elements. |

### 5.3. Typography

The typography is crucial for the retro feel. We'll use classic, bookish fonts.

#### 5.3.1. Font Families
*   **Primary (Headings):** `IM Fell English SC` - A classic, historical font that looks like it was printed with metal type. Perfect for D&D-style headings. (Import from Google Fonts).
*   **Secondary (Body):** `Garamond` - A timeless, highly readable serif font that was common in books from that era. (System font or import).

#### 5.3.2. Type Scale (Example)
| Element | Size | Weight | Line Height |
| :--- | :--- | :--- | :--- |
| H1 | 2.5rem (40px) | Regular | 1.2 |
| H2 | 2rem (32px) | Regular | 1.2 |
| H3 | 1.5rem (24px) | Regular | 1.3 |
| Body | 1.125rem (18px) | Regular | 1.6 |
| Small | 1rem (16px) | Regular | 1.5 |

### 5.4. Iconography

*   **Icon Style:** We will avoid modern, clean-line icons. Instead, we will use:
    *   Simple, hand-drawn style icons where needed.
    *   Text-based icons (e.g., using brackets `[X]` for a checkbox).
    *   Classic RPG-style decorative borders and dividers instead of icons for separation.

### 5.5. Spacing & Layout

*   **Layout:** The layout will be more dense and book-like than a modern web app. We will use classic two-column layouts where appropriate, reminiscent of a rulebook page.
*   **Spacing:** While a grid is still useful, we will rely more on typographic flow and classic layout principles rather than a strict, modern 8pt grid.


## 6. Accessibility Requirements

Even with a retro, textured design, we must prioritize accessibility to ensure the application is usable by everyone, as per the PRD's goal.

### 6.1. Compliance Target

*   **Standard:** Web Content Accessibility Guidelines (WCAG) 2.1 Level AA.
*   **Critical Note:** Achieving AA compliance with a low-contrast, parchment-and-ink aesthetic is challenging. We must be diligent and creative.

### 6.2. Key Requirements

#### Visual
*   **Color Contrast:** This is our biggest challenge. The dark brown text (`#3A241D`) on the tan surface (`#D2B48C`) does **not** meet the AA standard of 4.5:1.
    *   **Mitigation Strategy 1:** We must provide a "High-Contrast Mode" toggle. This mode will switch to a compliant palette (e.g., nearly black text on a very light parchment).
    *   **Mitigation Strategy 2:** All interactive elements (links, buttons) using color to signify action must also have a non-color indicator (e.g., an underline, a border).
*   **Focus Indicators:** All interactive elements must have a clear, highly visible focus state. For our theme, a thick, dark blue (`#00008B`) outline or a high-contrast drop shadow would be effective.
*   **Text Sizing:** Users must be able to zoom the page up to 200% without loss of content or functionality.

#### Interaction
*   **Keyboard Navigation:** All functionality must be operable through a keyboard. The tab order must be logical and sequential.
*   **Screen Reader Support:** All interactive elements must have clear, descriptive `aria-labels`. Decorative images and borders should have `aria-hidden="true"` to avoid cluttering the screen reader experience.
*   **Touch Targets:** On mobile devices, all interactive elements must have a touch target size of at least 44x44 pixels.

#### Content
*   **Alternative Text:** While we are avoiding complex icons, any meaningful images must have descriptive alt text.
*   **Heading Structure:** The document must use a logical heading hierarchy (H1, H2, H3, etc.) to allow for easy navigation by assistive technologies.
*   **Form Labels:** All input fields must have programmatically associated labels.

### 6.3. Testing Strategy

*   **Automated Testing:** Use tools like Axe or Lighthouse during development to catch common issues.
*   **Manual Testing:**
    *   Perform full keyboard navigation tests (tabbing through the entire flow).
    *   Test with a screen reader (e.g., NVDA, VoiceOver).
    *   Test with the high-contrast mode enabled.


## 7. Responsiveness Strategy

The application must provide a seamless experience across all common device sizes, from small mobile phones to large desktop monitors. Our retro, book-like design will adapt gracefully to different viewports.

### 7.1. Breakpoints

We will use a standard set of breakpoints that align well with Tailwind CSS's defaults.

| Breakpoint | Min Width | Target Devices |
| :--- | :--- | :--- |
| Mobile (sm) | 640px | Small to large phones (default) |
| Tablet (md) | 768px | Tablets (e.g., iPad) in portrait |
| Laptop (lg) | 1024px | Laptops, tablets in landscape |
| Desktop (xl) | 1280px | Standard desktop monitors |

### 7.2. Adaptation Patterns

*   **Mobile (Default):** A single-column layout is used for all content. Typography is scaled down, and touch targets are large. The layout is simple and linear.
*   **Tablet & Above:**
    *   **Layout:** We can introduce two-column layouts where appropriate to better utilize the space, similar to a book page. For example, the Results screen could show two character sheets side-by-side.
    *   **Navigation:** The peer-assessment UI might switch from a stacked/carousel view on mobile to a tabbed interface on larger screens.
    *   **Content Priority:** The core content remains the same across all breakpoints. No content will be hidden on smaller screens.
    *   **Interaction Changes:** Hover effects, which are not available on touch devices, will provide additional feedback on desktop.


## 8. Animation & Micro-interactions

For our retro theme, animations should be subtle and purposeful, avoiding overly smooth, modern "ease-in-out" curves.

*   **Motion Principles:** Motion should be minimal and crisp. Think less "sliding" and more "appearing" or "flipping," like turning a page in a book.
*   **Key Animations:**
    *   **EXP Gain:** A small, pixel-art style `+10 EXP` text that appears and quickly fades out above the answer button.
    *   **Loot Unlocked:** A simple "treasure chest" icon that shakes and opens to reveal the name of the loot badge.
    *   **Page Transitions:** A subtle fade-in/fade-out or a quick "slide" effect can be used between major screens to simulate page turns.

## 9. Performance Considerations

Performance is a key part of the user experience. Even a retro-styled app should feel fast and responsive.

*   **Performance Goals:**
    *   **Page Load:** The initial landing page should be interactive in under 2 seconds.
    *   **Interaction Response:** All button clicks and inputs should provide feedback in under 100ms.
*   **Design Strategies:**
    *   **Image Optimization:** The parchment background texture must be a highly compressed image file (e.g., `.webp`) to minimize load time.
    *   **Font Loading:** Use modern font-loading strategies to prevent "flash of unstyled text" and ensure fonts are available quickly.
    *   **Lazy Loading:** Future images or heavy components should be lazy-loaded to improve initial page performance.

## 10. Next Steps

This UI/UX Specification is now complete and ready to guide the next phases of the project.

### 10.1. Immediate Actions
1.  **Review & Approval:** This document should be reviewed by the project stakeholders (PM, Architect, Devs) for final approval.
2.  **Visual Design:** A designer can now use this specification to create high-fidelity mockups for all screens in a tool like Figma or Photoshop.
3.  **Frontend Architecture:** The Architect can use this document, along with the PRD, to finalize the Frontend Architecture document, ensuring the chosen components and structure can support this UX.

### 10.2. Design Handoff Checklist
- [x] All user flows documented
- [x] Core component inventory complete
- [x] Accessibility requirements defined
- [x] Responsiveness strategy clear
- [x] Branding & style guide (retro theme) confirmed
- [ ] Performance goals established
