const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.users.updateMany({
    where: { role: 'ADMIN' },
    data: { role: 'HOD' }
  });
  console.log('Updated users from ADMIN to HOD');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
