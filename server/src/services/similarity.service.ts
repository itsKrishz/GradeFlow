import prisma from '../lib/prisma';

export interface SimilarityResult {
  overallScore: number;
  threshold: number;
  flagged: boolean;
  matchedSource: string | null;
  matchedChunks: Array<{
    submissionSnippet: string;
    sourceSnippet: string;
    similarity: number;
  }>;
}

/**
 * Tokenize text into normalized lowercase n-grams (3-word sliding windows)
 */
function generateNGrams(text: string, n = 3): Set<string> {
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 2);

  const ngrams = new Set<string>();
  for (let i = 0; i <= words.length - n; i++) {
    ngrams.add(words.slice(i, i + n).join(' '));
  }
  return ngrams;
}

/**
 * Calculate Jaccard similarity index between two n-gram sets
 */
function computeJaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 || setB.size === 0) return 0;

  let intersectionCount = 0;
  for (const item of setA) {
    if (setB.has(item)) intersectionCount++;
  }

  const unionSize = setA.size + setB.size - intersectionCount;
  return unionSize > 0 ? (intersectionCount / unionSize) * 100 : 0;
}

/**
 * Extract overlapping sentence snippets between two texts
 */
function extractMatchingChunks(
  textA: string,
  textB: string,
  maxChunks = 3
): Array<{ submissionSnippet: string; sourceSnippet: string; similarity: number }> {
  const sentencesA = textA.split(/[.\n]+/).map((s) => s.trim()).filter((s) => s.length > 30);
  const sentencesB = textB.split(/[.\n]+/).map((s) => s.trim()).filter((s) => s.length > 30);

  const matches: Array<{ submissionSnippet: string; sourceSnippet: string; similarity: number }> = [];

  for (const sA of sentencesA) {
    const ngramsA = generateNGrams(sA, 2);
    for (const sB of sentencesB) {
      const ngramsB = generateNGrams(sB, 2);
      const similarity = computeJaccardSimilarity(ngramsA, ngramsB);

      if (similarity > 50) {
        matches.push({
          submissionSnippet: sA.slice(0, 160),
          sourceSnippet: sB.slice(0, 160),
          similarity: Math.round(similarity),
        });
        if (matches.length >= maxChunks) return matches;
      }
    }
  }

  return matches;
}

/**
 * Compare an incoming submission against all other submissions in the database for this assignment
 */
export async function analyzeSubmissionSimilarity(
  submissionId: string,
  assignmentId: string,
  submissionText: string,
  threshold = 30.0
): Promise<SimilarityResult> {
  // If the extracted text is too short, return clean result
  if (!submissionText || submissionText.trim().length < 50) {
    return {
      overallScore: 0.0,
      threshold,
      flagged: false,
      matchedSource: null,
      matchedChunks: [],
    };
  }

  const targetNGrams = generateNGrams(submissionText, 3);

  // Fetch all existing submissions for the same assignment that have extracted text
  const peerSubmissions = await prisma.submission.findMany({
    where: {
      assignmentId,
      id: { not: submissionId },
      fileText: { not: null },
    },
    include: {
      student: { select: { name: true, email: true } },
    },
  });

  let highestScore = 0.0;
  let topMatchedSource: string | null = null;
  let topMatchedChunks: Array<{ submissionSnippet: string; sourceSnippet: string; similarity: number }> = [];

  for (const peer of peerSubmissions) {
    if (!peer.fileText) continue;

    const peerNGrams = generateNGrams(peer.fileText, 3);
    const score = computeJaccardSimilarity(targetNGrams, peerNGrams);

    if (score > highestScore) {
      highestScore = score;
      topMatchedSource = `Student: ${peer.student.name} (${peer.fileName})`;
      topMatchedChunks = extractMatchingChunks(submissionText, peer.fileText);
    }
  }

  const roundedScore = Math.round(highestScore * 10) / 10;
  const isFlagged = roundedScore >= threshold;

  return {
    overallScore: roundedScore,
    threshold,
    flagged: isFlagged,
    matchedSource: isFlagged ? topMatchedSource : null,
    matchedChunks: topMatchedChunks,
  };
}
