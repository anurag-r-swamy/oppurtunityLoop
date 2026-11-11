# Explainable Participation Engine

Implemented in `server/src/services/recommendationEngine.js` without requiring any external AI API.

## Step 1: Eligibility Evaluation (`evaluateEligibility`)
Before scoring, each opportunity is checked against published restrictions and the student's profile:
- Publication status (`published`) and future deadline (`deadline > now`).
- Academic discipline (`allowedDisciplines` or `openToAllDisciplines`).
- Degree level (`allowedDegreeLevels`), course (`allowedCourses`), year (`allowedYears`), state (`allowedStates`), and age (`minAge`/`maxAge`).

**Strict Uncertainty Rule**:
- If any rule fails, status is **`ineligible`** with explicit `ineligibilityReasons`.
- If either the opportunity lacks academic eligibility rules (`openToAllDisciplines: false` and empty restriction arrays) OR the student profile is missing a required field for a stated restriction, status is **`unknown`** (never labelled `eligible`).
- Only when all stated rules are satisfied and academic eligibility is explicitly defined does status equal **`eligible`**.

## Step 2: Configurable Weighted Score (`RECOMMENDATION_WEIGHTS`, v1)
Normalized 0–100 score:
- `interests`: **25** (overlap between student `interests`/`preferredCategories` and event `category`/`tags`)
- `skills`: **25** (overlap against `requiredSkills`; neutral partial credit when event lists no prerequisites; `0` when student skills are missing)
- `academicRelevance`: **20** (explicit discipline match vs open-to-all vs ineligible)
- `beginnerSuitability`: **10** (matches `experienceLevel` with `beginnerFriendly`)
- `modePreference`: **10** (matches `preferredEventModes`)
- `locationPreference`: **5** (online/All India or matching state)
- `deadlineFeasibility`: **5** (time remaining before registration deadline)

Eligibility restrictions are never overridden by a high score. Ranked recommendations sort by `eligible` first, then `unknown`, then descending `score`, then earliest `deadline`, excluding `ineligible` and expired listings by default.

## Step 3: Explanation Generation
Every recommendation returns `opportunityId`, `score`, `eligibility`, `reasons`, `ineligibilityReasons`, `missingInformation`, `nextActions`, `scoreBreakdown`, `deadline`, `verificationMetadata`, and `scoreVersion`.

## Step 4: Evaluation Methodology
Run `npm run evaluate:recs` (`server/src/scripts/evaluateRecommendations.js`) to test:
1. Controlled eligibility classification (`eligible`, `ineligible`, `unknown`, expired).
2. Personalized top-1 ranking vs chronological deadline baseline (verifying that an irrelevant soon-to-expire Law quiz is filtered out rather than ranked #1 for an MCA student).
3. Missing-profile-data score reduction and transparency.

## Limitations & Future Improvements
- Currently uses exact/substring token normalization for skills and interests; synonym/taxonomy expansion (e.g. `JS` → `JavaScript`, `ML` → `Machine Learning`) can improve recall.
- Adding optional collaborative signals (e.g., anonymous participation completion rates by cohort) could complement deterministic content-based scoring once sufficient real data accumulates.

