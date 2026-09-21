import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { CopilotMessage, RubricCriterion } from '../../types';
import { mockUnsubmittedStudents } from '../../data/mockData';
import { 
  Sparkles, 
  Send, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Trash2, 
  ArrowRight, 
  FileText, 
  BarChart3, 
  Inbox, 
  Download, 
  Check, 
  Calendar, 
  ShieldAlert,
  HelpCircle,
  RotateCcw,
  Users
} from 'lucide-react';
import { Badge } from '../common/Badge';

interface CopilotChatProps {
  compactMode?: boolean;
  onNavigateAction?: () => void;
}

export const CopilotChat: React.FC<CopilotChatProps> = ({ compactMode = false, onNavigateAction }) => {
  const { 
    courses, 
    assignments, 
    submissions, 
    createAssignment, 
    deleteAssignment, 
    updateAssignmentDeadline,
    showToast 
  } = useApp();
  
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [inputQuery, setInputQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Multi-turn conversational memory for assignment creation
  const [assignmentDraftState, setAssignmentDraftState] = useState<{
    stage: 'idle' | 'missing_details' | 'awaiting_rubric' | 'preview_ready';
    title?: string;
    courseCode?: string;
    courseName?: string;
    courseId?: string;
    deadlineDate?: string;
    deadlineTime?: string;
    allowedTypes?: string[];
    totalMarks?: number;
    rubric?: RubricCriterion[];
  }>({ stage: 'idle' });

  // Initial welcome message
  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'assistant',
      text: 'Good evening, Professor. What would you like to do?',
      timestamp: 'Just now'
    }
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Handle Suggested Quick Action Pills
  const handleQuickAction = (actionText: string) => {
    setInputQuery(actionText);
    processQuery(actionText);
  };

  // The Conversational Intelligence & Rule Matcher
  const processQuery = (rawQuery: string) => {
    const text = rawQuery.trim();
    if (!text) return;

    // 1. Add User Message
    const userMessage: CopilotMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInputQuery('');
    setIsTyping(true);

    const lower = text.toLowerCase();

    // Simulating natural processing time & visual tool execution steps
    setTimeout(() => {
      setIsTyping(false);

      // --- FLOW A: MULTI-TURN ASSIGNMENT CREATION FLOW ---
      if (assignmentDraftState.stage === 'missing_details') {
        // Teacher is supplying missing information
        let newDraft = { ...assignmentDraftState };

        // Check if deadline mentioned
        if (lower.includes('oct') || lower.includes('pm') || lower.includes('deadline') || lower.includes('at')) {
          newDraft.deadlineDate = '2026-10-05';
          newDraft.deadlineTime = '23:59';
        }
        // Check if file type mentioned
        if (lower.includes('pdf')) {
          newDraft.allowedTypes = ['.pdf'];
        }
        // Check if marks mentioned
        const marksMatch = text.match(/(\d+)\s*(marks|pts|points)/i) || text.match(/20/);
        if (marksMatch) {
          newDraft.totalMarks = 20;
        }
        // Check if course mentioned if not set
        if (!newDraft.courseCode && (lower.includes('dbms') || lower.includes('cse2004'))) {
          newDraft.courseCode = 'CSE2004';
          newDraft.courseName = 'Database Management Systems';
          newDraft.courseId = courses[0]?.id || 'course-1';
        }

        // Check if all fields are collected
        const hasCourse = !!newDraft.courseCode;
        const hasDeadline = !!newDraft.deadlineDate;
        const hasFileType = !!newDraft.allowedTypes?.length;
        const hasMarks = !!newDraft.totalMarks;

        if (hasCourse && hasDeadline && hasFileType && hasMarks) {
          // Transition to rubric query
          setAssignmentDraftState({
            ...newDraft,
            stage: 'awaiting_rubric'
          });

          setMessages(prev => [
            ...prev,
            {
              id: `ai-${Date.now()}`,
              sender: 'assistant',
              text: 'Got it! I have saved the details for DBMS Normalization (Due Oct 5, 11:59 PM • PDF only • 20 marks).\n\nWould you like me to create the rubric automatically based on standard academic criteria, or would you like to specify custom criteria?',
              timestamp: 'Just now'
            }
          ]);
        } else {
          // Still missing some information
          const missing: string[] = [];
          if (!hasCourse) missing.push('Course');
          if (!hasDeadline) missing.push('Deadline');
          if (!hasFileType) missing.push('Allowed file type');
          if (!hasMarks) missing.push('Total marks');

          setAssignmentDraftState(newDraft);

          setMessages(prev => [
            ...prev,
            {
              id: `ai-${Date.now()}`,
              sender: 'assistant',
              text: `I've noted that. I still need the following information to finish preparing the assignment:`,
              timestamp: 'Just now',
              missingFieldsPrompt: {
                requiredFields: missing,
                collectedFields: {
                  Course: newDraft.courseCode || 'Not provided',
                  Deadline: newDraft.deadlineDate ? `${newDraft.deadlineDate} ${newDraft.deadlineTime}` : 'Not provided',
                  'File Type': newDraft.allowedTypes?.join(', ') || 'Not provided',
                  'Total Marks': newDraft.totalMarks ? `${newDraft.totalMarks} marks` : 'Not provided'
                }
              }
            }
          ]);
        }
        return;
      }

      // --- FLOW B: RUBRIC CONFIRMATION ---
      if (assignmentDraftState.stage === 'awaiting_rubric') {
        const rubric: RubricCriterion[] = [
          {
            id: 'rubric-norm-1',
            title: 'Correctness',
            description: 'Relational schema correctness and lossless join decomposition validity.',
            maxMarks: 10
          },
          {
            id: 'rubric-norm-2',
            title: 'Normalization Steps',
            description: 'Rigorous step-by-step derivation of 1NF, 2NF, 3NF, and BCNF functional dependencies.',
            maxMarks: 6
          },
          {
            id: 'rubric-norm-3',
            title: 'Documentation',
            description: 'Clarity of technical explanations, DDL formatting, and ER diagram annotations.',
            maxMarks: 4
          }
        ];

        const finalDraft = {
          ...assignmentDraftState,
          rubric,
          stage: 'preview_ready' as const
        };
        setAssignmentDraftState(finalDraft);

        setMessages(prev => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            sender: 'assistant',
            text: 'I have generated the assignment draft with structured evaluation rubrics. Please review the preview below before confirming:',
            timestamp: 'Just now',
            toolExecution: {
              actionName: 'Preparing assignment...',
              steps: [
                { label: 'Checking course prerequisites (CSE2004)', done: true },
                { label: 'Synthesizing 3 rubric criteria (20 marks)', done: true },
                { label: 'Validating deadline configuration', done: true }
              ]
            },
            assignmentDraft: {
              title: finalDraft.title || 'Normalization Project',
              courseCode: finalDraft.courseCode || 'CSE2004',
              courseName: finalDraft.courseName || 'Database Management Systems',
              dueDate: finalDraft.deadlineDate || '2026-10-05',
              dueTime: finalDraft.deadlineTime || '23:59',
              totalMarks: finalDraft.totalMarks || 20,
              acceptedFileTypes: finalDraft.allowedTypes || ['.pdf'],
              rubric
            }
          }
        ]);
        return;
      }

      // --- QUERY 1: HOW MANY PAPERS TO CHECK / PENDING EVALUATIONS ---
      if (
        lower.includes('how many papers') || 
        lower.includes('pending evaluations') || 
        lower.includes('submissions waiting') ||
        lower.includes('still have to check') ||
        lower.includes('pending')
      ) {
        setMessages(prev => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            sender: 'assistant',
            text: 'You currently have 37 submissions waiting for evaluation across your active courses.',
            timestamp: 'Just now',
            toolExecution: {
              actionName: 'Checking evaluation records...',
              steps: [
                { label: 'Loading submissions repository', done: true },
                { label: 'Filtering pending evaluations', done: true }
              ]
            },
            inboxBreakdown: {
              totalPending: 37,
              lateCount: 6,
              courses: [
                { name: 'Database Management Systems (CSE2004)', count: 18 },
                { name: 'Operating Systems (CSE3001)', count: 11 },
                { name: 'Software Engineering (CSE3004)', count: 8 }
              ]
            }
          }
        ]);
        return;
      }

      // --- QUERY 2: UNREPORTED / MISSING SUBMISSIONS ---
      if (
        lower.includes('haven\'t submitted') || 
        lower.includes('not submitted') || 
        lower.includes('who hasn\'t submitted') ||
        lower.includes('missing submission')
      ) {
        setMessages(prev => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            sender: 'assistant',
            text: '7 students have not submitted DBMS Assignment 3 (Database Normalization & Schema Design). The deadline is October 5 at 11:59 PM.',
            timestamp: 'Just now',
            toolExecution: {
              actionName: 'Querying student roster...',
              steps: [
                { label: 'Checking course enrollment roster (62 students)', done: true },
                { label: 'Cross-referencing submitted files', done: true }
              ]
            },
            studentsList: mockUnsubmittedStudents
          }
        ]);
        return;
      }

      // --- QUERY 3: CREATE ASSIGNMENT INITIAL TRIGGER ---
      if (
        lower.includes('create an assignment') || 
        lower.includes('create assignment') || 
        lower.includes('create a dbms assignment')
      ) {
        const title = lower.includes('normalization') ? 'Normalization' : 'Database Schema Design';
        const hasDbms = lower.includes('dbms');

        setAssignmentDraftState({
          stage: 'missing_details',
          title,
          courseCode: hasDbms ? 'CSE2004' : undefined,
          courseName: hasDbms ? 'Database Management Systems' : undefined,
          courseId: hasDbms ? courses[0]?.id || 'course-1' : undefined
        });

        const missingFields = ['Deadline', 'Allowed file type', 'Total marks'];
        if (!hasDbms) missingFields.unshift('Course');

        setMessages(prev => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            sender: 'assistant',
            text: `I can create that assignment called "${title}", but I need a few details first.\n\nYou can provide them all at once or one at a time:`,
            timestamp: 'Just now',
            missingFieldsPrompt: {
              requiredFields: missingFields,
              collectedFields: {
                Title: title,
                Course: hasDbms ? 'Database Management Systems (CSE2004)' : 'Not specified yet',
                Deadline: 'Pending',
                'Allowed file type': 'Pending',
                'Total marks': 'Pending'
              }
            }
          }
        ]);
        return;
      }

      // --- QUERY 4: DANGEROUS ACTION: DELETE ASSIGNMENT ---
      if (lower.includes('delete assignment') || lower.includes('remove assignment')) {
        const targetAssignment = assignments[2] || assignments[0];
        setMessages(prev => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            sender: 'assistant',
            text: `Safety Verification Required: Are you sure you want to delete "${targetAssignment?.title}"?`,
            timestamp: 'Just now',
            confirmationPrompt: {
              title: `Delete Assignment: ${targetAssignment?.title}?`,
              description: 'This will permanently remove the assignment, all associated student submissions, and grading records from the active curriculum.',
              actionType: 'delete_assignment',
              payload: { assignmentId: targetAssignment?.id, title: targetAssignment?.title }
            }
          }
        ]);
        return;
      }

      // --- QUERY 5: DANGEROUS ACTION: CHANGE DEADLINE ---
      if (lower.includes('change deadline') || lower.includes('extend deadline') || lower.includes('deadline to friday')) {
        setMessages(prev => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            sender: 'assistant',
            text: 'Please confirm the assignment deadline extension below:',
            timestamp: 'Just now',
            confirmationPrompt: {
              title: 'Change Assignment 3 Deadline to Friday?',
              description: 'This will update the submission portal due date to Friday, September 25, 2026 at 11:59 PM. Late submission policies will be adjusted accordingly.',
              actionType: 'change_deadline',
              payload: { assignmentId: assignments[0]?.id, newDate: '2026-09-25', newTime: '23:59' }
            }
          }
        ]);
        return;
      }

      // --- QUERY 6: SHOW SIMILARITY FLAGS ---
      if (lower.includes('similarity') || lower.includes('flagged') || lower.includes('plagiarism') || lower.includes('integrity')) {
        setMessages(prev => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            sender: 'assistant',
            text: '2 submissions have triggered the institutional academic integrity similarity threshold (>30%). None have been rejected automatically—teacher review is required:',
            timestamp: 'Just now',
            toolExecution: {
              actionName: 'Scanning integrity index...',
              steps: [
                { label: 'Querying AST token comparisons', done: true },
                { label: 'Filtering similarity > 30%', done: true }
              ]
            },
            flaggedList: [
              {
                studentName: 'Arjun Nair',
                regNo: 'CSE-2024-031',
                similarity: 42,
                matchedSource: 'Fall 2025 Archive & GitHub repo',
                assignmentTitle: 'DBMS Assignment 1'
              },
              {
                studentName: 'Rohan Mehta',
                regNo: '21BCE1156',
                similarity: 42,
                matchedSource: 'CS301-2025-S19 Archive',
                assignmentTitle: 'Assignment 2 - B-Tree Indexing'
              }
            ]
          }
        ]);
        return;
      }

      // --- QUERY 7: CLASS PERFORMANCE & ANALYTICS ---
      if (lower.includes('performance') || lower.includes('perform') || lower.includes('analytics') || lower.includes('average')) {
        setMessages(prev => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            sender: 'assistant',
            text: 'Here is the academic performance summary for Assignment 3 — Normalization:',
            timestamp: 'Just now',
            toolExecution: {
              actionName: 'Aggregating rubric distributions...',
              steps: [
                { label: 'Fetching evaluated scores (58 submissions)', done: true },
                { label: 'Computing statistical variance and medians', done: true }
              ]
            },
            analyticsSummary: {
              title: 'Assignment 3 — Normalization',
              courseName: 'Database Management Systems (CSE2004)',
              submissionsRatio: '58 / 62',
              average: '14.7 / 20',
              median: '15 / 20',
              highest: '20 / 20',
              lowest: '6 / 20',
              weakCriterion: 'Functional Dependency Identification',
              weakCount: 12,
              distribution: [
                { grade: 'A+', count: 14 },
                { grade: 'A', count: 20 },
                { grade: 'B+', count: 12 },
                { grade: 'B', count: 7 },
                { grade: 'C', count: 5 }
              ],
              link: '/teacher/analytics'
            }
          }
        ]);
        return;
      }

      // --- QUERY 8: EXPORT GRADE REPORT ---
      if (lower.includes('export') || lower.includes('csv') || lower.includes('report')) {
        // Trigger real CSV download
        const csvContent = '\uFEFFStudent Name,Reg No,Course,Assignment,Score,Percentage,Grade\nRahul Kumar,CSE-2024-042,CSE2004,Normalization,18,90%,A+\nAnjali Menon,CSE-2024-019,CSE2004,Normalization,16,80%,A\nArjun Nair,CSE-2024-031,CSE2004,Normalization,12,60%,B\nPriya Sharma,CSE-2024-055,CSE2004,Normalization,19,95%,A+';
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'GradeFlow_DBMS_GradeReport.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        setMessages(prev => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            sender: 'assistant',
            text: 'I have generated and triggered the download for "GradeFlow_DBMS_GradeReport.csv".\n\nIt includes all registered students, raw rubric points, calculated percentages, letter grades, and academic integrity statuses.',
            timestamp: 'Just now'
          }
        ]);
        showToast('Grade report CSV downloaded successfully!', 'success');
        return;
      }

      // --- QUERY 9: LATE SUBMISSIONS ---
      if (lower.includes('late') || lower.includes('late submissions')) {
        setMessages(prev => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            sender: 'assistant',
            text: 'You currently have 6 late submissions across your courses. Academic policy penalty deduction preview is available:',
            timestamp: 'Just now',
            studentsList: [
              { studentName: 'Anjali Menon', regNo: 'CSE-2024-019', deadline: 'Submitted 2h 15m late', status: 'Late' },
              { studentName: 'Vikram Aditya', regNo: 'CSE-2024-078', deadline: 'Submitted 11h late', status: 'Late' },
              { studentName: 'Dev Patel', regNo: '21BCE1311', deadline: 'Submitted 1d late', status: 'Late' }
            ]
          }
        ]);
        return;
      }

      // --- FALLBACK QUERY ---
      setMessages(prev => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'assistant',
          text: `I'm here to assist with your academic grading and course administration. Here are common actions I can perform for you right now:`,
          timestamp: 'Just now'
        }
      ]);
    }, 600);
  };

  // Confirm Assignment Creation
  const handleConfirmCreateAssignment = (draft: NonNullable<CopilotMessage['assignmentDraft']>) => {
    const newAssignment = createAssignment({
      courseId: draft.courseCode === 'CSE2004' ? (courses[0]?.id || 'course-1') : (courses[1]?.id || 'course-2'),
      courseName: draft.courseName,
      courseCode: draft.courseCode,
      title: draft.title,
      description: `Comprehensive evaluation deliverable covering ${draft.title} principles, structured schema implementation, and formal rubric analysis.`,
      dueDate: draft.dueDate,
      dueTime: draft.dueTime,
      totalMarks: draft.totalMarks,
      allowLate: true,
      maxSubmissions: 2,
      acceptedFileTypes: draft.acceptedFileTypes,
      rubric: draft.rubric
    });

    setAssignmentDraftState({ stage: 'idle' });

    setMessages(prev => [
      ...prev,
      {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: `✓ Assignment "${draft.title}" created successfully in ${draft.courseName} (${draft.courseCode})! Students have been notified on their course dashboard.`,
        timestamp: 'Just now'
      }
    ]);

    showToast(`Assignment "${draft.title}" created!`, 'success');
  };

  // Confirm Dangerous Action
  const handleConfirmDangerousAction = (prompt: NonNullable<CopilotMessage['confirmationPrompt']>) => {
    if (prompt.actionType === 'delete_assignment') {
      deleteAssignment(prompt.payload.assignmentId);
      setMessages(prev => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'assistant',
          text: `✓ Assignment "${prompt.payload.title}" has been deleted from the curriculum.`,
          timestamp: 'Just now'
        }
      ]);
    } else if (prompt.actionType === 'change_deadline') {
      updateAssignmentDeadline(prompt.payload.assignmentId, prompt.payload.newDate, prompt.payload.newTime);
      setMessages(prev => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'assistant',
          text: `✓ Deadline updated successfully to Friday, ${prompt.payload.newDate} at ${prompt.payload.newTime}.`,
          timestamp: 'Just now'
        }
      ]);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-black font-sans text-xs">
      {/* Top Header */}
      <div className="px-4 py-3 bg-white dark:bg-academic-darkCard border-b border-academic-lightBorder dark:border-academic-darkBorder flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <span>GradeFlow Copilot</span>
              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800">
                Academic AI
              </span>
            </h3>
            <p className="text-[10px] text-slate-500">
              Natural-language queries, assignment drafts, and evaluation intelligence.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setMessages([
              {
                id: 'msg-welcome',
                sender: 'assistant',
                text: 'Good evening, Professor. What would you like to do?',
                timestamp: 'Just now'
              }
            ]);
            setAssignmentDraftState({ stage: 'idle' });
          }}
          className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Reset conversation"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Messages Canvas */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            {/* Sender Label */}
            <span className="text-[10px] text-slate-400 mb-1 px-1">
              {msg.sender === 'user' ? 'You' : 'GradeFlow Copilot'} • {msg.timestamp}
            </span>

            {/* Bubble */}
            <div
              className={`max-w-[85%] rounded-lg p-3.5 shadow-sm space-y-2.5 ${
                msg.sender === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-none'
                  : 'bg-white dark:bg-academic-darkCard border border-academic-lightBorder dark:border-academic-darkBorder text-slate-800 dark:text-slate-200 rounded-bl-none'
              }`}
            >
              {/* Text content with clean newlines */}
              <p className="text-xs whitespace-pre-wrap leading-relaxed">
                {msg.text}
              </p>

              {/* Tool Execution Visual Progress */}
              {msg.toolExecution && (
                <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5 text-[11px]">
                  <div className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
                    <span>{msg.toolExecution.actionName}</span>
                  </div>
                  <div className="space-y-1 pl-3 text-slate-600 dark:text-slate-400">
                    {msg.toolExecution.steps.map((st, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-[10px]">
                        <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        <span>{st.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Missing Information Prompt UI */}
              {msg.missingFieldsPrompt && (
                <div className="p-3 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-lg space-y-2 text-xs">
                  <div className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Missing Required Academic Fields:</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    {Object.entries(msg.missingFieldsPrompt.collectedFields).map(([k, v]) => {
                      const isCollected = v !== 'Pending' && v !== 'Not specified yet';
                      return (
                        <div key={k} className="p-2 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                          <div>
                            <div className="text-[10px] text-slate-400 uppercase font-semibold">{k}</div>
                            <div className="font-semibold text-slate-800 dark:text-slate-200">{v}</div>
                          </div>
                          {isCollected ? (
                            <span className="text-emerald-600 font-bold">✓</span>
                          ) : (
                            <span className="text-amber-600 font-bold text-[10px]">Required</span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-2 flex flex-wrap gap-1.5">
                    <button
                      onClick={() => processQuery('DBMS, October 5 at 11:59 PM, PDF only, 20 marks.')}
                      className="px-2.5 py-1 text-[11px] font-semibold bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 rounded hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
                    >
                      "DBMS, October 5 at 11:59 PM, PDF only, 20 marks."
                    </button>
                  </div>
                </div>
              )}

              {/* Assignment Preview Ready for Confirmation */}
              {msg.assignmentDraft && (
                <div className="p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                    <span className="font-bold text-slate-900 dark:text-slate-100 uppercase tracking-tight text-[11px]">
                      Assignment Draft Preview
                    </span>
                    <Badge variant="blue" size="sm">Ready for Confirmation</Badge>
                  </div>

                  <div className="space-y-1.5 text-slate-700 dark:text-slate-300">
                    <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {msg.assignmentDraft.title}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                      <div>Course: <strong>{msg.assignmentDraft.courseCode}</strong> ({msg.assignmentDraft.courseName})</div>
                      <div>Deadline: <strong>{msg.assignmentDraft.dueDate} at {msg.assignmentDraft.dueTime}</strong></div>
                      <div>Submission: <strong>{msg.assignmentDraft.acceptedFileTypes.join(', ')}</strong></div>
                      <div>Total Marks: <strong>{msg.assignmentDraft.totalMarks}</strong></div>
                    </div>
                  </div>

                  {/* Rubric Breakdown */}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
                    <div className="font-semibold text-slate-800 dark:text-slate-200 text-[11px]">
                      Structured Rubric ({msg.assignmentDraft.rubric.length} Criteria)
                    </div>
                    <div className="divide-y divide-slate-200 dark:divide-slate-800">
                      {msg.assignmentDraft.rubric.map((r) => (
                        <div key={r.id} className="py-1 flex items-center justify-between text-[11px]">
                          <span className="text-slate-700 dark:text-slate-300">{r.title}</span>
                          <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{r.maxMarks} marks</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Confirmation Buttons */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <button
                      onClick={() => setAssignmentDraftState({ stage: 'idle' })}
                      className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded border border-slate-300 dark:border-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => navigate('/teacher/assignments/create')}
                      className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded border border-slate-300 dark:border-slate-700"
                    >
                      Edit in Builder
                    </button>
                    <button
                      onClick={() => handleConfirmCreateAssignment(msg.assignmentDraft!)}
                      className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded shadow-sm"
                    >
                      Create Assignment
                    </button>
                  </div>
                </div>
              )}

              {/* Confirmation Prompt for Dangerous Actions */}
              {msg.confirmationPrompt && (
                <div className="p-3.5 bg-rose-50/90 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 rounded-lg space-y-2.5 text-xs">
                  <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    <span>{msg.confirmationPrompt.title}</span>
                  </div>
                  <p className="text-xs text-rose-700 dark:text-rose-300 leading-relaxed">
                    {msg.confirmationPrompt.description}
                  </p>
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-rose-200 dark:border-rose-800">
                    <button
                      onClick={() => {
                        setMessages(prev => [
                          ...prev,
                          {
                            id: `ai-${Date.now()}`,
                            sender: 'assistant',
                            text: 'Action cancelled. No changes were made.',
                            timestamp: 'Just now'
                          }
                        ]);
                      }}
                      className="px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleConfirmDangerousAction(msg.confirmationPrompt!)}
                      className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded shadow-sm"
                    >
                      Confirm Action
                    </button>
                  </div>
                </div>
              )}

              {/* Inbox Breakdown Table */}
              {msg.inboxBreakdown && (
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs">
                  <div className="space-y-1.5">
                    {msg.inboxBreakdown.courses.map((c, i) => (
                      <div key={i} className="flex items-center justify-between text-[11px] py-1 border-b border-slate-100 dark:border-slate-800 last:border-b-0">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{c.name}</span>
                        <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{c.count} pending</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-slate-200 dark:border-slate-800">
                    <span className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold">
                      {msg.inboxBreakdown.lateCount} submissions are late
                    </span>
                    <button
                      onClick={() => {
                        onNavigateAction?.();
                        navigate('/teacher/inbox');
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded shadow-sm"
                    >
                      <Inbox className="w-3.5 h-3.5" />
                      <span>View Evaluation Inbox</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Unsubmitted Students Table */}
              {msg.studentsList && (
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[11px]">
                      <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                        <tr>
                          <th className="pb-1.5">Student</th>
                          <th className="pb-1.5">Reg Number</th>
                          <th className="pb-1.5">Deadline</th>
                          <th className="pb-1.5 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {msg.studentsList.map((st, i) => (
                          <tr key={i} className="py-1 text-slate-800 dark:text-slate-200">
                            <td className="py-1 font-semibold">{st.studentName}</td>
                            <td className="py-1 font-mono text-slate-500">{st.regNo}</td>
                            <td className="py-1 text-slate-600 dark:text-slate-400">{st.deadline}</td>
                            <td className="py-1 text-right">
                              <Badge variant={st.status === 'Late' ? 'rose' : 'amber'} size="sm">
                                {st.status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="pt-2 flex items-center justify-end">
                    <button
                      onClick={() => showToast('Batch reminder emails dispatched to 7 unsubmitted students.', 'success')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Send Batch Reminders</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Flagged Similarity List */}
              {msg.flaggedList && (
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                  <div className="space-y-2">
                    {msg.flaggedList.map((f, i) => (
                      <div key={i} className="p-2.5 bg-white dark:bg-black rounded border border-rose-200 dark:border-rose-900/50 flex items-center justify-between gap-2">
                        <div>
                          <div className="font-bold text-slate-900 dark:text-slate-100">{f.studentName} ({f.regNo})</div>
                          <div className="text-[10px] text-slate-500">Source: {f.matchedSource} • {f.assignmentTitle}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-rose-600 text-xs px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950 border border-rose-200 dark:border-rose-900">
                            {f.similarity}% Match
                          </span>
                          <button
                            onClick={() => {
                              onNavigateAction?.();
                              navigate('/teacher/evaluation/assign-1');
                            }}
                            className="px-2.5 py-1 text-xs font-semibold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded hover:bg-indigo-100"
                          >
                            Inspect
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Analytics Summary */}
              {msg.analyticsSummary && (
                <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
                  <div className="border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-slate-100">{msg.analyticsSummary.title}</div>
                      <div className="text-[10px] text-slate-500">{msg.analyticsSummary.courseName}</div>
                    </div>
                    <Badge variant="blue" size="sm">Evaluated</Badge>
                  </div>

                  {/* 4 Stat Boxes */}
                  <div className="grid grid-cols-4 gap-2 text-center text-slate-800 dark:text-slate-200">
                    <div className="p-2 bg-white dark:bg-black rounded border border-slate-200 dark:border-slate-800">
                      <div className="text-[10px] text-slate-400">Submissions</div>
                      <div className="font-bold text-sm text-indigo-600">{msg.analyticsSummary.submissionsRatio}</div>
                    </div>
                    <div className="p-2 bg-white dark:bg-black rounded border border-slate-200 dark:border-slate-800">
                      <div className="text-[10px] text-slate-400">Average</div>
                      <div className="font-bold text-sm text-emerald-600">{msg.analyticsSummary.average}</div>
                    </div>
                    <div className="p-2 bg-white dark:bg-black rounded border border-slate-200 dark:border-slate-800">
                      <div className="text-[10px] text-slate-400">Median</div>
                      <div className="font-bold text-sm">{msg.analyticsSummary.median}</div>
                    </div>
                    <div className="p-2 bg-white dark:bg-black rounded border border-slate-200 dark:border-slate-800">
                      <div className="text-[10px] text-slate-400">Highest / Low</div>
                      <div className="font-bold text-xs">{msg.analyticsSummary.highest.split(' ')[0]} / {msg.analyticsSummary.lowest.split(' ')[0]}</div>
                    </div>
                  </div>

                  {/* Weak Criterion Alert */}
                  <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded flex items-center justify-between text-[11px]">
                    <div>
                      <span className="font-bold text-amber-900 dark:text-amber-200">Most Common Weak Criterion: </span>
                      <span className="text-amber-800 dark:text-amber-300 font-medium">{msg.analyticsSummary.weakCriterion}</span>
                    </div>
                    <span className="font-bold text-amber-900 dark:text-amber-200">{msg.analyticsSummary.weakCount} below 50%</span>
                  </div>

                  {/* Link to Full Analytics */}
                  <div className="pt-2 flex items-center justify-end">
                    <button
                      onClick={() => {
                        onNavigateAction?.();
                        navigate(msg.analyticsSummary!.link);
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded shadow-sm"
                    >
                      <BarChart3 className="w-3.5 h-3.5" />
                      <span>Open Full Analytics</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-2 text-slate-500 text-xs p-2">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce"></span>
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.2s]"></span>
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.4s]"></span>
            <span className="text-[11px] text-slate-400">GradeFlow Copilot is synthesizing records...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Actions */}
      <div className="px-4 py-2 bg-white/50 dark:bg-slate-900/50 border-t border-academic-lightBorder dark:border-academic-darkBorder">
        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
          Suggested Actions:
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => handleQuickAction('Create a DBMS assignment called Normalization.')}
            className="px-2.5 py-1 text-[11px] rounded-md font-medium bg-white dark:bg-academic-darkCard border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-400 dark:hover:border-indigo-600 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shadow-2xs"
          >
            Create an assignment
          </button>
          <button
            onClick={() => handleQuickAction('How many papers do I still have to check?')}
            className="px-2.5 py-1 text-[11px] rounded-md font-medium bg-white dark:bg-academic-darkCard border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-400 dark:hover:border-indigo-600 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shadow-2xs"
          >
            Show pending evaluations
          </button>
          <button
            onClick={() => handleQuickAction('Which students haven\'t submitted DBMS Assignment 3?')}
            className="px-2.5 py-1 text-[11px] rounded-md font-medium bg-white dark:bg-academic-darkCard border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-400 dark:hover:border-indigo-600 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shadow-2xs"
          >
            Who hasn't submitted?
          </button>
          <button
            onClick={() => handleQuickAction('Show similarity flags')}
            className="px-2.5 py-1 text-[11px] rounded-md font-medium bg-white dark:bg-academic-darkCard border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-400 dark:hover:border-indigo-600 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shadow-2xs"
          >
            Show similarity flags
          </button>
          <button
            onClick={() => handleQuickAction('How did my DBMS class perform in Assignment 3?')}
            className="px-2.5 py-1 text-[11px] rounded-md font-medium bg-white dark:bg-academic-darkCard border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-400 dark:hover:border-indigo-600 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shadow-2xs"
          >
            Analyze class performance
          </button>
          <button
            onClick={() => handleQuickAction('Export my DBMS grade report')}
            className="px-2.5 py-1 text-[11px] rounded-md font-medium bg-white dark:bg-academic-darkCard border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-400 dark:hover:border-indigo-600 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shadow-2xs"
          >
            Export grade report
          </button>
        </div>
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          processQuery(inputQuery);
        }}
        className="p-3 bg-white dark:bg-academic-darkCard border-t border-academic-lightBorder dark:border-academic-darkBorder flex items-center gap-2"
      >
        <input
          ref={inputRef}
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder="Ask GradeFlow anything... (e.g. 'Create an assignment', 'Who hasn\'t submitted?')"
          className="flex-1 px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-academic-lightBorder dark:border-academic-darkBorder rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-600"
        />
        <button
          type="submit"
          disabled={!inputQuery.trim()}
          className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-40 shadow-sm"
          title="Send query"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
