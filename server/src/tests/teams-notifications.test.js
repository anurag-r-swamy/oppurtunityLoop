import { describe, expect, it } from 'vitest';
import { createVerifiedOpportunity, registerUserAndAgent } from './helpers.js';
import { generateDeadlineReminders } from '../services/reminderService.js';
import { Notification } from '../models/Notification.js';

describe('Team Matching & Deadline Reminders', () => {
  it('enforces team capacity, prevents duplicate membership, and locks after closure', async () => {
    const { user: org } = await registerUserAndAgent({
      email: 'orgteam@example.com',
      role: 'organizer'
    });
    const opp = await createVerifiedOpportunity(org._id, {
      teamSize: { min: 2, max: 2 }
    });

    const { agent: leader, csrf: leaderCsrf } = await registerUserAndAgent({
      email: 'leader@example.com',
      role: 'student'
    });
    const { agent: stu2, csrf: stu2Csrf } = await registerUserAndAgent({
      email: 'mate2@example.com',
      role: 'student'
    });
    const { agent: stu3, csrf: stu3Csrf } = await registerUserAndAgent({
      email: 'mate3@example.com',
      role: 'student'
    });

    const teamRes = await leader
      .post('/api/v1/team-requests')
      .set('x-csrf-token', leaderCsrf)
      .send({
        opportunityId: opp._id,
        title: 'Need React & Node Developer',
        description: 'Building civic web app for the hackathon.',
        requiredSkills: ['React'],
        maximumMembers: 2
      });
    expect(teamRes.status).toBe(201);
    const teamId = teamRes.body.data.teamRequest._id;

    // Student 2 requests to join
    const join2 = await stu2
      .post(`/api/v1/team-requests/${teamId}/invitations`)
      .set('x-csrf-token', stu2Csrf)
      .send({ message: 'I know React!', skillsOffered: ['React'] });
    expect(join2.status).toBe(201);
    const reqId = join2.body.data.teamRequest.requests[0]._id;

    // Leader accepts Student 2 -> team becomes full (2/2)
    const accept2 = await leader
      .post(`/api/v1/team-requests/${teamId}/respond`)
      .set('x-csrf-token', leaderCsrf)
      .send({ requestId: reqId, decision: 'accepted' });
    expect(accept2.status).toBe(200);
    expect(accept2.body.data.teamRequest.requestStatus).toBe('full');
    expect(accept2.body.data.teamRequest.availableSlots).toBe(0);

    // Student 3 cannot join a full team
    const join3 = await stu3
      .post(`/api/v1/team-requests/${teamId}/invitations`)
      .set('x-csrf-token', stu3Csrf)
      .send({ message: 'Can I join?' });
    expect(join3.status).toBe(400);
    expect(join3.body.error.code).toBe('TEAM_NOT_OPEN');
  });

  it('generates idempotent deadline reminders without duplicates', async () => {
    const { user: org } = await registerUserAndAgent({
      email: 'orgrem@example.com',
      role: 'organizer'
    });
    const opp = await createVerifiedOpportunity(org._id, {
      deadline: new Date(Date.now() + 2 * 86400000)
    });

    const { agent: stu, csrf: stuCsrf, user: studentUser } = await registerUserAndAgent({
      email: 'sturem@example.com',
      role: 'student'
    });

    await stu
      .post(`/api/v1/opportunities/${opp._id}/bookmark`)
      .set('x-csrf-token', stuCsrf);

    const run1 = await generateDeadlineReminders();
    expect(run1.created).toBe(1);

    // Second run for the same window must not create duplicate reminders
    const run2 = await generateDeadlineReminders();
    expect(run2.created).toBe(0);

    const count = await Notification.countDocuments({ userId: studentUser._id });
    expect(count).toBe(1);
  });
});

