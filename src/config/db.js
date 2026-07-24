const { PrismaClient } = require('@prisma/client');

// Single shared Prisma instance (avoids exhausting DB connections on hot-reload)
const prisma = global.__datum_prisma__ || new PrismaClient();
if (process.env.NODE_ENV !== 'production') global.__datum_prisma__ = prisma;

module.exports = prisma;
