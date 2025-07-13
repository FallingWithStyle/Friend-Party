import Link from 'next/link';
import './Header.css';

export default function Header() {
  return (
    <header className="header">
      <nav className="nav">
        <Link href="/" className="logo-link">
          Friend Party
        </Link>
        <div className="nav-links">
          <Link href="/create" className="nav-link">
            Create a Party
          </Link>
          {/* Add other links as needed */}
        </div>
      </nav>
    </header>
  );
}