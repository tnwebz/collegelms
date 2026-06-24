import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const branches = ['Computer Science', 'Information Technology', 'Electronics & Comm', 'Mechanical Engineering'];
const sections = ['A', 'B', 'C'];
const firstNames = ['Aarav', 'Vihaan', 'Aditya', 'Sai', 'Arjun', 'Ananya', 'Diya', 'Ishita', 'Kavya', 'Neha', 'Rohan', 'Rishabh', 'Rahul', 'Nitin', 'Amit', 'Pooja', 'Sneha', 'Riya', 'Shruti', 'Anjali', 'Karthik', 'Sanjay', 'Vikram', 'Meera', 'Rani'];
const lastNames = ['Sharma', 'Verma', 'Gupta', 'Patel', 'Singh', 'Kumar', 'Reddy', 'Nair', 'Das', 'Iyer', 'Menon', 'Jain', 'Bose', 'Rao', 'Chauhan'];

function getRandomItem(arr: any[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  console.log('Starting dynamic seed...');
  
  // Use same fixed hash for simplicity so user can log in easily
  const HASH = '$2b$10$W.DxZg8IilPT0xV8KxHBsubEH/bAs0xRBwl8Cjim12DWcwp6wRIIK'; // 'password123'

  // 1. Get the existing staff user to assign courses to
  const staffUser = await prisma.users.findUnique({ where: { email: 'staff@college.edu' } });
  if (!staffUser) {
    console.error('Run the basic seed_users.ts first to create staff account!');
    return;
  }

  // 2. Create 20 Dynamic Students
  console.log('Generating 20 dynamic students...');
  for (let i = 1; i <= 20; i++) {
    const fName = getRandomItem(firstNames);
    const lName = getRandomItem(lastNames);
    const fullName = `${fName} ${lName}`;
    const email = `student${i}@college.edu`;
    const branch = getRandomItem(branches);
    const section = getRandomItem(sections);
    const sem = Math.floor(Math.random() * 8) + 1; // 1 to 8

    await prisma.users.upsert({
      where: { email },
      update: {
        full_name: fullName,
      },
      create: {
        full_name: fullName,
        email,
        hashed_password: HASH,
        role: 'STUDENT',
        is_active: true,
        student_profile: {
          create: {
            enrollment_year: 2023,
            current_semester: sem,
            branch: branch,
            batch_year: '2027',
            section: section
          }
        }
      }
    });
  }

  // 3. Create Dynamic Courses
  console.log('Generating dynamic courses and content...');
  const coursesToCreate = [
    {
      title: 'Advanced Data Structures and Algorithms',
      description: 'Master algorithms and data structures to ace your placements.',
      department: 'Computer Science',
      semester: 1,
      course_type: 'standard',
    },
    {
      title: 'Machine Learning Fundamentals',
      description: 'Introduction to linear regression, classification, and neural networks.',
      department: 'Computer Science',
      semester: 1,
      course_type: 'standard',
    },
    {
      title: 'Python Coding Challenge Lab',
      description: 'Practical coding lab for Python programming with real-time compilation.',
      department: 'Computer Science',
      semester: 1,
      course_type: 'coding',
      language: 'python'
    }
  ];

  for (const cData of coursesToCreate) {
    const course = await prisma.courses.create({
      data: {
        title: cData.title,
        description: cData.description,
        is_published: true,
        staff_id: staffUser.id,
        course_type: cData.course_type,
        language: cData.language,
        department: cData.department,
        academic_year: '2023',
        semester: cData.semester,
        sections: ['A', 'B', 'C'],
        image_url: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800&auto=format&fit=crop&q=60'
      }
    });

    // Create course batch
    const batch = await prisma.course_batches.create({
      data: {
        course_id: course.id,
        semester: cData.semester,
        section: 'A',
        year: 2023,
        status: 'ACTIVE'
      }
    });

    // Create Modules for the course
    const module1 = await prisma.modules.create({
      data: {
        course_id: course.id,
        title: 'Module 1: Introduction',
        order: 1
      }
    });

    // Create Content Items (Lessons) for Module 1
    await prisma.content_items.create({
      data: {
        module_id: module1.id,
        title: 'Welcome to the Course',
        type: 'VIDEO',
        content: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        duration: 15,
        order: 1
      }
    });

    await prisma.content_items.create({
      data: {
        module_id: module1.id,
        title: 'First Assignment',
        type: 'ASSIGNMENT',
        order: 2
      }
    });
    
    // Enroll the first 10 students randomly into these courses via the batch
    for (let i = 1; i <= 10; i++) {
       const student = await prisma.users.findUnique({ where: { email: `student${i}@college.edu` }});
       if(student) {
           // We will use findFirst since enrollments lacks a unique identifier in the script creation
           const existingEnrollment = await prisma.enrollments.findFirst({
             where: { student_id: student.id, batch_id: batch.id }
           });
           
           if (!existingEnrollment) {
             await prisma.enrollments.create({
                 data: {
                     student_id: student.id,
                     batch_id: batch.id,
                     enrollment_date: new Date()
                 }
             });
           }
       }
    }
  }

  // 4. Create Coding Assessments (code_tests)
  await prisma.code_tests.create({
      data: {
          title: "Array Reverse Matrix",
          pass_key: "MATRIX2023",
          users: { connect: { id: staffUser.id } },
          problems: {
              create: {
                  title: "Array Reverse Matrix",
                  description: "Write a function to reverse a given array matrix.",
                  difficulty: "Medium",
                  test_cases: JSON.stringify([
                      { input: "[1, 2, 3]", output: "[3, 2, 1]" },
                      { input: "[4, 5, 6]", output: "[6, 5, 4]" }
                  ])
              }
          }
      }
  });

  console.log('Dynamic seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
