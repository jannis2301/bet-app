import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AppContextValue } from '../context/appContext';
import { useAppContext } from '../context/appContext';
import ProtectedRoute from './ProtectedRoute';

vi.mock('../context/appContext', () => ({
  useAppContext: vi.fn(),
}));

const renderAtHome = () =>
  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <p>protected content</p>
            </ProtectedRoute>
          }
        />
        <Route path="/register" element={<p>register page</p>} />
      </Routes>
    </MemoryRouter>
  );

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows a loading indicator while the current user is still being fetched', () => {
    vi.mocked(useAppContext).mockReturnValue({
      user: null,
      userLoading: true,
    } as AppContextValue);
    renderAtHome();

    expect(document.querySelector('.loading-box')).toBeInTheDocument();
    expect(screen.queryByText('protected content')).not.toBeInTheDocument();
  });

  it('redirects to /register when there is no logged-in user', () => {
    vi.mocked(useAppContext).mockReturnValue({
      user: null,
      userLoading: false,
    } as AppContextValue);
    renderAtHome();

    expect(screen.getByText('register page')).toBeInTheDocument();
    expect(screen.queryByText('protected content')).not.toBeInTheDocument();
  });

  it('renders its children once a user is present', () => {
    vi.mocked(useAppContext).mockReturnValue({
      user: { name: 'Alice' },
      userLoading: false,
    } as AppContextValue);
    renderAtHome();

    expect(screen.getByText('protected content')).toBeInTheDocument();
  });
});
