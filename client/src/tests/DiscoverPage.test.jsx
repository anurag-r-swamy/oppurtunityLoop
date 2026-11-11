import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { api } from '../lib/api';
import { DiscoverPage } from '../pages/public/DiscoverPage';
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

describe('DiscoverPage Search, Filters, Bookmarks, Error & Empty States', () => {
  it('renders opportunities, filters by category, and toggles bookmark for logged-in user', async () => {
    const sampleOpp = {
      _id: 'opp1',
      title: 'Sample Civic Hackathon',
      organizerName: 'Demo Guild',
      shortDescription: 'Build civic tools for students.',
      category: 'hackathon',
      eventMode: 'online',
      feeAmount: 0,
      feeCurrency: 'INR',
      deadline: new Date(Date.now() + 86400000 * 5).toISOString(),
      teamSize: { min: 1, max: 4 },
      verificationStatus: 'verified',
      isBookmarked: false,
      isDemoData: true
    };

    api.get.mockImplementation((url) => {
      if (url === '/auth/me') {
        return Promise.resolve({
          data: { data: { user: { _id: 'u1', name: 'Asha', role: 'student' } } }
        });
      }
      if (url.startsWith('/opportunities')) {
        return Promise.resolve({
          data: {
            data: {
              opportunities: [sampleOpp],
              pagination: { page: 1, totalPages: 1, total: 1 }
            }
          }
        });
      }
      return Promise.resolve({ data: { data: {} } });
    });
    api.post.mockResolvedValue({ data: { success: true } });

    const user = userEvent.setup();
    renderWithProviders(<DiscoverPage />);

    expect(await screen.findByText('Sample Civic Hackathon')).toBeInTheDocument();

    // Filter interaction
    await user.selectOptions(screen.getByLabelText(/category/i), 'hackathon');
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(expect.stringContaining('category=hackathon'));
    });

    // Bookmark interaction
    await user.click(screen.getByRole('button', { name: /bookmark opportunity/i }));
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/opportunities/opp1/bookmark');
    });
  });

  it('shows empty state when no opportunities match and error state with retry on failure', async () => {
    api.get.mockImplementation((url) => {
      if (url.startsWith('/opportunities')) {
        return Promise.reject(new Error('Network down'));
      }
      return Promise.resolve({ data: { data: {} } });
    });

    renderWithProviders(<DiscoverPage />);
    expect(await screen.findByText(/failed to load opportunities/i)).toBeInTheDocument();

    api.get.mockImplementation((url) => {
      if (url.startsWith('/opportunities')) {
        return Promise.resolve({
          data: {
            data: {
              opportunities: [],
              pagination: { page: 1, totalPages: 1, total: 0 }
            }
          }
        });
      }
      return Promise.resolve({ data: { data: {} } });
    });

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /retry/i }));
    expect(await screen.findByText(/no opportunities match your filters/i)).toBeInTheDocument();
  });
});

