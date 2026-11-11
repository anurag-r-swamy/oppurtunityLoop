import { describe, expect, it } from 'vitest';
import { createVerifiedOpportunity, registerUserAndAgent } from './helpers.js';

describe('Bookmarks & Participation Ownership and Status Transitions', () => {
  it('prevents duplicate bookmarks and supports removal', async () => {
    const { user: org } = await registerUserAndAgent({
      email: 'orgbm@example.com',
      role: 'organizer'
    });
    const opp = await createVerifiedOpportunity(org._id);

    const { agent, csrf } = await registerUserAndAgent({
      email: 'stubm@example.com',
      role: 'student'
    });

    const first = await agent
      .post(`/api/v1/opportunities/${opp._id}/bookmark`)
      .set('x-csrf-token', csrf);
    expect(first.status).toBe(201);

    const dup = await agent
      .post(`/api/v1/opportunities/${opp._id}/bookmark`)
      .set('x-csrf-token', csrf);
    expect(dup.status).toBe(409);

    const list = await agent.get('/api/v1/bookmarks');
    expect(list.body.data.bookmarks).toHaveLength(1);

    const del = await agent
      .delete(`/api/v1/opportunities/${opp._id}/bookmark`)
      .set('x-csrf-token', csrf);
    expect(del.status).toBe(200);
  });

  it('enforces participation ownership and valid status transitions', async () => {
    const { user: org } = await registerUserAndAgent({
      email: 'orgpart@example.com',
      role: 'organizer'
    });
    const opp = await createVerifiedOpportunity(org._id);

    const { agent: stu1, csrf: csrf1 } = await registerUserAndAgent({
      email: 'stu1@example.com',
      role: 'student'
    });
    const { agent: stu2, csrf: csrf2 } = await registerUserAndAgent({
      email: 'stu2@example.com',
      role: 'student'
    });

    const created = await stu1
      .post(`/api/v1/opportunities/${opp._id}/participation`)
      .set('x-csrf-token', csrf1)
      .send({ status: 'interested' });

    expect(created.status).toBe(201);
    const partId = created.body.data.participation._id;

    // Student 2 cannot read or modify Student 1's participation record
    const otherRead = await stu2.get(`/api/v1/participations/${partId}`);
    expect(otherRead.status).toBe(403);

    const otherPatch = await stu2
      .patch(`/api/v1/participations/${partId}`)
      .set('x-csrf-token', csrf2)
      .send({ status: 'registered' });
    expect(otherPatch.status).toBe(403);

    // Invalid status transition: interested -> won directly is rejected
    const invalidTransition = await stu1
      .patch(`/api/v1/participations/${partId}`)
      .set('x-csrf-token', csrf1)
      .send({ status: 'won' });
    expect(invalidTransition.status).toBe(400);
    expect(invalidTransition.body.error.code).toBe('INVALID_STATUS_TRANSITION');

    // Valid status transitions: interested -> registered -> submitted -> participated -> won
    const reg = await stu1
      .patch(`/api/v1/participations/${partId}`)
      .set('x-csrf-token', csrf1)
      .send({ status: 'registered' });
    expect(reg.status).toBe(200);
    expect(reg.body.data.participation.registeredAt).toBeTruthy();

    const sub = await stu1
      .patch(`/api/v1/participations/${partId}`)
      .set('x-csrf-token', csrf1)
      .send({ status: 'submitted' });
    expect(sub.status).toBe(200);

    const part = await stu1
      .patch(`/api/v1/participations/${partId}`)
      .set('x-csrf-token', csrf1)
      .send({ status: 'participated' });
    expect(part.status).toBe(200);

    const won = await stu1
      .patch(`/api/v1/participations/${partId}`)
      .set('x-csrf-token', csrf1)
      .send({ status: 'won', outcome: 'Finalist' });
    expect(won.status).toBe(200);
    expect(won.body.data.participation.outcome).toBe('Finalist');
  });
});

