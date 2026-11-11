import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getApiErrorMessage } from '../../lib/api';

const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required')
});

export function LoginPage() {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (values) => {
    setServerError('');
    try {
      const loggedIn = await login(values);
      showToast(`Welcome back, ${loggedIn.name}!`, 'success');
      const fallback =
        loggedIn.role === 'admin'
          ? '/admin'
          : loggedIn.role === 'organizer'
            ? '/organizer'
            : '/student';
      navigate(location.state?.from || fallback, { replace: true });
    } catch (err) {
      setServerError(getApiErrorMessage(err, 'Invalid email or password.'));
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-xs">
        <h1 className="text-2xl font-bold text-slate-900">Sign in to OpportunityLoop</h1>
        <p className="mt-1 text-sm text-slate-600">
          Access your recommendations, participation tracker, or organizer listings.
        </p>

        {serverError && (
          <div
            role="alert"
            className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
          >
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4" noValidate>
          <div>
            <label htmlFor="login-email" className="block text-sm font-medium text-slate-700">
              Email address
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              {...register('email')}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-rose-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="login-password" className="block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              {...register('password')}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
            />
            {errors.password && (
              <p className="mt-1 text-xs text-rose-600">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-600">
          New to OpportunityLoop?{' '}
          <Link to="/register" className="font-semibold text-indigo-600 hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

