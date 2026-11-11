import bcrypt from 'bcryptjs';
import request from 'supertest';
import { createApp } from '../app.js';
import { User } from '../models/User.js';
import { Opportunity } from '../models/Opportunity.js';

export const app = createApp();

export function extractCsrfFromCookies(setCookies = []) {
  for (const cookie of setCookies) {
    const match = cookie.match(/ol_csrf=([^;]+)/);
    if (match) return match[1];
  }
  return '';
}

export async function registerUserAndAgent({
  name = 'Test User',
  email,
  password = 'Password123',
  role = 'student',
  organizationName
}) {
  const agent = request.agent(app);
  const csrfRes = await agent.get('/api/v1/auth/csrf-token');
  const csrf = csrfRes.body.data.csrfToken;

  const res = await agent
    .post('/api/v1/auth/register')
    .set('x-csrf-token', csrf)
    .send({ name, email, password, role, organizationName });

  return { agent, csrf, res, user: res.body?.data?.user };
}

export async function createAdminAgent(email = 'admin@example.com') {
  const password = 'AdminPassword123';
  const passwordHash = await bcrypt.hash(password, 10);
  const admin = await User.create({
    name: 'Platform Admin',
    email,
    passwordHash,
    role: 'admin',
    accountStatus: 'active'
  });

  const agent = request.agent(app);
  const csrfRes = await agent.get('/api/v1/auth/csrf-token');
  const csrf = csrfRes.body.data.csrfToken;

  await agent
    .post('/api/v1/auth/login')
    .set('x-csrf-token', csrf)
    .send({ email, password });

  return { agent, csrf, admin };
}

export async function createVerifiedOpportunity(organizerId, overrides = {}) {
  const now = Date.now();
  const future = (d) => new Date(now + d * 86400000);
  return Opportunity.create({
    title: 'Sample Verified Hackathon',
    slug: `sample-opp-${Math.random().toString(36).slice(2, 8)}`,
    shortDescription: 'A verified sample competition for testing OpportunityLoop.',
    fullDescription:
      'Full description of this verified sample competition with sufficient length for validation.',
    category: 'hackathon',
    tags: ['Web', 'Civic Tech'],
    organizerId,
    organizerName: 'Sample Organizer',
    officialSourceUrl: 'https://example.org/event',
    registrationUrl: 'https://example.org/register',
    eventMode: 'online',
    location: { state: 'All India', city: '', venue: 'Online' },
    eligibilityRules: {
      allowedDisciplines: ['MCA, Computer Science, and IT', 'Engineering and Technology'],
      allowedDegreeLevels: ['Undergraduate', 'Postgraduate'],
      allowedYears: [1, 2, 3, 4],
      allowedStates: ['All India'],
      openToAllDisciplines: false
    },
    feeAmount: 0,
    deadline: future(10),
    eventStartDate: future(12),
    eventEndDate: future(14),
    teamSize: { min: 1, max: 4 },
    requiredSkills: ['JavaScript', 'React'],
    beginnerFriendly: true,
    verificationStatus: 'verified',
    publicationStatus: 'published',
    submittedBy: organizerId,
    lastVerifiedAt: new Date(),
    isDemoData: true,
    ...overrides
  });
}

