import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AppContextValue } from '../context/appContext';
import { useAppContext } from '../context/appContext';
import ResetPassword from './ResetPassword';

vi.mock('../context/appContext', () => ({
  useAppContext: vi.fn(),
}));

const baseContext = {
  user: null,
  isLoading: false,
  showAlert: false,
  displayAlert: vi.fn(),
  resetPassword: vi.fn(),
} as unknown as AppContextValue;

const renderWithToken = (token: string | null) =>
  render(
    <MemoryRouter
      initialEntries={[
        token ? `/reset-password?token=${token}` : '/reset-password',
      ]}
    >
      <ResetPassword />
    </MemoryRouter>
  );

describe('ResetPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAppContext).mockReturnValue(baseContext);
  });

  it('shows an invalid-link message when there is no token', () => {
    renderWithToken(null);

    expect(screen.getByText(/this link is invalid/i)).toBeInTheDocument();
  });

  it('submits the new password with the token from the URL', async () => {
    const user = userEvent.setup();
    renderWithToken('abc123');

    await user.type(
      screen.getByPlaceholderText('Enter your new password...'),
      'new-password123'
    );
    await user.type(
      screen.getByPlaceholderText('Confirm your new password...'),
      'new-password123'
    );
    await user.click(screen.getByRole('button', { name: 'Reset password' }));

    expect(baseContext.resetPassword).toHaveBeenCalledWith({
      token: 'abc123',
      password: 'new-password123',
    });
  });

  it('shows an alert instead of submitting when the passwords do not match', async () => {
    const user = userEvent.setup();
    renderWithToken('abc123');

    await user.type(
      screen.getByPlaceholderText('Enter your new password...'),
      'new-password123'
    );
    await user.type(
      screen.getByPlaceholderText('Confirm your new password...'),
      'different-password'
    );
    await user.click(screen.getByRole('button', { name: 'Reset password' }));

    expect(baseContext.displayAlert).toHaveBeenCalled();
    expect(baseContext.resetPassword).not.toHaveBeenCalled();
  });
});
