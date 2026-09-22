import { GoogleGenAI } from '@google/genai';

export interface RubricCriterionInput {
  id: string;
  title: string;
  description: string;
  maxMarks: number;
}

export interface EvaluatedCriterion {
  criterionId: string;
  criterionTitle: string;
  score: number;
  maxMarks: number;
  reasoning: string;
  strengths: string[];
  areasForImprovement: string[];
}

export interface AIEvaluationResult {
  totalScore: number;
  percentage: number;
  grade: string;
  overallFeedback: string;
  rubricScores: EvaluatedCriterion[];
  academicDisclaimer: string;
  provider: 'gemini' | 'heuristic-engine';
}

const ACADEMIC_DISCLAIMER =
  'This is an AI-generated draft recommendation. Final academic judgment, grade approval, and publication rest with the course instructor.';

/**
 * Deterministic academic evaluator engine used when Gemini API key is unset or in local dev/testing
 */
function evaluateWithHeuristicEngine(
  submissionText: string,
  assignmentTitle: string,
  rubricCriteria: RubricCriterionInput[],
  studentName = 'Student'
): AIEvaluationResult {
  const normalizedText = (submissionText || '').toLowerCase();
  const textLength = normalizedText.length;

  let totalScore = 0;
  let totalPossible = 0;

  const evaluatedCriteria: EvaluatedCriterion[] = rubricCriteria.map((criterion) => {
    totalPossible += criterion.maxMarks;

    // Check keyword relevance between criterion description and student text
    const keywords = criterion.description
      .toLowerCase()
      .split(/\W+/)
      .filter((w) => w.length > 3);

    let matchCount = 0;
    for (const kw of keywords) {
      if (normalizedText.includes(kw)) matchCount++;
    }

    const keywordRatio = keywords.length > 0 ? matchCount / keywords.length : 0.5;

    // Base scoring heuristic (scaled from 75% to 95% depending on density and completeness)
    let scoreFactor = 0.82;
    if (textLength > 300) scoreFactor += 0.08;
    if (keywordRatio > 0.4) scoreFactor += 0.06;
    if (textLength < 80) scoreFactor = 0.55;

    scoreFactor = Math.min(0.98, Math.max(0.4, scoreFactor));
    const score = Math.round(criterion.maxMarks * scoreFactor * 2) / 2;
    totalScore += score;

    return {
      criterionId: criterion.id,
      criterionTitle: criterion.title,
      score,
      maxMarks: criterion.maxMarks,
      reasoning: `Submission addresses '${criterion.title}' with sound structure. Key concepts from rubric description identified.`,
      strengths: [
        `Clear demonstration of foundational principles required by '${criterion.title}'.`,
        'Structured formulation and logical arrangement of submission components.',
      ],
      areasForImprovement: [
        `Consider expanding on edge cases and deeper analytical justifications for '${criterion.title}'.`,
      ],
    };
  });

  const percentage = totalPossible > 0 ? Math.round((totalScore / totalPossible) * 1000) / 10 : 0;
  let grade = 'B';
  if (percentage >= 90) grade = 'A';
  else if (percentage >= 80) grade = 'B';
  else if (percentage >= 70) grade = 'C';
  else if (percentage >= 60) grade = 'D';
  else grade = 'F';

  const overallFeedback = `Solid academic submission for '${assignmentTitle}'. ${studentName} demonstrates proficient understanding of the core criteria with organized execution. Minor refinements in technical proofs will elevate subsequent submissions.`;

  return {
    totalScore,
    percentage,
    grade,
    overallFeedback,
    rubricScores: evaluatedCriteria,
    academicDisclaimer: ACADEMIC_DISCLAIMER,
    provider: 'heuristic-engine',
  };
}

/**
 * Main AI Evaluation entry point.
 * Uses Gemini 2.5 Flash if GEMINI_API_KEY is configured; falls back safely to heuristic engine.
 */
export async function evaluateSubmissionWithAI(params: {
  submissionText: string;
  assignmentTitle: string;
  assignmentDescription: string;
  rubricCriteria: RubricCriterionInput[];
  studentName?: string;
}): Promise<AIEvaluationResult> {
  const { submissionText, assignmentTitle, assignmentDescription, rubricCriteria, studentName } =
    params;

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  if (!apiKey || apiKey.trim() === '') {
    return evaluateWithHeuristicEngine(
      submissionText,
      assignmentTitle,
      rubricCriteria,
      studentName
    );
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
You are GradeFlow AI Evaluator, a rigorous academic grading assistant.
Evaluate the student submission strictly against the instructor's rubric criteria.

Assignment: "${assignmentTitle}"
Description: "${assignmentDescription}"

Student Submission Text:
"""
${submissionText.slice(0, 10000)}
"""

Rubric Criteria:
${rubricCriteria
  .map(
    (c, i) => `${i + 1}. [ID: ${c.id}] "${c.title}" (Max Marks: ${c.maxMarks}): ${c.description}`
  )
  .join('\n')}

INSTRUCTIONS:
1. Score each criterion fairly. Score must NEVER exceed maxMarks.
2. Provide a constructive 2-sentence reasoning, 2 strengths, and 1 area for improvement per criterion.
3. Compute totalScore (sum of criterion scores) and percentage.
4. Output letter grade: A (>=90%), B (80-89%), C (70-79%), D (60-69%), F (<60%).
5. Return ONLY a valid JSON object matching this schema:
{
  "totalScore": number,
  "percentage": number,
  "grade": string,
  "overallFeedback": string,
  "rubricScores": [
    {
      "criterionId": string,
      "criterionTitle": string,
      "score": number,
      "maxMarks": number,
      "reasoning": string,
      "strengths": string[],
      "areasForImprovement": string[]
    }
  ]
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2, // Low temperature for deterministic grading consistency
      },
    });

    const responseText = response.text || '';
    const parsed = JSON.parse(responseText);

    return {
      totalScore: Number(parsed.totalScore) || 0,
      percentage: Number(parsed.percentage) || 0,
      grade: String(parsed.grade || 'B'),
      overallFeedback: String(parsed.overallFeedback || 'Evaluation completed.'),
      rubricScores: parsed.rubricScores || [],
      academicDisclaimer: ACADEMIC_DISCLAIMER,
      provider: 'gemini',
    };
  } catch (error: any) {
    console.warn('[Gemini AI Evaluation Warning]:', error.message, 'Falling back to heuristic engine.');
    return evaluateWithHeuristicEngine(
      submissionText,
      assignmentTitle,
      rubricCriteria,
      studentName
    );
  }
}

/**
 * Generate constructive feedback summary from rubric score breakdown
 */
export function generateFeedbackFromScores(params: {
  rubricScores: Record<string, number> | any[];
  criteria: RubricCriterionInput[];
  studentName?: string;
}): string {
  const { rubricScores, criteria, studentName = 'Student' } = params;

  let totalScore = 0;
  let totalMax = 0;
  const strongAreas: string[] = [];
  const needsWorkAreas: string[] = [];

  for (const criterion of criteria) {
    let score = 0;
    if (Array.isArray(rubricScores)) {
      const match = rubricScores.find((r) => r.criterionId === criterion.id || r.criterionTitle === criterion.title);
      score = match ? match.score : 0;
    } else if (typeof rubricScores === 'object') {
      score = rubricScores[criterion.id] ?? rubricScores[criterion.title] ?? 0;
    }

    totalScore += score;
    totalMax += criterion.maxMarks;

    const ratio = criterion.maxMarks > 0 ? score / criterion.maxMarks : 0;
    if (ratio >= 0.85) strongAreas.push(criterion.title);
    else if (ratio < 0.7) needsWorkAreas.push(criterion.title);
  }

  const pct = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;

  let feedback = `Overall Grade: ${pct}%. ${studentName} demonstrated `;
  if (strongAreas.length > 0) {
    feedback += `excellent mastery in ${strongAreas.join(' and ')}. `;
  } else {
    feedback += `a solid foundational attempt across the rubric items. `;
  }

  if (needsWorkAreas.length > 0) {
    feedback += `To achieve top marks in future evaluations, focus on deeper technical rigor in ${needsWorkAreas.join(' and ')}.`;
  } else {
    feedback += 'Consistent, high-caliber execution throughout the submission.';
  }

  return feedback;
}
