import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../../hooks/useAuth';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('useAuth hook', () => {
  beforeEach(() => {
    // Clear storage before each test
    localStorage.clear();
  });

  test('provides authentication state and methods', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(typeof result.current.login).toBe('function');
    expect(typeof result.current.logout).toBe('function');
    expect(typeof result.current.register).toBe('function');
  });

  test('updates auth state after login', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    const mockUser = { id: '1', name: 'Test User', email: 'test@example.com', role: 'user' };
    const mockToken = 'mock-token';
    
    // Mock login API call
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: mockUser, token: mockToken }),
    });

    await act(async () => {
      await result.current.login('test@example.com', 'password');
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(mockUser);
    expect(localStorage.getItem('authToken')).toBe(mockToken);
  });

  test('clears auth state after logout', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    // Setup initial authenticated state
    localStorage.setItem('authToken', 'test-token');
    localStorage.setItem('user', JSON.stringify({ id: '1', name: 'Test User' }));
    
    // Force a re-render to pick up the localStorage values
    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(localStorage.getItem('authToken')).toBeNull();
  });
});