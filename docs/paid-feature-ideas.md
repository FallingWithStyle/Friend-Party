## Paid feature ideas

A living list of potential paid/premium features. Keep entries concise and focused on the customer value. Add notes for scope, constraints, and monetization approach.

- **Custom themes**
  - **Description**: Allow users or party owners to choose premium themes or design a custom look (colors, typography accents) applied across Lobby, Questionnaire, and Results.
  - **Scope ideas**: Prebuilt theme pack, lightweight theme editor (primary/secondary colors), per-party vs per-user theme ownership, shareable theme presets.
  - **Monetization**: Theme pack purchase or inclusion in a premium tier; consider one-time purchase for individual themes.
  - **Tech notes**: Establish theme tokens in Tailwind; persist selection at `party` and/or `user` level; expose in UI settings.

- **Custom (vanity) 6-character party code**
  - **Description**: Let the party owner set a custom 6-character alphanumeric code (A–Z, 0–9) instead of a random code.
  - **Constraints**: Must be globally unique; profanity/inappropriate word filter; reservation/renewal policy; handle migration from existing random codes.
  - **Monetization**: One-time purchase with optional annual renewal to keep the code reserved; consider premium tier entitlement.
  - **Tech notes**: Uniqueness validation and reservation table; server-side enforcement; admin override; edge cases for expired reservations.

Last updated: 2025-08-08


