import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app, createVerifiedOpportunity, registerUserAndAgent } from './helpers.js';

describe('Opportunities Search, Filtering, Pagination, and Ownership', () => {
  it('filters active opportunities, excludes expired/unverified, and paginates properly', async () => {
    const { user: org } = await registerUserAndAgent({
      email: 'org@example.com',
      role: 'organizer'
    });

    const now = Date.now();
    await createVerifiedOpportunity(org._id, {
      title: 'Civic Tech Hack',
      category: 'hackathon',
      eventMode: 'online',
      feeAmount: 0,
      beginnerFriendly: true,
      deadline: new Date(now + 5 * 86400000)
    });
    await createVerifiedOpportunity(org._id, {
      title: 'Law Moot Quiz',
      category: 'quiz',
      eventMode: 'offline',
      location: { state: 'Delhi', city: 'New Delhi', venue: 'Campus' },
      feeAmount: 200,
      beginnerFriendly: false,
      deadline: new Date(now + 8 * 86400000)
    });
    await createVerifiedOpportunity(org._id, {
      title: 'Design Challenge Alpha',
      category: 'design-challenge',
      eventMode: 'hybrid',
      feeAmount: 0,
      deadline: new Date(now + 12 * 86400000)
    });
    // Expired listing (should be excluded by default)
    await createVerifiedOpportunity(org._id, {
      title: 'Expired Contest',
      category: 'coding-contest',
      deadline: new Date(now - 2 * 86400000),
      publicationStatus: 'expired'
    });
    // Pending unverified listing (should not be publicly visible)
    await createVerifiedOpportunity(org._id, {
      title: 'Unverified Draft',
      verificationStatus: 'pending',
      publicationStatus: 'draft'
    });

    const allActive = await request(app).get('/api/v1/opportunities');
    expect(allActive.status).toBe(200);
    expect(allActive.body.data.pagination.total).toBe(3);

    const hackFilter = await request(app).get('/api/v1/opportunities?category=hackathon&feeType=free');
    expect(hackFilter.body.data.opportunities).toHaveLength(1);
    expect(hackFilter.body.data.opportunities[0].title).toBe('Civic Tech Hack');

    const searchFilter = await request(app).get('/api/v1/opportunities?q=Moot');
    expect(searchFilter.body.data.opportunities).toHaveLength(1);
    expect(searchFilter.body.data.opportunities[0].title).toBe('Law Moot Quiz');

    const page1 = await request(app).get('/api/v1/opportunities?limit=2&page=1');
    const page2 = await request(app).get('/api/v1/opportunities?limit=2&page=2');
    expect(page1.body.data.opportunities).toHaveLength(2);
    expect(page2.body.data.opportunities).toHaveLength(1);
    expect(page1.body.data.pagination.totalPages).toBe(2);
  });

  it('prevents an organizer from editing another organizer listing', async () => {
    const { agent: org1Agent, csrf: csrf1, user: org1 } = await registerUserAndAgent({
      email: 'org1@example.com',
      role: 'organizer'
    });
    const { agent: org2Agent, csrf: csrf2 } = await registerUserAndAgent({
      email: 'org2@example.com',
      role: 'organizer'
    });

    const opp = await createVerifiedOpportunity(org1._id, {
      verificationStatus: 'pending',
      publicationStatus: 'draft'
    });

    const unauthorizedPatch = await org2Agent
      .patch(`/api/v1/organizer/opportunities/${opp._id}`)
      .set('x-csrf-token', csrf2)
      .send({ title: 'Hijacked Title' });

    expect(unauthorizedPatch.status).toBe(403);

    const authorizedPatch = await org1Agent
      .patch(`/api/v1/organizer/opportunities/${opp._id}`)
      .set('x-csrf-token', csrf1)
      .send({ title: 'Updated Legitimate Title' });

    expect(authorizedPatch.status).toBe(200);
    expect(authorizedPatch.body.data.opportunity.title).toBe('Updated Legitimate Title');
  });
});

