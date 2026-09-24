import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { TrendingUp, Award, CheckCircle2, BookOpen } from 'lucide-react';

export const StudentPerformance: React.FC = () => {
  const { isDarkMode, currentUser, courses, assignments, submissions } = useApp();

  // Submissions for this student
  const mySubmissions = submissions.filter(s => s.studentId === currentUser.id || s.regNo === currentUser.regNo);
  const myEvaluatedSubs = mySubmissions.filter(s => s.evaluationStatus === 'Evaluated' && s.evaluation && s.evaluation.maxScore > 0);

  // Cumulative Average
  const totalEvaluated = myEvaluatedSubs.length;
  let cumulativeAvgVal = 0;
  if (totalEvaluated > 0) {
    const sumPct = myEvaluatedSubs.reduce((acc, s) => acc + (s.evaluation!.totalScore / s.evaluation!.maxScore) * 100, 0);
    cumulativeAvgVal = sumPct / totalEvaluated;
  }

  const cumulativeAvgStr = totalEvaluated > 0 ? `${cumulativeAvgVal.toFixed(1)}%` : '—';
  
  // Grade Standing
  let currentGradeStanding = 'Awaiting Grades';
  if (totalEvaluated > 0) {
    if (cumulativeAvgVal >= 90) currentGradeStanding = 'Grade A+ (Distinction)';
    else if (cumulativeAvgVal >= 80) currentGradeStanding = 'Grade A (Excellent)';
    else if (cumulativeAvgVal >= 70) currentGradeStanding = 'Grade B+ (Very Good)';
    else if (cumulativeAvgVal >= 60) currentGradeStanding = 'Grade B (Good)';
    else if (cumulativeAvgVal >= 50) currentGradeStanding = 'Grade C (Passing)';
    else currentGradeStanding = 'Grade F (Remedial Required)';
  }

  // Completed Evaluations Metric
  const onTimeCount = mySubmissions.filter(s => s.status !== 'Late').length;
  const onTimePercentage = mySubmissions.length > 0 
    ? `${Math.round((onTimeCount / mySubmissions.length) * 100)}% on-time`
    : 'No submissions yet';

  const flaggedCount = mySubmissions.filter(s => s.similarityScore >= (s.similarityReport?.threshold || 20)).length;
  const integrityStanding = flaggedCount === 0 
    ? 'Zero integrity flags detected' 
    : `${flaggedCount} submission${flaggedCount > 1 ? 's' : ''} flagged for review`;

  // Performance Trend Data across assignments
  const performanceTrendData = myEvaluatedSubs.map(sub => {
    const asg = assignments.find(a => a.id === sub.assignmentId);
    const myScore = Math.round((sub.evaluation!.totalScore / sub.evaluation!.maxScore) * 100);

    // Class average for this assignment
    const classSubs = submissions.filter(s => s.assignmentId === sub.assignmentId && s.evaluation && s.evaluation.maxScore > 0);
    const classAvg = classSubs.length > 0
      ? Math.round(classSubs.reduce((acc, s) => acc + (s.evaluation!.totalScore / s.evaluation!.maxScore) * 100, 0) / classSubs.length)
      : myScore;

    return {
      assignment: asg?.title ? (asg.title.length > 18 ? `${asg.title.slice(0, 16)}...` : asg.title) : 'Assignment',
      score: myScore,
      classAvg
    };
  });

  // Course Breakdown Table: derived from active courses & student's evaluated submissions
  const courseBreakdown = courses.map(course => {
    // Find all assignments for this course
    const courseAsgIds = new Set(assignments.filter(a => a.courseId === course.id || a.courseCode === course.code).map(a => a.id));
    
    // Submissions by this student for this course
    const studentCourseSubs = mySubmissions.filter(s => courseAsgIds.has(s.assignmentId));
    const studentCourseEvalSubs = studentCourseSubs.filter(s => s.evaluation && s.evaluation.maxScore > 0);

    if (studentCourseEvalSubs.length === 0) {
      return {
        course: course.name,
        code: course.code,
        score: studentCourseSubs.length > 0 ? 'Submitted (Pending)' : 'No Submissions',
        grade: '—'
      };
    }

    const avg = studentCourseEvalSubs.reduce((acc, s) => acc + (s.evaluation!.totalScore / s.evaluation!.maxScore) * 100, 0) / studentCourseEvalSubs.length;
    const grade = avg >= 90 ? 'A+' : avg >= 80 ? 'A' : avg >= 70 ? 'B+' : avg >= 60 ? 'B' : avg >= 50 ? 'C' : 'F';

    return {
      course: course.name,
      code: course.code,
      score: `${avg.toFixed(1)}%`,
      grade
    };
  });

  const gridColor = isDarkMode ? '#1f293d' : '#e2e8f0';
  const textColor = isDarkMode ? '#94a3b8' : '#64748b';

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="pb-2 border-b border-academic-lightBorder dark:border-academic-darkBorder">
        <h2 className="text-xl font-bold text-academic-lightText dark:text-academic-darkText tracking-tight">
          Academic Performance Overview
        </h2>
        <p className="text-xs text-academic-lightMuted dark:text-academic-darkMuted mt-0.5">
          Longitudinal grade trend and subject-specific competency milestones.
        </p>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-academic-darkCard border border-academic-lightBorder dark:border-academic-darkBorder rounded-lg p-5 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Cumulative Average</span>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            {cumulativeAvgStr}
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1 font-medium">
            <TrendingUp className="w-3 h-3" />
            <span>
              {totalEvaluated > 0 
                ? `Based on ${totalEvaluated} evaluated deliverable${totalEvaluated > 1 ? 's' : ''}` 
                : 'Awaiting graded deliverables'}
            </span>
          </p>
        </div>

        <div className="bg-white dark:bg-academic-darkCard border border-academic-lightBorder dark:border-academic-darkBorder rounded-lg p-5 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Current Grade Standing</span>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {currentGradeStanding}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Across {courses.length} Enrolled Course{courses.length === 1 ? '' : 's'}
          </p>
        </div>

        <div className="bg-white dark:bg-academic-darkCard border border-academic-lightBorder dark:border-academic-darkBorder rounded-lg p-5 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Completed Evaluations</span>
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
            {totalEvaluated} / {mySubmissions.length} Tasks
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {integrityStanding}
          </p>
        </div>
      </div>

      {/* Grade Trend Line Chart */}
      <div className="bg-white dark:bg-academic-darkCard border border-academic-lightBorder dark:border-academic-darkBorder rounded-lg p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Grade Trend Across Assignments
            </h3>
            <p className="text-xs text-slate-500">
              Comparison between your scores and class median performance.
            </p>
          </div>
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
            {totalEvaluated > 0 ? `${totalEvaluated} Evaluated` : 'No Evaluated Submissions'}
          </span>
        </div>

        <div className="h-64 w-full">
          {performanceTrendData.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
              <TrendingUp className="w-8 h-8 mb-2 opacity-40" />
              <p>No graded assignment submissions yet to plot trend.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="assignment" stroke={textColor} fontSize={12} tickLine={false} />
                <YAxis stroke={textColor} fontSize={12} domain={[0, 100]} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDarkMode ? '#172033' : '#ffffff',
                    borderColor: isDarkMode ? '#334155' : '#e2e8f0',
                    color: isDarkMode ? '#f8fafc' : '#0f172a',
                    fontSize: '12px',
                    borderRadius: '6px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  name="Your Score (%)" 
                  stroke="#4f46e5" 
                  strokeWidth={2.5} 
                  dot={{ r: 5, fill: '#4f46e5' }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="classAvg" 
                  name="Class Average (%)" 
                  stroke="#94a3b8" 
                  strokeWidth={1.5} 
                  strokeDasharray="4 4" 
                  dot={{ r: 3, fill: '#94a3b8' }} 
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Course Breakdown Table */}
      <div className="bg-white dark:bg-academic-darkCard border border-academic-lightBorder dark:border-academic-darkBorder rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-academic-lightBorder dark:border-academic-darkBorder">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Course Performance Breakdown
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 font-medium border-b border-academic-lightBorder dark:border-academic-darkBorder">
              <tr>
                <th className="px-4 py-3">Course</th>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3 text-right">Standing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-academic-lightBorder dark:divide-academic-darkBorder">
              {courseBreakdown.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                    No active courses found.
                  </td>
                </tr>
              ) : (
                courseBreakdown.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">
                      {item.course}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-500">
                      {item.code}
                    </td>
                    <td className="px-4 py-3 font-bold text-indigo-600 dark:text-indigo-400">
                      {item.score}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {item.grade !== '—' ? (
                        <span className="font-bold text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                          Grade {item.grade}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-medium">Pending</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
