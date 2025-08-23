import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuth } from './useAuth';
import { createClient } from '@/lib/supabase/client';
import usePartyStore from '@/store/partyStore';

// Mock the Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(),
}));

// Mock the party store
vi.mock('@/store/partyStore', () => ({
  default: {
    setState: vi.fn(),
  },
}));

describe('useAuth', () => {
  let mockSupabase: any;
  let mockAuth: any;
  let mockSubscription: any;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Create mock subscription
    mockSubscription = {
      unsubscribe: vi.fn(),
    };

    // Create mock auth
    mockAuth = {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
      signInWithOtp: vi.fn(),
      signOut: vi.fn(),
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

  it('initializes with default state', async () => {
    // Mock successful session retrieval
    mockAuth.getSession.mockResolvedValue({
      data: { session: null },
    });

    mockAuth.onAuthStateChange.mockReturnValue({
      data: { subscription: mockSubscription },
    });

    const { result } = renderHook(() => useAuth());

    // Initial state should be loading
    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBe(null);
    expect(result.current.session).toBe(null);
    expect(result.current.email).toBe('');
    expect(result.current.magicLinkSent).toBe(false);

    // Wait for initial session check
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('retrieves existing session on mount', async () => {
    const mockUser = { id: 'user-1', email: 'test@example.com' };
    const mockSession = { user: mockUser, access_token: 'token' };

    mockAuth.getSession.mockResolvedValue({
      data: { session: mockSession },
    });

    mockAuth.onAuthStateChange.mockReturnValue({
      data: { subscription: mockSubscription },
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.session).toEqual(mockSession);
    });

    expect(usePartyStore.setState).toHaveBeenCalledWith({ loading: false });
  });

  it('handles auth state changes', async () => {
    const mockUser = { id: 'user-1', email: 'test@example.com' };
    const mockSession = { user: mockUser, access_token: 'token' };

    mockAuth.getSession.mockResolvedValue({
      data: { session: null },
    });

    let authStateCallback: any;
    mockAuth.onAuthStateChange.mockImplementation((callback) => {
      authStateCallback = callback;
      return { data: { subscription: mockSubscription } };
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Simulate auth state change
    act(() => {
      authStateCallback('SIGNED_IN', mockSession);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.session).toEqual(mockSession);
  });

  it('signs in with magic link successfully', async () => {
    mockAuth.getSession.mockResolvedValue({
      data: { session: null },
    });

    mockAuth.onAuthStateChange.mockReturnValue({
      data: { subscription: mockSubscription },
    });

    mockAuth.signInWithOtp.mockResolvedValue({ error: null });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.signInWithMagicLink('test@example.com');
    });

    expect(mockAuth.signInWithOtp).toHaveBeenCalledWith({
      email: 'test@example.com',
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    expect(result.current.magicLinkSent).toBe(true);
  });

  it('signs in with magic link with custom redirect URL', async () => {
    mockAuth.getSession.mockResolvedValue({
      data: { session: null },
    });

    mockAuth.onAuthStateChange.mockReturnValue({
      data: { subscription: mockSubscription },
    });

    mockAuth.signInWithOtp.mockResolvedValue({ error: null });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const customRedirect = 'https://custom.com/callback';

    await act(async () => {
      await result.current.signInWithMagicLink('test@example.com', customRedirect);
    });

    expect(mockAuth.signInWithOtp).toHaveBeenCalledWith({
      email: 'test@example.com',
      options: {
        emailRedirectTo: customRedirect,
      },
    });
  });

  it('handles magic link sign-in errors', async () => {
    mockAuth.getSession.mockResolvedValue({
      data: { session: null },
    });

    mockAuth.onAuthStateChange.mockReturnValue({
      data: { subscription: mockSubscription },
    });

    const mockError = new Error('Sign-in failed');
    mockAuth.signInWithOtp.mockResolvedValue({ error: mockError });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await expect(
      act(async () => {
        await result.current.signInWithMagicLink('test@example.com');
      })
    ).rejects.toThrow('Sign-in failed');
  });

  it('signs out successfully', async () => {
    const mockUser = { id: 'user-1', email: 'test@example.com' };
    const mockSession = { user: mockUser, access_token: 'token' };

    mockAuth.getSession.mockResolvedValue({
      data: { session: mockSession },
    });

    mockAuth.onAuthStateChange.mockReturnValue({
      data: { subscription: mockSubscription },
    });

    mockAuth.signOut.mockResolvedValue({ error: null });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.user).toEqual(mockUser);
    });

    await act(async () => {
      await result.current.signOut();
    });

    expect(mockAuth.signOut).toHaveBeenCalled();
    expect(result.current.user).toBe(null);
    expect(result.current.session).toBe(null);
    expect(result.current.email).toBe('');
    expect(result.current.magicLinkSent).toBe(false);
  });

  it('manages email state', async () => {
    mockAuth.getSession.mockResolvedValue({
      data: { session: null },
    });

    mockAuth.onAuthStateChange.mockReturnValue({
      data: { subscription: mockSubscription },
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.setEmail('new@example.com');
    });

    expect(result.current.email).toBe('new@example.com');
  });

  it('manages magic link sent state', async () => {
    mockAuth.getSession.mockResolvedValue({
      data: { session: null },
    });

    mockAuth.onAuthStateChange.mockReturnValue({
      data: { subscription: mockSubscription },
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.setMagicLinkSent(true);
    });

    expect(result.current.magicLinkSent).toBe(true);
  });

  it('cleans up subscription on unmount', async () => {
    mockAuth.getSession.mockResolvedValue({
      data: { session: null },
    });

    mockAuth.onAuthStateChange.mockReturnValue({
      data: { subscription: mockSubscription },
    });

    const { unmount } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(mockAuth.onAuthStateChange).toHaveBeenCalled();
    });

    unmount();

    expect(mockSubscription.unsubscribe).toHaveBeenCalled();
  });
});
