import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const listUsers = async () => {
  try {
    const users = await prisma.users.findMany({
      select: { id: true, email: true, password_hash: true }
    });
    for (const u of users) {
      console.log(u);
    }
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
};

if (require.main === module) {
  listUsers();
}
