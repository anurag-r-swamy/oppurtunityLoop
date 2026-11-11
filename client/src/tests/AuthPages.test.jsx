import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { api } from '../lib/api';
import { LoginPage } from '../pages/public/LoginPage';
import { RegisterPage } from '../pages/public/RegisterPage';
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

describe('Auth Pages Validation', () => {
  it('displays inline validation errors on empty login submit', async () => {
    api.get.mockResolvedValue({ data: { data: {} } });
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText(/enter a valid email address/i)).toBeInTheDocument();
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
  });

  it('validates password complexity during registration', async () => {
    api.get.mockResolvedValue({ data: { data: {} } });
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />);

    await user.type(screen.getByLabelText(/full name/i), 'Ananya Rao');
    await user.type(screen.getByLabelText(/email address/i), 'ananya@example.com');
    await user.type(screen.getByLabelText(/password/i), 'weak');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
    });
  });
});

