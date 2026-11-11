import { RECOMMENDATION_WEIGHTS } from '../config/constants.js';

function normalizeTokens(arr = []) {
  return [...new Set(arr.map((s) => String(s).trim().toLowerCase()).filter(Boolean))];
}

function overlapRatio(studentTokens, targetTokens) {
  if (!targetTokens.length) return null;
  if (!studentTokens.length) return 0;
  const studentSet = new Set(studentTokens);
  let matches = 0;
  for (const t of targetTokens) {
    if (studentSet.has(t) || studentTokens.some((s) => s.includes(t) || t.includes(s))) {
      matches += 1;
    }
  }
  return matches / targetTokens.length;
}

export function evaluateEligibility(studentProfile = {}, opportunity, now = new Date()) {
  const rules = opportunity.eligibilityRules || {};
  const missingInformation = [];
  const ineligibilityReasons = [];
  const eligibilityPassedReasons = [];

  if (opportunity.publicationStatus !== 'published') {
    ineligibilityReasons.push(`Listing is currently ${opportunity.publicationStatus}.`);
  }
  if (opportunity.deadline && new Date(opportunity.deadline) <= now) {
    ineligibilityReasons.push('Registration deadline has already passed.');
  }

  const hasAcademicRule =
    rules.openToAllDisciplines ||
    (rules.allowedDisciplines && rules.allowedDisciplines.length > 0) ||
    (rules.allowedDegreeLevels && rules.allowedDegreeLevels.length > 0) ||
    (rules.allowedCourses && rules.allowedCourses.length > 0);

  if (!hasAcademicRule) {
    missingInformation.push('Event academic eligibility criteria are not specified by organizer');
  }

  // Discipline check
  if (!rules.openToAllDisciplines && rules.allowedDisciplines?.length > 0) {
    if (!studentProfile.discipline) {
      missingInformation.push('Your academic discipline');
    } else if (!rules.allowedDisciplines.includes(studentProfile.discipline)) {
      ineligibilityReasons.push(
        `Requires discipline in: ${rules.allowedDisciplines.join(', ')}.`
      );
    } else {
      eligibilityPassedReasons.push('Your academic discipline matches the eligibility criteria');
    }
  } else if (rules.openToAllDisciplines) {
    eligibilityPassedReasons.push('Open to students from all academic disciplines');
  }

  // Degree level check
  if (rules.allowedDegreeLevels?.length > 0) {
    if (!studentProfile.degreeLevel) {
      missingInformation.push('Your degree level');
    } else if (!rules.allowedDegreeLevels.includes(studentProfile.degreeLevel)) {
      ineligibilityReasons.push(
        `Restricted to ${rules.allowedDegreeLevels.join(', ')} students.`
      );
    } else {
      eligibilityPassedReasons.push('Your degree level meets the listed requirements');
    }
  }

  // Course check
  if (rules.allowedCourses?.length > 0) {
    if (!studentProfile.course) {
      missingInformation.push('Your course name');
    } else {
      const courseLower = studentProfile.course.trim().toLowerCase();
      const allowedLower = rules.allowedCourses.map((c) => c.trim().toLowerCase());
      const matched = allowedLower.some((c) => courseLower.includes(c) || c.includes(courseLower));
      if (!matched) {
        ineligibilityReasons.push(`Restricted to courses: ${rules.allowedCourses.join(', ')}.`);
      } else {
        eligibilityPassedReasons.push('Your course matches the eligible programs');
      }
    }
  }

  // Year of study check
  if (rules.allowedYears?.length > 0) {
    if (!studentProfile.currentYear) {
      missingInformation.push('Your current year of study');
    } else if (!rules.allowedYears.includes(Number(studentProfile.currentYear))) {
      ineligibilityReasons.push(
        `Open to study year(s): ${rules.allowedYears.join(', ')}.`
      );
    } else {
      eligibilityPassedReasons.push('Your current year of study is eligible');
    }
  }

  // Location / State check
  const allowedStates = rules.allowedStates || [];
  if (allowedStates.length > 0 && !allowedStates.includes('All India')) {
    if (!studentProfile.state) {
      missingInformation.push('Your state/location');
    } else if (!allowedStates.includes(studentProfile.state)) {
      ineligibilityReasons.push(`Restricted to students in: ${allowedStates.join(', ')}.`);
    } else {
      eligibilityPassedReasons.push(`Available in your state (${studentProfile.state})`);
    }
  }

  // Age check
  if (rules.minAge != null || rules.maxAge != null) {
    if (studentProfile.age == null) {
      missingInformation.push('Your age (required for age-restricted opportunities)');
    } else {
      const age = Number(studentProfile.age);
      if (rules.minAge != null && age < rules.minAge) {
        ineligibilityReasons.push(`Minimum age requirement is ${rules.minAge}.`);
      } else if (rules.maxAge != null && age > rules.maxAge) {
        ineligibilityReasons.push(`Maximum age requirement is ${rules.maxAge}.`);
      } else {
        eligibilityPassedReasons.push('Your age meets the listed requirement');
      }
    }
  }

  let status = 'eligible';
  if (ineligibilityReasons.length > 0) {
    status = 'ineligible';
  } else if (missingInformation.length > 0) {
    status = 'unknown';
  }

  return {
    status,
    ineligibilityReasons,
    eligibilityPassedReasons,
    missingInformation: [...new Set(missingInformation)]
  };
}

export function scoreOpportunityForStudent(
  user,
  opportunity,
  weights = RECOMMENDATION_WEIGHTS,
  now = new Date()
) {
  const profile = user?.studentProfile || {};
  const eligibility = evaluateEligibility(profile, opportunity, now);
  const reasons = [...eligibility.eligibilityPassedReasons];
  const missingInformation = [...eligibility.missingInformation];

  // 1. Interests & Category match (weights.interests)
  const studentInterests = normalizeTokens([
    ...(profile.interests || []),
    ...(profile.preferredCategories || [])
  ]);
  const eventTopics = normalizeTokens([
    opportunity.category,
    ...(opportunity.tags || [])
  ]);

  let interestScore = 0;
  if (!studentInterests.length) {
    missingInformation.push('Your interests or preferred categories');
  } else {
    const categoryMatch = (profile.preferredCategories || []).includes(opportunity.category);
    const topicOverlap = overlapRatio(studentInterests, eventTopics) ?? 0;
    const ratio = categoryMatch ? Math.max(0.75, topicOverlap) : topicOverlap;
    interestScore = Math.round(weights.interests * ratio);
    if (ratio >= 0.4) {
      reasons.push('Matches your selected interests and preferred categories');
    }
  }

  // 2. Skill match (weights.skills)
  const studentSkills = normalizeTokens(profile.skills || []);
  const requiredSkills = normalizeTokens(opportunity.requiredSkills || []);
  let skillScore = 0;
  if (!studentSkills.length) {
    missingInformation.push('Your skills');
  } else if (!requiredSkills.length) {
    // No specific skills required; award moderate neutral score transparently
    skillScore = Math.round(weights.skills * 0.6);
    reasons.push('No specialized prerequisite skills listed; accessible with your background');
  } else {
    const ratio = overlapRatio(studentSkills, requiredSkills) ?? 0;
    skillScore = Math.round(weights.skills * ratio);
    if (ratio > 0) {
      const matchedCount = requiredSkills.filter((reqSkill) =>
        studentSkills.some((s) => s.includes(reqSkill) || reqSkill.includes(s))
      ).length;
      reasons.push(
        `Matches ${matchedCount} of ${requiredSkills.length} listed skill requirements`
      );
    }
  }

  // 3. Academic relevance (weights.academicRelevance)
  let academicScore = 0;
  const rules = opportunity.eligibilityRules || {};
  if (!profile.discipline && !profile.degreeLevel) {
    missingInformation.push('Your academic profile details');
  } else if (eligibility.status === 'ineligible') {
    academicScore = 0;
  } else if (
    rules.allowedDisciplines?.length > 0 &&
    profile.discipline &&
    rules.allowedDisciplines.includes(profile.discipline)
  ) {
    academicScore = weights.academicRelevance;
  } else if (rules.openToAllDisciplines) {
    academicScore = Math.round(weights.academicRelevance * 0.8);
  } else {
    academicScore = Math.round(weights.academicRelevance * 0.4);
  }

  // 4. Beginner suitability (weights.beginnerSuitability)
  let beginnerScore = 0;
  const exp = profile.experienceLevel || '';
  if (!exp) {
    missingInformation.push('Your experience level');
  } else if (exp === 'beginner') {
    if (opportunity.beginnerFriendly) {
      beginnerScore = weights.beginnerSuitability;
      reasons.push('Marked beginner-friendly for your experience level');
    } else {
      beginnerScore = Math.round(weights.beginnerSuitability * 0.3);
    }
  } else {
    beginnerScore = opportunity.beginnerFriendly
      ? Math.round(weights.beginnerSuitability * 0.7)
      : weights.beginnerSuitability;
    reasons.push('Suitable for your experience level');
  }

  // 5. Preferred event mode (weights.modePreference)
  let modeScore = 0;
  const preferredModes = profile.preferredEventModes || [];
  if (!preferredModes.length) {
    missingInformation.push('Your preferred event modes (online/offline/hybrid)');
    modeScore = Math.round(weights.modePreference * 0.4);
  } else if (preferredModes.includes(opportunity.eventMode)) {
    modeScore = weights.modePreference;
    reasons.push(`Matches your preferred ${opportunity.eventMode} event mode`);
  }

  // 6. Location preference (weights.locationPreference)
  let locationScore = 0;
  const eventState = opportunity.location?.state || 'All India';
  if (opportunity.eventMode === 'online' || eventState === 'All India') {
    locationScore = weights.locationPreference;
  } else if (profile.state && profile.state.toLowerCase() === eventState.toLowerCase()) {
    locationScore = weights.locationPreference;
    reasons.push(`Hosted in your state (${eventState})`);
  } else if (!profile.state) {
    locationScore = Math.round(weights.locationPreference * 0.3);
  }

  // 7. Deadline feasibility (weights.deadlineFeasibility)
  let deadlineScore = 0;
  const msRemaining = new Date(opportunity.deadline).getTime() - now.getTime();
  const daysRemaining = msRemaining / (1000 * 60 * 60 * 24);
  if (daysRemaining >= 7) {
    deadlineScore = weights.deadlineFeasibility;
  } else if (daysRemaining >= 2) {
    deadlineScore = Math.round(weights.deadlineFeasibility * 0.7);
    reasons.push('Upcoming deadline within the next week — plan preparation soon');
  } else if (daysRemaining > 0) {
    deadlineScore = Math.round(weights.deadlineFeasibility * 0.3);
    reasons.push('Deadline is very soon (< 48 hours)');
  }

  const rawTotal =
    interestScore +
    skillScore +
    academicScore +
    beginnerScore +
    modeScore +
    locationScore +
    deadlineScore;

  const score = Math.max(0, Math.min(100, Math.round(rawTotal)));

  const uniqueMissing = [...new Set(missingInformation)];
  const nextActions = [];
  if (uniqueMissing.length > 0) {
    nextActions.push('Complete your student profile fields to improve eligibility certainty');
  }
  if (eligibility.status === 'eligible') {
    nextActions.push('Review the official source link and start a preparation checklist');
  } else if (eligibility.status === 'unknown') {
    nextActions.push('Verify eligibility directly on the official event page before registering');
  }
  if (opportunity.teamSize?.max > 1) {
    nextActions.push(
      `Team event (${opportunity.teamSize.min}-${opportunity.teamSize.max} members): check Team Discovery if you need teammates`
    );
  }

  return {
    opportunityId: String(opportunity._id),
    score,
    eligibility: eligibility.status,
    reasons: [...new Set(reasons)],
    ineligibilityReasons: eligibility.ineligibilityReasons,
    missingInformation: uniqueMissing,
    nextActions,
    scoreBreakdown: {
      interests: { score: interestScore, max: weights.interests },
      skills: { score: skillScore, max: weights.skills },
      academicRelevance: { score: academicScore, max: weights.academicRelevance },
      beginnerSuitability: { score: beginnerScore, max: weights.beginnerSuitability },
      modePreference: { score: modeScore, max: weights.modePreference },
      locationPreference: { score: locationScore, max: weights.locationPreference },
      deadlineFeasibility: { score: deadlineScore, max: weights.deadlineFeasibility }
    },
    deadline: opportunity.deadline,
    verificationMetadata: {
      verificationStatus: opportunity.verificationStatus,
      lastVerifiedAt: opportunity.lastVerifiedAt,
      officialSourceUrl: opportunity.officialSourceUrl,
      isDemoData: Boolean(opportunity.isDemoData)
    },
    scoreVersion: weights.version
  };
}

export function rankOpportunitiesForStudent(user, opportunities, options = {}) {
  const { includeIneligible = false, now = new Date() } = options;

  const evaluated = opportunities.map((opp) => ({
    opportunity: opp,
    explanation: scoreOpportunityForStudent(user, opp, RECOMMENDATION_WEIGHTS, now)
  }));

  const filtered = includeIneligible
    ? evaluated
    : evaluated.filter((item) => item.explanation.eligibility !== 'ineligible');

  const eligibilityPriority = { eligible: 0, unknown: 1, ineligible: 2 };

  filtered.sort((a, b) => {
    const prioDiff =
      eligibilityPriority[a.explanation.eligibility] -
      eligibilityPriority[b.explanation.eligibility];
    if (prioDiff !== 0) return prioDiff;
    if (b.explanation.score !== a.explanation.score) {
      return b.explanation.score - a.explanation.score;
    }
    return new Date(a.opportunity.deadline) - new Date(b.opportunity.deadline);
  });

  return filtered;
}

