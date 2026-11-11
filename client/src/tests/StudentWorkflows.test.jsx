import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { api } from '../lib/api';
import { ExplanationPanel } from '../components/opportunities/ExplanationPanel';
import { ParticipationDetailPage } from '../pages/student/ParticipationDetailPage';
import { ProtectedRoute } from '../components/common/ProtectedRoute';
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

describe('Recommendation Explanations, Participation Tracker, and Protected Routes', () => {
  it('renders recommendation explanation reasons, breakdown, and missing info', async () => {
    api.get.mockResolvedValue({ data: { data: {} } });
    renderWithProviders(
      <ExplanationPanel
        explanation={{
          score: 82,
          eligibility: 'unknown',
          scoreVersion: 'v1',
          reasons: ['Matches your selected interests'],
          ineligibilityReasons: [],
          missingInformation: ['Your current year of study'],
          nextActions: ['Update your student profile'],
          scoreBreakdown: {
            interests: { score: 25, max: 25 },
            skills: { score: 20, max: 25 }
          }
        }}
      />
    );

    expect(screen.getByText(/match score: 82\/100/i)).toBeInTheDocument();
    expect(screen.getByText(/matches your selected interests/i)).toBeInTheDocument();
    expect(screen.getByText(/your current year of study/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/auth/me');
    });
  });

  it('updates participation tracker status and checklist', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/auth/me') {
        return Promise.resolve({
          data: { data: { user: { _id: 's1', name: 'Student', role: 'student' } } }
        });
      }
      if (url === '/participations/p1') {
        return Promise.resolve({
          data: {
            data: {
              participation: {
                _id: 'p1',
                status: 'interested',
                verificationOrigin: 'self_reported',
                opportunityId: { title: 'Demo Science Symposium' },
                preparationChecklist: [{ _id: 'c1', text: 'Draft abstract', completed: false }]
              }
            }
          }
        });
      }
      return Promise.resolve({ data: { data: {} } });
    });

    api.patch.mockResolvedValue({
      data: {
        data: {
          participation: {
            _id: 'p1',
            status: 'registered',
            verificationOrigin: 'self_reported',
            opportunityId: { title: 'Demo Science Symposium' },
            preparationChecklist: [{ _id: 'c1', text: 'Draft abstract', completed: true }]
          }
        }
      }
    });

    const user = userEvent.setup();
    renderWithProviders(
      <Routes>
        <Route path="/student/participations/:id" element={<ParticipationDetailPage />} />
      </Routes>,
      { route: '/student/participations/p1' }
    );

    expect(await screen.findByText('Demo Science Symposium')).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText(/participation status/i), 'registered');
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith(
        '/participations/p1',
        expect.objectContaining({ status: 'registered' })
      );
    });
  });

  it('blocks student from viewing admin-protected routes', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/auth/me') {
        return Promise.resolve({
          data: { data: { user: { _id: 's1', name: 'Student', role: 'student' } } }
        });
      }
      return Promise.resolve({ data: { data: {} } });
    });

    renderWithProviders(
      <ProtectedRoute allowedRoles={['admin']}>
        <div>Admin Secret Panel</div>
      </ProtectedRoute>
    );

    expect(await screen.findByText(/access restricted/i)).toBeInTheDocument();
    expect(screen.queryByText('Admin Secret Panel')).not.toBeInTheDocument();
  });
});
