import { MemoryRouter } from 'react-router-dom';
import { render } from '@testing-library/react';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';

export function renderWithProviders(ui, { route = '/' } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <ToastProvider>
        <AuthProvider>{ui}</AuthProvider>
      </ToastProvider>
    </MemoryRouter>
  );
}

