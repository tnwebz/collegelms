import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const branches = ["Computer Science", "Information Technology", "Electronics", "Mechanical Engineering"];
const firstNames = ["James", "Mary", "Robert", "Patricia", "John", "Jennifer", "Michael", "Linda", "David", "Elizabeth"];
const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez"];

function getRandomItem(arr: any[]) {
    return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
    console.log('Generating students for sections B and C...');

    const newStudents = [];

    // Generate 10 Section B students
    for (let i = 0; i < 10; i++) {
        newStudents.push({
            full_name: `${getRandomItem(firstNames)} ${getRandomItem(lastNames)}`,
            email: `studentB${i + 1}@college.edu`,
            password: "password123",
            role: "STUDENT",
            section: "B"
        });
    }

    // Generate 10 Section C students
    for (let i = 0; i < 10; i++) {
        newStudents.push({
            full_name: `${getRandomItem(firstNames)} ${getRandomItem(lastNames)}`,
            email: `studentC${i + 1}@college.edu`,
            password: "password123",
            role: "STUDENT",
            section: "C"
        });
    }

    let createdCount = 0;

    for (const st of newStudents) {
        const exists = await prisma.users.findUnique({ where: { email: st.email } });
        if (!exists) {
            const user = await prisma.users.create({
                data: {
                    full_name: st.full_name,
                    email: st.email,
                    hashed_password: '$2b$10$W.DxZg8IilPT0xV8KxHBsubEH/bAs0xRBwl8Cjim12DWcwp6wRIIK',
                    role: 'STUDENT',
                    student_profile: {
                        create: {
                            enrollment_year: 2023,
                            current_semester: Math.floor(Math.random() * 8) + 1,
                            branch: getRandomItem(branches),
                            batch_year: "2027",
                            section: st.section
                        }
                    }
                }
            });
            createdCount++;
        }
    }

    console.log(`Successfully created ${createdCount} new students across sections B and C.`);
}

main()
    .catch((e) => {
        console.error(e);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
