A responsive, 90s-era D&D-themed landing page for a web app called "Friend Party". The design should feel like a page from a classic 3rd Edition rulebook.

**1. High-Level Goal:**
Create a responsive landing page for "Friend Party" that looks and feels like a page from a 90s Dungeons & Dragons rulebook. It must be textured, use classic book-style typography, and have two main actions: "Forge a New Party" and "Join an Existing Party".

**2. Detailed, Step-by-Step Instructions:**
1.  **Layout:**
    *   The entire page should have a textured background that looks like aged parchment or wheat-colored paper (`#F5DEB3`).
    *   The main content should be in a single, centered column, reminiscent of a book's page.
    *   Add a thin, decorative border around the main content area, like you'd see in a rulebook. A simple dark brown (`#855E42`) double-line border would be perfect.
2.  **Main Heading:**
    *   Display the title "Friend Party".
    *   Use the `IM Fell English SC` font.
    *   The color should be a dark, classic red (`#8B0000`).
    *   The heading should be large and centered.
3.  **Introductory Text:**
    *   Below the heading, add a short paragraph of text: "Gather your allies, assess your bonds, and reveal your party's true nature."
    *   Use the `Garamond` font for this body text.
    *   The color should be a dark brown, like ink (`#3A241D`).
4.  **"Create Party" Action:**
    *   This should be a simple, text-based link styled to look like a heading in a book.
    *   The text should be "» Forge a New Party «".
    *   Use the `IM Fell English SC` font, colored with the primary dark red (`#8B0000`).
    *   When hovered, the text should get a subtle underline.
5.  **"Join Party" Action:**
    *   Below the "Create" action, add a section for joining.
    *   **Label:** Add a small heading that says "Or, Join an Existing Party:". Use the `Garamond` font in the ink color (`#3A241D`).
    *   **Input Field:**
        *   The input field should look like it belongs on the page. Give it a simple, thin border in a dark tan color (`#855E42`) and a light parchment background (`#D2B48C`).
        *   The placeholder text should say "Enter Party Code".
    *   **Join Button:**
        *   This should be a button that looks like a classic RPG button.
        *   The text should be "Join".
        *   Use a dark blue background (`#00008B`) with light text.
        *   The button should have sharp corners (no border-radius).
6.  **Spacing:** Use classic typographic spacing. Rely on paragraph spacing and margins rather than a strict grid. The layout should feel balanced, like a well-set page of a book.

**3. Code Examples, Data Structures & Constraints:**
*   **Tech Stack:** Generate code for **React (Next.js) with TypeScript and Tailwind CSS**.
*   **Fonts:**
    *   `IM Fell English SC` (for headings) - import from Google Fonts.
    *   `Garamond` (for body text).
*   **Color Palette (Strict):**
    *   Primary Red: `#8B0000`
    *   Secondary Blue: `#00008B`
    *   Parchment BG: `#F5DEB3`
    *   Parchment Surface: `#D2B48C`
    *   Ink Text: `#3A241D`
    *   Border: `#855E42`
*   **Constraints:** Do NOT use modern UI elements like cards with drop shadows, gradients, or rounded corners (except for the input field, which should be subtle). The goal is a flat, textured, book-like appearance.

**4. Define a Strict Scope:**
The output should be a single, self-contained React component (`.tsx`) for the landing page. All styling must be done using Tailwind CSS classes. A link to a parchment texture image for the background would be a bonus.