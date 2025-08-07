# UI/UX Specification: Hireling Conversion Voting

This document describes the UI/UX changes required in the Lobby to support the hireling conversion voting feature.

## 1. Lobby Screen Changes

The Lobby screen's party member list will be updated to include the voting mechanism.

### 1.1. Party Member List Item

Each party member's list item will have a new "options" icon (e.g., a vertical ellipsis '⋮') on the far right. This icon will only be visible for non-NPC members and will not be shown for the current user's own list item.

### 1.2. Voting Option

Clicking the "options" icon will open a small context menu with a single option: "Vote to make Hireling".

### 1.3. Voting Status Display

When a vote is initiated for a party member, a new status line will appear below their name in the list item. This will display the current vote count in real-time.

*   **Initial state**: "Vote to make Hireling: 1/X"
*   **Subsequent votes**: "Votes to make Hireling: Y/X" (where Y is the number of 'yes' votes and X is the total number of eligible voters).

### 1.4. Converted Hireling Display

Once a party member is successfully converted to a hireling, their list item will be updated:

*   The "options" icon will be removed.
*   A "(Hireling)" tag or a distinct hireling icon will appear next to their name.
*   The voting status display will be removed.

## 2. User Flow

1.  **User A** is in the Lobby with **User B** and **User C**.
2.  **User A** clicks the '⋮' icon next to **User C**'s name.
3.  **User A** selects "Vote to make Hireling".
4.  The UI for all users updates to show "Vote to make Hireling: 1/2" under **User C**'s name.
5.  **User B** sees the vote status, clicks the '⋮' icon next to **User C**'s name, and also selects "Vote to make Hireling".
6.  The vote is now unanimous (2/2). The backend triggers the conversion.
7.  The UI for all users updates:
    *   The voting status under **User C**'s name is removed.
    *   **User C**'s name is now displayed as "User C (Hireling)".
    *   The '⋮' icon next to **User C**'s name is removed.