import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AppContextValue } from '../context/appContext';
import { useAppContext } from '../context/appContext';
import ForgotPassword from './ForgotPassword';

vi.mock('../context/appContext', () => ({
  useAppContext: vi.fn(),
}));

const baseContext = {
  isLoading: false,
  showAlert: false,
  forgotPassword: vi.fn(),
} as unknown as AppContextValue;

describe('ForgotPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAppContext).mockReturnValue(baseContext);
  });

  it('submits the entered email', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    );

    await user.type(
      screen.getByPlaceholderText('Enter your email...'),
      'alice@example.com'
    );
    await user.click(screen.getByRole('button', { name: 'Send reset link' }));

    expect(baseContext.forgotPassword).toHaveBeenCalledWith(
      'alice@example.com'
    );
  });

  it('shows the alert when the context reports one', () => {
    vi.mocked(useAppContext).mockReturnValue({
      ...baseContext,
      showAlert: true,
      alertType: 'success',
      alertText: 'sent',
    });
    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    );

    expect(screen.getByText('sent')).toBeInTheDocument();
  });
});
