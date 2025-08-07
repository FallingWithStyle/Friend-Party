'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import './HamburgerMenu.css';
import { createClient } from '@/lib/supabase/client';

const ADMIN_EMAIL = 'patrickandrewregan@gmail.com';

export default function HamburgerMenu() {
  const supabase = useMemo(() => createClient(), []);
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (!mounted) return;
        setEmail(data?.user?.email ?? null);
      } catch {
        if (!mounted) return;
        setEmail(null);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [supabase]);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  const isAdmin = email === ADMIN_EMAIL;

  return (
    <div className="hamburger-menu-container">
      <button className="hamburger-icon" onClick={toggleMenu} aria-label="Toggle menu">
        <div className={`bar ${isOpen ? 'open' : ''}`}></div>
        <div className={`bar ${isOpen ? 'open' : ''}`}></div>
        <div className={`bar ${isOpen ? 'open' : ''}`}></div>
      </button>

      <nav className={`menu-overlay ${isOpen ? 'open' : ''}`} onClick={closeMenu}>
        <ul className="menu-list" onClick={(e) => e.stopPropagation()}>
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
          <li>
            <Link href="/attributions" className="menu-link" onClick={closeMenu}>
              Attributions
            </Link>
          </li>
          {isAdmin && (
            <li>
              <Link href="/admin" className="menu-link" onClick={closeMenu}>
                Admin
              </Link>
            </li>
          )}
        </ul>
      </nav>
    </div>
  );
}