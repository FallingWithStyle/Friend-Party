'use client';

import { useState } from 'react';
import Link from 'next/link';
import './HamburgerMenu.css';

export default function HamburgerMenu() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  return (
    <div className="hamburger-menu-container">
      <button className="hamburger-icon" onClick={toggleMenu} aria-label="Toggle menu">
        <div className={`bar ${isOpen ? 'open' : ''}`}></div>
        <div className={`bar ${isOpen ? 'open' : ''}`}></div>
        <div className={`bar ${isOpen ? 'open' : ''}`}></div>
      </button>

      <nav className={`menu-overlay ${isOpen ? 'open' : ''}`} onClick={closeMenu}> {/* Click overlay to close */}
        <ul className="menu-list" onClick={(e) => e.stopPropagation()}> {/* Prevent clicks inside menu from closing */}
          <li>
            <Link href="/" className="menu-link" onClick={closeMenu}>
              Home
            </Link>
          </li>
          <li>
            <Link href="/profile" className="menu-link" onClick={closeMenu}>
              Profile
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
}