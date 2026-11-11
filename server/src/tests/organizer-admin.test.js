import { describe, expect, it } from 'vitest';
import { AuditLog } from '../models/AuditLog.js';
import { createAdminAgent, registerUserAndAgent } from './helpers.js';

describe('Organizer Submission & Admin Verification Workflow', () => {
  it('enforces organizer submit -> admin verify -> audit log recording', async () => {
    const { agent: orgAgent, csrf: orgCsrf } = await registerUserAndAgent({
      email: 'orgflow@example.com',
      role: 'organizer',
      organizationName: 'Campus Guild'
    });

    const now = Date.now();
    const createRes = await orgAgent
      .post('/api/v1/organizer/opportunities')
      .set('x-csrf-token', orgCsrf)
      .send({
        title: 'National Research Presentation',
        shortDescription: 'Interdisciplinary research presentation for college students.',
        fullDescription: 'Submit an original abstract across science, law, or management.',
        category: 'research',
        officialSourceUrl: 'https://example.org/research',
        registrationUrl: 'https://example.org/research/register',
        eventMode: 'hybrid',
        deadline: new Date(now + 10 * 86400000).toISOString(),
        eventStartDate: new Date(now + 14 * 86400000).toISOString(),
        eventEndDate: new Date(now + 15 * 86400000).toISOString(),
        eligibilityRules: { openToAllDisciplines: true }
      });

    expect(createRes.status).toBe(201);
    const oppId = createRes.body.data.opportunity._id;
    expect(createRes.body.data.opportunity.publicationStatus).toBe('draft');
    expect(createRes.body.data.opportunity.verificationStatus).toBe('pending');

    // Organizer cannot call admin verify endpoint
    const selfVerify = await orgAgent
      .patch(`/api/v1/admin/opportunities/${oppId}/verify`)
      .set('x-csrf-token', orgCsrf);
    expect(selfVerify.status).toBe(403);

    // Organizer submits for review
    const submitRes = await orgAgent
      .post(`/api/v1/organizer/opportunities/${oppId}/submit`)
      .set('x-csrf-token', orgCsrf);
    expect(submitRes.status).toBe(200);
    expect(submitRes.body.data.opportunity.submittedAt).toBeTruthy();

    // Admin verifies
    const { agent: adminAgent, csrf: adminCsrf } = await createAdminAgent();
    const pendingRes = await adminAgent.get('/api/v1/admin/opportunities/pending');
    expect(pendingRes.body.data.opportunities.some((o) => o._id === oppId)).toBe(true);

    const verifyRes = await adminAgent
      .patch(`/api/v1/admin/opportunities/${oppId}/verify`)
      .set('x-csrf-token', adminCsrf);
    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.data.opportunity.verificationStatus).toBe('verified');
    expect(verifyRes.body.data.opportunity.publicationStatus).toBe('published');

    const audit = await AuditLog.findOne({ action: 'OPPORTUNITY_VERIFIED', entityId: oppId }).lean();
    expect(audit).toBeTruthy();
  });
});

