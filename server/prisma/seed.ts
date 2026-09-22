import { PrismaClient, Role, SubmissionStatus, ProcessingState, AssignmentStatus, NotificationType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting GradeFlow database seeding...');

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

  console.log('🧹 Cleaned existing records.');

  // Pre-hash passwords
  const teacherPasswordHash = await bcrypt.hash('teacher123', 10);
  const studentPasswordHash = await bcrypt.hash('student123', 10);
  const adminPasswordHash = await bcrypt.hash('admin123', 10);

  // 2. Seed Users
  const teacher = await prisma.user.create({
    data: {
      username: 'teacher',
      email: 'teacher@gradeflow.edu',
      passwordHash: teacherPasswordHash,
      name: 'Prof. Robert Vance',
      role: Role.TEACHER,
      department: 'Computer Science & Engineering',
    },
  });

  const studentAlex = await prisma.user.create({
    data: {
      username: 'student',
      email: 'student@gradeflow.edu',
      passwordHash: studentPasswordHash,
      name: 'Alex Rivera',
      role: Role.STUDENT,
      department: 'Computer Science & Engineering',
    },
  });

  const studentJordan = await prisma.user.create({
    data: {
      username: 'jordan',
      email: 'jordan.l@gradeflow.edu',
      passwordHash: studentPasswordHash,
      name: 'Jordan Lee',
      role: Role.STUDENT,
      department: 'Computer Science & Engineering',
    },
  });

  const studentSophia = await prisma.user.create({
    data: {
      username: 'sophia',
      email: 'sophia.c@gradeflow.edu',
      passwordHash: studentPasswordHash,
      name: 'Sophia Chen',
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

  console.log(`👤 Seeded 5 Users (${teacher.name}, ${studentAlex.name}, ${studentJordan.name}, ${studentSophia.name}, ${admin.name}).`);

  // 3. Seed Courses
  const dbCourse = await prisma.course.create({
    data: {
      code: 'CS301',
      name: 'Database Engineering & Relational Design',
      semester: 'Fall 2026',
      department: 'Computer Science',
      teacherId: teacher.id,
    },
  });

  const dsaCourse = await prisma.course.create({
    data: {
      code: 'CS302',
      name: 'Advanced Data Structures & Algorithms',
      semester: 'Fall 2026',
      department: 'Computer Science',
      teacherId: teacher.id,
    },
  });

  const aiCourse = await prisma.course.create({
    data: {
      code: 'CS304',
      name: 'Machine Learning & Natural Language Processing',
      semester: 'Spring 2027',
      department: 'Computer Science',
      teacherId: teacher.id,
    },
  });

  console.log(`📚 Seeded 3 Courses (${dbCourse.code}, ${dsaCourse.code}, ${aiCourse.code}).`);

  // 4. Enroll Students
  await prisma.courseEnrollment.createMany({
    data: [
      { courseId: dbCourse.id, studentId: studentAlex.id },
      { courseId: dbCourse.id, studentId: studentJordan.id },
      { courseId: dbCourse.id, studentId: studentSophia.id },
      { courseId: dsaCourse.id, studentId: studentAlex.id },
      { courseId: dsaCourse.id, studentId: studentJordan.id },
      { courseId: aiCourse.id, studentId: studentSophia.id },
    ],
  });

  console.log('🎓 Seeded Course Enrollments.');

  // 5. Seed Assignments
  const assignment1 = await prisma.assignment.create({
    data: {
      courseId: dbCourse.id,
      title: 'Assignment 1: Relational Schema & 3NF Normalization',
      description:
        'Design a normalized relational database schema for an academic evaluation system. Submit ER diagrams, SQL DDL statements, and mathematical proofs of Third Normal Form (3NF).',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      dueTime: '23:59',
      totalMarks: 100,
      acceptedFileTypes: ['pdf', 'sql'],
      status: AssignmentStatus.PUBLISHED,
      rubricCriteria: {
        create: [
          {
            title: 'Schema Correctness & Key Constraints',
            description: 'Accurate Primary/Foreign keys, integrity constraints, and cascade rules.',
            maxMarks: 35,
            orderIndex: 0,
          },
          {
            title: '3NF Decomposition & Normalization Proof',
            description: 'Elimination of transitive dependencies and proof that non-key attributes depend solely on key.',
            maxMarks: 35,
            orderIndex: 1,
          },
          {
            title: 'SQL DDL Execution & Index Optimization',
            description: 'Valid PostgreSQL DDL execution and secondary index justifications.',
            maxMarks: 30,
            orderIndex: 2,
          },
        ],
      },
    },
  });

  const assignment2 = await prisma.assignment.create({
    data: {
      courseId: dbCourse.id,
      title: 'Assignment 2: B-Tree Index Implementation',
      description: 'Implement a disk-backed B+ Tree in C++ or Python with insert, search, and range scan capabilities.',
      dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      dueTime: '23:59',
      totalMarks: 100,
      acceptedFileTypes: ['zip', 'tar.gz'],
      status: AssignmentStatus.PUBLISHED,
    },
  });

  console.log(`📝 Seeded 2 Assignments for ${dbCourse.code}.`);

  // 6. Seed Submissions, Evaluations, and Integrity Reports
  // Submission 1: Alex Rivera (Clean, High Grade, Graded)
  const alexSubmission = await prisma.submission.create({
    data: {
      assignmentId: assignment1.id,
      studentId: studentAlex.id,
      fileName: 'alex_rivera_cs301_a1.pdf',
      fileSize: '2.4 MB',
      fileUrl: '/uploads/sample_alex.pdf',
      status: SubmissionStatus.GRADED,
      processingState: ProcessingState.COMPLETED,
      submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.evaluation.create({
    data: {
      submissionId: alexSubmission.id,
      evaluatorId: teacher.id,
      totalScore: 94.0,
      percentage: 94.0,
      grade: 'A',
      feedback:
        'Outstanding submission. The functional dependency matrix is completely sound and accurately identifies candidate keys. The proposed indexes for student submissions demonstrate strong understanding of query plans.',
      rubricScores: [
        { criterionTitle: 'Schema Correctness & Key Constraints', score: 34, maxMarks: 35, comment: 'Clean constraints and foreign key actions.' },
        { criterionTitle: '3NF Decomposition & Normalization Proof', score: 33, maxMarks: 35, comment: 'Rigorous proof with no transitive anomalies.' },
        { criterionTitle: 'SQL DDL Execution & Index Optimization', score: 27, maxMarks: 30, comment: 'Good composite index on [courseId, studentId].' },
      ],
      aiAssisted: true,
      published: true,
    },
  });

  await prisma.similarityReport.create({
    data: {
      submissionId: alexSubmission.id,
      overallScore: 8.5,
      threshold: 30.0,
      flagged: false,
      matchedSource: 'Standard PostgreSQL Documentation & IEEE Templates',
      matchedChunks: [
        {
          submissionSnippet: 'CREATE TABLE course_enrollments ( id UUID PRIMARY KEY ... )',
          sourceSnippet: 'CREATE TABLE enrollments ( id UUID PRIMARY KEY ... )',
          similarity: 12,
        },
      ],
    },
  });

  // Submission 2: Jordan Lee (Flagged for Academic Integrity)
  const jordanSubmission = await prisma.submission.create({
    data: {
      assignmentId: assignment1.id,
      studentId: studentJordan.id,
      fileName: 'jordan_lee_db_a1.pdf',
      fileSize: '1.8 MB',
      fileUrl: '/uploads/sample_jordan.pdf',
      status: SubmissionStatus.FLAGGED,
      processingState: ProcessingState.COMPLETED,
      submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.evaluation.create({
    data: {
      submissionId: jordanSubmission.id,
      evaluatorId: teacher.id,
      totalScore: 56.0,
      percentage: 56.0,
      grade: 'D',
      feedback:
        'Significant overlap detected with Spring 2024 repository submission. 3NF decomposition text appears copied verbatim. Please see instructor during office hours.',
      rubricScores: [
        { criterionTitle: 'Schema Correctness & Key Constraints', score: 22, maxMarks: 35, comment: 'Schema structure functional but unoriginal.' },
        { criterionTitle: '3NF Decomposition & Normalization Proof', score: 14, maxMarks: 35, comment: 'Proofs match archived repository verbatim.' },
        { criterionTitle: 'SQL DDL Execution & Index Optimization', score: 20, maxMarks: 30, comment: 'Basic queries without execution plan analysis.' },
      ],
      aiAssisted: true,
      published: false,
    },
  });

  await prisma.similarityReport.create({
    data: {
      submissionId: jordanSubmission.id,
      overallScore: 86.4,
      threshold: 30.0,
      flagged: true,
      matchedSource: 'Student CS-2024-042 (Spring 2024 Archival Archive)',
      matchedChunks: [
        {
          submissionSnippet: 'Theorem 1: Let R be a relation schema with functional dependencies F...',
          sourceSnippet: 'Theorem 1: Let R be a relation schema with functional dependencies F...',
          similarity: 98,
        },
        {
          submissionSnippet: 'Decomposition into 3NF ensures lossless join and dependency preservation...',
          sourceSnippet: 'Decomposition into 3NF ensures lossless join and dependency preservation...',
          similarity: 94,
        },
      ],
    },
  });

  // Submission 3: Sophia Chen (In Progress / Evaluating)
  const sophiaSubmission = await prisma.submission.create({
    data: {
      assignmentId: assignment1.id,
      studentId: studentSophia.id,
      fileName: 'sophia_chen_db_v1.pdf',
      fileSize: '3.1 MB',
      fileUrl: '/uploads/sample_sophia.pdf',
      status: SubmissionStatus.EVALUATING,
      processingState: ProcessingState.AI_EVALUATION,
      submittedAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    },
  });

  console.log(`📄 Seeded 3 Submissions with Evaluations & Similarity Reports.`);

  // 7. Seed Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: teacher.id,
        title: 'New Submissions Ready for Evaluation',
        message: '3 submissions are ready for review in CS301 (Assignment 1).',
        type: NotificationType.INFO,
      },
      {
        userId: teacher.id,
        title: 'Academic Integrity Alert',
        message: 'Submission from Jordan Lee has been flagged with 86.4% similarity.',
        type: NotificationType.WARNING,
      },
      {
        userId: studentAlex.id,
        title: 'Grade Published',
        message: 'Your submission for Assignment 1 has been graded: 94.0% (Grade A).',
        type: NotificationType.SUCCESS,
      },
    ],
  });

  console.log('🔔 Seeded Notifications.');
  console.log('✅ GradeFlow database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
