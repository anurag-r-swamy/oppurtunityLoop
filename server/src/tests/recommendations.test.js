import { describe, expect, it } from 'vitest';
import { createVerifiedOpportunity, registerUserAndAgent } from './helpers.js';

describe('Explainable Participation Engine (Recommendations & Eligibility)', () => {
  it('evaluates eligible, ineligible, and unknown cases and returns consistent explanations', async () => {
    const { user: org } = await registerUserAndAgent({
      email: 'orgrec@example.com',
      role: 'organizer'
    });

    const eligibleHack = await createVerifiedOpportunity(org._id, {
      title: 'MCA Web Hackathon',
      category: 'hackathon',
      tags: ['Web Development', 'Civic Tech'],
      requiredSkills: ['JavaScript', 'React'],
      eligibilityRules: {
        allowedDisciplines: ['MCA, Computer Science, and IT'],
        allowedDegreeLevels: ['Postgraduate'],
        allowedYears: [2],
        openToAllDisciplines: false
      }
    });

    const lawIneligible = await createVerifiedOpportunity(org._id, {
      title: 'Law Only Quiz',
      category: 'quiz',
      eligibilityRules: {
        allowedDisciplines: ['Law'],
        allowedDegreeLevels: ['Undergraduate'],
        openToAllDisciplines: false
      }
    });

    const unknownCriteria = await createVerifiedOpportunity(org._id, {
      title: 'Unspecified Criteria Design Event',
      category: 'design-challenge',
      eligibilityRules: {
        openToAllDisciplines: false
      }
    });

    // Expired opportunity must be excluded from active recommendations
    await createVerifiedOpportunity(org._id, {
      title: 'Expired Hackathon',
      deadline: new Date(Date.now() - 86400000),
      publicationStatus: 'published'
    });

    const { agent, csrf } = await registerUserAndAgent({
      email: 'sturec@example.com',
      role: 'student'
    });

    await agent
      .patch('/api/v1/users/me')
      .set('x-csrf-token', csrf)
      .send({
        studentProfile: {
          collegeName: 'Test College',
          course: 'MCA',
          discipline: 'MCA, Computer Science, and IT',
          degreeLevel: 'Postgraduate',
          currentYear: 2,
          state: 'Karnataka',
          skills: ['JavaScript', 'React', 'Node.js'],
          interests: ['Web Development', 'Civic Tech'],
          experienceLevel: 'beginner',
          preferredEventModes: ['online'],
          preferredCategories: ['hackathon']
        }
      });

    const recRes = await agent.get('/api/v1/recommendations');
    expect(recRes.status).toBe(200);
    const recs = recRes.body.data.recommendations;

    // Law-only (ineligible) and expired must be excluded by default
    expect(recs.some((r) => r.opportunity._id === String(lawIneligible._id))).toBe(false);
    expect(recs.some((r) => r.opportunity.title === 'Expired Hackathon')).toBe(false);

    // Eligible hackathon should rank #1 ahead of unknown criteria event
    expect(recs[0].opportunity._id).toBe(String(eligibleHack._id));
    expect(recs[0].explanation.eligibility).toBe('eligible');
    expect(recs[0].explanation.score).toBeGreaterThanOrEqual(75);
    expect(recs[0].explanation.reasons.length).toBeGreaterThan(0);

    // Unknown eligibility event must be marked 'unknown', never 'eligible'
    const unknownItem = recs.find((r) => r.opportunity._id === String(unknownCriteria._id));
    expect(unknownItem).toBeTruthy();
    expect(unknownItem.explanation.eligibility).toBe('unknown');
    expect(unknownItem.explanation.missingInformation.length).toBeGreaterThan(0);

    // Direct explanation endpoint for ineligible listing still explains why
    const expLaw = await agent.get(`/api/v1/recommendations/${lawIneligible._id}/explanation`);
    expect(expLaw.status).toBe(200);
    expect(expLaw.body.data.explanation.eligibility).toBe('ineligible');
    expect(expLaw.body.data.explanation.ineligibilityReasons.length).toBeGreaterThan(0);
  });
});

