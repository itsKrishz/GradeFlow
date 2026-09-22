/**
 * GradeFlow Unified API Client
 * Connects frontend React components to Express / PostgreSQL backend (http://localhost:5001/api/v1)
 */

const API_BASE_URL =
  ((import.meta as any)?.env?.VITE_API_URL) || 'http://localhost:5001/api/v1';

export function getStoredToken(): string | null {
  return localStorage.getItem('gradeflow_token');
}

export function setStoredToken(token: string): void {
  localStorage.setItem('gradeflow_token', token);
}

export function clearStoredToken(): void {
  localStorage.removeItem('gradeflow_token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.message || `Request failed with status ${response.status}`;
    const error = new Error(errorMsg);
    (error as any).status = response.status;
    (error as any).data = data;
    throw error;
  }

  return data as T;
}

export const api = {
  // 1. System Health
  health: {
    check: async () => {
      const res = await fetch('http://localhost:5001/health').catch(() => null);
      if (!res || !res.ok) return { status: 'offline', connected: false };
      return res.json();
    },
  },

  // 2. Authentication
  auth: {
    login: async (identifier: string, password?: string) => {
      const data = await request<{
        success: boolean;
        token: string;
        user: {
          id: string;
          username: string;
          email: string;
          name: string;
          role: 'TEACHER' | 'STUDENT' | 'ADMIN';
          department?: string;
        };
      }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier, password }),
      });

      if (data.token) {
        setStoredToken(data.token);
      }
      return data;
    },

    getMe: async () => {
      return request<{
        success: boolean;
        user: {
          id: string;
          username: string;
          email: string;
          name: string;
          role: 'TEACHER' | 'STUDENT' | 'ADMIN';
          department?: string;
        };
      }>('/auth/me');
    },

    logout: () => {
      clearStoredToken();
    },
  },

  // 3. Courses
  courses: {
    getAll: async () => {
      return request<{ success: boolean; count: number; courses: any[] }>('/courses');
    },
    getById: async (id: string) => {
      return request<{ success: boolean; course: any }>(`/courses/${id}`);
    },
    create: async (courseData: { code: string; name: string; semester: string; department?: string }) => {
      return request<{ success: boolean; course: any }>('/courses', {
        method: 'POST',
        body: JSON.stringify(courseData),
      });
    },
    delete: async (id: string) => {
      return request<{ success: boolean; message: string }>(`/courses/${id}`, {
        method: 'DELETE',
      });
    },
  },

  // 4. Assignments
  assignments: {
    getAll: async (courseId?: string) => {
      const query = courseId ? `?courseId=${encodeURIComponent(courseId)}` : '';
      return request<{ success: boolean; count: number; assignments: any[] }>(`/assignments${query}`);
    },
    getById: async (id: string) => {
      return request<{ success: boolean; assignment: any }>(`/assignments/${id}`);
    },
    create: async (data: {
      courseId: string;
      title: string;
      description: string;
      dueDate: string;
      dueTime?: string;
      totalMarks?: number;
      acceptedFileTypes?: string[];
      rubricCriteria?: Array<{ title: string; description: string; maxMarks: number }>;
    }) => {
      return request<{ success: boolean; assignment: any }>('/assignments', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    delete: async (id: string) => {
      return request<{ success: boolean; message: string }>(`/assignments/${id}`, {
        method: 'DELETE',
      });
    },
  },

  // 5. Submissions
  submissions: {
    getAll: async (params?: { assignmentId?: string; courseId?: string }) => {
      const searchParams = new URLSearchParams();
      if (params?.assignmentId) searchParams.append('assignmentId', params.assignmentId);
      if (params?.courseId) searchParams.append('courseId', params.courseId);
      const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
      return request<{ success: boolean; count: number; submissions: any[] }>(`/submissions${query}`);
    },
    getById: async (id: string) => {
      return request<{ success: boolean; submission: any }>(`/submissions/${id}`);
    },
    create: async (data: {
      assignmentId: string;
      fileName: string;
      fileSize: string;
      fileUrl?: string;
      fileText?: string;
    }) => {
      return request<{ success: boolean; submission: any }>('/submissions', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
  },

  // 6. Evaluations
  evaluations: {
    getAll: async (params?: { assignmentId?: string; submissionId?: string }) => {
      const searchParams = new URLSearchParams();
      if (params?.assignmentId) searchParams.append('assignmentId', params.assignmentId);
      if (params?.submissionId) searchParams.append('submissionId', params.submissionId);
      const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
      return request<{ success: boolean; count: number; evaluations: any[] }>(`/evaluations${query}`);
    },
    getBySubmissionId: async (submissionId: string) => {
      return request<{ success: boolean; evaluation: any }>(`/evaluations/submission/${submissionId}`);
    },
    save: async (data: {
      submissionId: string;
      totalScore: number;
      percentage: number;
      grade: string;
      feedback: string;
      rubricScores: any;
      aiAssisted?: boolean;
      published?: boolean;
    }) => {
      return request<{ success: boolean; evaluation: any }>('/evaluations', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    updateSimilarity: async (
      submissionId: string,
      data: {
        overallScore: number;
        threshold?: number;
        flagged: boolean;
        matchedSource?: string;
        matchedChunks?: any;
      }
    ) => {
      return request<{ success: boolean; similarityReport: any }>(`/evaluations/similarity/${submissionId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
  },
};
