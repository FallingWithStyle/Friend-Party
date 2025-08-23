import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import AdminNavLink from './AdminNavLink';
import { createClient } from '@/lib/supabase/client';

// Mock dependencies
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(),
}));

// Mock Next.js Link component
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('AdminNavLink', () => {
  let mockSupabase: any;
  let mockAuth: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create mock auth
    mockAuth = {
      getUser: vi.fn(),
    };

    // Create mock Supabase client
    mockSupabase = {
      auth: mockAuth,
    };

    // Mock the createClient function
    (createClient as any).mockReturnValue(mockSupabase);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders admin link when user email matches admin email', async () => {
    const adminEmail = 'patrickandrewregan@gmail.com';
    
    mockAuth.getUser.mockResolvedValue({
      data: { user: { email: adminEmail } },
    });

    render(<AdminNavLink />);

    await waitFor(() => {
      expect(screen.getByText('Admin')).toBeInTheDocument();
    });

    const adminLink = screen.getByRole('link', { name: 'Admin' });
    expect(adminLink).toHaveAttribute('href', '/admin');
    expect(adminLink).toHaveAttribute('aria-label', 'Admin');
  });

  it('does not render when user email does not match admin email', async () => {
    const nonAdminEmail = 'user@example.com';
    
    mockAuth.getUser.mockResolvedValue({
      data: { user: { email: nonAdminEmail } },
    });

    render(<AdminNavLink />);

    await waitFor(() => {
      expect(screen.queryByText('Admin')).not.toBeInTheDocument();
    });
  });

  it('does not render when user is not authenticated', async () => {
    mockAuth.getUser.mockResolvedValue({
      data: { user: null },
    });

    render(<AdminNavLink />);

    await waitFor(() => {
      expect(screen.queryByText('Admin')).not.toBeInTheDocument();
    });
  });

  it('does not render when authentication fails', async () => {
    mockAuth.getUser.mockRejectedValue(new Error('Auth error'));

    render(<AdminNavLink />);

    await waitFor(() => {
      expect(screen.queryByText('Admin')).not.toBeInTheDocument();
    });
  });

  it('applies correct styling to admin link', async () => {
    const adminEmail = 'patrickandrewregan@gmail.com';
    
    mockAuth.getUser.mockResolvedValue({
      data: { user: { email: adminEmail } },
    });

    render(<AdminNavLink />);

    await waitFor(() => {
      expect(screen.getByText('Admin')).toBeInTheDocument();
    });

    const adminLink = screen.getByRole('link', { name: 'Admin' });
    
    // Check inline styles
    expect(adminLink).toHaveStyle({
      padding: '0.4rem 0.6rem',
      fontSize: '14px',
      border: '1px solid #333',
      borderRadius: '4px',
      background: '#fff',
      color: '#333',
      textDecoration: 'none',
    });
  });

  it('handles component unmounting gracefully', async () => {
    const adminEmail = 'patrickandrewregan@gmail.com';
    
    mockAuth.getUser.mockImplementation(() => 
      new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            data: { user: { email: adminEmail } },
          });
        }, 100);
      })
    );

    const { unmount } = render(<AdminNavLink />);

    // Unmount before the async operation completes
    unmount();

    // Wait a bit to ensure no errors occur
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // No assertions needed - just ensuring no errors occur
  });

  it('creates Supabase client only once', async () => {
    const adminEmail = 'patrickandrewregan@gmail.com';
    
    mockAuth.getUser.mockResolvedValue({
      data: { user: { email: adminEmail } },
    });

    render(<AdminNavLink />);

    await waitFor(() => {
      expect(screen.getByText('Admin')).toBeInTheDocument();
    });

    expect(createClient).toHaveBeenCalledTimes(1);
  });
});
