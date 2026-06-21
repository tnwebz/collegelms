const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('123', 10);
  await prisma.users.upsert({
    where: { email: 'superadmin@gmail.com' },
    update: {
      role: 'SUPERADMIN',
      hashed_password: hashedPassword,
      is_active: true,
      full_name: 'Super Admin'
    },
    create: {
      email: 'superadmin@gmail.com',
      login_id: 'superadmin',
      full_name: 'Super Admin',
      hashed_password: hashedPassword,
      role: 'SUPERADMIN',
      is_active: true
    }
  });
  console.log('Super Admin seeded successfully');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
