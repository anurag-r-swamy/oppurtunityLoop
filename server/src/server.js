import bcrypt from 'bcryptjs';
import { env } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import { createApp } from './app.js';
import { startReminderScheduler } from './services/reminderService.js';
import { seedDatabase } from './scripts/seed.js';
import { User } from './models/User.js';

let server;
let reminderTimer;
let memoryServer;

async function start() {
  try {
    let mongoUri = env.MONGODB_URI;

    if (env.USE_IN_MEMORY_DB && env.NODE_ENV === 'development') {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      memoryServer = await MongoMemoryServer.create();
      mongoUri = memoryServer.getUri();
      console.log(`Started local in-memory MongoDB at ${mongoUri}`);
    }

    await connectDB(mongoUri);
    console.log('Connected to MongoDB');

    if (memoryServer) {
      await seedDatabase();
      console.log('Seeded demo data into in-memory MongoDB');
      console.log('Demo student: student.demo@example.com / DemoPass@123');
      console.log('Demo organizer: organizer.demo@example.com / DemoPass@123');

      const adminEmail = (process.env.DEV_ADMIN_EMAIL || '').trim().toLowerCase();
      const adminPass = process.env.DEV_ADMIN_PASSWORD || '';
      if (adminEmail && adminPass.length >= 8) {
        const passwordHash = await bcrypt.hash(adminPass, 12);
        await User.updateOne(
          { email: adminEmail },
          {
            $setOnInsert: {
              name: process.env.DEV_ADMIN_NAME || 'Local Dev Admin',
              email: adminEmail,
              passwordHash,
              role: 'admin',
              accountStatus: 'active'
            }
          },
          { upsert: true }
        );
        console.log(`Initialized dev admin in in-memory MongoDB: ${adminEmail}`);
      }
    }

    const app = createApp();
    server = app.listen(env.PORT, () => {
      console.log(`OpportunityLoop API listening on port ${env.PORT} (${env.NODE_ENV})`);
    });

    reminderTimer = startReminderScheduler();
  } catch (err) {
    console.error('Failed to start OpportunityLoop server:', err.message);
    process.exit(1);
  }
}

async function shutdown(signal) {
  console.log(`Received ${signal}. Shutting down gracefully...`);
  if (reminderTimer) clearInterval(reminderTimer);
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await disconnectDB();
  if (memoryServer) {
    await memoryServer.stop();
  }
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

start();
