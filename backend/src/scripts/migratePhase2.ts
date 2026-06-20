import { PrismaClient, ContentType, BatchStatus } from '@prisma/client';

const prisma = new PrismaClient({ log: ['warn', 'error'] });

async function migrate() {
  console.log("🚀 Starting Phase 2 Migration: Template vs Instance Mapping...");

  // Fetch all existing courses (Blueprints)
  const courses = await prisma.courses.findMany();
  console.log(`Found ${courses.length} courses to migrate.`);

  for (const course of courses) {
    // 1. Instantiate default CourseBatch
    const batch = await prisma.course_batches.create({
      data: {
        course_id: course.id,
        semester: 0,
        section: 'Legacy',
        status: BatchStatus.ACTIVE
      }
    });
    console.log(`✅ Created Legacy Batch [ID: ${batch.id}] for Course [ID: ${course.id}]`);

    // 2. Remap existing course content to the new CourseBatch
    // Following legacy architecture: Course -> Modules -> Content Items
    const legacyModules = await prisma.modules.findMany({
      where: { course_id: course.id },
      include: { content_items: true }
    });

    let contentCount = 0;
    for (const mod of legacyModules) {
      for (const item of mod.content_items) {
        let type: typeof ContentType[keyof typeof ContentType] = ContentType.VIDEO;
        if (item.type?.toUpperCase() === 'ASSIGNMENT') type = ContentType.ASSIGNMENT;
        if (item.type?.toUpperCase() === 'TEST') type = ContentType.TEST;

        await prisma.batch_content.create({
          data: {
            batch_id: batch.id,
            type: type,
            title: item.title || 'Untitled',
            content_data: item.content || item.instructions || item.test_config,
            due_date: item.end_time || null
          }
        });
        contentCount++;
      }
    }
    console.log(`   Mapped ${contentCount} legacy content items to Batch [ID: ${batch.id}]`);
    
    // Note: Because we used Prisma db push with data loss in Phase 1, the legacy student_id 
    // to course_id mapping in enrollments was wiped from the schema columns. In a production 
    // SQL deployment, we would map the existing enrollments.course_id to the new batch.id here.
  }

  console.log("🎉 Phase 2 Migration Scripts Executed Successfully.");
}

migrate()
  .catch(e => {
    console.error("Migration Failed:", e);
    // @ts-ignore
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
