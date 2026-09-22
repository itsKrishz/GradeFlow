-- CreateEnum
CREATE TYPE "Role" AS ENUM ('STUDENT', 'TEACHER', 'ADMIN');

-- CreateEnum
CREATE TYPE "ProcessingState" AS ENUM ('PENDING', 'EXTRACTING', 'SIMILARITY_CHECK', 'AI_EVALUATION', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('SUBMITTED', 'EVALUATING', 'GRADED', 'FLAGGED');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('INFO', 'SUCCESS', 'WARNING', 'ERROR');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL DEFAULT 'pbkdf2_placeholder',
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'STUDENT',
    "department" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "semester" TEXT NOT NULL,
    "department" TEXT NOT NULL DEFAULT 'Computer Science',
    "teacherId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_enrollments" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "course_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assignments" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "dueTime" TEXT NOT NULL DEFAULT '23:59',
    "totalMarks" INTEGER NOT NULL DEFAULT 100,
    "acceptedFileTypes" TEXT[] DEFAULT ARRAY['pdf', 'sql', 'zip']::TEXT[],
    "status" "AssignmentStatus" NOT NULL DEFAULT 'PUBLISHED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rubric_criteria" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "maxMarks" INTEGER NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "rubric_criteria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submissions" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" TEXT NOT NULL,
    "fileUrl" TEXT,
    "fileText" TEXT,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'SUBMITTED',
    "processingState" "ProcessingState" NOT NULL DEFAULT 'COMPLETED',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluations" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "evaluatorId" TEXT NOT NULL,
    "totalScore" DOUBLE PRECISION NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,
    "grade" TEXT NOT NULL,
    "feedback" TEXT NOT NULL,
    "rubricScores" JSONB NOT NULL,
    "aiAssisted" BOOLEAN NOT NULL DEFAULT true,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "evaluatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "similarity_reports" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "overallScore" DOUBLE PRECISION NOT NULL,
    "threshold" DOUBLE PRECISION NOT NULL DEFAULT 30.0,
    "flagged" BOOLEAN NOT NULL DEFAULT false,
    "matchedSource" TEXT,
    "matchedChunks" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "similarity_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL DEFAULT 'INFO',
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "courses_code_key" ON "courses"("code");

-- CreateIndex
CREATE UNIQUE INDEX "course_enrollments_courseId_studentId_key" ON "course_enrollments"("courseId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "submissions_assignmentId_studentId_key" ON "submissions"("assignmentId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "evaluations_submissionId_key" ON "evaluations"("submissionId");

-- CreateIndex
CREATE UNIQUE INDEX "similarity_reports_submissionId_key" ON "similarity_reports"("submissionId");

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_enrollments" ADD CONSTRAINT "course_enrollments_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_enrollments" ADD CONSTRAINT "course_enrollments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rubric_criteria" ADD CONSTRAINT "rubric_criteria_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_evaluatorId_fkey" FOREIGN KEY ("evaluatorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "similarity_reports" ADD CONSTRAINT "similarity_reports_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
