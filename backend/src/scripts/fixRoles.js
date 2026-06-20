const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  console.log("Checking DB users...");
  try {
    const users = await p.$queryRaw`SELECT id, email, role::text as text_role FROM users`;
    console.log(users);
    
    // Fix lowercase roles
    for (const u of users) {
      if (u.text_role === 'student') {
        console.log(`Fixing student: ${u.email}`);
        await p.$executeRaw`UPDATE users SET role = 'STUDENT'::"Role" WHERE id = ${u.id}`;
      } else if (u.text_role === 'instructor') {
        console.log(`Fixing staff: ${u.email}`);
        await p.$executeRaw`UPDATE users SET role = 'STAFF'::"Role" WHERE id = ${u.id}`;
      } else if (u.text_role === 'admin') {
        await p.$executeRaw`UPDATE users SET role = 'ADMIN'::"Role" WHERE id = ${u.id}`;
      }
    }
    console.log("Fixed roles in DB");
  } catch (e) {
    console.error("Error connecting to DB:", e);
  } finally {
    await p.$disconnect();
  }
}
main();
