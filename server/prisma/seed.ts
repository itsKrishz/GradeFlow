import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting GradeFlow database seeding (Clean Slate)...');

  // 1. Clean existing records in reverse dependency order
  await prisma.notification.deleteMany();
  await prisma.similarityReport.deleteMany();
  await prisma.evaluation.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.rubricCriterion.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.courseEnrollment.deleteMany();
  await prisma.course.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 Cleaned existing records from database.');

  // Pre-hash passwords
  const teacherPasswordHash = await bcrypt.hash('teacher123', 10);
  const studentPasswordHash = await bcrypt.hash('student123', 10);
  const adminPasswordHash = await bcrypt.hash('admin123', 10);

  // 2. Seed Clean Initial Users
  const teacher = await prisma.user.create({
    data: {
      username: 'teacher1',
      email: 'teacher1@gradeflow.edu',
      passwordHash: teacherPasswordHash,
      name: 'Prof. Teacher',
      role: Role.TEACHER,
      department: 'Computer Science & Engineering',
    },
  });

  const studentBhadra = await prisma.user.create({
    data: {
      username: 'bhadra',
      email: 'bhadra.k@student.edu',
      passwordHash: studentPasswordHash,
      name: 'Bhadra K.',
      role: Role.STUDENT,
      department: 'Computer Science & Engineering',
    },
  });

  const studentNevin = await prisma.user.create({
    data: {
      username: 'nevin',
      email: 'nevin.p@student.edu',
      passwordHash: studentPasswordHash,
      name: 'Nevin P.',
      role: Role.STUDENT,
      department: 'Computer Science & Engineering',
    },
  });

  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@gradeflow.edu',
      passwordHash: adminPasswordHash,
      name: 'Campus Administrator',
      role: Role.ADMIN,
      department: 'Academic Computing Services',
    },
  });

  console.log(`👤 Seeded 4 Clean Users (${teacher.name}, ${studentBhadra.name}, ${studentNevin.name}, ${admin.name}).`);
  console.log('✅ Clean slate ready: Zero hardcoded mock users, zero hardcoded courses and zero assignments in database.');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
