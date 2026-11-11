import {
  evaluateEligibility,
  rankOpportunitiesForStudent,
  scoreOpportunityForStudent
} from '../services/recommendationEngine.js';

const now = new Date('2026-11-11T00:00:00Z');
const future = (days) => new Date(now.getTime() + days * 86400000);
const past = (days) => new Date(now.getTime() - days * 86400000);

const mcaStudent = {
  _id: 'stu-mca',
  studentProfile: {
    discipline: 'MCA, Computer Science, and IT',
    degreeLevel: 'Postgraduate',
    course: 'MCA',
    currentYear: 2,
    age: 22,
    state: 'Karnataka',
    skills: ['JavaScript', 'React', 'Node.js', 'MongoDB'],
    interests: ['Web Development', 'Civic Tech'],
    experienceLevel: 'intermediate',
    preferredEventModes: ['online'],
    preferredCategories: ['hackathon']
  }
};

const incompleteStudent = {
  _id: 'stu-incomplete',
  studentProfile: {
    skills: [],
    interests: []
  }
};

const sampleOpps = [
  {
    _id: 'opp-soon-law',
    title: 'Law Policy Quiz (Soonest Deadline)',
    category: 'quiz',
    tags: ['Constitutional Law'],
    eventMode: 'online',
    location: { state: 'All India' },
    requiredSkills: ['Policy Analysis'],
    beginnerFriendly: true,
    deadline: future(2),
    publicationStatus: 'published',
    verificationStatus: 'verified',
    lastVerifiedAt: now,
    officialSourceUrl: 'https://example.org/law',
    eligibilityRules: {
      allowedDisciplines: ['Law'],
      allowedDegreeLevels: ['Undergraduate', 'Postgraduate'],
      openToAllDisciplines: false
    }
  },
  {
    _id: 'opp-hackathon-match',
    title: 'CivicTech Campus Hackathon',
    category: 'hackathon',
    tags: ['Civic Tech', 'Web Development'],
    eventMode: 'online',
    location: { state: 'All India' },
    requiredSkills: ['JavaScript', 'React', 'Node.js'],
    beginnerFriendly: false,
    deadline: future(12),
    publicationStatus: 'published',
    verificationStatus: 'verified',
    lastVerifiedAt: now,
    officialSourceUrl: 'https://example.org/hack',
    eligibilityRules: {
      allowedDisciplines: ['MCA, Computer Science, and IT', 'Engineering and Technology'],
      allowedDegreeLevels: ['Undergraduate', 'Postgraduate'],
      openToAllDisciplines: false
    }
  },
  {
    _id: 'opp-unknown-rules',
    title: 'General Design Sprint (No Academic Criteria)',
    category: 'design-challenge',
    tags: ['UI/UX'],
    eventMode: 'online',
    location: { state: 'All India' },
    requiredSkills: ['Figma'],
    beginnerFriendly: true,
    deadline: future(8),
    publicationStatus: 'published',
    verificationStatus: 'verified',
    lastVerifiedAt: now,
    officialSourceUrl: 'https://example.org/design',
    eligibilityRules: {
      openToAllDisciplines: false
    }
  },
  {
    _id: 'opp-expired',
    title: 'Expired Coding Contest',
    category: 'coding-contest',
    tags: ['Algorithms'],
    eventMode: 'online',
    location: { state: 'All India' },
    requiredSkills: ['Python'],
    beginnerFriendly: true,
    deadline: past(2),
    publicationStatus: 'published',
    verificationStatus: 'verified',
    lastVerifiedAt: now,
    officialSourceUrl: 'https://example.org/expired',
    eligibilityRules: {
      openToAllDisciplines: true
    }
  }
];

function runEvaluation() {
  // 1. Controlled Eligibility Checks
  const eligChecks = [
    {
      name: 'MCA student on MCA/PG Hackathon',
      expected: 'eligible',
      actual: evaluateEligibility(mcaStudent.studentProfile, sampleOpps[1], now).status
    },
    {
      name: 'MCA student on Law-only Quiz',
      expected: 'ineligible',
      actual: evaluateEligibility(mcaStudent.studentProfile, sampleOpps[0], now).status
    },
    {
      name: 'MCA student on event with missing academic rules',
      expected: 'unknown',
      actual: evaluateEligibility(mcaStudent.studentProfile, sampleOpps[2], now).status
    },
    {
      name: 'Incomplete profile on restricted Hackathon',
      expected: 'unknown',
      actual: evaluateEligibility(incompleteStudent.studentProfile, sampleOpps[1], now).status
    },
    {
      name: 'Expired opportunity check',
      expected: 'ineligible',
      actual: evaluateEligibility(mcaStudent.studentProfile, sampleOpps[3], now).status
    }
  ];

  const eligPassed = eligChecks.filter((c) => c.expected === c.actual).length;

  // 2. Personalized Ranking vs Chronological Baseline
  const chronologicalOrder = sampleOpps
    .filter((o) => o.deadline > now)
    .sort((a, b) => a.deadline - b.deadline)
    .map((o) => o._id);

  const personalized = rankOpportunitiesForStudent(mcaStudent, sampleOpps, { now });
  const personalizedOrder = personalized.map((r) => r.opportunity._id);

  // 3. Missing data behavior check
  const incompleteScore = scoreOpportunityForStudent(incompleteStudent, sampleOpps[1], undefined, now);
  const fullScore = scoreOpportunityForStudent(mcaStudent, sampleOpps[1], undefined, now);

  console.log('=== OpportunityLoop Recommendation Engine Evaluation ===');
  console.log(`Eligibility classification accuracy: ${eligPassed}/${eligChecks.length}`);
  for (const check of eligChecks) {
    console.log(`  - ${check.name}: expected=${check.expected}, actual=${check.actual}`);
  }
  console.log('\nChronological baseline top-1 (active):', chronologicalOrder[0]);
  console.log('Personalized ranking top-1:', personalizedOrder[0]);
  console.log('Expired opportunity excluded from personalized:', !personalizedOrder.includes('opp-expired'));
  console.log('Ineligible opportunity excluded from personalized:', !personalizedOrder.includes('opp-soon-law'));
  console.log(
    `\nScore comparison on target Hackathon -> Complete profile: ${fullScore.score}, Incomplete profile: ${incompleteScore.score}`
  );
  console.log('Incomplete profile missingInformation:', incompleteScore.missingInformation);
}

runEvaluation();

