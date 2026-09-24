import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { 
  ArrowLeft, 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Sparkles, 
  CheckCircle2, 
  Save, 
  Clock, 
  AlertTriangle, 
  Search, 
  FileText, 
  Highlighter, 
  MessageSquarePlus,
  Sliders,
  Check,
  ShieldAlert,
  ExternalLink,
  X,
  RefreshCw,
  Edit3,
  Scale,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Download,
  Upload,
  Eye
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { mockFeedbackTemplates, mockSimilarityComparison } from '../../data/mockData';
import { Evaluation } from '../../types';
import { getOrGeneratePdfUrl } from '../../utils/pdfStorage';

export const EvaluationWorkspace: React.FC = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { 
    assignments, 
    submissions, 
    saveEvaluation, 
    generateAIFeedback, 
    showToast,
    attachPdfToSubmission 
  } = useApp();

  // Find assignment
  const currentAssignmentId = assignmentId || assignments[0]?.id;
  const assignment = assignments.find(a => a.id === currentAssignmentId) || assignments[0];

  // All submissions for this assignment
  const assignmentSubmissions = assignment ? submissions.filter(s => s.assignmentId === assignment.id) : [];

  // Left Column Filter States
  const [studentSearch, setStudentSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'evaluated' | 'flagged'>('all');

  // Filtered submissions
  const filteredSubmissions = assignmentSubmissions.filter(sub => {
    const matchesSearch = 
      sub.studentName.toLowerCase().includes(studentSearch.toLowerCase()) ||
      sub.regNo.toLowerCase().includes(studentSearch.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === 'pending') return sub.evaluationStatus === 'Pending';
    if (statusFilter === 'evaluated') return sub.evaluationStatus === 'Evaluated';
    if (statusFilter === 'flagged') return sub.similarityScore >= sub.similarityReport.threshold || sub.evaluationStatus === 'Flagged';
    return true;
  });

  // Selected Student Submission
  const studentIdParam = searchParams.get('studentId');
  const initialIndex = studentIdParam 
    ? assignmentSubmissions.findIndex(s => s.studentId === studentIdParam || s.id === studentIdParam)
    : 0;

  const [selectedStudentIndex, setSelectedStudentIndex] = useState<number>(initialIndex >= 0 ? initialIndex : 0);
  const currentSubmission = assignmentSubmissions[selectedStudentIndex] || assignmentSubmissions[0];

  // Document Viewer States
  const [currentPage, setCurrentPage] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [activeAnnotationMode, setActiveAnnotationMode] = useState<'none' | 'highlight' | 'comment'>('none');
  const [mockAnnotations, setMockAnnotations] = useState<string[]>([]);

  // PDF Document Viewer States
  const [viewMode, setViewMode] = useState<'pdf' | 'text'>('pdf');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Rubric Scores State (criterionId -> score)
  const [rubricScores, setRubricScores] = useState<Record<string, number>>({});
  const [feedbackText, setFeedbackText] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  // AI-Assisted Evaluation Card State
  const [showAiCard, setShowAiCard] = useState(true);
  const [isRegeneratingAi, setIsRegeneratingAi] = useState(false);

  // Similarity & Integrity Modal State
  const [showSimilarityModal, setShowSimilarityModal] = useState(false);
  const [activeSegmentIndex, setActiveSegmentIndex] = useState(0);
  const [flagDismissed, setFlagDismissed] = useState(false);
  const [modalViewMode, setModalViewMode] = useState<'sideBySidePdf' | 'textDiff'>('sideBySidePdf');
  const [selectedPeerId, setSelectedPeerId] = useState<string | null>(null);
  const [peerPdfUrl, setPeerPdfUrl] = useState<string | null>(null);
  const [peerPdfLoading, setPeerPdfLoading] = useState(false);

  // Find matched peer submission for side-by-side comparison
  const matchedPeerSubmission = React.useMemo(() => {
    if (!currentSubmission) return null;

    // 1. Try from similarityReport matchedSections
    const matchedSection = currentSubmission.similarityReport?.matchedSections?.[0];
    if (matchedSection?.matchedSubmissionId) {
      const found = submissions.find(s => s.id === matchedSection.matchedSubmissionId);
      if (found) return found;
    }

    // 2. Try by student name in matchedSource (e.g. "Peer Submission: athul (filename.pdf)")
    if (matchedSection?.matchedSource) {
      const match = matchedSection.matchedSource.match(/Peer Submission:\s*([^(]+)/i);
      if (match) {
        const studentName = match[1].trim().toLowerCase();
        const found = submissions.find(s => 
          s.assignmentId === currentSubmission.assignmentId &&
          s.id !== currentSubmission.id &&
          (s.studentName.toLowerCase().includes(studentName) || studentName.includes(s.studentName.toLowerCase()))
        );
        if (found) return found;
      }
    }

    // 3. Try matching by identical fileHash
    if (currentSubmission.fileHash) {
      const found = submissions.find(s => 
        s.assignmentId === currentSubmission.assignmentId &&
        s.id !== currentSubmission.id &&
        s.fileHash === currentSubmission.fileHash
      );
      if (found) return found;
    }

    // 4. Try matching by identical fileName
    if (currentSubmission.fileName) {
      const found = submissions.find(s => 
        s.assignmentId === currentSubmission.assignmentId &&
        s.id !== currentSubmission.id &&
        s.fileName.toLowerCase() === currentSubmission.fileName.toLowerCase()
      );
      if (found) return found;
    }

    // 5. Fallback to any other peer submission in the assignment
    const otherSubs = submissions.filter(s => s.assignmentId === currentSubmission.assignmentId && s.id !== currentSubmission.id);
    return otherSubs.length > 0 ? otherSubs[0] : null;
  }, [currentSubmission, submissions]);

  // Active peer submission (either auto-matched or selected by teacher from dropdown)
  const activePeerSubmission = React.useMemo(() => {
    if (selectedPeerId) {
      return submissions.find(s => s.id === selectedPeerId) || matchedPeerSubmission;
    }
    return matchedPeerSubmission;
  }, [selectedPeerId, submissions, matchedPeerSubmission]);

  // Load peer PDF URL whenever active peer submission changes
  useEffect(() => {
    let isMounted = true;
    if (activePeerSubmission) {
      setPeerPdfLoading(true);
      getOrGeneratePdfUrl(activePeerSubmission)
        .then(url => {
          if (isMounted) {
            setPeerPdfUrl(url);
            setPeerPdfLoading(false);
          }
        })
        .catch(err => {
          console.error('Error resolving peer PDF:', err);
          if (isMounted) setPeerPdfLoading(false);
        });
    } else {
      setPeerPdfUrl(null);
      setPeerPdfLoading(false);
    }
    return () => {
      isMounted = false;
    };
  }, [activePeerSubmission?.id, activePeerSubmission?.pdfStorageKey, activePeerSubmission?.fileUrl]);

  // Load or generate real PDF view for the active submission
  useEffect(() => {
    let isMounted = true;
    if (currentSubmission) {
      setPdfLoading(true);
      getOrGeneratePdfUrl(currentSubmission)
        .then(url => {
          if (isMounted) {
            setPdfUrl(url);
            setPdfLoading(false);
          }
        })
        .catch(err => {
          console.error('Error resolving submission PDF:', err);
          if (isMounted) setPdfLoading(false);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [currentSubmission?.id, currentSubmission?.pdfStorageKey, currentSubmission?.fileUrl, assignment?.id]);

  const handleDownloadPdf = () => {
    if (!pdfUrl || !currentSubmission) return;
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = currentSubmission.fileName.endsWith('.pdf') ? currentSubmission.fileName : `${currentSubmission.fileName}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('Download started for submission PDF', 'info');
  };

  const handleTeacherPdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && currentSubmission) {
      const file = e.target.files[0];
      setPdfLoading(true);
      await attachPdfToSubmission(currentSubmission.id, file);
      const newUrl = URL.createObjectURL(file);
      setPdfUrl(newUrl);
      setPdfLoading(false);
    }
  };

  // Initialize or load existing evaluation when selected student changes
  useEffect(() => {
    if (currentSubmission) {
      if (currentSubmission.evaluation) {
        setRubricScores(currentSubmission.evaluation.rubricScores || {});
        setFeedbackText(currentSubmission.evaluation.feedback || '');
      } else {
        // Initialize default scores (e.g. ~80% of max marks as starter)
        const initialScores: Record<string, number> = {};
        assignment.rubric.forEach(c => {
          initialScores[c.id] = Math.round(c.maxMarks * 0.8);
        });
        setRubricScores(initialScores);
        setFeedbackText('');
      }
      setCurrentPage(1);
      setMockAnnotations([]);
      setFlagDismissed(false);
      // Sync URL
      setSearchParams({ studentId: currentSubmission.studentId });
    }
  }, [currentSubmission?.id]);

  // Live Score Calculations
  const calculateTotalScore = () => {
    return assignment.rubric.reduce((acc, criterion) => {
      return acc + (rubricScores[criterion.id] ?? 0);
    }, 0);
  };

  const totalScore = calculateTotalScore();
  const maxScore = assignment.totalMarks || 40;
  const percentage = Math.round((totalScore / maxScore) * 100);

  // Grade Boundaries according to specification:
  // 90–100: A+ | 80–89: A | 70–79: B+ | 60–69: B | 50–59: C | Below 50: F
  const getLetterGrade = (pct: number): string => {
    if (pct >= 90) return 'A+';
    if (pct >= 80) return 'A';
    if (pct >= 70) return 'B+';
    if (pct >= 60) return 'B';
    if (pct >= 50) return 'C';
    return 'F';
  };

  const letterGrade = getLetterGrade(percentage);

  // Handle Score Input Change
  const handleScoreChange = (criterionId: string, value: number, max: number) => {
    const clamped = Math.max(0, Math.min(max, isNaN(value) ? 0 : value));
    setRubricScores(prev => ({
      ...prev,
      [criterionId]: clamped
    }));
  };

  // Quick Feedback Template Insertion
  const handleApplyTemplate = (templateText: string) => {
    setFeedbackText(prev => prev ? `${prev}\n\n${templateText}` : templateText);
    showToast('Feedback template applied', 'info');
  };

  // AI-Assisted Feedback Generator
  const handleGenerateAiFeedback = () => {
    setIsAiGenerating(true);
    setTimeout(() => {
      const generated = generateAIFeedback(rubricScores, assignment.rubric, currentSubmission.studentName);
      setFeedbackText(generated);
      setIsAiGenerating(false);
      showToast('AI Feedback drafted. Please review and edit before saving.', 'info');
    }, 600);
  };

  // Save Evaluation Actions
  const handleSave = (isDraft = false) => {
    if (!currentSubmission) return;

    const evalPayload: Evaluation = {
      id: currentSubmission.evaluation?.id || `eval-${Date.now()}`,
      submissionId: currentSubmission.id,
      rubricScores,
      totalScore,
      maxScore,
      percentage,
      grade: letterGrade,
      feedback: feedbackText,
      aiAssisted: isAiGenerating,
      status: isDraft ? 'Draft' : 'Final',
      evaluatedAt: new Date().toLocaleString()
    };

    saveEvaluation(currentSubmission.id, evalPayload, isDraft);
  };

  // Sequential Navigation
  const handlePrevStudent = () => {
    if (selectedStudentIndex > 0) {
      setSelectedStudentIndex(selectedStudentIndex - 1);
    }
  };

  const handleNextStudent = () => {
    if (selectedStudentIndex < assignmentSubmissions.length - 1) {
      setSelectedStudentIndex(selectedStudentIndex + 1);
    }
  };

  // Document Annotation Handler
  const handleAddAnnotation = (text: string) => {
    setMockAnnotations(prev => [...prev, text]);
    showToast('Inline annotation added to preview', 'info');
  };

  if (!assignment) {
    return (
      <div className="p-12 text-center max-w-md mx-auto space-y-4">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">No Assignments Available</h3>
        <p className="text-xs text-slate-500">
          Create an academic assignment before launching the evaluation workspace.
        </p>
        <button
          onClick={() => navigate('/teacher/assignments/create')}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-semibold shadow-sm transition-colors"
        >
          Create Assignment
        </button>
      </div>
    );
  }

  if (!currentSubmission) {
    return (
      <div className="p-12 text-center max-w-md mx-auto space-y-4">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">No Submissions Yet</h3>
        <p className="text-xs text-slate-500">
          No students have submitted deliverables for "{assignment.title}" yet.
        </p>
        <button
          onClick={() => navigate('/teacher/assignments')}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-md text-xs font-semibold shadow-sm transition-colors"
        >
          Back to Assignments
        </button>
      </div>
    );
  }

  const isSimilarityFlagged = currentSubmission.similarityScore >= currentSubmission.similarityReport.threshold && !flagDismissed;
  const totalPages = currentSubmission.pages?.length || 1;
  const activePageData = currentSubmission.pages?.[currentPage - 1] || {
    pageNumber: 1,
    title: 'Submission Document Preview',
    content: 'Document contents rendered here...'
  };

  // Computed AI Suggestion Data
  const suggestedRubricScores: Record<string, number> = currentSubmission.aiSuggestedRubric || (() => {
    const scores: Record<string, number> = {};
    assignment.rubric.forEach(c => {
      scores[c.id] = Math.max(1, Math.round(c.maxMarks * (isSimilarityFlagged ? 0.65 : 0.85)));
    });
    return scores;
  })();

  const suggestedReasoning: Record<string, string> = 
    typeof currentSubmission.aiReasoning === 'object' && currentSubmission.aiReasoning !== null
      ? currentSubmission.aiReasoning
      : {
          'rubric-1': typeof currentSubmission.aiReasoning === 'string' ? currentSubmission.aiReasoning : 'Schema captures critical relational entities and conforms to standard entity-relationship modeling conventions.',
          'rubric-2': isSimilarityFlagged
            ? 'Normalization derivation matches previously archived student submissions in multiple functional dependency proofs.'
            : 'Solid functional dependency decomposition achieving 3NF without information loss or transitive anomalies.',
          'rubric-3': 'DDL executes cleanly with valid primary keys, foreign key references, and appropriate check constraints.',
          'rubric-4': 'Benchmark queries properly structured with reasonable performance profiling and EXPLAIN scans.'
        };

  const suggestedAiFeedback = currentSubmission.aiSuggestedFeedback || 
    (isSimilarityFlagged
      ? 'Relational modeling exhibits foundational competence, but substantial overlapping sections in the normalization proofs require instructor clarification regarding citation and originality.'
      : 'Commendable database design with robust normalization and index benchmarking. Recommend verifying composite index performance under high concurrency.');

  const suggestedTotalScore = currentSubmission.aiSuggestedScore || 
    Object.values(suggestedRubricScores).reduce((a, b) => a + b, 0);

  const suggestedPercentage = Math.round((suggestedTotalScore / maxScore) * 100);
  const suggestedGrade = getLetterGrade(suggestedPercentage);

  // Accept AI suggestions into teacher editable state
  const handleAcceptAiSuggestion = () => {
    setRubricScores(suggestedRubricScores);
    setFeedbackText(suggestedAiFeedback);
    showToast('AI evaluation suggestion applied! You can now adjust individual scores.', 'success');
  };

  // Regenerate AI suggestion
  const handleRegenerateAi = () => {
    setIsRegeneratingAi(true);
    setTimeout(() => {
      setIsRegeneratingAi(false);
      showToast('AI suggestions recalculated from current submission text.', 'info');
    }, 750);
  };

  // Similarity Actions
  const handleDismissFlag = () => {
    setFlagDismissed(true);
    setShowSimilarityModal(false);
    showToast(`Similarity flag for ${currentSubmission.studentName} dismissed by instructor.`, 'info');
  };

  const handleConfirmFlag = () => {
    setShowSimilarityModal(false);
    showToast(`Academic integrity concern confirmed for ${currentSubmission.studentName}. Flagged for review.`, 'warning');
  };

  const handleAddIntegrityNoteToFeedback = (sectionName: string) => {
    const note = `\n\n[Academic Integrity Query]: Please clarify the source and formulation methodology for "${sectionName}" in your project report.`;
    setFeedbackText(prev => prev ? `${prev}${note}` : note);
    showToast('Clarification request added to student feedback.', 'info');
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden bg-slate-100 dark:bg-academic-navy">
      {/* Top Bar: Assignment Breadcrumb & Next/Prev Controls */}
      <div className="h-12 bg-white dark:bg-academic-darkCard border-b border-academic-lightBorder dark:border-academic-darkBorder px-4 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate(`/teacher/assignments/${assignment.id}`)}
            className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded transition-colors"
            title="Back to Assignment Details"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          
          <div className="text-xs truncate">
            <span className="font-semibold text-slate-900 dark:text-slate-100">{assignment.title}</span>
            <span className="text-slate-400 mx-1.5">•</span>
            <span className="font-mono text-slate-500">{assignment.courseCode}</span>
          </div>
        </div>

        {/* Center: Student Sequence Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevStudent}
            disabled={selectedStudentIndex === 0}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none rounded border border-slate-300 dark:border-slate-700 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Previous Student</span>
          </button>

          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 px-1">
            Student {selectedStudentIndex + 1} of {assignmentSubmissions.length}
          </span>

          <button
            onClick={handleNextStudent}
            disabled={selectedStudentIndex === assignmentSubmissions.length - 1}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none rounded border border-slate-300 dark:border-slate-700 transition-colors"
          >
            <span className="hidden sm:inline">Next Student</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: Quick Save Action */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSave(true)}
            className="px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded border border-slate-300 dark:border-slate-700 transition-colors"
          >
            Save Draft
          </button>
          <button
            onClick={() => handleSave(false)}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded shadow-sm transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Save Evaluation</span>
          </button>
        </div>
      </div>

      {/* THREE COLUMN WORKSPACE */}
      <div className="flex-1 flex overflow-hidden">
        {/* =========================================================================
            COLUMN 1: STUDENT SUBMISSIONS ROSTER (Left Column - 280px)
        ========================================================================= */}
        <aside className="w-72 bg-white dark:bg-academic-darkCard border-r border-academic-lightBorder dark:border-academic-darkBorder flex flex-col shrink-0 overflow-hidden">
          {/* Search Box */}
          <div className="p-3 border-b border-academic-lightBorder dark:border-academic-darkBorder space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search students..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-600"
              />
            </div>

            {/* Status Filter Tabs */}
            <div className="grid grid-cols-4 gap-1 text-[11px]">
              {(['all', 'pending', 'evaluated', 'flagged'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`py-1 rounded text-center font-medium capitalize transition-colors ${
                    statusFilter === tab
                      ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Student Submissions List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
            {filteredSubmissions.map((sub, idx) => {
              const isSelected = sub.id === currentSubmission.id;
              const isFlagged = sub.similarityScore >= sub.similarityReport.threshold;

              return (
                <div
                  key={sub.id}
                  onClick={() => {
                    const originalIdx = assignmentSubmissions.findIndex(s => s.id === sub.id);
                    setSelectedStudentIndex(originalIdx >= 0 ? originalIdx : idx);
                  }}
                  className={`p-3 cursor-pointer transition-colors border-l-4 ${
                    isSelected
                      ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-600'
                      : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <div className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                      {sub.studentName}
                    </div>
                    {isFlagged && (
                      <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/70 px-1 py-0.2 rounded border border-rose-200 dark:border-rose-800 flex items-center gap-0.5">
                        <AlertTriangle className="w-2.5 h-2.5" />
                        <span>{sub.similarityScore}%</span>
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                    {sub.regNo}
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 text-[10px]">
                    <span className={sub.status === 'Late' ? 'text-rose-600 dark:text-rose-400 font-medium' : 'text-slate-500'}>
                      {sub.status === 'Late' ? 'Late' : 'On-Time'}
                    </span>

                    <span className={`font-semibold ${
                      sub.evaluationStatus === 'Evaluated' ? 'text-emerald-600 dark:text-emerald-400' :
                      sub.evaluationStatus === 'Flagged' ? 'text-rose-600 dark:text-rose-400' :
                      'text-amber-600 dark:text-amber-400'
                    }`}>
                      {sub.evaluationStatus === 'Evaluated' ? `Evaluated (${sub.evaluation?.totalScore}/${sub.evaluation?.maxScore})` :
                       sub.evaluationStatus === 'Flagged' ? 'Flagged' : 'Pending'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* =========================================================================
            COLUMN 2: DOCUMENT PREVIEW (Center Column - Flex 1)
        ========================================================================= */}
        <section className="flex-1 bg-slate-200/80 dark:bg-slate-950 flex flex-col min-w-0 overflow-hidden">
          {/* Preview Toolbar */}
          <div className="h-11 bg-white dark:bg-academic-darkCard border-b border-academic-lightBorder dark:border-academic-darkBorder px-4 flex items-center justify-between shrink-0 shadow-sm gap-2">
            {/* File info and View Switcher */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex items-center gap-1.5 min-w-0 text-xs text-slate-700 dark:text-slate-300">
                <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span className="font-semibold truncate max-w-[140px] sm:max-w-[200px]" title={currentSubmission.fileName}>
                  {currentSubmission.fileName}
                </span>
                <span className="text-slate-400 font-normal shrink-0">({currentSubmission.fileSize})</span>
              </div>

              {/* View Switcher Tabs */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded border border-slate-200 dark:border-slate-700 text-xs shrink-0">
                <button
                  onClick={() => setViewMode('pdf')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                    viewMode === 'pdf'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 font-bold shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                  title="View original submitted PDF document"
                >
                  <Eye className="w-3 h-3" />
                  <span>PDF Document</span>
                </button>
                <button
                  onClick={() => setViewMode('text')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                    viewMode === 'text'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 font-bold shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                  title="View extracted OCR text & annotations"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>OCR & Notes</span>
                </button>
              </div>
            </div>

            {/* Document Controls */}
            <div className="flex items-center gap-2">
              {viewMode === 'pdf' ? (
                <div className="flex items-center gap-1.5 text-xs">
                  {/* Open in New Window */}
                  {pdfUrl && (
                    <button
                      onClick={() => window.open(pdfUrl, '_blank')}
                      className="flex items-center gap-1 px-2 py-1 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 transition-colors"
                      title="Open PDF in new browser tab"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span className="hidden md:inline text-[11px]">Pop Out</span>
                    </button>
                  )}

                  {/* Download PDF */}
                  {pdfUrl && (
                    <button
                      onClick={handleDownloadPdf}
                      className="flex items-center gap-1 px-2 py-1 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 transition-colors"
                      title="Download PDF deliverable"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span className="hidden md:inline text-[11px]">Download</span>
                    </button>
                  )}

                  {/* Attach / Replace PDF */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".pdf"
                    className="hidden"
                    onChange={handleTeacherPdfUpload}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1 px-2 py-1 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/70 hover:bg-indigo-100 dark:hover:bg-indigo-900 rounded border border-indigo-200 dark:border-indigo-800 transition-colors"
                    title="Attach or replace PDF file for this submission"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-medium">Attach PDF</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {/* Annotation Tools */}
                  <div className="flex items-center gap-1 border-r border-slate-200 dark:border-slate-700 pr-2 mr-1">
                    <button
                      onClick={() => {
                        const mode = activeAnnotationMode === 'highlight' ? 'none' : 'highlight';
                        setActiveAnnotationMode(mode);
                        if (mode === 'highlight') handleAddAnnotation('Highlighted Table Constraints specification');
                      }}
                      className={`p-1.5 rounded transition-colors ${
                        activeAnnotationMode === 'highlight'
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                      title="Highlight Text Tool"
                    >
                      <Highlighter className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        const mode = activeAnnotationMode === 'comment' ? 'none' : 'comment';
                        setActiveAnnotationMode(mode);
                        if (mode === 'comment') handleAddAnnotation('Teacher Comment: Explain cascade policy here');
                      }}
                      className={`p-1.5 rounded transition-colors ${
                        activeAnnotationMode === 'comment'
                          ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                      title="Add Inline Comment"
                    >
                      <MessageSquarePlus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Page navigation */}
                  <div className="flex items-center gap-1 text-xs">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage <= 1}
                      className="p-1 rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none"
                      title="Previous Page"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-slate-600 dark:text-slate-400 font-medium px-1">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage >= totalPages}
                      className="p-1 rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none"
                      title="Next Page"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Zoom controls */}
                  <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-700 pl-2 text-xs">
                    <button
                      onClick={() => setZoomLevel(z => Math.max(70, z - 10))}
                      className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400 w-10 text-center">
                      {zoomLevel}%
                    </span>
                    <button
                      onClick={() => setZoomLevel(z => Math.min(140, z + 10))}
                      className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setZoomLevel(100)}
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      title="Reset Zoom"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* VIEW MODE 1: NATIVE PDF DOCUMENT EMBED */}
          {viewMode === 'pdf' ? (
            <div className="flex-1 w-full h-full relative bg-slate-900/90 dark:bg-slate-950 flex flex-col overflow-hidden">
              {pdfLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
                  <RefreshCw className="w-8 h-8 animate-spin text-indigo-500 mb-3" />
                  <p className="text-sm font-semibold text-slate-200">Loading student PDF deliverable...</p>
                  <p className="text-xs text-slate-500 mt-1">Rendering high-resolution document canvas</p>
                </div>
              ) : pdfUrl ? (
                <object
                  data={`${pdfUrl}#toolbar=1&navpanes=1&scrollbar=1&view=FitH`}
                  type="application/pdf"
                  className="w-full h-full border-0 flex-1 bg-white"
                >
                  <iframe
                    src={`${pdfUrl}#toolbar=1&navpanes=1&scrollbar=1&view=FitH`}
                    title={currentSubmission.fileName}
                    className="w-full h-full border-0 flex-1 bg-white"
                  >
                    <div className="p-8 text-center text-slate-300">
                      <p className="text-xs">Your browser does not support inline PDF viewing.</p>
                      <a
                        href={pdfUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs underline text-indigo-400 font-semibold mt-2 inline-block"
                      >
                        Click here to open PDF in a new tab
                      </a>
                    </div>
                  </iframe>
                </object>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 max-w-md mx-auto space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto shadow-sm">
                    <FileText className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-100">
                      Original PDF File Not Cached
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Deliverable: <span className="font-semibold text-indigo-300 font-mono">{currentSubmission.fileName}</span> ({currentSubmission.fileSize})
                    </p>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                      This submission was created in a previous session before PDF file caching was enabled in this browser. Please attach the student's original PDF to inspect the document.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Attach {currentSubmission.fileName}</span>
                    </button>
                    <button
                      onClick={() => setViewMode('text')}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium border border-slate-700 transition-colors"
                    >
                      View Text & Notes
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* VIEW MODE 2: EXTRACTED TEXT & OCR ACADEMIC CANVAS */
            <div className="flex-1 overflow-y-auto p-6 flex justify-center items-start">
              <div
                style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
                className="w-full max-w-2xl bg-white text-slate-900 shadow-lg border border-slate-300 p-8 rounded-sm min-h-[700px] transition-transform duration-100 space-y-6"
              >
                {/* Academic Header */}
                <div className="border-b-2 border-slate-800 pb-4 flex items-start justify-between">
                  <div>
                    <h1 className="text-lg font-bold font-serif text-slate-900 tracking-tight">
                      {assignment.title}
                    </h1>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Course: {assignment.courseName} ({assignment.courseCode})
                    </p>
                  </div>
                  <div className="text-right text-xs">
                    <p className="font-bold text-slate-900">{currentSubmission.studentName}</p>
                    <p className="font-mono text-slate-600">{currentSubmission.regNo}</p>
                    <p className="text-[10px] text-slate-500">{currentSubmission.submittedAt}</p>
                  </div>
                </div>

                {/* Active Annotations Banner */}
                {mockAnnotations.length > 0 && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs space-y-1">
                    <div className="font-bold text-amber-800 flex items-center gap-1">
                      <MessageSquarePlus className="w-3.5 h-3.5" />
                      <span>Instructor Document Annotations ({mockAnnotations.length})</span>
                    </div>
                    {mockAnnotations.map((note, i) => (
                      <div key={i} className="text-amber-900 text-[11px] pl-2 border-l-2 border-amber-400">
                        • {note}
                      </div>
                    ))}
                  </div>
                )}

                {/* Page Content */}
                <div className="space-y-4 text-xs leading-relaxed text-slate-800 font-serif">
                  <h2 className="text-sm font-bold font-sans text-slate-900 border-b border-slate-200 pb-1">
                    {activePageData.title}
                  </h2>

                  <div className="whitespace-pre-line text-xs font-sans">
                    {activePageData.content}
                  </div>

                  {activePageData.codeSnippet && (
                    <div className="mt-3">
                      <div className="text-[11px] font-mono font-semibold text-slate-500 mb-1">
                        Listing: Structured DDL & Execution Benchmark
                      </div>
                      <pre className="p-3.5 bg-slate-900 text-emerald-400 rounded-md font-mono text-[11px] overflow-x-auto leading-normal">
                        <code>{activePageData.codeSnippet}</code>
                      </pre>
                    </div>
                  )}
                </div>

                {/* Document Page Footer */}
                <div className="pt-8 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>GradeFlow Submission Viewer — Secure Academic Sandbox</span>
                  <span>Page {currentPage} of {totalPages}</span>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* =========================================================================
            COLUMN 3: RUBRIC EVALUATION & FEEDBACK PANEL (Right Column - 400px)
        ========================================================================= */}
        <aside className="w-96 bg-white dark:bg-academic-darkCard border-l border-academic-lightBorder dark:border-academic-darkBorder flex flex-col shrink-0 overflow-hidden">
          {/* Rubric Header with Live Score & Grade */}
          <div className="p-4 border-b border-academic-lightBorder dark:border-academic-darkBorder bg-slate-50/70 dark:bg-slate-900/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                  Rubric Evaluation
                </h3>
              </div>
              <Badge variant="blue" size="sm">
                {currentSubmission.evaluationStatus}
              </Badge>
            </div>

            {/* Live Score Summary Box */}
            <div className="mt-3 p-3 bg-white dark:bg-slate-800 border border-academic-lightBorder dark:border-academic-darkBorder rounded-lg shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-400">Total Score</span>
                <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  {totalScore} <span className="text-xs font-normal text-slate-500">/ {maxScore}</span>
                </div>
              </div>

              <div className="text-center">
                <span className="text-[10px] uppercase font-semibold text-slate-400">Percentage</span>
                <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                  {percentage}%
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-semibold text-slate-400">Letter Grade</span>
                <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                  {letterGrade}
                </div>
              </div>
            </div>
          </div>

          {/* Scrollable Criteria & Panels */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {/* AI-Assisted Evaluation Suggestion Card */}
            <div className="p-3.5 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900 rounded text-indigo-700 dark:text-indigo-300">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-indigo-950 dark:text-indigo-100 flex items-center gap-1.5">
                      <span>AI Evaluation Suggestion</span>
                      <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 bg-indigo-200/60 dark:bg-indigo-800/60 text-indigo-800 dark:text-indigo-200 rounded">
                        {suggestedTotalScore}/{maxScore} ({suggestedGrade})
                      </span>
                    </h4>
                    <p className="text-[10px] text-indigo-700/80 dark:text-indigo-300/80">
                      Based on rubric specifications & paper analysis
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={handleRegenerateAi}
                    disabled={isRegeneratingAi}
                    className="p-1 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded transition-colors"
                    title="Regenerate AI suggestion"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRegeneratingAi ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={() => setShowAiCard(!showAiCard)}
                    className="p-1 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded transition-colors"
                    title={showAiCard ? "Collapse AI Card" : "Expand AI Card"}
                  >
                    {showAiCard ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {showAiCard && (
                <div className="space-y-3 pt-1">
                  {/* Criteria score breakdown & explanations */}
                  <div className="space-y-2 bg-white/80 dark:bg-slate-900/80 p-2.5 rounded border border-indigo-100 dark:border-indigo-900/50">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Suggested Criteria Breakdown
                    </div>
                    {assignment.rubric.map(crit => {
                      const score = suggestedRubricScores[crit.id] ?? 0;
                      const explanation = suggestedReasoning[crit.id] || 'Aligned with criterion expectations.';
                      return (
                        <div key={crit.id} className="text-xs pb-1.5 border-b border-slate-100 dark:border-slate-800 last:border-b-0">
                          <div className="flex justify-between items-center font-medium text-slate-800 dark:text-slate-200">
                            <span className="truncate pr-2">{crit.title}</span>
                            <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold shrink-0">
                              {score}/{crit.maxMarks}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                            {explanation}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Suggested feedback draft preview */}
                  <div className="bg-white/80 dark:bg-slate-900/80 p-2.5 rounded border border-indigo-100 dark:border-indigo-900/50 space-y-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Suggested Qualitative Feedback
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 italic leading-relaxed">
                      "{suggestedAiFeedback}"
                    </p>
                  </div>

                  {/* Teacher Action Controls */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={handleAcceptAiSuggestion}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold shadow-sm transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Accept Suggestion</span>
                    </button>
                    <button
                      onClick={() => {
                        handleAcceptAiSuggestion();
                        const el = document.getElementById('feedback-textarea');
                        if (el) el.focus();
                      }}
                      className="px-2.5 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded text-xs font-medium transition-colors"
                      title="Accept and focus feedback editor"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Academic Disclaimer */}
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 text-center leading-normal pt-1 border-t border-indigo-100 dark:border-indigo-900/40">
                    AI provides grading suggestions based on the rubric. The instructor must verify and finalize all marks.
                  </p>
                </div>
              )}
            </div>

            {/* 1. Rubric Criteria List (Manual adjustment / verification) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Criteria Scoring
                </span>
                <span className="text-[10px] text-slate-400">
                  Direct teacher override enabled
                </span>
              </div>
              {assignment.rubric.map((criterion, idx) => {
                const currentScore = rubricScores[criterion.id] ?? Math.round(criterion.maxMarks * 0.8);

                return (
                  <div
                    key={criterion.id}
                    className="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-lg space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-mono text-slate-400 font-semibold">
                          Criteria {idx + 1}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {criterion.title}
                        </h4>
                      </div>

                      {/* Number Input (Preferred for accuracy) */}
                      <div className="flex items-center gap-1 shrink-0">
                        <input
                          type="number"
                          min={0}
                          max={criterion.maxMarks}
                          value={currentScore}
                          onChange={(e) => handleScoreChange(criterion.id, Number(e.target.value), criterion.maxMarks)}
                          className="w-12 px-1.5 py-0.5 text-xs text-center font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                        />
                        <span className="text-xs text-slate-500 font-medium">
                          / {criterion.maxMarks}
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                      {criterion.description}
                    </p>

                    {/* Range Slider */}
                    <div className="pt-1">
                      <input
                        type="range"
                        min={0}
                        max={criterion.maxMarks}
                        step={1}
                        value={currentScore}
                        onChange={(e) => handleScoreChange(criterion.id, Number(e.target.value), criterion.maxMarks)}
                        className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 2. Enhanced Similarity & Integrity Inspection Panel */}
            {isSimilarityFlagged ? (
              /* FLAGGED CARD */
              <div className="p-3.5 bg-rose-50/80 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-800 rounded-lg text-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-rose-900 dark:text-rose-200">
                    <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    <span>Integrity Alert: {currentSubmission.similarityScore}% Similarity</span>
                  </div>
                  <Badge variant="rose" size="sm">
                    Flagged (&gt;={currentSubmission.similarityReport.threshold}%)
                  </Badge>
                </div>

                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${Math.min(100, currentSubmission.similarityScore)}%` }}
                    className="h-full bg-rose-600"
                  />
                </div>

                <div className="p-2.5 bg-white dark:bg-slate-900 rounded border border-rose-200 dark:border-rose-800 text-[11px] space-y-2">
                  <p className="text-slate-700 dark:text-slate-300 font-medium">
                    Similarity exceeds the configured {currentSubmission.similarityReport.threshold}% threshold.
                  </p>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    {currentSubmission.similarityReport?.matchedSections?.[0]?.matchedSource
                      ? `Matched with ${currentSubmission.similarityReport.matchedSections[0].matchedSource}. Note: Similarity does not automatically imply plagiarism.`
                      : 'Matched with Institutional Archive (Fall 2025) and external sources. Note: Similarity does not automatically imply plagiarism.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowSimilarityModal(true)}
                    className="w-full py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded shadow-sm transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Scale className="w-3.5 h-3.5" />
                    <span>View Side-by-Side Analysis</span>
                  </button>
                </div>
              </div>
            ) : (
              /* CLEAN CARD */
              <div className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-900 dark:text-emerald-200">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Integrity Status: Clean ({currentSubmission.similarityScore}%)</span>
                  </div>
                  <Badge variant="green" size="sm">
                    Passed (&lt;{currentSubmission.similarityReport.threshold}%)
                  </Badge>
                </div>

                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${Math.min(100, currentSubmission.similarityScore)}%` }}
                    className="h-full bg-emerald-600"
                  />
                </div>

                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  Low textual overlap. Minor matches correspond to standard algorithmic boilerplate and course schema definitions.
                </p>

                <button
                  type="button"
                  onClick={() => setShowSimilarityModal(true)}
                  className="w-full py-1.5 text-[11px] font-semibold text-emerald-800 dark:text-emerald-200 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800 rounded hover:bg-emerald-50 dark:hover:bg-emerald-950/60 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Scale className="w-3.5 h-3.5" />
                  <span>Inspect Similarity Report</span>
                </button>
              </div>
            )}

            {/* 3. Feedback Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Constructive Feedback
                </label>

                {/* AI Assistant Button (Clear that it is optional) */}
                <button
                  type="button"
                  onClick={handleGenerateAiFeedback}
                  disabled={isAiGenerating}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 rounded hover:bg-purple-100 dark:hover:bg-purple-900 transition-colors shadow-sm"
                  title="Generate constructive suggestions based on rubric scores"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>{isAiGenerating ? 'Drafting...' : 'Generate AI Feedback'}</span>
                </button>
              </div>

              {/* Quick Feedback Templates */}
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">
                  Quick Feedback Templates:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {mockFeedbackTemplates.map((template) => (
                    <button
                      key={template.title}
                      type="button"
                      onClick={() => handleApplyTemplate(template.text)}
                      className="px-2 py-0.5 text-[10px] font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700 transition-colors"
                    >
                      + {template.title}
                    </button>
                  ))}
                </div>
              </div>

              {/* Feedback Text Area */}
              <textarea
                id="feedback-textarea"
                rows={5}
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Provide qualitative feedback, suggestions for improvement, and comments..."
                className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-600 leading-relaxed"
              />
            </div>
          </div>

          {/* Bottom Actions: Save Draft & Save Evaluation */}
          <div className="p-3 border-t border-academic-lightBorder dark:border-academic-darkBorder bg-slate-50/80 dark:bg-slate-900/50 flex items-center justify-between gap-2">
            <button
              onClick={() => handleSave(true)}
              className="flex-1 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Save Draft
            </button>

            <button
              onClick={() => handleSave(false)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-sm transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Evaluation</span>
            </button>
          </div>
        </aside>
      </div>

      {/* =========================================================================
          MODAL: DETAILED SIDE-BY-SIDE SIMILARITY COMPARISON
      ========================================================================= */}
      {/* =========================================================================
          MODAL: DETAILED SIDE-BY-SIDE SIMILARITY COMPARISON
      ========================================================================= */}
      {showSimilarityModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-academic-darkCard border border-academic-lightBorder dark:border-academic-darkBorder rounded-xl max-w-7xl w-full h-[92vh] max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-5 py-3 border-b border-academic-lightBorder dark:border-academic-darkBorder flex items-center justify-between bg-slate-50 dark:bg-slate-900/80 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-lg">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Academic Integrity & Side-by-Side Similarity Comparison
                    </h3>
                    <Badge variant={isSimilarityFlagged ? "rose" : "green"} size="sm">
                      {currentSubmission.similarityScore}% Overlap
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Student: <span className="font-semibold text-slate-700 dark:text-slate-300">{currentSubmission.studentName}</span> ({currentSubmission.regNo}) • {currentSubmission.fileName}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* View Mode Toggle: Side-by-Side PDFs vs Text Diff */}
                <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-100 dark:bg-slate-800 text-xs font-medium">
                  <button
                    onClick={() => setModalViewMode('sideBySidePdf')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors ${
                      modalViewMode === 'sideBySidePdf'
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-bold shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Side-by-Side PDFs</span>
                  </button>
                  <button
                    onClick={() => setModalViewMode('textDiff')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors ${
                      modalViewMode === 'textDiff'
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-bold shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Text & Shingle Diff</span>
                  </button>
                </div>

                <button
                  onClick={() => setShowSimilarityModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Source Overview & Peer Selector Bar */}
            <div className="px-5 py-2.5 bg-slate-50 dark:bg-slate-900 border-b border-academic-lightBorder dark:border-academic-darkBorder flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-semibold block">Primary Matched Source</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono text-xs">
                    {currentSubmission.similarityReport?.matchedSections?.[0]?.matchedSource || mockSimilarityComparison.matchedSource}
                  </span>
                </div>

                {assignmentSubmissions.filter(s => s.id !== currentSubmission.id).length > 0 && (
                  <div className="flex items-center gap-2 pl-3 border-l border-slate-200 dark:border-slate-700">
                    <span className="text-[11px] font-semibold text-slate-500">Compare Against:</span>
                    <select
                      value={activePeerSubmission?.id || ''}
                      onChange={(e) => setSelectedPeerId(e.target.value)}
                      className="px-2.5 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                    >
                      {assignmentSubmissions
                        .filter(s => s.id !== currentSubmission.id)
                        .map(peer => (
                          <option key={peer.id} value={peer.id}>
                            {peer.studentName} ({peer.fileName}) {peer.id === matchedPeerSubmission?.id ? '★ (Auto-Matched)' : ''}
                          </option>
                        ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {pdfUrl && (
                  <button
                    onClick={() => window.open(pdfUrl, '_blank')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    title="Open Student PDF in a new browser tab"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Open Student PDF</span>
                  </button>
                )}
                {peerPdfUrl && (
                  <button
                    onClick={() => window.open(peerPdfUrl, '_blank')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 rounded hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors"
                    title="Open Matched Peer PDF in a new browser tab"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Open Matched PDF</span>
                  </button>
                )}
              </div>
            </div>

            {/* Modal Body: Side-by-Side PDFs or Text Diff */}
            {modalViewMode === 'sideBySidePdf' ? (
              <div className="flex-1 min-h-0 p-3 bg-slate-100 dark:bg-slate-950/80 grid grid-cols-1 md:grid-cols-2 gap-3 overflow-hidden">
                {/* Left Column: Student Submission PDF */}
                <div className="border border-academic-lightBorder dark:border-academic-darkBorder rounded-lg flex flex-col bg-white dark:bg-slate-900 overflow-hidden shadow-xs h-full">
                  <div className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800/90 border-b border-academic-lightBorder dark:border-academic-darkBorder flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {currentSubmission.studentName} ({currentSubmission.regNo})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-slate-500 font-semibold truncate max-w-[150px]">
                        {currentSubmission.fileName}
                      </span>
                      {pdfUrl && (
                        <button
                          onClick={() => {
                            const a = document.createElement('a');
                            a.href = pdfUrl;
                            a.download = currentSubmission.fileName;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                          }}
                          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                          title="Download Student PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 w-full h-full relative bg-slate-900/90 dark:bg-slate-950 flex flex-col overflow-hidden">
                    {pdfLoading ? (
                      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
                        <RefreshCw className="w-8 h-8 animate-spin text-indigo-500 mb-2" />
                        <p className="text-xs font-semibold text-slate-200">Rendering student document...</p>
                      </div>
                    ) : pdfUrl ? (
                      <object
                        data={`${pdfUrl}#toolbar=1&navpanes=0&scrollbar=1&view=FitH`}
                        type="application/pdf"
                        className="w-full h-full border-0 flex-1 bg-white"
                      >
                        <iframe
                          src={`${pdfUrl}#toolbar=1&navpanes=0&scrollbar=1&view=FitH`}
                          title={currentSubmission.fileName}
                          className="w-full h-full border-0 flex-1 bg-white"
                        />
                      </object>
                    ) : (
                      <div className="flex-1 p-4 overflow-y-auto font-mono text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900">
                        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded mb-2 text-amber-800 dark:text-amber-200 text-xs">
                          Direct PDF stream unavailable. Displaying extracted deliverable text:
                        </div>
                        <pre className="whitespace-pre-wrap leading-relaxed">
                          {currentSubmission.extractedText || currentSubmission.pages?.[0]?.content || 'No text extracted.'}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column: Matched Peer Submission PDF */}
                <div className="border border-academic-lightBorder dark:border-academic-darkBorder rounded-lg flex flex-col bg-white dark:bg-slate-900 overflow-hidden shadow-xs h-full">
                  <div className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800/90 border-b border-academic-lightBorder dark:border-academic-darkBorder flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                      <Scale className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {activePeerSubmission ? `${activePeerSubmission.studentName} (${activePeerSubmission.regNo})` : 'Matched Source File'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="rose" size="sm">
                        {currentSubmission.similarityScore}% Match
                      </Badge>
                      {peerPdfUrl && (
                        <button
                          onClick={() => {
                            const a = document.createElement('a');
                            a.href = peerPdfUrl;
                            a.download = activePeerSubmission?.fileName || 'matched_peer.pdf';
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                          }}
                          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                          title="Download Matched PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 w-full h-full relative bg-slate-900/90 dark:bg-slate-950 flex flex-col overflow-hidden">
                    {peerPdfLoading ? (
                      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
                        <RefreshCw className="w-8 h-8 animate-spin text-rose-500 mb-2" />
                        <p className="text-xs font-semibold text-slate-200">Rendering matched peer document...</p>
                      </div>
                    ) : peerPdfUrl ? (
                      <object
                        data={`${peerPdfUrl}#toolbar=1&navpanes=0&scrollbar=1&view=FitH`}
                        type="application/pdf"
                        className="w-full h-full border-0 flex-1 bg-white"
                      >
                        <iframe
                          src={`${peerPdfUrl}#toolbar=1&navpanes=0&scrollbar=1&view=FitH`}
                          title={activePeerSubmission?.fileName || 'Matched Peer Document'}
                          className="w-full h-full border-0 flex-1 bg-white"
                        />
                      </object>
                    ) : (
                      <div className="flex-1 p-4 overflow-y-auto font-mono text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900">
                        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded mb-2 text-rose-800 dark:text-rose-200 text-xs">
                          {activePeerSubmission 
                            ? `Displaying extracted text from ${activePeerSubmission.studentName}'s deliverable:`
                            : 'Institutional benchmark archive reference:'}
                        </div>
                        <pre className="whitespace-pre-wrap leading-relaxed">
                          {activePeerSubmission?.extractedText || activePeerSubmission?.pages?.[0]?.content || currentSubmission.similarityReport?.matchedSections?.[0]?.matchedSnippet || mockSimilarityComparison.matchedSegments[activeSegmentIndex]?.sourceText || 'No reference text available.'}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Text & Shingle Diff Mode */
              <div className="flex-1 min-h-0 overflow-y-auto p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left Column: Student Submission */}
                <div className="border border-academic-lightBorder dark:border-academic-darkBorder rounded-lg flex flex-col bg-white dark:bg-slate-900/60 overflow-hidden">
                  <div className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800/80 border-b border-academic-lightBorder dark:border-academic-darkBorder flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        Student Submission Deliverable
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 font-semibold">
                      {currentSubmission.fileName}
                    </span>
                  </div>

                  <div className="p-4 flex-1 space-y-3 font-mono text-xs overflow-y-auto">
                    <div className="text-[11px] font-sans font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                      {currentSubmission.similarityReport?.matchedSections?.[0]?.sectionTitle || mockSimilarityComparison.matchedSegments[activeSegmentIndex]?.section}
                    </div>
                    <div className="p-3 bg-amber-50/70 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded text-amber-950 dark:text-amber-100 leading-relaxed whitespace-pre-wrap">
                      <mark className="bg-amber-200 dark:bg-amber-900 text-amber-950 dark:text-amber-100 px-1 py-0.5 rounded font-mono font-medium">
                        {currentSubmission.pages?.[0]?.content || mockSimilarityComparison.matchedSegments[activeSegmentIndex]?.studentText}
                      </mark>
                    </div>
                  </div>
                </div>

                {/* Right Column: Matched Archive Source */}
                <div className="border border-academic-lightBorder dark:border-academic-darkBorder rounded-lg flex flex-col bg-white dark:bg-slate-900/60 overflow-hidden">
                  <div className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800/80 border-b border-academic-lightBorder dark:border-academic-darkBorder flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Scale className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        Institutional Archive & Benchmark Source
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-rose-600 dark:text-rose-400 font-bold">
                      {currentSubmission.similarityScore || mockSimilarityComparison.matchedSegments[activeSegmentIndex]?.similarity}% match
                    </span>
                  </div>

                  <div className="p-4 flex-1 space-y-3 font-mono text-xs overflow-y-auto">
                    <div className="text-[11px] font-sans font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                      {currentSubmission.similarityReport?.matchedSections?.[0]?.matchedSource || 'Archive Reference File'}
                    </div>
                    <div className="p-3 bg-rose-50/70 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 rounded text-rose-950 dark:text-rose-100 leading-relaxed whitespace-pre-wrap">
                      <mark className="bg-rose-200 dark:bg-rose-900 text-rose-950 dark:text-rose-100 px-1 py-0.5 rounded font-mono font-medium">
                        {currentSubmission.similarityReport?.matchedSections?.[0]?.matchedSnippet || mockSimilarityComparison.matchedSegments[activeSegmentIndex]?.sourceText}
                      </mark>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Modal Bottom Actions */}
            <div className="px-5 py-3 border-t border-academic-lightBorder dark:border-academic-darkBorder bg-slate-50 dark:bg-slate-900 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDismissFlag}
                  className="px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-md hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors"
                >
                  Dismiss Flag (Reviewed & Acceptable)
                </button>
                <button
                  type="button"
                  onClick={() => handleAddIntegrityNoteToFeedback(mockSimilarityComparison.matchedSegments[activeSegmentIndex]?.section || 'Normalization derivation')}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  Add Clarification Note to Feedback
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleConfirmFlag}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-md shadow-sm transition-colors"
                >
                  Confirm Integrity Concern
                </button>
                <button
                  type="button"
                  onClick={() => setShowSimilarityModal(false)}
                  className="px-3.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
