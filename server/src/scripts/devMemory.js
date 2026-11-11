process.env.NODE_ENV = process.env.NODE_ENV || 'development';
process.env.USE_IN_MEMORY_DB = 'true';

await import('../server.js');

