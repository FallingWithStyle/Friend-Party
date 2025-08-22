import Link from "next/link"
import "./page.css"

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
