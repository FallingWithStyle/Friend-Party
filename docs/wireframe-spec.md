# Friend Party Wireframe Specification

## 1. Overview

This document outlines the wireframe specifications for the Friend Party mobile application. The focus is on layout, component hierarchy, and core user flows for party creation and character management. The visual style will incorporate retro fantasy and D&D-inspired elements.

## 2. Party Creation Screen

A mobile-first layout for creating a new party.

### Layout

-   **Header:** Displays the application title, "Friend Party," in a stylized, retro fantasy font.
-   **Main Section:**
    -   **Party Name:** A text input field for the user to name their party. Placeholder: "Enter Party Name".
    -   **Party Members:** A list view to display added members. Initially empty.
    -   **Add Member Button:** A button to add new members to the party.
    -   **Create Party Button:** A primary call-to-action button. Label: "Create Party". Icon: Sword.
-   **Sidebar:**
    -   **Party Code Input:** A field for entering an existing party code to join. Placeholder: "Enter Party Code". Icon: Dice.
    -   **Quick Start:** A small section with brief instructions on how to create or join a party.

### Visual Elements & Hierarchy

-   The "Create Party" button should be the most prominent element on the screen.
-   The header font should be distinct and thematic.
-   Icons (sword, dice) should be simple and recognizable.

## 3. Character Profile Screen

A mobile layout for viewing and managing a character's profile.

### Layout

-   **Character Card:** The dominant element on the screen.
    -   **Character Name:** Display area for the character's name. Placeholder: "Character Name".
    -   **Class Selection:** A dropdown menu to select the character's class (e.g., Warrior, Mage, Rogue).
    -   **Stats Visualization:** A graphical representation of character stats (e.g., Strength, Dexterity, Intelligence) using bars or radial charts.
-   **Comparison Section:**
    -   **Party Member Thumbnails:** A horizontal row of small circular thumbnails for other party members.
    -   **Question Display:** A text area showing a "get to know you" question. Placeholder: "What is your character's greatest fear?".
    -   **Answer Buttons:** Buttons for submitting or viewing answers.

### Visual Elements & Hierarchy

-   The character card should feel like a physical D&D character sheet.
-   Each character class should have a unique, simple icon.
-   Stat icons (e.g., fist for strength, brain for intelligence) should be used for clarity.

## 4. Component Library

A collection of reusable UI components with a consistent D&D theme.

-   **Buttons:**
    -   **Primary:** Large, prominent, with an icon. (e.g., "Create Party"). States: default, hover, disabled.
    -   **Secondary:** Smaller, less prominent. (e.g., "Add Member").
-   **Input Fields:**
    -   Standard text input with a thematic border.
    -   Optional icon placement (e.g., dice icon for party code).
-   **Character Card:**
    -   A container with a distinct border and background.
    -   Defined sections for name, class, and stats.
-   **Icons:**
    -   **Sword:** Action, creation.
    -   **Dice:** Randomness, joining.
    -   **Class Icons:** Warrior (axe), Mage (staff), Rogue (dagger).
    -   **Stat Icons:** Strength (fist), Dexterity (boot), Intelligence (brain).

## 5. Next Steps

-   **Figma Implementation:** Translate these wireframes into high-fidelity mockups in Figma.
-   **Prototyping:** Create an interactive prototype to test the primary user flow (party creation -> character profile).
-   **User Testing:** Prepare a plan to test the prototype with a small group of users to gather feedback on usability and clarity.