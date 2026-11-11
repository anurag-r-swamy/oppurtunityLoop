import bcrypt from 'bcryptjs';
import { connectDB, disconnectDB } from '../config/db.js';
import { env } from '../config/env.js';
import { User } from '../models/User.js';

async function createDevAdmin() {
  if (env.NODE_ENV === 'production') {
    console.error('create-dev-admin is for local development only.');
    process.exit(1);
  }

  const name = process.env.DEV_ADMIN_NAME || 'Local Dev Admin';
  const email = (process.env.DEV_ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.DEV_ADMIN_PASSWORD || '';

  if (!email || !password || password.length < 8) {
    console.error(
      'Please provide DEV_ADMIN_EMAIL and DEV_ADMIN_PASSWORD (min 8 chars) in environment variables.'
    );
    process.exit(1);
  }

  await connectDB();
  const passwordHash = await bcrypt.hash(password, 12);

  const existing = await User.findOne({ email });
  if (existing) {
    existing.name = name;
    existing.passwordHash = passwordHash;
    existing.role = 'admin';
    existing.accountStatus = 'active';
    await existing.save();
    console.log(`Updated local dev admin account: ${email}`);
  } else {
    await User.create({
      name,
      email,
      passwordHash,
      role: 'admin',
      accountStatus: 'active'
    });
    console.log(`Created local dev admin account: ${email}`);
  }

  await disconnectDB();
}

createDevAdmin().catch((err) => {
  console.error('Failed to create dev admin:', err);
  process.exit(1);
});

