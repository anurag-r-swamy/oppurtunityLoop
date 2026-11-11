import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app, createAdminAgent, registerUserAndAgent } from './helpers.js';

describe('Authentication & Authorization', () => {
  it('registers a student with valid input and returns user without passwordHash', async () => {
    const { res } = await registerUserAndAgent({
      name: 'Priya Sharma',
      email: 'priya@example.com',
      role: 'student'
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('priya@example.com');
    expect(res.body.data.user.role).toBe('student');
    expect(res.body.data.user.passwordHash).toBeUndefined();
  });

  it('never permits self-assigning admin role during registration', async () => {
    const { res } = await registerUserAndAgent({
      name: 'Sneaky User',
      email: 'sneaky@example.com',
      role: 'admin'
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects duplicate email registration', async () => {
    await registerUserAndAgent({ email: 'dup@example.com' });
    const { res } = await registerUserAndAgent({ email: 'DUP@example.com' });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EMAIL_EXISTS');
  });

  it('rejects invalid login credentials', async () => {
    await registerUserAndAgent({ email: 'user@example.com', password: 'Password123' });

    const agent = request.agent(app);
    const csrfRes = await agent.get('/api/v1/auth/csrf-token');
    const res = await agent
      .post('/api/v1/auth/login')
      .set('x-csrf-token', csrfRes.body.data.csrfToken)
      .send({ email: 'user@example.com', password: 'WrongPassword1' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('rejects unauthenticated access to protected routes and invalidates session on logout', async () => {
    const unauthRes = await request(app).get('/api/v1/auth/me');
    expect(unauthRes.status).toBe(401);

    const { agent, csrf } = await registerUserAndAgent({ email: 'session@example.com' });
    const meRes = await agent.get('/api/v1/auth/me');
    expect(meRes.status).toBe(200);

    const logoutRes = await agent.post('/api/v1/auth/logout').set('x-csrf-token', csrf);
    expect(logoutRes.status).toBe(200);

    const afterLogout = await agent.get('/api/v1/auth/me');
    expect(afterLogout.status).toBe(401);
  });

  it('forbids students from accessing admin endpoints', async () => {
    const { agent } = await registerUserAndAgent({ email: 'student1@example.com' });
    const adminRes = await agent.get('/api/v1/admin/dashboard');
    expect(adminRes.status).toBe(403);
    expect(adminRes.body.error.code).toBe('FORBIDDEN');

    const { agent: adminAgent } = await createAdminAgent();
    const okRes = await adminAgent.get('/api/v1/admin/dashboard');
    expect(okRes.status).toBe(200);
  });

  it('rejects mutating requests missing a valid CSRF token when authenticated', async () => {
    const { agent } = await registerUserAndAgent({ email: 'csrf@example.com' });

    const res = await agent
      .patch('/api/v1/users/me')
      .send({ name: 'Should Fail Without CSRF' });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('CSRF_INVALID');
  });

  it('sanitizes NoSQL $-prefixed operators in request bodies', async () => {
    await registerUserAndAgent({ email: 'nosql@example.com', password: 'Password123' });

    const agent = request.agent(app);
    const csrfRes = await agent.get('/api/v1/auth/csrf-token');
    const res = await agent
      .post('/api/v1/auth/login')
      .set('x-csrf-token', csrfRes.body.data.csrfToken)
      .send({ email: { $ne: '' }, password: { $gt: '' } });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

