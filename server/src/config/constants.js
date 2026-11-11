export const USER_ROLES = ['student', 'organizer', 'admin'];

export const ACCOUNT_STATUSES = ['active', 'suspended'];

export const ACADEMIC_DISCIPLINES = [
  'Engineering and Technology',
  'MCA, Computer Science, and IT',
  'Science and Research',
  'Commerce and Management',
  'Arts and Humanities',
  'Law',
  'Design and Media',
  'Medicine and Allied Disciplines',
  'Education',
  'Other'
];

export const DEGREE_LEVELS = [
  'Diploma',
  'Undergraduate',
  'Postgraduate',
  'Doctoral',
  'Integrated'
];

export const EXPERIENCE_LEVELS = ['beginner', 'intermediate', 'advanced'];

export const EVENT_MODES = ['online', 'offline', 'hybrid'];

export const OPPORTUNITY_CATEGORIES = [
  'hackathon',
  'coding-contest',
  'research',
  'case-competition',
  'quiz',
  'debate',
  'design-challenge',
  'cultural',
  'workshop',
  'fellowship'
];

export const VERIFICATION_STATUSES = ['pending', 'verified', 'rejected', 'needs_review'];

export const PUBLICATION_STATUSES = ['draft', 'published', 'expired', 'archived'];

export const PARTICIPATION_STATUSES = [
  'interested',
  'registered',
  'preparing',
  'submitted',
  'participated',
  'won',
  'withdrawn'
];

// Allowed state transitions for Participation workflow
export const PARTICIPATION_TRANSITIONS = {
  interested: ['registered', 'preparing', 'withdrawn'],
  registered: ['preparing', 'submitted', 'participated', 'withdrawn'],
  preparing: ['registered', 'submitted', 'participated', 'withdrawn'],
  submitted: ['participated', 'won', 'withdrawn'],
  participated: ['won'],
  won: [],
  withdrawn: ['interested', 'registered']
};

export const REPORT_REASONS = [
  'incorrect_deadline',
  'broken_link',
  'fake_event',
  'incorrect_eligibility',
  'duplicate_event',
  'other'
];

export const REPORT_STATUSES = ['open', 'under_review', 'resolved', 'dismissed'];

export const INDIAN_STATES = [
  'All India',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Chandigarh',
  'Jammu and Kashmir',
  'Ladakh',
  'Puducherry'
];

// Configurable weights for Explainable Participation Engine (must sum to 100)
export const RECOMMENDATION_WEIGHTS = {
  version: 'v1',
  interests: 25,
  skills: 25,
  academicRelevance: 20,
  beginnerSuitability: 10,
  modePreference: 10,
  locationPreference: 5,
  deadlineFeasibility: 5
};

