import Link from "next/link"
import "./page.css"

/**
 * 🎨 LOGO EFFECT TESTING GROUND - PRESERVE FOR FUTURE THEMES 🎨
 * 
 * This page contains 6 different logo styling variants that demonstrate
 * various "statue reflecting firelight" effects using CSS gradients,
 * background-clip, and text-shadow properties.
 * 
 * IMPORTANT: DO NOT DELETE - This page serves as a reference for:
 * - Unlockable theme variations
 * - Logo styling experiments
 * - CSS technique demonstrations
 * - Future premium features
 * 
 * Current Variants:
 * 1. Original: Gold gradient with dark brown shadow
 * 2. Golden: Gold text with dark shadow + golden shadow layers
 * 3. Diluted: Same as variant 2 but with more diluted shadows
 * 4. Blue: Same as variant 3 but with blue-tinted shadows for contrast
 * 5. White: Same as variant 3 but with white/cream shadows for readability
 * 6. Maroon: Same as variant 3 but with maroon shadows (hamburger color)
 * 
 * Each variant can be easily adapted for different themes, seasons, or user preferences.
 * Consider making these unlockable through achievements, level progression, or premium features.
 */
export default function TestLogoPage() {
  return (
    <div className="testlogo-container">
      <div className="testlogo-header">
        <h1>🎨 Logo Effect Testing Ground 🎨</h1>
        <p>Experimenting with different "statue reflecting firelight" effects</p>
        <Link href="/" className="back-link">← Back to Main Page</Link>
      </div>

      <div className="logo-grid">
        {/* Variant 1: Original "statue reflecting firelight" */}
        <div className="logo-variant">
          <h2 className="logo-title variant-1">⚔️ ROLLCALL ⚔️</h2>
          <p className="variant-description">Original: Gold gradient with dark brown shadow</p>
        </div>

        {/* Variant 2: Darker gold text with very soft golden glow */}
        <div className="logo-variant">
          <h2 className="logo-title variant-2">⚔️ ROLLCALL ⚔️</h2>
          <p className="variant-description">Original gold text with dark shadow + golden shadow layers</p>
        </div>

        {/* Variant 3: Swapped shadow and firelight */}
        <div className="logo-variant">
          <h2 className="logo-title variant-3">⚔️ ROLLCALL ⚔️</h2>
          <p className="variant-description">Same as variant 2 but with more diluted shadows</p>
        </div>

        {/* Variant 4: Gold text with golden shadow (combination of 1 & 3) */}
        <div className="logo-variant">
          <h2 className="logo-title variant-4">⚔️ ROLLCALL ⚔️</h2>
          <p className="variant-description">Same as variant 3 but with blue-tinted shadows for better contrast</p>
        </div>

        {/* Variant 5: Same as variant 3 but with white/cream shadows for maximum readability */}
        <div className="logo-variant">
          <h2 className="logo-title variant-5">⚔️ ROLLCALL ⚔️</h2>
          <p className="variant-description">Same as variant 3 but with white/cream shadows for maximum readability</p>
        </div>

        {/* Variant 6: Same as variant 3 but with maroon shadows (hamburger menu color) */}
        <div className="logo-variant">
          <h2 className="logo-title variant-6">⚔️ ROLLCALL ⚔️</h2>
          <p className="variant-description">Same as variant 3 but with maroon shadows (hamburger menu color)</p>
        </div>
      </div>

      <div className="testlogo-footer">
        <p>Each variant uses different CSS properties for unique effects</p>
      </div>
    </div>
  )
}
