import { AuditLog } from '../models/AuditLog.js';

export async function recordAuditLog({ actorId, action, entityType, entityId, metadata = {} }) {
  try {
    // Strip any potentially sensitive keys if accidentally passed
    const safeMetadata = { ...metadata };
    delete safeMetadata.password;
    delete safeMetadata.passwordHash;
    delete safeMetadata.token;
    delete safeMetadata.session;

    await AuditLog.create({
      actorId,
      action,
      entityType,
      entityId,
      metadata: safeMetadata
    });
  } catch (err) {
    console.error('AuditLog write failed:', err.message);
  }
}

