import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const forceInstructor = async () => {
  const email = "sadhanashreya28@gmail.com";
  
  try {
    const user = await prisma.users.findUnique({ where: { email } });
    
    if (user) {
      console.log(`🧐 Current Role: ${user.role}`);
      await prisma.users.update({
        where: { id: user.id },
        data: { role: 'STAFF' }
      });
      console.log(`✅ SUCCESS: ${user.email} has been forcefully promoted to INSTRUCTOR.`);
    } else {
      console.log(`❌ Error: User ${email} not found. Did you delete the db again?`);
    }
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
};

forceInstructor();
