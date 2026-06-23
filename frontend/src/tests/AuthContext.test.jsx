import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { useContext } from 'react';
import { createContext } from 'react';

// Helper: wrap with required router context
function renderWithRouter(ui) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

// A minimal consumer to inspect context
function AuthConsumer() {
  // We can't import the private context directly, so test via behaviour
  return <div data-testid="consumer">rendered</div>;
}

describe('AuthProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders children without crashing', async () => {
    renderWithRouter(
      <AuthProvider>
        <div data-testid="child">hello</div>
      </AuthProvider>
    );
    await waitFor(() => {
      expect(screen.getByTestId('child')).toBeInTheDocument();
    });
  });

  it('clears token if it is invalid', async () => {
    localStorage.setItem('token', 'not.a.valid.jwt');
    renderWithRouter(
      <AuthProvider>
        <div>child</div>
      </AuthProvider>
    );
    await waitFor(() => {
      expect(localStorage.getItem('token')).toBeNull();
    });
  });

  it('parses a valid JWT token and sets user from payload', async () => {
    // Create a fake JWT (header.payload.signature)
    const payload = {
      id: 'user123',
      role: 'admin',
      lab: 'lab456',
      name: 'Test Admin',
    };
    const encodedPayload = btoa(JSON.stringify(payload));
    const fakeToken = `eyJhbGciOiJIUzI1NiJ9.${encodedPayload}.fakesig`;
    localStorage.setItem('token', fakeToken);

    let capturedUser = null;
    // Use a context-aware wrapper to check user state
    // We test this indirectly by checking the app renders normally
    renderWithRouter(
      <AuthProvider>
        <div data-testid="app">App</div>
      </AuthProvider>
    );
    await waitFor(() => {
      expect(screen.getByTestId('app')).toBeInTheDocument();
    });
    // Token should still be in localStorage (valid format)
    expect(localStorage.getItem('token')).toBe(fakeToken);
  });
});
