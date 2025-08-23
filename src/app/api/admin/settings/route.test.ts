import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from './route';
import { createClient } from '@/utils/supabase/server';
import { getMoraleSettings, saveMoraleSettings } from '@/lib/settings';

// Mock dependencies
vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/settings', () => ({
  getMoraleSettings: vi.fn(),
  saveMoraleSettings: vi.fn(),
}));

describe('Admin Settings API', () => {
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
    (createClient as any).mockResolvedValue(mockSupabase);
  });

  describe('GET /api/admin/settings', () => {
    it('returns settings when user is authenticated', async () => {
      const mockUser = { id: 'user-1', email: 'user@example.com' };
      const mockSettings = { high: 85, low: 15, hysteresis: 5 };

      mockAuth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      (getMoraleSettings as any).mockResolvedValue(mockSettings);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockSettings);
      expect(getMoraleSettings).toHaveBeenCalledWith(mockSupabase);
    });

    it('returns 401 when user is not authenticated', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Unauthorized' });
    });

    it('returns 401 when authentication fails', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Auth error' },
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Unauthorized' });
    });
  });

  describe('POST /api/admin/settings', () => {
    const adminEmail = 'patrickandrewregan@gmail.com';
    const validSettings = { high: 90, low: 10, hysteresis: 3 };

    it('saves settings when user is admin', async () => {
      const mockUser = { id: 'admin-1', email: adminEmail };
      const savedSettings = { ...validSettings, updated_by: adminEmail };

      mockAuth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      (saveMoraleSettings as any).mockResolvedValue(savedSettings);

      const request = new NextRequest('http://localhost/api/admin/settings', {
        method: 'POST',
        body: JSON.stringify(validSettings),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(savedSettings);
      expect(saveMoraleSettings).toHaveBeenCalledWith(mockSupabase, validSettings, adminEmail);
    });

    it('returns 403 when user is not admin', async () => {
      const mockUser = { id: 'user-1', email: 'user@example.com' };

      mockAuth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const request = new NextRequest('http://localhost/api/admin/settings', {
        method: 'POST',
        body: JSON.stringify(validSettings),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data).toEqual({ error: 'Forbidden' });
    });

    it('returns 401 when user is not authenticated', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const request = new NextRequest('http://localhost/api/admin/settings', {
        method: 'POST',
        body: JSON.stringify(validSettings),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Unauthorized' });
    });

    it('returns 400 when request body is invalid JSON', async () => {
      const mockUser = { id: 'admin-1', email: adminEmail };

      mockAuth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Create a request with invalid body
      const request = new NextRequest('http://localhost/api/admin/settings', {
        method: 'POST',
        body: 'invalid json',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Invalid JSON' });
    });

    it('returns 400 when save operation fails', async () => {
      const mockUser = { id: 'admin-1', email: adminEmail };
      const saveError = new Error('Validation failed');

      mockAuth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      (saveMoraleSettings as any).mockRejectedValue(saveError);

      const request = new NextRequest('http://localhost/api/admin/settings', {
        method: 'POST',
        body: JSON.stringify(validSettings),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ 
        error: 'Validation/Save failed', 
        details: 'Validation failed' 
      });
    });

    it('handles partial settings update', async () => {
      const mockUser = { id: 'admin-1', email: adminEmail };
      const partialSettings = { high: 95 };
      const savedSettings = { ...partialSettings, updated_by: adminEmail };

      mockAuth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      (saveMoraleSettings as any).mockResolvedValue(savedSettings);

      const request = new NextRequest('http://localhost/api/admin/settings', {
        method: 'POST',
        body: JSON.stringify(partialSettings),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(savedSettings);
      expect(saveMoraleSettings).toHaveBeenCalledWith(mockSupabase, partialSettings, adminEmail);
    });

    it('handles empty settings object', async () => {
      const mockUser = { id: 'admin-1', email: adminEmail };
      const emptySettings = {};
      const savedSettings = { updated_by: adminEmail };

      mockAuth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      (saveMoraleSettings as any).mockResolvedValue(savedSettings);

      const request = new NextRequest('http://localhost/api/admin/settings', {
        method: 'POST',
        body: JSON.stringify(emptySettings),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(savedSettings);
      expect(saveMoraleSettings).toHaveBeenCalledWith(mockSupabase, emptySettings, adminEmail);
    });
  });
});
