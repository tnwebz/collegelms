import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding sample users...');
  const HASH = '$2b$10$W.DxZg8IilPT0xV8KxHBsubEH/bAs0xRBwl8Cjim12DWcwp6wRIIK'; // 'password123'

  // 0. Create Super Admin
  const admin = await prisma.users.upsert({
    where: { email: 'admin@college.edu' },
    update: { hashed_password: HASH },
    create: {
      full_name: 'Super Admin',
      email: 'admin@college.edu',
      hashed_password: HASH,
      role: 'SUPERADMIN',
      is_active: true,
    }
  });

  // 1. Create HOD
  const hod = await prisma.users.upsert({
    where: { email: 'hod@college.edu' },
    update: { hashed_password: HASH },
    create: {
      full_name: 'Hod CS',
      email: 'hod@college.edu',
      hashed_password: HASH,
      role: 'HOD',
      is_active: true,
      hod_profile: {
        create: {
          department: 'Computer Science'
        }
      }
    }
  });

  // 2. Create Staff
  const staff = await prisma.users.upsert({
    where: { email: 'staff@college.edu' },
    update: { hashed_password: HASH },
    create: {
      full_name: 'Jane Staff',
      email: 'staff@college.edu',
      hashed_password: HASH,
      role: 'STAFF',
      is_active: true,
      staff_profile: {
        create: {
          department: 'Computer Science',
          qualification: 'M.Tech'
        }
      }
    }
  });

  // 3. Create Student
  const student = await prisma.users.upsert({
    where: { email: 'student@college.edu' },
    update: { hashed_password: HASH },
    create: {
      full_name: 'John Student',
      email: 'student@college.edu',
      hashed_password: HASH,
      role: 'STUDENT',
      is_active: true,
      student_profile: {
        create: {
          enrollment_year: 2023,
          current_semester: 1,
          branch: 'Computer Science',
          batch_year: '2027',
          section: 'A'
        }
      }
    }
  });

  console.log('Seeded Admin:', admin.email, 'password123');
  console.log('Seeded HOD:', hod.email, 'password123');
  console.log('Seeded Staff:', staff.email, 'password123');
  console.log('Seeded Student:', student.email, 'password123');
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
