import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AppContextValue } from '../../context/appContext';
import { useAppContext } from '../../context/appContext';
import Profile from './Profile';

vi.mock('../../context/appContext', () => ({
  useAppContext: vi.fn(),
}));

const baseContext = {
  user: {
    name: 'Alice',
    email: 'alice@example.com',
    location: 'Berlin',
    team: 'Union Berlin',
  },
  isLoading: false,
  showAlert: false,
  displayAlert: vi.fn(),
  updateUser: vi.fn(),
  updatePassword: vi.fn(),
} as unknown as AppContextValue;

describe('Profile password change', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAppContext).mockReturnValue(baseContext);
  });

  it('submits the current and new password', async () => {
    const user = userEvent.setup();
    render(<Profile />);

    await user.type(
      screen.getByLabelText('Current Password'),
      'old-password123'
    );
    await user.type(screen.getByLabelText('New Password'), 'new-password123');
    await user.type(
      screen.getByLabelText('Confirm New Password'),
      'new-password123'
    );
    await user.click(screen.getByRole('button', { name: 'Change Password' }));

    expect(baseContext.updatePassword).toHaveBeenCalledWith({
      oldPassword: 'old-password123',
      newPassword: 'new-password123',
    });
  });

  it('shows an alert instead of submitting when the new passwords do not match', async () => {
    const user = userEvent.setup();
    render(<Profile />);

    await user.type(
      screen.getByLabelText('Current Password'),
      'old-password123'
    );
    await user.type(screen.getByLabelText('New Password'), 'new-password123');
    await user.type(
      screen.getByLabelText('Confirm New Password'),
      'different-password'
    );
    await user.click(screen.getByRole('button', { name: 'Change Password' }));

    expect(baseContext.displayAlert).toHaveBeenCalled();
    expect(baseContext.updatePassword).not.toHaveBeenCalled();
  });

  it('clears the password fields after submitting', async () => {
    const user = userEvent.setup();
    render(<Profile />);

    const currentPasswordInput = screen.getByLabelText(
      'Current Password'
    ) as HTMLInputElement;
    await user.type(currentPasswordInput, 'old-password123');
    await user.type(screen.getByLabelText('New Password'), 'new-password123');
    await user.type(
      screen.getByLabelText('Confirm New Password'),
      'new-password123'
    );
    await user.click(screen.getByRole('button', { name: 'Change Password' }));

    expect(currentPasswordInput.value).toBe('');
  });
});
