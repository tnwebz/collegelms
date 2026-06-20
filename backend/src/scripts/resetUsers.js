const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetUsers() {
  try {
    console.log("Truncating users table CASCADE...");
    await prisma.$executeRawUnsafe('TRUNCATE TABLE users RESTART IDENTITY CASCADE;');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('123', salt);

    console.log("Creating new staff user...");
    await prisma.users.create({
      data: {
        email: 'staff@gmail.com',
        hashed_password: hashedPassword,
        full_name: 'Test Staff',
        role: 'STAFF',
        is_active: true,
        created_at: new Date()
      }
    });

    console.log("Creating new student user...");
    await prisma.users.create({
      data: {
        email: 'student@gmail.com',
        hashed_password: hashedPassword,
        full_name: 'Test Student',
        role: 'STUDENT',
        is_active: true,
        created_at: new Date()
      }
    });

    console.log("Creating new admin user...");
    await prisma.users.create({
      data: {
        email: 'admin@gmail.com',
        hashed_password: hashedPassword,
        full_name: 'Admin User',
        role: 'ADMIN',
        is_active: true,
        created_at: new Date()
      }
    });

    console.log("✅ Success! Users created.");
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await prisma.$disconnect();
  }
}

resetUsers();
