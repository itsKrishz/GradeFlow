import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { 
  ArrowLeft, 
  UploadCloud, 
  FileCheck2, 
  File, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar, 
  Clock, 
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  Sparkles,
  Layers,
  Cpu,
  Check
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';

export const StudentSubmit: React.FC = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const { assignments, submitAssignment, currentUser } = useApp();

  const assignment = assignments.find(a => a.id === assignmentId) || assignments[0];

  const [selectedFile, setSelectedFile] = useState<{ name: string; size: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [submissionTimestamp, setSubmissionTimestamp] = useState('');
  const [isLate, setIsLate] = useState(false);

  // Background Asynchronous Processing Pipeline States
  const [pipelineStage, setPipelineStage] = useState<'idle' | 'extracting' | 'similarity' | 'ai_evaluating' | 'ready' | 'failed'>('idle');
  const [pipelineProgress, setPipelineProgress] = useState(0);
  const [simulateWorkerFailure, setSimulateWorkerFailure] = useState(false);
  const [pipelineError, setPipelineError] = useState('');

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const sizeFormatted = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
      setSelectedFile({ name: file.name, size: sizeFormatted });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const sizeFormatted = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
      setSelectedFile({ name: file.name, size: sizeFormatted });
    }
  };

  const runPipeline = (simulateFail: boolean) => {
    setPipelineError('');
    setPipelineStage('extracting');
    setPipelineProgress(25);

    setTimeout(() => {
      if (simulateFail) {
        setPipelineStage('failed');
        setPipelineError('Extraction Worker Timeout: Text extraction from PDF stream exceeded memory threshold. Deliverable queue stalled.');
        return;
      }
      setPipelineStage('similarity');
      setPipelineProgress(55);

      setTimeout(() => {
        setPipelineStage('ai_evaluating');
        setPipelineProgress(85);

        setTimeout(() => {
          setPipelineStage('ready');
          setPipelineProgress(100);
        }, 1200);
      }, 1200);
    }, 1000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    const now = new Date();
    const deadline = new Date(`${assignment.dueDate}T${assignment.dueTime}`);
    const late = now > deadline;
    setIsLate(late);
    setSubmissionTimestamp(now.toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }));

    submitAssignment(assignment.id, selectedFile);
    setSubmittedSuccess(true);
    runPipeline(simulateWorkerFailure);
  };

  const handleRetryPipeline = () => {
    runPipeline(false);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 pb-2 border-b border-academic-lightBorder dark:border-academic-darkBorder">
        <button
          onClick={() => navigate(-1)}
          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="text-xs text-slate-400">Assignments /</span>
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Submit Work</span>
      </div>

      {submittedSuccess ? (
        /* SUBMISSION & ASYNC PIPELINE VIEW */
        <div className="bg-white dark:bg-academic-darkCard border border-academic-lightBorder dark:border-academic-darkBorder rounded-xl p-6 sm:p-8 shadow-sm space-y-6">
          {/* Header Status */}
          {pipelineStage === 'failed' ? (
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto border border-rose-300 dark:border-rose-800">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-rose-900 dark:text-rose-100">
                Asynchronous Processing Failed
              </h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                An error occurred during backend document extraction or verification. Your file is preserved.
              </p>
            </div>
          ) : pipelineStage === 'ready' ? (
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-300 dark:border-emerald-800">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Submission Verified & Queued
              </h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Deliverable processed successfully through automated checks. Ready for instructor evaluation.
              </p>
            </div>
          ) : (
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto border border-indigo-200 dark:border-indigo-800">
                <RefreshCw className="w-7 h-7 animate-spin" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Processing Submission Deliverable...
              </h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Running automated pipeline: text extraction, similarity checks, and rubric structure mapping.
              </p>
            </div>
          )}

          {/* Real-time Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] font-mono font-semibold text-slate-500">
              <span className="capitalize">
                {pipelineStage === 'extracting' && 'Step 1 of 3: Parsing Text & Syntax...'}
                {pipelineStage === 'similarity' && 'Step 2 of 3: Running Similarity Engine...'}
                {pipelineStage === 'ai_evaluating' && 'Step 3 of 3: Aligning Rubric Criteria...'}
                {pipelineStage === 'ready' && 'Pipeline Complete — Ready for Review'}
                {pipelineStage === 'failed' && 'Worker Task Halted'}
              </span>
              <span>{pipelineProgress}%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
              <div
                style={{ width: `${pipelineProgress}%` }}
                className={`h-full transition-all duration-500 ${
                  pipelineStage === 'failed'
                    ? 'bg-rose-600'
                    : pipelineStage === 'ready'
                    ? 'bg-emerald-600'
                    : 'bg-indigo-600'
                }`}
              />
            </div>
          </div>

          {/* Asynchronous Pipeline Multi-Step Visualizer */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900/70 border border-academic-lightBorder dark:border-academic-darkBorder rounded-lg space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Background Processing Pipeline
            </div>

            {/* Step 1: Text Extraction */}
            <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className={`p-1.5 rounded text-xs ${
                  pipelineStage === 'extracting'
                    ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300'
                    : pipelineStage === 'failed'
                    ? 'bg-rose-100 dark:bg-rose-950 text-rose-600'
                    : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                }`}>
                  <Layers className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900 dark:text-slate-100">1. Text & Code Extraction</div>
                  <div className="text-[10px] text-slate-500">Parsing PDF tokens, syntax trees, and DDL scripts</div>
                </div>
              </div>
              <div className="shrink-0">
                {pipelineStage === 'extracting' && (
                  <Badge variant="blue" size="sm">In Progress...</Badge>
                )}
                {pipelineStage === 'failed' && (
                  <Badge variant="rose" size="sm">Failed</Badge>
                )}
                {(pipelineStage === 'similarity' || pipelineStage === 'ai_evaluating' || pipelineStage === 'ready') && (
                  <Badge variant="green" size="sm">Completed</Badge>
                )}
              </div>
            </div>

            {/* Step 2: Similarity Analysis */}
            <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className={`p-1.5 rounded text-xs ${
                  pipelineStage === 'similarity'
                    ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300'
                    : (pipelineStage === 'ai_evaluating' || pipelineStage === 'ready')
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                }`}>
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900 dark:text-slate-100">2. Academic Integrity & Similarity</div>
                  <div className="text-[10px] text-slate-500">Cross-referencing institutional archives & repositories</div>
                </div>
              </div>
              <div className="shrink-0">
                {pipelineStage === 'similarity' && (
                  <Badge variant="blue" size="sm">Analyzing...</Badge>
                )}
                {(pipelineStage === 'ai_evaluating' || pipelineStage === 'ready') && (
                  <Badge variant="green" size="sm">12% Overlap (Clean)</Badge>
                )}
                {(pipelineStage === 'extracting' || pipelineStage === 'failed') && (
                  <Badge variant="neutral" size="sm">Queued</Badge>
                )}
              </div>
            </div>

            {/* Step 3: AI Evaluation Assistance */}
            <div className="flex items-center justify-between text-xs py-1.5">
              <div className="flex items-center gap-2.5">
                <div className={`p-1.5 rounded text-xs ${
                  pipelineStage === 'ai_evaluating'
                    ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300'
                    : pipelineStage === 'ready'
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                }`}>
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900 dark:text-slate-100">3. AI Rubric Alignment</div>
                  <div className="text-[10px] text-slate-500">Drafting criteria suggestions for instructor review</div>
                </div>
              </div>
              <div className="shrink-0">
                {pipelineStage === 'ai_evaluating' && (
                  <Badge variant="blue" size="sm">Evaluating...</Badge>
                )}
                {pipelineStage === 'ready' && (
                  <Badge variant="green" size="sm">Ready</Badge>
                )}
                {(pipelineStage === 'extracting' || pipelineStage === 'similarity' || pipelineStage === 'failed') && (
                  <Badge variant="neutral" size="sm">Pending</Badge>
                )}
              </div>
            </div>
          </div>

          {/* Failure Alert Box with Retry Action */}
          {pipelineStage === 'failed' && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-lg text-xs space-y-3">
              <p className="text-rose-800 dark:text-rose-200 font-mono text-[11px] leading-relaxed">
                {pipelineError}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRetryPipeline}
                  className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-md transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry Processing Pipeline</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/student/dashboard')}
                  className="px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded border border-slate-300 dark:border-slate-700 transition-colors"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          )}

          {/* Submission Metadata Details */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs space-y-2">
            <div className="flex justify-between pb-1.5 border-b border-slate-200 dark:border-slate-800">
              <span className="text-slate-500">Assignment:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{assignment.title}</span>
            </div>
            <div className="flex justify-between pb-1.5 border-b border-slate-200 dark:border-slate-800">
              <span className="text-slate-500">Submitted At:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{submissionTimestamp}</span>
            </div>
            <div className="flex justify-between pb-1.5 border-b border-slate-200 dark:border-slate-800">
              <span className="text-slate-500">File Uploaded:</span>
              <span className="font-mono text-slate-800 dark:text-slate-200">{selectedFile?.name} ({selectedFile?.size})</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Submission Status:</span>
              {isLate ? (
                <Badge variant="rose" size="sm">Late Submission</Badge>
              ) : (
                <Badge variant="green" size="sm">Submitted (On Time)</Badge>
              )}
            </div>
          </div>

          {pipelineStage === 'ready' && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => navigate('/student/dashboard')}
                className="px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors shadow-sm"
              >
                Return to Student Dashboard
              </button>
            </div>
          )}
        </div>
      ) : (
        /* SUBMISSION FORM */
        <div className="space-y-6">
          {/* Assignment Overview Box */}
          <div className="bg-white dark:bg-academic-darkCard border border-academic-lightBorder dark:border-academic-darkBorder rounded-lg p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded border border-indigo-200 dark:border-indigo-800">
                {assignment.courseCode}
              </span>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {assignment.title}
              </h2>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {assignment.description}
            </p>

            <div className="flex flex-wrap gap-4 pt-3 border-t border-academic-lightBorder dark:border-academic-darkBorder text-xs text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Deadline: <strong>{assignment.dueDate} at {assignment.dueTime}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Total Marks: <strong>{assignment.totalMarks} Points</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                <span>Academic Integrity Check Enabled</span>
              </div>
            </div>
          </div>

          {/* Upload Area */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white dark:bg-academic-darkCard border border-academic-lightBorder dark:border-academic-darkBorder rounded-lg p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                Deliverable Upload
              </h3>

              {!selectedFile ? (
                /* Drag & Drop Zone */
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleFileDrop}
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                    isDragging
                      ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30'
                      : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-900/50'
                  }`}
                >
                  <UploadCloud className="w-10 h-10 text-indigo-600 dark:text-indigo-400 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Drag and Drop Your File Here
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    or click to browse from your computer
                  </p>

                  <label className="mt-4 inline-block px-3.5 py-1.5 text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-md shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer">
                    <span>Choose File</span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                  </label>

                  <p className="text-[10px] text-slate-400 mt-4">
                    Accepted Formats: {assignment.acceptedFileTypes.join(', ')} • Max file size: 25 MB
                  </p>
                </div>
              ) : (
                /* Selected File Card */
                <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-950 rounded text-indigo-600 dark:text-indigo-400">
                      <File className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 font-mono">
                        {selectedFile.name}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Size: {selectedFile.size} • Ready for verification
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded transition-colors"
                    title="Remove file"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Simulation controls & Submit Action */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <label className="flex items-center gap-2 text-[11px] text-slate-500 cursor-pointer self-start sm:self-center">
                <input
                  type="checkbox"
                  checked={simulateWorkerFailure}
                  onChange={(e) => setSimulateWorkerFailure(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Simulate worker timeout (test retry flow)</span>
              </label>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded border border-slate-300 dark:border-slate-700"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={!selectedFile}
                  className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:pointer-events-none rounded shadow-sm transition-colors"
                >
                  <FileCheck2 className="w-4 h-4" />
                  <span>Confirm & Submit Assignment</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
