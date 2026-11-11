import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getApiErrorMessage } from '../../lib/api';

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  email: z.string().trim().email('Enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Za-z]/, 'Include at least one letter')
    .regex(/[0-9]/, 'Include at least one number'),
  role: z.enum(['student', 'organizer']),
  organizationName: z.string().trim().optional()
});

export function RegisterPage() {
  const { register: registerUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [serverError, setServerError] = useState('');

  const defaultRole = searchParams.get('role') === 'organizer' ? 'organizer' : 'student';

  const {
    register,
    watch,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: defaultRole
    }
  });

  const selectedRole = watch('role');

  const onSubmit = async (values) => {
    setServerError('');
    try {
      const created = await registerUser(values);
      showToast('Account created successfully!', 'success');
      navigate(created.role === 'organizer' ? '/organizer' : '/student/profile', {
        replace: true
      });
    } catch (err) {
      setServerError(getApiErrorMessage(err, 'Registration failed.'));
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-xs">
        <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
        <p className="mt-1 text-sm text-slate-600">
          Join OpportunityLoop as a college student or event organizer.
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
            <label htmlFor="reg-role" className="block text-sm font-medium text-slate-700">
              Account Role
            </label>
            <select
              id="reg-role"
              {...register('role')}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm"
            >
              <option value="student">Student</option>
              <option value="organizer">Event Organizer / Campus Club</option>
            </select>
          </div>

          <div>
            <label htmlFor="reg-name" className="block text-sm font-medium text-slate-700">
              Full Name
            </label>
            <input
              id="reg-name"
              type="text"
              {...register('name')}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
            />
            {errors.name && <p className="mt-1 text-xs text-rose-600">{errors.name.message}</p>}
          </div>

          {selectedRole === 'organizer' && (
            <div>
              <label htmlFor="reg-org" className="block text-sm font-medium text-slate-700">
                Organization / College Club Name
              </label>
              <input
                id="reg-org"
                type="text"
                {...register('organizationName')}
                placeholder="e.g., Campus Debate Society"
                className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
              />
            </div>
          )}

          <div>
            <label htmlFor="reg-email" className="block text-sm font-medium text-slate-700">
              Email Address
            </label>
            <input
              id="reg-email"
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
            <label htmlFor="reg-password" className="block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="reg-password"
              type="password"
              autoComplete="new-password"
              {...register('password')}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
            />
            <p className="mt-1 text-[11px] text-slate-500">
              Minimum 8 characters with at least 1 letter and 1 number.
            </p>
            {errors.password && (
              <p className="mt-1 text-xs text-rose-600">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-600">
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-indigo-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

