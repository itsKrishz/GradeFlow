import path from 'path';
import fs from 'fs';
import { EventEmitter } from 'events';
import prisma from '../lib/prisma';
import { extractDocumentText } from './extractor.service';
import { analyzeSubmissionSimilarity } from './similarity.service';
import { evaluateSubmissionWithAI } from './ai-evaluator.service';
import { NotificationType, ProcessingState, SubmissionStatus } from '@prisma/client';

export interface PipelineJobStatus {
  submissionId: string;
  stage: ProcessingState;
  progress: number;
  stageMessage: string;
  error?: string;
  completedAt?: Date;
}

class PipelineEventEmitter extends EventEmitter {}
export const pipelineEvents = new PipelineEventEmitter();

// In-memory status tracker for real-time progress polling
const jobStatuses = new Map<string, PipelineJobStatus>();

export function getJobStatus(submissionId: string): PipelineJobStatus | null {
  return jobStatuses.get(submissionId) || null;
}

function updateJobStatus(
  submissionId: string,
  stage: ProcessingState,
  progress: number,
  stageMessage: string,
  error?: string
) {
  const status: PipelineJobStatus = {
    submissionId,
    stage,
    progress,
    stageMessage,
    error,
    ...(stage === ProcessingState.COMPLETED ? { completedAt: new Date() } : {}),
  };
  jobStatuses.set(submissionId, status);
  pipelineEvents.emit(`progress:${submissionId}`, status);
}

/**
 * Enqueue a submission for asynchronous background processing
 */
export function enqueueSubmissionPipeline(submissionId: string): void {
  updateJobStatus(submissionId, ProcessingState.PENDING, 5, 'Submission queued for processing...');

  // Run in next tick of event loop asynchronously so HTTP response is returned immediately
  setImmediate(async () => {
    try {
      await processSubmission(submissionId);
    } catch (error: any) {
      console.error(`[Pipeline Error for submission ${submissionId}]:`, error);
      updateJobStatus(
        submissionId,
        ProcessingState.FAILED,
        100,
        'Processing failed.',
        error.message
      );
      await prisma.submission.update({
        where: { id: submissionId },
        data: { processingState: ProcessingState.FAILED },
      });
    }
  });
}

/**
 * Multi-stage sequential pipeline worker
 */
async function processSubmission(submissionId: string): Promise<void> {
  // 1. Fetch submission with assignment and rubrics
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      student: true,
      assignment: {
        include: {
          course: true,
          rubricCriteria: { orderBy: { orderIndex: 'asc' } },
        },
      },
    },
  });

  if (!submission) {
    throw new Error(`Submission '${submissionId}' not found.`);
  }

  // Stage 1: Document Extraction
  updateJobStatus(submissionId, ProcessingState.EXTRACTING, 25, 'Extracting text and structure from file...');
  await prisma.submission.update({
    where: { id: submissionId },
    data: { processingState: ProcessingState.EXTRACTING },
  });

  let extractedText = submission.fileText || '';

  if (submission.fileUrl) {
    const fullPath = path.isAbsolute(submission.fileUrl)
      ? submission.fileUrl
      : path.join(process.cwd(), submission.fileUrl);

    if (fs.existsSync(fullPath)) {
      const extractionResult = await extractDocumentText(fullPath);
      extractedText = extractionResult.text;

      // Save extracted text to PostgreSQL
      await prisma.submission.update({
        where: { id: submissionId },
        data: { fileText: extractedText },
      });
    }
  }

  // Stage 2: Academic Similarity Check
  updateJobStatus(submissionId, ProcessingState.SIMILARITY_CHECK, 55, 'Running academic integrity & similarity comparison...');
  await prisma.submission.update({
    where: { id: submissionId },
    data: { processingState: ProcessingState.SIMILARITY_CHECK },
  });

  const similarityResult = await analyzeSubmissionSimilarity(
    submissionId,
    submission.assignmentId,
    extractedText,
    30.0
  );

  // Upsert similarity report
  await prisma.similarityReport.upsert({
    where: { submissionId },
    update: {
      overallScore: similarityResult.overallScore,
      threshold: similarityResult.threshold,
      flagged: similarityResult.flagged,
      matchedSource: similarityResult.matchedSource,
      matchedChunks: similarityResult.matchedChunks,
    },
    create: {
      submissionId,
      overallScore: similarityResult.overallScore,
      threshold: similarityResult.threshold,
      flagged: similarityResult.flagged,
      matchedSource: similarityResult.matchedSource,
      matchedChunks: similarityResult.matchedChunks,
    },
  });

  if (similarityResult.flagged) {
    await prisma.submission.update({
      where: { id: submissionId },
      data: { status: SubmissionStatus.FLAGGED },
    });
  }

  // Stage 3: AI Rubric Evaluation Recommendation
  updateJobStatus(submissionId, ProcessingState.AI_EVALUATION, 85, 'Evaluating rubric criteria and preparing grading draft...');
  await prisma.submission.update({
    where: { id: submissionId },
    data: { processingState: ProcessingState.AI_EVALUATION },
  });

  // Execute AI Rubric Scoring Engine
  const aiResult = await evaluateSubmissionWithAI({
    submissionText: extractedText,
    assignmentTitle: submission.assignment.title,
    assignmentDescription: submission.assignment.description,
    rubricCriteria: submission.assignment.rubricCriteria,
    studentName: submission.student.name,
  });

  const feedbackText = similarityResult.flagged
    ? `${aiResult.overallFeedback} [Academic Warning: Similarity flagged at ${similarityResult.overallScore}% with ${similarityResult.matchedSource}].`
    : aiResult.overallFeedback;

  // Create initial draft evaluation (ready for instructor review in Evaluation Workspace)
  await prisma.evaluation.upsert({
    where: { submissionId },
    update: {
      totalScore: aiResult.totalScore,
      percentage: aiResult.percentage,
      grade: aiResult.grade,
      feedback: feedbackText,
      rubricScores: aiResult.rubricScores as any,
      aiAssisted: true,
      published: false, // Remains in draft until instructor confirms
      evaluatedAt: new Date(),
    },
    create: {
      submissionId,
      evaluatorId: submission.assignment.course.teacherId,
      totalScore: aiResult.totalScore,
      percentage: aiResult.percentage,
      grade: aiResult.grade,
      feedback: feedbackText,
      rubricScores: aiResult.rubricScores as any,
      aiAssisted: true,
      published: false,
    },
  });

  // Stage 4: Pipeline Completed
  updateJobStatus(submissionId, ProcessingState.COMPLETED, 100, 'Processing complete! Ready for instructor review.');
  await prisma.submission.update({
    where: { id: submissionId },
    data: {
      processingState: ProcessingState.COMPLETED,
      status: similarityResult.flagged ? SubmissionStatus.FLAGGED : SubmissionStatus.EVALUATING,
    },
  });

  // Notify instructor of new submission processed
  await prisma.notification.create({
    data: {
      userId: submission.assignment.course.teacherId,
      title: 'Submission Pipeline Completed',
      message: `${submission.student.name} submitted '${submission.assignment.title}'. Ready for evaluation.`,
      type: similarityResult.flagged ? NotificationType.WARNING : NotificationType.INFO,
    },
  });
}
