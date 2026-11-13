import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../dist/generated/prisma/client.js";
import bcrypt from "bcrypt";

const name = process.env.ADMIN_NAME?.trim();
const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not configured.");
}

if (!name || !email || !password) {
  throw new Error("Admin name, email and password are required.");
}

if (password.length < 12) {
  throw new Error("Admin password must contain at least 12 characters.");
}

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

try {
  const existing = await prisma.admin.findUnique({
    where: { email },
  });

  if (existing) {
    throw new Error("This admin email already exists. No changes made.");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.admin.create({
    data: {
      name,
      email,
      passwordHash,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
      isActive: true,
    },
  });

  console.log("\nAdmin account created successfully:");
  console.log(admin);
} catch (error) {
  console.error("\nAdmin creation failed:", error.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
