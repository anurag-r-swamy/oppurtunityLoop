# Database Schema

All models are defined in `server/src/models/` using Mongoose 8 with timestamps and explicit indexes.

## Collections

1. **users (`User`)**
   - `name`, `email` (unique, lowercase, normalized), `passwordHash` (`select: false`), `role` (`student` | `organizer` | `admin`), `accountStatus` (`active` | `suspended`).
   - `studentProfile`: `collegeName`, `course`, `discipline`, `degreeLevel`, `currentYear`, `age`, `state`, `city`, `skills[]`, `interests[]`, `experienceLevel`, `preferredEventModes[]`, `preferredCategories[]`, `availabilityPreferences`, `profileCompletionStatus` (auto-computed in `pre('save')`).
   - `organizerProfile`: `organizationName`, `organizationType`, `websiteUrl`, `description`.
   - `notificationPreferences`: `inAppReminders`, `emailReminders`, `reminderDaysBefore[]`, `teamUpdates`.
   - Indexes: `{ email: 1 }` (unique), `{ role: 1, accountStatus: 1 }`, `{ 'studentProfile.discipline': 1 }`.

2. **sessions (`Session`)**
   - `userId` (ref `User`), `tokenHash` (unique HMAC-SHA256), `userAgent`, `expiresAt` (TTL index `{ expireAfterSeconds: 0 }`), `revokedAt`.

3. **opportunities (`Opportunity`)**
   - Core fields: `title`, `slug` (unique), `shortDescription`, `fullDescription`, `category`, `tags[]`, `organizerId` (ref `User`), `organizerName`, `officialSourceUrl`, `registrationUrl`, `eventMode`, `location` (`state`, `city`, `venue`).
   - Rules & logistics: `eligibilityRules` (`allowedDisciplines[]`, `allowedDegreeLevels[]`, `allowedCourses[]`, `allowedYears[]`, `allowedStates[]`, `minAge`, `maxAge`, `openToAllDisciplines`, `notes`), `feeAmount`, `feeCurrency`, `deadline`, `eventStartDate`, `eventEndDate`, `teamSize` (`min`, `max`), `requiredSkills[]`, `beginnerFriendly`, `defaultChecklist[]`, `isDemoData`.
   - Moderation: `verificationStatus` (`pending` | `verified` | `rejected` | `needs_review`), `publicationStatus` (`draft` | `published` | `expired` | `archived`), `submittedBy`, `submittedAt`, `verifiedBy`, `lastVerifiedAt`, `lastCheckedAt`, `rejectionReason`.
   - Validation: `eventEndDate >= eventStartDate`, `deadline <= eventEndDate`, `teamSize.max >= teamSize.min`, `maxAge >= minAge`.
   - Indexes: compound `{ publicationStatus: 1, verificationStatus: 1, deadline: 1 }`, `{ category: 1, eventMode: 1, feeAmount: 1, deadline: 1 }`, and full-text index across title/descriptions/organizer/tags/skills.

4. **bookmarks (`Bookmark`)**
   - `userId`, `opportunityId`, `createdAt`.
   - Unique compound index `{ userId: 1, opportunityId: 1 }` prevents duplicates at database level.

5. **participations (`Participation`)**
   - `userId`, `opportunityId`, `status` (`interested` | `registered` | `preparing` | `submitted` | `participated` | `won` | `withdrawn`), `preparationChecklist[]`, `registrationUrl`, `registeredAt`, `submittedAt`, `participatedAt`, `outcome`, `evidenceUrl`, `verificationOrigin` (`self_reported` | `organizer_confirmed`), `personalNotes`.
   - Unique compound index `{ userId: 1, opportunityId: 1 }`.

6. **teamrequests (`TeamRequest`)**
   - `opportunityId`, `createdBy`, `title`, `description`, `requiredSkills[]`, `creatorSkills[]`, `desiredExperienceLevel`, `maximumMembers`, `members[]`, `requests[]` (`join_request` | `leader_invite`), `requestStatus` (`open` | `full` | `closed`).

7. **notifications (`Notification`)**
   - `userId`, `type`, `title`, `message`, `relatedOpportunityId`, `reminderWindowKey`, `scheduledAt`, `sentAt`, `readAt`, `status`.
   - Partial unique index `{ userId: 1, relatedOpportunityId: 1, reminderWindowKey: 1 }` prevents duplicate reminders for the same user, opportunity, and reminder window.

8. **reports (`Report`)**
   - `submittedBy`, `opportunityId`, `reason`, `description`, `status`, `resolutionNote`, `reviewedBy`, `reviewedAt`.

9. **auditlogs (`AuditLog`)**
   - `actorId`, `action`, `entityType`, `entityId`, `metadata` (sanitized), `timestamp`.

10. **categories (`Category`)** & **platformsettings (`PlatformSetting`)**
    - Admin-managed category taxonomy and global feature flags (`teamMatchingEnabled`, `requireAdminVerification`, `defaultReminderDays`, `maintenanceBanner`).

