import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { Category } from '../models/Category.js';
import { Opportunity } from '../models/Opportunity.js';
import { seedDatabase } from '../scripts/seed.js';
import { app } from './helpers.js';

describe('Demo Seed Script & End-to-End Public/Recommendation Queries', () => {
  it('seeds demo categories and opportunities idempotently and excludes expired listing from active discovery', async () => {
    const first = await seedDatabase();
    const second = await seedDatabase();

    expect(first.categoriesCount).toBe(10);
    expect(first.demoOpportunitiesCount).toBe(10);
    expect(second.demoOpportunitiesCount).toBe(10);

    const catCount = await Category.countDocuments();
    const oppCount = await Opportunity.countDocuments();
    expect(catCount).toBe(10);
    expect(oppCount).toBe(10);

    // 9 active + 1 expired sample -> active discovery returns 9
    const publicRes = await request(app).get('/api/v1/opportunities?limit=20');
    expect(publicRes.status).toBe(200);
    expect(publicRes.body.data.pagination.total).toBe(9);
    expect(
      publicRes.body.data.opportunities.every((o) => o.isDemoData === true)
    ).toBe(true);

    // Demo student login & recommendations
    const agent = request.agent(app);
    const csrfRes = await agent.get('/api/v1/auth/csrf-token');
    const loginRes = await agent
      .post('/api/v1/auth/login')
      .set('x-csrf-token', csrfRes.body.data.csrfToken)
      .send({ email: 'student.demo@example.com', password: 'DemoPass@123' });

    expect(loginRes.status).toBe(200);

    const recRes = await agent.get('/api/v1/recommendations');
    expect(recRes.status).toBe(200);
    expect(recRes.body.data.recommendations.length).toBeGreaterThan(0);
    expect(recRes.body.data.recommendations[0].explanation.scoreVersion).toBe('v1');
  });
});

