import { connectDB, disconnectDB } from '../config/db.js';
import { env } from '../config/env.js';
import { AuditLog } from '../models/AuditLog.js';
import { Bookmark } from '../models/Bookmark.js';
import { Category } from '../models/Category.js';
import { Notification } from '../models/Notification.js';
import { Opportunity } from '../models/Opportunity.js';
import { Participation } from '../models/Participation.js';
import { PlatformSetting } from '../models/PlatformSetting.js';
import { Report } from '../models/Report.js';
import { Session } from '../models/Session.js';
import { TeamRequest } from '../models/TeamRequest.js';
import { User } from '../models/User.js';

async function reset() {
  if (env.NODE_ENV === 'production') {
    console.error('Refusing to reset database when NODE_ENV=production.');
    process.exit(1);
  }

  await connectDB();
  await Promise.all([
    AuditLog.deleteMany({}),
    Bookmark.deleteMany({}),
    Category.deleteMany({}),
    Notification.deleteMany({}),
    Opportunity.deleteMany({}),
    Participation.deleteMany({}),
    PlatformSetting.deleteMany({}),
    Report.deleteMany({}),
    Session.deleteMany({}),
    TeamRequest.deleteMany({}),
    User.deleteMany({})
  ]);

  console.log('Development database cleared successfully.');
  await disconnectDB();
}

reset().catch((err) => {
  console.error('Reset failed:', err);
  process.exit(1);
});

