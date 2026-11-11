import bcrypt from 'bcryptjs';
import { pathToFileURL } from 'url';
import { connectDB, disconnectDB } from '../config/db.js';
import { Category } from '../models/Category.js';
import { Opportunity } from '../models/Opportunity.js';
import { PlatformSetting } from '../models/PlatformSetting.js';
import { User } from '../models/User.js';

function daysFromNow(days) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

const DEFAULT_CATEGORIES = [
  { slug: 'hackathon', name: 'Hackathons', description: 'Build prototypes and software solutions', sortOrder: 1 },
  { slug: 'coding-contest', name: 'Coding Contests', description: 'Competitive programming and algorithmic rounds', sortOrder: 2 },
  { slug: 'research', name: 'Research Presentations', description: 'Paper presentations, posters, and symposia', sortOrder: 3 },
  { slug: 'case-competition', name: 'Case Competitions', description: 'Business, finance, and strategy case challenges', sortOrder: 4 },
  { slug: 'quiz', name: 'Quizzes', description: 'General, domain, and academic quizzes', sortOrder: 5 },
  { slug: 'debate', name: 'Debates', description: 'Parliamentary debates and moot courts', sortOrder: 6 },
  { slug: 'design-challenge', name: 'Design Challenges', description: 'UI/UX, product design, and visual sprints', sortOrder: 7 },
  { slug: 'cultural', name: 'Cultural Competitions', description: 'Music, theatre, literature, and fine arts', sortOrder: 8 },
  { slug: 'workshop', name: 'Workshops', description: 'Hands-on technical and interdisciplinary workshops', sortOrder: 9 },
  { slug: 'fellowship', name: 'Fellowships', description: 'Student fellowships and leadership cohorts', sortOrder: 10 }
];

export async function seedDatabase() {
  for (const cat of DEFAULT_CATEGORIES) {
    await Category.updateOne({ slug: cat.slug }, { $setOnInsert: cat }, { upsert: true });
  }

  await PlatformSetting.updateOne(
    { key: 'global' },
    {
      $setOnInsert: {
        key: 'global',
        teamMatchingEnabled: true,
        requireAdminVerification: true,
        defaultReminderDays: [7, 3, 1],
        maintenanceBanner: ''
      }
    },
    { upsert: true }
  );

  const demoPasswordHash = await bcrypt.hash('DemoPass@123', 10);

  let demoOrganizer = await User.findOne({ email: 'organizer.demo@example.com' });
  if (!demoOrganizer) {
    demoOrganizer = await User.create({
      name: 'Demo Campus Consortium',
      email: 'organizer.demo@example.com',
      passwordHash: demoPasswordHash,
      role: 'organizer',
      organizerProfile: {
        organizationName: 'Demo Campus Consortium (Sample Organizer)',
        organizationType: 'university',
        websiteUrl: 'https://example.org/consortium',
        description: 'Sample organizer account used strictly for OpportunityLoop demo listings.'
      }
    });
  }

  let demoStudent = await User.findOne({ email: 'student.demo@example.com' });
  if (!demoStudent) {
    demoStudent = await User.create({
      name: 'Aarav Demo Student',
      email: 'student.demo@example.com',
      passwordHash: demoPasswordHash,
      role: 'student',
      studentProfile: {
        collegeName: 'Sample Institute of Computing',
        course: 'MCA',
        discipline: 'MCA, Computer Science, and IT',
        degreeLevel: 'Postgraduate',
        currentYear: 2,
        age: 22,
        state: 'Karnataka',
        city: 'Bengaluru',
        skills: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'Python'],
        interests: ['Web Development', 'Civic Tech', 'Open Source', 'Algorithms'],
        experienceLevel: 'intermediate',
        preferredEventModes: ['online', 'hybrid'],
        preferredCategories: ['hackathon', 'coding-contest'],
        availabilityPreferences: 'weekends'
      }
    });
  }

  const demoOpportunities = [
    {
      title: '[Demo] All-India CivicTech Campus Hackathon',
      slug: 'demo-all-india-civictech-campus-hackathon',
      shortDescription:
        'Sample 36-hour team hackathon focused on campus sustainability, digital accessibility, and local civic tools.',
      fullDescription:
        'This is clearly labelled demo data for OpportunityLoop. Build practical web or mobile prototypes solving civic and campus challenges across India. Teams of 2 to 4 students can participate remotely with mentor check-ins.',
      category: 'hackathon',
      tags: ['Civic Tech', 'Web Development', 'Open Source', 'Sustainability'],
      organizerName: 'Demo Campus Tech Guild',
      officialSourceUrl: 'https://example.org/events/civictech-hackathon',
      registrationUrl: 'https://example.org/register/civictech-hackathon',
      eventMode: 'online',
      location: { state: 'All India', city: '', venue: 'Online Portal' },
      eligibilityRules: {
        allowedDisciplines: [
          'Engineering and Technology',
          'MCA, Computer Science, and IT',
          'Design and Media'
        ],
        allowedDegreeLevels: ['Undergraduate', 'Postgraduate', 'Integrated'],
        allowedCourses: [],
        allowedYears: [1, 2, 3, 4],
        allowedStates: ['All India'],
        openToAllDisciplines: false,
        notes: 'Valid college ID required at registration.'
      },
      feeAmount: 0,
      deadline: daysFromNow(10),
      eventStartDate: daysFromNow(14),
      eventEndDate: daysFromNow(16),
      teamSize: { min: 2, max: 4 },
      requiredSkills: ['JavaScript', 'React', 'UI/UX', 'Problem Solving'],
      beginnerFriendly: true,
      defaultChecklist: [
        'Form a team of 2-4 students',
        'Review problem statements on the official sample portal',
        'Submit initial idea abstract before deadline'
      ]
    },
    {
      title: '[Demo] Collegiate Algorithmic Coding Sprint',
      slug: 'demo-collegiate-algorithmic-coding-sprint',
      shortDescription:
        'Sample individual competitive programming contest covering data structures, graphs, and dynamic programming.',
      fullDescription:
        'Demo listing representing a national collegiate coding contest. Solve 6 algorithmic problems in 3 hours using C++, Java, or Python.',
      category: 'coding-contest',
      tags: ['Algorithms', 'Data Structures', 'Competitive Programming'],
      organizerName: 'Example Programming Society',
      officialSourceUrl: 'https://example.org/events/algo-sprint',
      registrationUrl: 'https://example.org/register/algo-sprint',
      eventMode: 'online',
      location: { state: 'All India', city: '', venue: 'Online Judge' },
      eligibilityRules: {
        allowedDisciplines: [
          'Engineering and Technology',
          'MCA, Computer Science, and IT',
          'Science and Research'
        ],
        allowedDegreeLevels: ['Undergraduate', 'Postgraduate'],
        allowedCourses: [],
        allowedYears: [],
        allowedStates: ['All India'],
        openToAllDisciplines: false,
        notes: 'Individual participation only.'
      },
      feeAmount: 0,
      deadline: daysFromNow(5),
      eventStartDate: daysFromNow(7),
      eventEndDate: daysFromNow(7),
      teamSize: { min: 1, max: 1 },
      requiredSkills: ['Algorithms', 'Python', 'C++', 'Java'],
      beginnerFriendly: false,
      defaultChecklist: [
        'Test compiler setup on sample judge',
        'Review time and memory constraints',
        'Complete registration 24h early'
      ]
    },
    {
      title: '[Demo] Interdisciplinary Science & Research Poster Symposium',
      slug: 'demo-interdisciplinary-science-research-symposium',
      shortDescription:
        'Sample academic research presentation welcoming abstracts in physics, biology, chemistry, and computational science.',
      fullDescription:
        'Demo listing for science and research students across India. Present original undergraduate or postgraduate literature reviews and experimental posters.',
      category: 'research',
      tags: ['Research', 'Scientific Writing', 'Data Analysis', 'Poster'],
      organizerName: 'Sample National Science Forum',
      officialSourceUrl: 'https://example.org/events/science-symposium',
      registrationUrl: 'https://example.org/register/science-symposium',
      eventMode: 'hybrid',
      location: { state: 'Maharashtra', city: 'Pune', venue: 'Sample Science Auditorium & Live Stream' },
      eligibilityRules: {
        allowedDisciplines: [
          'Science and Research',
          'Medicine and Allied Disciplines',
          'Engineering and Technology'
        ],
        allowedDegreeLevels: ['Undergraduate', 'Postgraduate', 'Doctoral'],
        allowedCourses: [],
        allowedYears: [],
        allowedStates: ['All India'],
        openToAllDisciplines: false,
        notes: 'Abstract limit: 400 words.'
      },
      feeAmount: 250,
      deadline: daysFromNow(18),
      eventStartDate: daysFromNow(28),
      eventEndDate: daysFromNow(30),
      teamSize: { min: 1, max: 2 },
      requiredSkills: ['Academic Writing', 'Literature Review', 'Presentation'],
      beginnerFriendly: true,
      defaultChecklist: [
        'Draft 400-word structured abstract',
        'Obtain faculty mentor endorsement if required',
        'Prepare A1 poster PDF'
      ]
    },
    {
      title: '[Demo] National Management & Social Impact Case Challenge',
      slug: 'demo-national-management-case-challenge',
      shortDescription:
        'Sample 3-round business strategy and sustainability case competition for commerce, management, and allied students.',
      fullDescription:
        'Demo listing for commerce, management, and economics students. Analyze a realistic retail supply-chain case and pitch actionable recommendations.',
      category: 'case-competition',
      tags: ['Strategy', 'Finance', 'Consulting', 'Sustainability'],
      organizerName: 'Example Business School Club',
      officialSourceUrl: 'https://example.org/events/case-challenge',
      registrationUrl: 'https://example.org/register/case-challenge',
      eventMode: 'hybrid',
      location: { state: 'Delhi', city: 'New Delhi', venue: 'Sample Management Campus' },
      eligibilityRules: {
        allowedDisciplines: ['Commerce and Management', 'Arts and Humanities', 'Other'],
        allowedDegreeLevels: ['Undergraduate', 'Postgraduate'],
        allowedCourses: [],
        allowedYears: [],
        allowedStates: ['All India'],
        openToAllDisciplines: false,
        notes: 'Teams of 2-3 from the same or different colleges.'
      },
      feeAmount: 200,
      deadline: daysFromNow(12),
      eventStartDate: daysFromNow(19),
      eventEndDate: daysFromNow(22),
      teamSize: { min: 2, max: 3 },
      requiredSkills: ['Financial Modeling', 'Market Research', 'Slide Design'],
      beginnerFriendly: true,
      defaultChecklist: [
        'Register team of 2-3 members',
        'Download case brief upon release',
        'Submit 8-slide executive deck'
      ]
    },
    {
      title: '[Demo] Inter-University Constitutional Law & Policy Quiz',
      slug: 'demo-constitutional-law-policy-quiz',
      shortDescription:
        'Sample quiz competition exploring Indian constitutional history, governance, and current public policy.',
      fullDescription:
        'Demo quiz open to law, humanities, and policy students across India. Preliminary online round followed by live buzzer finals.',
      category: 'quiz',
      tags: ['Constitutional Law', 'Public Policy', 'General Knowledge'],
      organizerName: 'Sample Legal Studies Collective',
      officialSourceUrl: 'https://example.org/events/law-policy-quiz',
      registrationUrl: 'https://example.org/register/law-policy-quiz',
      eventMode: 'online',
      location: { state: 'All India', city: '', venue: 'Video Conference Platform' },
      eligibilityRules: {
        allowedDisciplines: ['Law', 'Arts and Humanities', 'Education'],
        allowedDegreeLevels: ['Undergraduate', 'Postgraduate', 'Integrated'],
        allowedCourses: [],
        allowedYears: [],
        allowedStates: ['All India'],
        openToAllDisciplines: false,
        notes: 'Open to LLB, BA, MA, and B.Ed students.'
      },
      feeAmount: 0,
      deadline: daysFromNow(8),
      eventStartDate: daysFromNow(11),
      eventEndDate: daysFromNow(11),
      teamSize: { min: 1, max: 2 },
      requiredSkills: ['Policy Analysis', 'Quick Recall', 'Current Affairs'],
      beginnerFriendly: true,
      defaultChecklist: [
        'Review recent landmark constitutional notes',
        'Check system audio/video before prelims'
      ]
    },
    {
      title: '[Demo] All-India Parliamentary Debate Open',
      slug: 'demo-all-india-parliamentary-debate-open',
      shortDescription:
        'Sample British Parliamentary style debate tournament open to students from all academic disciplines.',
      fullDescription:
        'Demo listing for aspiring speakers and debaters. Compete across 5 preliminary rounds on ethics, technology, economics, and society.',
      category: 'debate',
      tags: ['Public Speaking', 'Debate', 'Critical Thinking', 'Policy'],
      organizerName: 'Example Debating Union',
      officialSourceUrl: 'https://example.org/events/debate-open',
      registrationUrl: 'https://example.org/register/debate-open',
      eventMode: 'offline',
      location: { state: 'Karnataka', city: 'Bengaluru', venue: 'Sample Humanities Block' },
      eligibilityRules: {
        allowedDisciplines: [],
        allowedDegreeLevels: ['Undergraduate', 'Postgraduate', 'Integrated'],
        allowedCourses: [],
        allowedYears: [],
        allowedStates: ['All India'],
        openToAllDisciplines: true,
        notes: 'Open to all disciplines; novice break category available.'
      },
      feeAmount: 300,
      deadline: daysFromNow(15),
      eventStartDate: daysFromNow(21),
      eventEndDate: daysFromNow(23),
      teamSize: { min: 2, max: 2 },
      requiredSkills: ['Public Speaking', 'Argumentation', 'Research'],
      beginnerFriendly: true,
      defaultChecklist: [
        'Confirm debating partner',
        'Prepare matter files on current themes'
      ]
    },
    {
      title: '[Demo] Accessible Public Transit UI/UX Design Challenge',
      slug: 'demo-accessible-transit-uiux-design-challenge',
      shortDescription:
        'Sample product and visual design sprint focused on multilingual mobile interfaces for Indian commuters.',
      fullDescription:
        'Demo listing for design, media, and HCI students. Submit user research insights, wireframes, and an interactive prototype.',
      category: 'design-challenge',
      tags: ['UI/UX', 'Accessibility', 'Figma', 'User Research'],
      organizerName: 'Sample Design Collective',
      officialSourceUrl: 'https://example.org/events/transit-design',
      registrationUrl: 'https://example.org/register/transit-design',
      eventMode: 'online',
      location: { state: 'All India', city: '', venue: 'Remote Submission' },
      eligibilityRules: {
        allowedDisciplines: [
          'Design and Media',
          'Engineering and Technology',
          'MCA, Computer Science, and IT',
          'Arts and Humanities'
        ],
        allowedDegreeLevels: ['Diploma', 'Undergraduate', 'Postgraduate'],
        allowedCourses: [],
        allowedYears: [],
        allowedStates: ['All India'],
        openToAllDisciplines: false,
        notes: 'Case study PDF + interactive prototype link required.'
      },
      feeAmount: 0,
      deadline: daysFromNow(14),
      eventStartDate: daysFromNow(16),
      eventEndDate: daysFromNow(20),
      teamSize: { min: 1, max: 3 },
      requiredSkills: ['UI/UX', 'Figma', 'Prototyping', 'Accessibility'],
      beginnerFriendly: true,
      defaultChecklist: [
        'Conduct 3 quick commuter interviews',
        'Verify WCAG contrast ratios in prototype'
      ]
    },
    {
      title: '[Demo] Inter-College Theatre & Folk Arts Showcase',
      slug: 'demo-inter-college-theatre-folk-arts-showcase',
      shortDescription:
        'Sample regional cultural festival celebrating street play, classical music, and visual storytelling.',
      fullDescription:
        'Demo listing for cultural clubs and performing arts students across Tamil Nadu and neighboring states.',
      category: 'cultural',
      tags: ['Theatre', 'Music', 'Performing Arts', 'Culture'],
      organizerName: 'Example Cultural Guild',
      officialSourceUrl: 'https://example.org/events/cultural-showcase',
      registrationUrl: 'https://example.org/register/cultural-showcase',
      eventMode: 'offline',
      location: { state: 'Tamil Nadu', city: 'Chennai', venue: 'Sample Open Air Auditorium' },
      eligibilityRules: {
        allowedDisciplines: [],
        allowedDegreeLevels: ['Diploma', 'Undergraduate', 'Postgraduate'],
        allowedCourses: [],
        allowedYears: [],
        allowedStates: ['Tamil Nadu', 'Kerala', 'Karnataka', 'Andhra Pradesh'],
        openToAllDisciplines: true,
        notes: 'Regional offline showcase; college authorization letter needed.'
      },
      feeAmount: 150,
      deadline: daysFromNow(20),
      eventStartDate: daysFromNow(27),
      eventEndDate: daysFromNow(28),
      teamSize: { min: 1, max: 8 },
      requiredSkills: ['Stage Performance', 'Scriptwriting', 'Team Coordination'],
      beginnerFriendly: true,
      defaultChecklist: [
        'Submit 10-minute script or audio sample',
        'Verify stage prop guidelines'
      ]
    },
    {
      title: '[Demo] Clinical Epidemiology & Health Data Workshop',
      slug: 'demo-clinical-epidemiology-workshop',
      shortDescription:
        'Sample hands-on workshop introducing study design, biostatistics, and public health datasets.',
      fullDescription:
        'Demo workshop tailored for medicine, allied health, life sciences, and education/public health students.',
      category: 'workshop',
      tags: ['Public Health', 'Biostatistics', 'Epidemiology', 'Research'],
      organizerName: 'Sample Allied Health Academy',
      officialSourceUrl: 'https://example.org/events/epi-workshop',
      registrationUrl: 'https://example.org/register/epi-workshop',
      eventMode: 'online',
      location: { state: 'All India', city: '', venue: 'Live Interactive Webinar' },
      eligibilityRules: {
        allowedDisciplines: [
          'Medicine and Allied Disciplines',
          'Science and Research',
          'Education'
        ],
        allowedDegreeLevels: ['Undergraduate', 'Postgraduate', 'Doctoral'],
        allowedCourses: [],
        allowedYears: [],
        allowedStates: ['All India'],
        openToAllDisciplines: false,
        notes: 'Certificate of completion on 100% session attendance.'
      },
      feeAmount: 0,
      deadline: daysFromNow(3),
      eventStartDate: daysFromNow(5),
      eventEndDate: daysFromNow(6),
      teamSize: { min: 1, max: 1 },
      requiredSkills: ['Statistics', 'Research Methods'],
      beginnerFriendly: true,
      defaultChecklist: ['Install spreadsheet/R basics before session']
    },
    {
      title: '[Demo] Campus Education & Literacy Fellowship (Historical Sample)',
      slug: 'demo-campus-education-fellowship-expired',
      shortDescription:
        'Sample expired listing demonstrating historical archive and expired-opportunity exclusion behavior.',
      fullDescription:
        'This sample listing has a past deadline to demonstrate that expired opportunities are excluded from active recommendations and default discovery.',
      category: 'fellowship',
      tags: ['Education', 'Mentoring', 'Community'],
      organizerName: 'Example Education Trust',
      officialSourceUrl: 'https://example.org/events/education-fellowship',
      registrationUrl: 'https://example.org/register/education-fellowship',
      eventMode: 'hybrid',
      location: { state: 'All India', city: '', venue: 'Regional Chapters' },
      eligibilityRules: {
        allowedDisciplines: ['Education', 'Arts and Humanities', 'Other'],
        allowedDegreeLevels: ['Undergraduate', 'Postgraduate'],
        allowedCourses: [],
        allowedYears: [],
        allowedStates: ['All India'],
        openToAllDisciplines: false,
        notes: 'Expired demo entry.'
      },
      feeAmount: 0,
      deadline: daysFromNow(-5),
      eventStartDate: daysFromNow(2),
      eventEndDate: daysFromNow(4),
      teamSize: { min: 1, max: 1 },
      requiredSkills: ['Teaching', 'Communication'],
      beginnerFriendly: true,
      publicationStatus: 'expired',
      defaultChecklist: []
    }
  ];

  for (const item of demoOpportunities) {
    const isExpired = item.publicationStatus === 'expired' || item.deadline < new Date();
    await Opportunity.updateOne(
      { slug: item.slug },
      {
        $setOnInsert: {
          ...item,
          organizerId: demoOrganizer._id,
          submittedBy: demoOrganizer._id,
          submittedAt: new Date(),
          isDemoData: true,
          verificationStatus: 'verified',
          publicationStatus: isExpired ? 'expired' : 'published',
          lastVerifiedAt: new Date(),
          lastCheckedAt: new Date()
        }
      },
      { upsert: true }
    );
  }

  return {
    categoriesCount: DEFAULT_CATEGORIES.length,
    demoOpportunitiesCount: demoOpportunities.length
  };
}

async function runCli() {
  await connectDB();
  console.log('Connected to MongoDB for seeding demo data...');
  await seedDatabase();
  console.log('Demo seed complete.');
  console.log('Demo student login: student.demo@example.com / DemoPass@123');
  console.log('Demo organizer login: organizer.demo@example.com / DemoPass@123');
  console.log('Note: Create a local dev admin separately using npm run create-dev-admin with DEV_ADMIN_* env vars.');
  await disconnectDB();
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runCli().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
}

