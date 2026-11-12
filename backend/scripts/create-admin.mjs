
import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../dist/generated/prisma/client.js';
const required = ['DATABASE_URL', 'ADMIN_NAME', 'ADMIN_EMAIL', 'ADMIN_PASSWORD'];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`${key} is missing from environment`);
  }
}

if (process.env.ADMIN_PASSWORD.length < 12) {
  throw new Error('Admin password must be at least 12 characters');
}

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

try {
  const email = process.env.ADMIN_EMAIL.trim().toLowerCase();

  const existing = await prisma.admin.findUnique({
    where: { email },
  });

  if (existing) {
    throw new Error('An admin with this email already exists');
  }

  const passwordHash = await bcrypt.hash(
    process.env.ADMIN_PASSWORD,
    12,
  );

  const admin = await prisma.admin.create({
    data: {
      name: process.env.ADMIN_NAME.trim(),
      email,
      passwordHash,
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  console.log('Admin created successfully:', admin);
} finally {
  await prisma.$disconnect();
}
