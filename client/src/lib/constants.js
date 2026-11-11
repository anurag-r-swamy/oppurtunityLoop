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

export const EXPERIENCE_LEVELS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' }
];

export const EVENT_MODES = [
  { value: 'online', label: 'Online' },
  { value: 'offline', label: 'Offline' },
  { value: 'hybrid', label: 'Hybrid' }
];

export const OPPORTUNITY_CATEGORIES = [
  { value: 'hackathon', label: 'Hackathons' },
  { value: 'coding-contest', label: 'Coding Contests' },
  { value: 'research', label: 'Research Presentations' },
  { value: 'case-competition', label: 'Case Competitions' },
  { value: 'quiz', label: 'Quizzes' },
  { value: 'debate', label: 'Debates' },
  { value: 'design-challenge', label: 'Design Challenges' },
  { value: 'cultural', label: 'Cultural Competitions' },
  { value: 'workshop', label: 'Workshops' },
  { value: 'fellowship', label: 'Fellowships' }
];

export const PARTICIPATION_STATUSES = [
  { value: 'interested', label: 'Interested' },
  { value: 'registered', label: 'Registered' },
  { value: 'preparing', label: 'Preparing' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'participated', label: 'Participated' },
  { value: 'won', label: 'Won / Recognized' },
  { value: 'withdrawn', label: 'Withdrawn' }
];

export const PARTICIPATION_TRANSITIONS = {
  interested: ['registered', 'preparing', 'withdrawn'],
  registered: ['preparing', 'submitted', 'participated', 'withdrawn'],
  preparing: ['registered', 'submitted', 'participated', 'withdrawn'],
  submitted: ['participated', 'won', 'withdrawn'],
  participated: ['won'],
  won: [],
  withdrawn: ['interested', 'registered']
};

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

export const REPORT_REASONS = [
  { value: 'incorrect_deadline', label: 'Incorrect deadline' },
  { value: 'broken_link', label: 'Broken registration or source link' },
  { value: 'fake_event', label: 'Suspicious or fake event' },
  { value: 'incorrect_eligibility', label: 'Incorrect eligibility rules' },
  { value: 'duplicate_event', label: 'Duplicate listing' },
  { value: 'other', label: 'Other issue' }
];

