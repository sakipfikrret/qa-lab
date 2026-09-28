import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { AuthScreen } from '../components/auth/AuthScreen';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const props = { signupOpen: false, bootError: null, onRetry: vi.fn(), onAuthenticated: vi.fn() };

describe('AuthScreen', () => {
  it('first run shows the admin-account form', () => {
    render(<AuthScreen {...props} needsSetup />);
    expect(screen.getByText('Create the admin account')).toBeDefined();
    expect(screen.getByLabelText('Name')).toBeDefined();
  });

  it('login shows the server error and stays on screen', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false, status: 401, statusText: 'Unauthorized',
      json: async () => ({ error: 'Invalid email or password' }),
    }));
    render(<AuthScreen {...props} needsSetup={false} />);
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.co' } });
    fireEvent.change(screen.getByLabelText(/Password/), { target: { value: 'whatever' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('Invalid email or password'));
    expect(props.onAuthenticated).not.toHaveBeenCalled();
  });

  it('does not offer sign-up when it is closed', () => {
    render(<AuthScreen {...props} needsSetup={false} signupOpen={false} />);
    expect(screen.queryByText('Create an account')).toBeNull();
  });
});
