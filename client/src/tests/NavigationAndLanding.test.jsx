import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { api } from '../lib/api';
import { Navbar } from '../components/common/Navbar';
import { LandingPage } from '../pages/public/LandingPage';
import { renderWithProviders } from './testUtils';

vi.mock('../lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn()
  },
  getApiErrorMessage: (err, fallback) => err?.response?.data?.error?.message || fallback
}));

describe('Role-Aware Navigation & Landing Page', () => {
  it('shows student-specific navigation links when authenticated as a student', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/auth/me') {
        return Promise.resolve({
          data: { data: { user: { _id: 's1', name: 'Riya', role: 'student' } } }
        });
      }
      return Promise.resolve({ data: { data: {} } });
    });

    renderWithProviders(<Navbar />);

    expect(await screen.findByText('Recommended')).toBeInTheDocument();
    expect(screen.getByText('Tracker')).toBeInTheDocument();
    expect(screen.queryByText('Verification Queue')).not.toBeInTheDocument();
  });

  it('shows admin verification queue link only when authenticated as admin', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/auth/me') {
        return Promise.resolve({
          data: { data: { user: { _id: 'a1', name: 'Admin', role: 'admin' } } }
        });
      }
      return Promise.resolve({ data: { data: {} } });
    });

    renderWithProviders(<Navbar />);

    expect(await screen.findByText('Verification Queue')).toBeInTheDocument();
    expect(screen.queryByText('Tracker')).not.toBeInTheDocument();
  });

  it('renders LandingPage mission and empty state when no opportunities exist', async () => {
    api.get.mockImplementation((url) => {
      if (url.startsWith('/opportunities')) {
        return Promise.resolve({ data: { data: { opportunities: [] } } });
      }
      return Promise.resolve({ data: { data: {} } });
    });

    renderWithProviders(<LandingPage />);

    expect(
      await screen.findByText(/find verified student opportunities across every discipline/i)
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/no active opportunities published yet/i)
    ).toBeInTheDocument();
  });
});

