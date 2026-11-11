import express from 'express';
import { TeamRequest } from '../models/TeamRequest.js';
import { Opportunity } from '../models/Opportunity.js';
import { Notification } from '../models/Notification.js';
import { PlatformSetting } from '../models/PlatformSetting.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { AppError } from '../middleware/errorHandler.js';
import {
  createTeamRequestSchema,
  teamInviteOrJoinSchema,
  teamRespondSchema,
  updateTeamRequestSchema
} from '../validators/teamRequest.validators.js';

const router = express.Router();

async function ensureTeamsEnabled(next) {
  const settings = await PlatformSetting.findOne({ key: 'global' }).lean();
  if (settings && settings.teamMatchingEnabled === false) {
    next(new AppError(403, 'FEATURE_DISABLED', 'Team matching is currently disabled.'));
    return false;
  }
  return true;
}

function formatTeamForViewer(teamDoc, viewerId) {
  const team = typeof teamDoc.toObject === 'function' ? teamDoc.toObject() : { ...teamDoc };
  const isMember = (team.members || []).some(
    (m) => String(m.userId?._id || m.userId) === String(viewerId)
  );
  const isLeader = String(team.createdBy?._id || team.createdBy) === String(viewerId);

  // Never expose private requests/invitations of other students to non-leaders
  const visibleRequests = isLeader
    ? team.requests || []
    : (team.requests || []).filter(
        (r) => String(r.userId?._id || r.userId) === String(viewerId)
      );

  return {
    ...team,
    isMember,
    isLeader,
    availableSlots: Math.max(0, team.maximumMembers - (team.members?.length || 0)),
    requests: visibleRequests
  };
}

router.get('/', authenticate, async (req, res, next) => {
  try {
    if (!(await ensureTeamsEnabled(next))) return;

    const filter = {};
    if (req.query.opportunityId) filter.opportunityId = req.query.opportunityId;
    if (req.query.status && ['open', 'full', 'closed'].includes(req.query.status)) {
      filter.requestStatus = req.query.status;
    }
    if (req.query.mine === 'true') {
      filter['members.userId'] = req.user._id;
    }
    if (req.query.skill) {
      filter.requiredSkills = new RegExp(String(req.query.skill).trim(), 'i');
    }

    const teams = await TeamRequest.find(filter)
      .populate('opportunityId', 'title slug deadline category eventMode teamSize')
      .populate('createdBy', 'name studentProfile.discipline studentProfile.course')
      .populate('members.userId', 'name studentProfile.discipline studentProfile.skills')
      .populate('requests.userId', 'name studentProfile.discipline studentProfile.skills')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const formatted = teams.map((t) => formatTeamForViewer(t, req.user._id));

    res.json({
      success: true,
      data: { teamRequests: formatted }
    });
  } catch (err) {
    next(err);
  }
});

router.post(
  '/',
  authenticate,
  requireRole('student'),
  validate({ body: createTeamRequestSchema }),
  async (req, res, next) => {
    try {
      if (!(await ensureTeamsEnabled(next))) return;

      const {
        opportunityId,
        title,
        description,
        requiredSkills,
        creatorSkills,
        desiredExperienceLevel,
        maximumMembers
      } = req.body;

      const opp = await Opportunity.findById(opportunityId).lean();
      if (!opp || opp.publicationStatus !== 'published') {
        return next(
          new AppError(404, 'OPPORTUNITY_NOT_FOUND', 'Published opportunity not found.')
        );
      }

      if (opp.teamSize?.max && maximumMembers > opp.teamSize.max) {
        return next(
          new AppError(
            400,
            'EXCEEDS_EVENT_TEAM_LIMIT',
            `Maximum team size allowed for this event is ${opp.teamSize.max}.`
          )
        );
      }

      const team = await TeamRequest.create({
        opportunityId: opp._id,
        createdBy: req.user._id,
        title,
        description,
        requiredSkills,
        creatorSkills:
          creatorSkills.length > 0 ? creatorSkills : req.user.studentProfile?.skills || [],
        desiredExperienceLevel,
        maximumMembers,
        members: [
          {
            userId: req.user._id,
            roleInTeam: 'leader',
            skillsOffered:
              creatorSkills.length > 0 ? creatorSkills : req.user.studentProfile?.skills || []
          }
        ],
        requestStatus: 'open'
      });

      const populated = await TeamRequest.findById(team._id)
        .populate('opportunityId', 'title slug deadline category eventMode teamSize')
        .populate('createdBy', 'name studentProfile.discipline')
        .populate('members.userId', 'name studentProfile.discipline studentProfile.skills')
        .lean();

      return res.status(201).json({
        success: true,
        data: { teamRequest: formatTeamForViewer(populated, req.user._id) }
      });
    } catch (err) {
      return next(err);
    }
  }
);

router.get('/:id', authenticate, async (req, res, next) => {
  try {
    if (!(await ensureTeamsEnabled(next))) return;

    const team = await TeamRequest.findById(req.params.id)
      .populate('opportunityId', 'title slug deadline category eventMode teamSize')
      .populate('createdBy', 'name studentProfile.discipline studentProfile.course')
      .populate('members.userId', 'name studentProfile.discipline studentProfile.skills')
      .populate('requests.userId', 'name studentProfile.discipline studentProfile.skills')
      .lean();

    if (!team) {
      return next(new AppError(404, 'TEAM_NOT_FOUND', 'Team request not found.'));
    }

    return res.json({
      success: true,
      data: { teamRequest: formatTeamForViewer(team, req.user._id) }
    });
  } catch (err) {
    return next(err);
  }
});

router.patch(
  '/:id',
  authenticate,
  requireRole('student'),
  validate({ body: updateTeamRequestSchema }),
  async (req, res, next) => {
    try {
      if (!(await ensureTeamsEnabled(next))) return;

      const team = await TeamRequest.findById(req.params.id);
      if (!team) {
        return next(new AppError(404, 'TEAM_NOT_FOUND', 'Team request not found.'));
      }

      if (String(team.createdBy) !== String(req.user._id)) {
        return next(
          new AppError(403, 'FORBIDDEN', 'Only the team creator can update this team request.')
        );
      }

      if (team.requestStatus === 'closed' && req.body.requestStatus !== 'closed') {
        return next(
          new AppError(400, 'TEAM_CLOSED', 'Closed team requests cannot be modified.')
        );
      }

      if (
        req.body.maximumMembers !== undefined &&
        req.body.maximumMembers < team.members.length
      ) {
        return next(
          new AppError(
            400,
            'INVALID_CAPACITY',
            'Maximum members cannot be less than current member count.'
          )
        );
      }

      Object.assign(team, req.body);
      if (team.requestStatus !== 'closed') {
        team.requestStatus = team.members.length >= team.maximumMembers ? 'full' : 'open';
      }

      await team.save();
      return res.json({
        success: true,
        data: { teamRequest: formatTeamForViewer(team, req.user._id) }
      });
    } catch (err) {
      return next(err);
    }
  }
);

router.post(
  '/:id/invitations',
  authenticate,
  requireRole('student'),
  validate({ body: teamInviteOrJoinSchema }),
  async (req, res, next) => {
    try {
      if (!(await ensureTeamsEnabled(next))) return;

      const team = await TeamRequest.findById(req.params.id);
      if (!team) {
        return next(new AppError(404, 'TEAM_NOT_FOUND', 'Team request not found.'));
      }

      if (team.requestStatus !== 'open' || team.members.length >= team.maximumMembers) {
        return next(
          new AppError(
            400,
            'TEAM_NOT_OPEN',
            'This team request is closed or already at maximum capacity.'
          )
        );
      }

      const isLeader = String(team.createdBy) === String(req.user._id);
      const { targetUserId, message, skillsOffered } = req.body;

      let applicantId = req.user._id;
      let direction = 'join_request';

      if (targetUserId) {
        if (!isLeader) {
          return next(
            new AppError(403, 'FORBIDDEN', 'Only the team leader can invite specific users.')
          );
        }
        applicantId = targetUserId;
        direction = 'leader_invite';
      } else if (isLeader) {
        return next(
          new AppError(400, 'ALREADY_MEMBER', 'You are already the leader of this team.')
        );
      }

      const alreadyMember = team.members.some(
        (m) => String(m.userId) === String(applicantId)
      );
      if (alreadyMember) {
        return next(
          new AppError(409, 'ALREADY_MEMBER', 'User is already a member of this team.')
        );
      }

      const duplicatePending = team.requests.some(
        (r) => String(r.userId) === String(applicantId) && r.status === 'pending'
      );
      if (duplicatePending) {
        return next(
          new AppError(409, 'PENDING_REQUEST_EXISTS', 'A pending request already exists.')
        );
      }

      team.requests.push({
        userId: applicantId,
        direction,
        message,
        skillsOffered:
          skillsOffered.length > 0 ? skillsOffered : req.user.studentProfile?.skills || []
      });

      await team.save();

      // Notify leader on join_request or invitee on leader_invite
      const notifyUserId = direction === 'join_request' ? team.createdBy : applicantId;
      await Notification.create({
        userId: notifyUserId,
        type: 'team_update',
        title:
          direction === 'join_request'
            ? `New team join request for "${team.title}"`
            : `You were invited to join "${team.title}"`,
        message:
          direction === 'join_request'
            ? `${req.user.name} requested to join your team.`
            : `${req.user.name} invited you to join their team.`,
        relatedOpportunityId: team.opportunityId,
        sentAt: new Date(),
        status: 'sent'
      });

      return res.status(201).json({
        success: true,
        data: { teamRequest: formatTeamForViewer(team, req.user._id) }
      });
    } catch (err) {
      return next(err);
    }
  }
);

router.post(
  '/:id/respond',
  authenticate,
  requireRole('student'),
  validate({ body: teamRespondSchema }),
  async (req, res, next) => {
    try {
      if (!(await ensureTeamsEnabled(next))) return;

      const team = await TeamRequest.findById(req.params.id);
      if (!team) {
        return next(new AppError(404, 'TEAM_NOT_FOUND', 'Team request not found.'));
      }

      if (team.requestStatus === 'closed') {
        return next(
          new AppError(400, 'TEAM_CLOSED', 'Membership cannot be modified after team closure.')
        );
      }

      const { requestId, decision } = req.body;
      const entry = team.requests.id(requestId);
      if (!entry || entry.status !== 'pending') {
        return next(
          new AppError(404, 'REQUEST_NOT_FOUND', 'Pending request or invitation not found.')
        );
      }

      const isLeader = String(team.createdBy) === String(req.user._id);
      const isApplicant = String(entry.userId) === String(req.user._id);

      if (decision === 'withdrawn') {
        if (!isApplicant) {
          return next(new AppError(403, 'FORBIDDEN', 'Only the applicant can withdraw.'));
        }
      } else if (entry.direction === 'join_request' && !isLeader) {
        return next(
          new AppError(403, 'FORBIDDEN', 'Only the team leader can accept or reject join requests.')
        );
      } else if (entry.direction === 'leader_invite' && !isApplicant) {
        return next(
          new AppError(403, 'FORBIDDEN', 'Only the invited student can respond to this invitation.')
        );
      }

      if (decision === 'accepted') {
        if (team.members.length >= team.maximumMembers) {
          return next(new AppError(409, 'TEAM_FULL', 'Team has already reached maximum capacity.'));
        }
        const alreadyMember = team.members.some(
          (m) => String(m.userId) === String(entry.userId)
        );
        if (alreadyMember) {
          return next(new AppError(409, 'ALREADY_MEMBER', 'User is already in the team.'));
        }
        team.members.push({
          userId: entry.userId,
          roleInTeam: 'member',
          skillsOffered: entry.skillsOffered || []
        });
        if (team.members.length >= team.maximumMembers) {
          team.requestStatus = 'full';
        }
      }

      entry.status = decision;
      entry.respondedAt = new Date();
      await team.save();

      const targetNotifyUser = isLeader ? entry.userId : team.createdBy;
      await Notification.create({
        userId: targetNotifyUser,
        type: 'team_update',
        title: `Team request ${decision}: "${team.title}"`,
        message: `Your team ${entry.direction === 'join_request' ? 'join request' : 'invitation'} was ${decision}.`,
        relatedOpportunityId: team.opportunityId,
        sentAt: new Date(),
        status: 'sent'
      });

      return res.json({
        success: true,
        data: { teamRequest: formatTeamForViewer(team, req.user._id) }
      });
    } catch (err) {
      return next(err);
    }
  }
);

router.post('/:id/leave', authenticate, requireRole('student'), async (req, res, next) => {
  try {
    if (!(await ensureTeamsEnabled(next))) return;

    const team = await TeamRequest.findById(req.params.id);
    if (!team) {
      return next(new AppError(404, 'TEAM_NOT_FOUND', 'Team request not found.'));
    }

    if (team.requestStatus === 'closed') {
      return next(
        new AppError(400, 'TEAM_CLOSED', 'Cannot alter membership on a closed team request.')
      );
    }

    const idx = team.members.findIndex((m) => String(m.userId) === String(req.user._id));
    if (idx === -1) {
      return next(new AppError(404, 'NOT_A_MEMBER', 'You are not a member of this team.'));
    }

    if (String(team.createdBy) === String(req.user._id)) {
      return next(
        new AppError(
          400,
          'LEADER_CANNOT_LEAVE',
          'Team creator cannot leave the team. Close the team request instead.'
        )
      );
    }

    team.members.splice(idx, 1);
    if (team.requestStatus === 'full' && team.members.length < team.maximumMembers) {
      team.requestStatus = 'open';
    }
    await team.save();

    return res.json({
      success: true,
      data: { teamRequest: formatTeamForViewer(team, req.user._id) }
    });
  } catch (err) {
    return next(err);
  }
});

export default router;

