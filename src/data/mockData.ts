import { Course, Assignment, Submission, User, Activity, EnrolledStudent, AppNotification } from '../types';

export const mockUsers: User[] = [
  {
    id: 'user-1',
    name: 'Prof. Sarah Jenkins',
    username: 'teacher',
    email: 'teacher@gradeflow.edu',
    role: 'teacher',
    title: 'Associate Professor',
    department: 'Computer Science & Engineering',
    status: 'Active',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'user-2',
    name: 'Rahul Kumar',
    username: 'student',
    email: 'rahul.k@student.edu',
    role: 'student',
    title: 'Undergraduate Student',
    department: 'Computer Science & Engineering',
    regNo: 'CSE-2024-042',
    status: 'Active',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'user-3',
    name: 'Dr. Arvind Mehta',
    username: 'admin',
    email: 'admin@gradeflow.edu',
    role: 'admin',
    title: 'Dean of Academics & Systems',
    department: 'Academic Affairs',
    status: 'Active',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'user-stu-3',
    name: 'Arjun Nair',
    username: 'student2',
    email: 'student2@gradeflow.edu',
    role: 'student',
    title: 'Undergraduate Student',
    department: 'Computer Science & Engineering',
    regNo: 'CSE-2024-031',
    status: 'Active',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
  }
];

export const mockCourses: Course[] = [
  {
    id: 'course-1',
    name: 'Database Management Systems',
    code: 'CSE2004',
    section: 'A',
    semester: 'Fall 2026',
    academicYear: '2026-2027',
    studentsCount: 62,
    activeAssignmentsCount: 2,
    enrollmentCode: 'GF-DBMS-26',
    description: 'Relational algebra, SQL fundamentals, schema normalization, ACID transactions, and index query optimization.',
    teacherName: 'Prof. Sarah Jenkins'
  },
  {
    id: 'course-2',
    name: 'Web Programming & Modern Frameworks',
    code: 'CSE3002',
    section: 'B',
    semester: 'Fall 2026',
    academicYear: '2026-2027',
    studentsCount: 50,
    activeAssignmentsCount: 1,
    enrollmentCode: 'GF-WEB-14',
    description: 'Fullstack web architecture, React ecosystems, state management, REST APIs, and authentication flows.',
    teacherName: 'Prof. Sarah Jenkins'
  },
  {
    id: 'course-3',
    name: 'Design & Analysis of Algorithms',
    code: 'CSE2001',
    section: 'A',
    semester: 'Fall 2026',
    academicYear: '2026-2027',
    studentsCount: 58,
    activeAssignmentsCount: 1,
    enrollmentCode: 'GF-ALGO-08',
    description: 'Asymptotic analysis, divide & conquer, dynamic programming, graph traversals, and NP-completeness.',
    teacherName: 'Prof. Sarah Jenkins'
  },
  {
    id: 'course-4',
    name: 'Operating Systems & Distributed Architecture',
    code: 'CSE2003',
    section: 'C',
    semester: 'Fall 2026',
    academicYear: '2026-2027',
    studentsCount: 45,
    activeAssignmentsCount: 1,
    enrollmentCode: 'GF-OS-33',
    description: 'Process scheduling, virtual memory paging, multithreading synchronization, and file system design.',
    teacherName: 'Prof. Sarah Jenkins'
  }
];

export const mockAssignments: Assignment[] = [
  {
    id: 'assign-1',
    courseId: 'course-1',
    courseName: 'Database Management Systems',
    courseCode: 'CSE2004',
    title: 'Database Schema Design & Normalization Project',
    description: 'Design an enterprise e-commerce database schema. Demonstrate functional dependencies, decompose to 3NF/BCNF, write production DDL with foreign key constraints, and optimize 3 critical reporting queries with B-Tree indices.',
    dueDate: '2026-09-15',
    dueTime: '23:59',
    totalMarks: 40,
    allowLate: true,
    maxSubmissions: 2,
    acceptedFileTypes: ['.pdf', '.sql', '.zip'],
    totalStudents: 60,
    submittedCount: 42,
    pendingCount: 24,
    lateCount: 7,
    evaluatedCount: 86,
    status: 'Active',
    rubric: [
      {
        id: 'rubric-1',
        title: 'Correctness & Schema Integrity',
        description: 'Entities, primary keys, foreign keys, and referential actions match the system requirements without data anomalies.',
        maxMarks: 10
      },
      {
        id: 'rubric-2',
        title: 'Normalization (3NF / BCNF) Justification',
        description: 'Rigorous derivation of functional dependencies and step-by-step lossless join dependency decomposition.',
        maxMarks: 10
      },
      {
        id: 'rubric-3',
        title: 'Query Optimization & Indexing',
        description: 'Execution plan analysis, index selection criteria, and measurable query performance improvements.',
        maxMarks: 10
      },
      {
        id: 'rubric-4',
        title: 'Documentation & Presentation',
        description: 'Clean academic formatting, ER diagrams, clarity of technical explanations, and query documentation.',
        maxMarks: 10
      }
    ]
  },
  {
    id: 'assign-2',
    courseId: 'course-2',
    courseName: 'Web Programming & Modern Frameworks',
    courseCode: 'CSE3002',
    title: 'React Portfolio & State Architecture',
    description: 'Develop a responsive developer portfolio application using React, TypeScript, and state management hooks with accessibility compliance.',
    dueDate: '2026-09-18',
    dueTime: '23:59',
    totalMarks: 50,
    allowLate: true,
    maxSubmissions: 1,
    acceptedFileTypes: ['.zip', '.pdf'],
    totalStudents: 50,
    submittedCount: 38,
    pendingCount: 18,
    lateCount: 3,
    evaluatedCount: 20,
    status: 'Active',
    rubric: [
      {
        id: 'rubric-w1',
        title: 'Component Architecture & Clean Code',
        description: 'Modular structure, reusable primitives, clean separation of concerns.',
        maxMarks: 15
      },
      {
        id: 'rubric-w2',
        title: 'State Management & Effects',
        description: 'Predictable state transitions, custom hooks, zero memory leaks.',
        maxMarks: 15
      },
      {
        id: 'rubric-w3',
        title: 'Responsive UI & Accessibility',
        description: 'Fluid layout across mobile/desktop, semantic HTML5, keyboard navigation.',
        maxMarks: 10
      },
      {
        id: 'rubric-w4',
        title: 'Testing & Documentation',
        description: 'Unit test suites, README setup instructions, and code comments.',
        maxMarks: 10
      }
    ]
  },
  {
    id: 'assign-3',
    courseId: 'course-3',
    courseName: 'Design & Analysis of Algorithms',
    courseCode: 'CSE2001',
    title: 'Divide & Conquer Algorithm Implementation',
    description: 'Implementation and empirical performance comparison between Strassen Matrix Multiplication and classic O(n^3) multiplication.',
    dueDate: '2026-09-22',
    dueTime: '23:59',
    totalMarks: 30,
    allowLate: false,
    maxSubmissions: 1,
    acceptedFileTypes: ['.pdf', '.zip'],
    totalStudents: 58,
    submittedCount: 22,
    pendingCount: 14,
    lateCount: 0,
    evaluatedCount: 8,
    status: 'Active',
    rubric: [
      {
        id: 'rubric-a1',
        title: 'Algorithmic Correctness',
        description: 'Base cases, recursive steps, handling of non-power-of-two matrix dimensions.',
        maxMarks: 12
      },
      {
        id: 'rubric-a2',
        title: 'Empirical Benchmark Analysis',
        description: 'Plots, asymptotic runtime verification, threshold crossover identification.',
        maxMarks: 10
      },
      {
        id: 'rubric-a3',
        title: 'Code Quality & Comments',
        description: 'Readable implementation, memory efficiency, unit tests.',
        maxMarks: 8
      }
    ]
  }
];

export const mockSubmissions: Submission[] = [
  {
    id: 'sub-1',
    assignmentId: 'assign-1',
    studentId: 'user-2',
    studentName: 'Rahul Kumar',
    regNo: 'CSE-2024-042',
    studentEmail: 'rahul.k@student.edu',
    submittedAt: '2026-09-14 18:24',
    status: 'Submitted',
    evaluationStatus: 'Evaluated',
    similarityScore: 12,
    fileName: 'RahulKumar_DBMS_Project_Report.pdf',
    fileSize: '3.4 MB',
    similarityReport: {
      overallScore: 12,
      threshold: 30,
      flagged: false,
      matchedSections: [
        {
          sectionTitle: 'Standard Definitions & Normal Forms',
          similarityPercentage: 18,
          matchedSource: 'Silberschatz Database System Concepts (Chapter 8)',
          matchedSnippet: 'A relation schema R is in Boyce-Codd Normal Form if for every functional dependency alpha -> beta in F+...'
        }
      ]
    },
    evaluation: {
      id: 'eval-1',
      submissionId: 'sub-1',
      rubricScores: {
        'rubric-1': 9,
        'rubric-2': 8,
        'rubric-3': 9,
        'rubric-4': 8
      },
      totalScore: 34,
      maxScore: 40,
      percentage: 85,
      grade: 'A',
      feedback: 'Excellent relational design with strong adherence to 3NF. Query plans are well-thought-out and indexes show a 4x reduction in disk reads. Consider clarifying your cascade delete policies for order line items in future submissions.',
      aiAssisted: false,
      status: 'Final',
      evaluatedAt: '2026-09-15 11:30'
    },
    pages: [
      {
        pageNumber: 1,
        title: '1. Executive Summary & ER Diagram Specifications',
        content: `Project Scope: Enterprise Multi-Vendor Retail Platform

The schema encapsulates transactions, item catalog hierarchies, vendor fulfillment centers, and user order management. The initial conceptual design identified 14 primary entities with 22 distinct relationship sets.

Integrity Constraints Enforced:
• Customer accounts require verified email unique constraints.
• Order state transitions follow strict finite state machine validation (Pending -> Authorized -> Shipped -> Delivered).
• Inventory holds enforce row-level locks to prevent overselling anomalies during peak traffic spikes.

Entity Relationship Overview:
- USERS (user_id PK, email UNIQUE, password_hash, created_at, status)
- ORDERS (order_id PK, customer_id FK, status, total_amount, placed_timestamp)
- ORDER_ITEMS (item_id PK, order_id FK, sku_id FK, unit_price, quantity)
- INVENTORY (sku_id PK, warehouse_id FK, available_stock, reserved_stock)`
      },
      {
        pageNumber: 2,
        title: '2. Relational Schema & DDL Implementation',
        content: `DDL Specifications with Referential Integrity:`,
        codeSnippet: `-- Schema DDL Specification with Foreign Key cascading actions
CREATE TABLE orders (
    order_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    order_status VARCHAR(20) NOT NULL CHECK (order_status IN ('PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED')),
    subtotal_cents BIGINT NOT NULL CHECK (subtotal_cents >= 0),
    tax_cents BIGINT NOT NULL CHECK (tax_cents >= 0),
    total_cents BIGINT GENERATED ALWAYS AS (subtotal_cents + tax_cents) STORED,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE order_items (
    item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    product_sku VARCHAR(50) NOT NULL REFERENCES product_catalog(sku),
    unit_price_cents BIGINT NOT NULL CHECK (unit_price_cents > 0),
    quantity INT NOT NULL CHECK (quantity > 0)
);`
      },
      {
        pageNumber: 3,
        title: '3. Normalization Derivation (1NF to BCNF)',
        content: `Functional Dependencies Identified in Universal Order Relation:
FD1: {order_id, product_sku} -> {quantity, unit_price_cents, discount_rate}
FD2: {order_id} -> {customer_id, order_date, shipping_address_id, payment_method}
FD3: {customer_id} -> {customer_name, customer_email, loyalty_tier}
FD4: {product_sku} -> {product_name, category_id, standard_msrp}

Normalization Steps:
1. First Normal Form (1NF):
   All attributes contain atomic values. Multi-valued shipping tags are separated into dedicated relational tables.

2. Second Normal Form (2NF):
   Removed partial functional dependencies on the composite key {order_id, product_sku}. FD2, FD3, and FD4 were decomposed into independent relations.

3. Third Normal Form (3NF):
   Eliminated transitive dependency: order_id -> customer_id -> loyalty_tier. Created dedicated CUSTOMER_PROFILES relation.

4. BCNF Verification:
   In every non-trivial functional dependency X -> Y, X is a superkey for the decomposed relation.`
      },
      {
        pageNumber: 4,
        title: '4. Query Plan Optimization & B-Tree Indexing Benchmarks',
        content: `Critical Query Tested: Fetch monthly high-value customer order history with running total aggregations.`,
        codeSnippet: `-- Baseline Query (Sequential Scan: 412ms on 500,000 synthetic rows)
SELECT c.customer_id, c.customer_name, COUNT(o.order_id) as total_orders, SUM(o.total_cents) as lifetime_spend
FROM customers c
JOIN orders o ON c.customer_id = o.customer_id
WHERE o.created_at >= NOW() - INTERVAL '90 days'
GROUP BY c.customer_id, c.customer_name
ORDER BY lifetime_spend DESC
LIMIT 50;

-- Optimized Composite Covering Index
CREATE INDEX idx_orders_customer_created_total 
ON orders (customer_id, created_at DESC) 
INCLUDE (total_cents);

-- Execution Result after index:
-- Index-Only Scan on orders: Execution time reduced to 18.4ms (95.5% latency improvement).`
      }
    ]
  },
  {
    id: 'sub-2',
    assignmentId: 'assign-1',
    studentId: 'user-stu-2',
    studentName: 'Anjali Menon',
    regNo: 'CSE-2024-019',
    studentEmail: 'anjali.m@student.edu',
    submittedAt: '2026-09-16 02:15',
    status: 'Late',
    evaluationStatus: 'Pending',
    similarityScore: 8,
    fileName: 'Anjali_Menon_DBMS_Assignment.pdf',
    fileSize: '2.8 MB',
    similarityReport: {
      overallScore: 8,
      threshold: 30,
      flagged: false,
      matchedSections: [
        {
          sectionTitle: 'B-Tree Indexing Principles',
          similarityPercentage: 11,
          matchedSource: 'PostgreSQL 16 Official Documentation',
          matchedSnippet: 'B-tree indexes can handle equality and range queries on data that can be sorted into some normal order.'
        }
      ]
    },
    pages: [
      {
        pageNumber: 1,
        title: '1. Healthcare Patient Billing System Schema',
        content: `Architecture Overview:
The goal of this database is to manage inpatient hospital admissions, diagnostic procedure codes (ICD-10), doctor schedules, and health insurance claim adjudication.

Entities Defined:
- PATIENT (patient_mrn PK, full_name, dob, blood_group, insurance_policy_id)
- ADMISSION (admission_id PK, patient_mrn FK, room_no, admit_time, discharge_time)
- PHYSICIAN (physician_npi PK, physician_name, specialty_code, phone)
- PROCEDURE_RECORD (record_id PK, admission_id FK, icd10_code, performed_by_npi FK, cost)`
      },
      {
        pageNumber: 2,
        title: '2. Normalization to 3NF',
        content: `Analysis of Functional Dependencies:
Primary Key Candidate: {admission_id, procedure_id}
Notice that admission_id uniquely identifies patient_mrn, admit_time, and primary_attending_doctor.
To achieve 3NF:
- Decomposed ADMISSIONS into ADMISSIONS_CORE and ADMISSION_PROCEDURES.
- Decomposed INSURANCE_PROVIDERS to avoid transitive updates when payer address changes.`
      },
      {
        pageNumber: 3,
        title: '3. DDL Script & Constraints',
        content: `Structured DDL with Check Constraints:`,
        codeSnippet: `CREATE TABLE admissions (
    admission_id VARCHAR(20) PRIMARY KEY,
    patient_mrn VARCHAR(20) NOT NULL REFERENCES patients(patient_mrn),
    admit_time TIMESTAMP NOT NULL,
    discharge_time TIMESTAMP CHECK (discharge_time > admit_time),
    admission_type VARCHAR(15) CHECK (admission_type IN ('EMERGENCY', 'ELECTIVE', 'URGENT'))
);`
      }
    ]
  },
  {
    id: 'sub-3',
    assignmentId: 'assign-1',
    studentId: 'user-stu-3',
    studentName: 'Arjun Nair',
    regNo: 'CSE-2024-031',
    studentEmail: 'arjun.n@student.edu',
    submittedAt: '2026-09-15 21:05',
    status: 'Submitted',
    evaluationStatus: 'Flagged',
    similarityScore: 42,
    fileName: 'Arjun_Nair_DBMS_Project.pdf',
    fileSize: '4.1 MB',
    similarityReport: {
      overallScore: 42,
      threshold: 30,
      flagged: true,
      matchedSections: [
        {
          sectionTitle: 'Section 1: Introduction & Literature Review',
          similarityPercentage: 68,
          matchedSource: 'GitHub / public-coursework/dbms-assignment-2025/schema.md',
          matchedSnippet: 'In modern relational database management systems, normal forms provide an algorithmic framework for mitigating redundant data representations...'
        },
        {
          sectionTitle: 'Section 3: 3NF & BCNF Decomposition Algorithms',
          similarityPercentage: 45,
          matchedSource: 'Course Archive 2024 / Student Submission #1089',
          matchedSnippet: 'Algorithm 3.2: Compute the canonical cover Fc of F. For each functional dependency X -> Y in Fc, create relation schema Ri = X U Y...'
        }
      ]
    },
    pages: [
      {
        pageNumber: 1,
        title: '1. Introduction to Enterprise Schema Architecture',
        content: `In modern relational database management systems, normal forms provide an algorithmic framework for mitigating redundant data representations and avoiding insert, update, and delete anomalies.

This submission evaluates an enterprise inventory supply chain system with warehouse distribution hubs and freight dispatch logs.`
      },
      {
        pageNumber: 2,
        title: '2. Normal Form Decompositions and Canonical Cover',
        content: `Algorithm 3.2: Compute the canonical cover Fc of F. For each functional dependency X -> Y in Fc, create relation schema Ri = X U Y. If no relation schema contains a candidate key for R, add a schema containing a candidate key.

Proof of Lossless Join Property:
Let R1 and R2 be a decomposition of R. The decomposition is lossless join if and only if:
(R1 intersect R2) -> R1 or (R1 intersect R2) -> R2.`
      }
    ]
  },
  {
    id: 'sub-4',
    assignmentId: 'assign-1',
    studentId: 'user-stu-4',
    studentName: 'Priya Sharma',
    regNo: 'CSE-2024-055',
    studentEmail: 'priya.s@student.edu',
    submittedAt: '2026-09-14 14:10',
    status: 'Submitted',
    evaluationStatus: 'Evaluated',
    similarityScore: 18,
    fileName: 'Priya_Sharma_DBMS_Final.pdf',
    fileSize: '3.9 MB',
    similarityReport: {
      overallScore: 18,
      threshold: 30,
      flagged: false,
      matchedSections: [
        {
          sectionTitle: 'Index Clustering Principles',
          similarityPercentage: 15,
          matchedSource: 'Database Management Systems by Ramakrishnan',
          matchedSnippet: 'A clustered index is an index where the order of rows on disk matches the key order.'
        }
      ]
    },
    evaluation: {
      id: 'eval-4',
      submissionId: 'sub-4',
      rubricScores: {
        'rubric-1': 10,
        'rubric-2': 9,
        'rubric-3': 10,
        'rubric-4': 9
      },
      totalScore: 38,
      maxScore: 40,
      percentage: 95,
      grade: 'A+',
      feedback: 'Outstanding submission! The schema design is production-ready, normalization proofs are thorough, and your EXPLAIN ANALYZE benchmarks with clustered indexes are exemplary. Outstanding work.',
      aiAssisted: true,
      status: 'Final',
      evaluatedAt: '2026-09-15 14:45'
    },
    pages: [
      {
        pageNumber: 1,
        title: '1. Autonomous Vehicle Fleet Telemetry Schema',
        content: `System Overview:
Capturing high-throughput IoT sensor telemetry from autonomous vehicles in real-time. The architecture uses time-partitioned PostgreSQL tables with hypertable indexing.

Key Performance Indicators:
• Under 5ms ingestion latency for GPS coordinates and lidar lidar bounding boxes.
• Efficient spatial query execution using PostGIS extensions.`
      }
    ]
  },
  {
    id: 'sub-5',
    assignmentId: 'assign-1',
    studentId: 'user-stu-5',
    studentName: 'Vikram Aditya',
    regNo: 'CSE-2024-078',
    studentEmail: 'vikram.a@student.edu',
    submittedAt: '2026-09-16 11:30',
    status: 'Late',
    evaluationStatus: 'Pending',
    similarityScore: 25,
    fileName: 'Vikram_Aditya_DBMS.pdf',
    fileSize: '2.1 MB',
    similarityReport: {
      overallScore: 25,
      threshold: 30,
      flagged: false,
      matchedSections: [
        {
          sectionTitle: 'ACID Transaction Examples',
          similarityPercentage: 22,
          matchedSource: 'Stack Overflow / Relational Schema Discussions',
          matchedSnippet: 'BEGIN TRANSACTION; UPDATE balances SET amount = amount - 100 WHERE account_id = 1;'
        }
      ]
    },
    pages: [
      {
        pageNumber: 1,
        title: '1. Banking Core Ledger Schema',
        content: `Design of double-entry bookkeeping ledger schema for regional bank. Enforces immutability on ledger transactions.`
      }
    ]
  },
  {
    id: 'sub-6',
    assignmentId: 'assign-1',
    studentId: 'user-stu-6',
    studentName: 'Sneha Patel',
    regNo: 'CSE-2024-089',
    studentEmail: 'sneha.p@student.edu',
    submittedAt: '2026-09-15 19:40',
    status: 'Submitted',
    evaluationStatus: 'Pending',
    similarityScore: 14,
    fileName: 'Sneha_Patel_DBMS.pdf',
    fileSize: '3.1 MB',
    similarityReport: {
      overallScore: 14,
      threshold: 30,
      flagged: false,
      matchedSections: []
    },
    pages: [
      {
        pageNumber: 1,
        title: '1. University Course Registration System',
        content: `Course registration system handling prerequisite graphs and capacity limits with trigger checks.`
      }
    ]
  }
];

export const mockRecentActivity: Activity[] = [
  {
    id: 'act-1',
    user: 'Rahul Kumar',
    action: 'submitted assignment',
    target: 'Database Schema Design & Normalization',
    timeAgo: '12 minutes ago',
    type: 'submission'
  },
  {
    id: 'act-2',
    user: 'Prof. Sarah Jenkins',
    action: 'evaluated submission for',
    target: 'Priya Sharma (Grade: A+)',
    timeAgo: '45 minutes ago',
    type: 'evaluation'
  },
  {
    id: 'act-3',
    user: 'System Plagiarism Engine',
    action: 'detected similarity flag on',
    target: 'Arjun Nair (42% match)',
    timeAgo: '2 hours ago',
    type: 'similarity'
  },
  {
    id: 'act-4',
    user: 'Prof. Sarah Jenkins',
    action: 'published new assignment',
    target: 'React Portfolio & State Architecture',
    timeAgo: '1 day ago',
    type: 'assignment'
  },
  {
    id: 'act-5',
    user: 'Anjali Menon',
    action: 'submitted late assignment',
    target: 'Database Schema Design & Normalization',
    timeAgo: '1 day ago',
    type: 'submission'
  }
];

export const mockEnrolledStudents: EnrolledStudent[] = [
  {
    id: 'stu-1',
    name: 'Rahul Kumar',
    regNo: 'CSE-2024-042',
    email: 'rahul.k@student.edu',
    courseId: 'course-1',
    enrollmentStatus: 'Active',
    averageGrade: '85% (A)',
    submittedAssignments: 4,
    totalAssignments: 4
  },
  {
    id: 'stu-2',
    name: 'Anjali Menon',
    regNo: 'CSE-2024-019',
    email: 'anjali.m@student.edu',
    courseId: 'course-1',
    enrollmentStatus: 'Active',
    averageGrade: '78% (B+)',
    submittedAssignments: 4,
    totalAssignments: 4
  },
  {
    id: 'stu-3',
    name: 'Arjun Nair',
    regNo: 'CSE-2024-031',
    email: 'arjun.n@student.edu',
    courseId: 'course-1',
    enrollmentStatus: 'Active',
    averageGrade: '68% (B)',
    submittedAssignments: 3,
    totalAssignments: 4
  },
  {
    id: 'stu-4',
    name: 'Priya Sharma',
    regNo: 'CSE-2024-055',
    email: 'priya.s@student.edu',
    courseId: 'course-1',
    enrollmentStatus: 'Active',
    averageGrade: '94% (A+)',
    submittedAssignments: 4,
    totalAssignments: 4
  },
  {
    id: 'stu-5',
    name: 'Vikram Aditya',
    regNo: 'CSE-2024-078',
    email: 'vikram.a@student.edu',
    courseId: 'course-1',
    enrollmentStatus: 'Active',
    averageGrade: '72% (B+)',
    submittedAssignments: 3,
    totalAssignments: 4
  },
  {
    id: 'stu-6',
    name: 'Sneha Patel',
    regNo: 'CSE-2024-089',
    email: 'sneha.p@student.edu',
    courseId: 'course-1',
    enrollmentStatus: 'Active',
    averageGrade: '88% (A)',
    submittedAssignments: 4,
    totalAssignments: 4
  },
  {
    id: 'stu-7',
    name: 'Rohan Gupta',
    regNo: 'CSE-2024-102',
    email: 'rohan.g@student.edu',
    courseId: 'course-1',
    enrollmentStatus: 'Active',
    averageGrade: '54% (C)',
    submittedAssignments: 2,
    totalAssignments: 4
  }
];

export const mockFeedbackTemplates = [
  {
    title: 'Good Work',
    text: 'Good understanding of core principles. The implementation is clean, logically organized, and satisfies the assignment requirements effectively.'
  },
  {
    title: 'Needs Improvement',
    text: 'The submission addresses the primary goals but requires substantial refinement in structure and completeness. Please review the rubric criteria carefully.'
  },
  {
    title: 'Excellent Documentation',
    text: 'Exceptional documentation and clarity of thought. The technical justifications, schemas, and diagrams are thorough, professional, and well-annotated.'
  },
  {
    title: 'Improve Code Quality',
    text: 'The theoretical approach is sound, but the code implementation would benefit from adhering to formatting conventions, modularity, and error handling.'
  },
  {
    title: 'Late Submission',
    text: 'Assignment was submitted past the scheduled deadline. Note that policy deductions may apply as outlined in the course syllabus.'
  }
];

export const mockNotifications: AppNotification[] = [
  {
    id: 'notif-1',
    type: 'submission',
    title: 'New Student Submission',
    message: 'Rahul Kumar submitted Database Schema Design & Normalization Project.',
    timestamp: '10m ago',
    read: false,
    link: '/teacher/evaluation/assign-1',
    actionText: 'Evaluate'
  },
  {
    id: 'notif-2',
    type: 'evaluation',
    title: 'Evaluation Required',
    message: '18 DBMS submissions are waiting for evaluation in Section A.',
    timestamp: '1h ago',
    read: false,
    link: '/teacher/inbox',
    actionText: 'Open Inbox'
  },
  {
    id: 'notif-3',
    type: 'integrity',
    title: 'Academic Integrity Alert',
    message: 'Arjun Nair (CSE-2024-031) flagged with 42% code overlap in DBMS Assignment 1.',
    timestamp: '2h ago',
    read: false,
    link: '/teacher/evaluation/assign-1',
    actionText: 'Review Match'
  },
  {
    id: 'notif-4',
    type: 'deadline',
    title: 'Upcoming Deadline',
    message: 'React Portfolio & State Architecture closes tomorrow at 11:59 PM.',
    timestamp: '4h ago',
    read: true,
    link: '/teacher/assignments',
    actionText: 'View'
  }
];

export const mockUnsubmittedStudents = [
  { studentName: 'Rahul Kumar', regNo: '23BCS001', deadline: 'Oct 5, 11:59 PM', status: 'Not Submitted' },
  { studentName: 'Meera Nambiar', regNo: '23BCS014', deadline: 'Oct 5, 11:59 PM', status: 'Not Submitted' },
  { studentName: 'Aditya Verma', regNo: '23BCS027', deadline: 'Oct 5, 11:59 PM', status: 'Not Submitted' },
  { studentName: 'Kavya Pillai', regNo: '23BCS039', deadline: 'Oct 5, 11:59 PM', status: 'Not Submitted' },
  { studentName: 'Gaurav Sen', regNo: '23BCS052', deadline: 'Oct 5, 11:59 PM', status: 'Not Submitted' },
  { studentName: 'Divya Ramesh', regNo: '23BCS068', deadline: 'Oct 5, 11:59 PM', status: 'Not Submitted' },
  { studentName: 'Siddharth Roy', regNo: '23BCS081', deadline: 'Oct 5, 11:59 PM', status: 'Not Submitted' }
];

export const mockSimilarityComparison = {
  studentName: 'Arjun Nair',
  regNo: 'CSE-2024-031',
  similarityScore: 42,
  flagThreshold: 30,
  assignmentTitle: 'Database Schema Design & Normalization Project',
  matchedSource: 'Institutional Submissions Archive (Fall 2025 - CS301)',
  matchedSourceType: 'Prior Student Submission Archive',
  secondarySource: 'GitHub / algorithms-cpp / btree_index.cpp',
  secondarySimilarity: 14,
  matchedSegments: [
    {
      section: '3NF Canonical Cover Algorithm',
      studentText: 'Algorithm 3.2: Compute the canonical cover Fc of F. For each functional dependency X -> Y in Fc, create relation schema Ri = X U Y. If no relation schema contains a candidate key for R, add a schema containing a candidate key.',
      sourceText: 'Algorithm 3.2: Compute the canonical cover Fc of F. For each functional dependency X -> Y in Fc, create relation schema Ri = X U Y. If no relation schema contains a candidate key for R, add a schema containing a candidate key.',
      similarity: 96
    },
    {
      section: 'Lossless Join Proof Derivation',
      studentText: 'Let R1 and R2 be a decomposition of R. The decomposition is lossless join if and only if: (R1 intersect R2) -> R1 or (R1 intersect R2) -> R2.',
      sourceText: 'Theorem: Let R1 and R2 decompose relation R. The decomposition is lossless join if and only if (R1 ∩ R2) -> R1 or (R1 ∩ R2) -> R2.',
      similarity: 88
    },
    {
      section: 'Order State Transition Check',
      studentText: 'CREATE TABLE orders (\n    order_id UUID PRIMARY KEY,\n    order_status VARCHAR(20) CHECK (order_status IN (\'PENDING\', \'PROCESSING\', \'SHIPPED\', \'DELIVERED\', \'CANCELLED\'))\n);',
      sourceText: 'CREATE TABLE orders (\n    order_id UUID PRIMARY KEY,\n    order_status VARCHAR(20) CHECK (order_status IN (\'PENDING\', \'PROCESSING\', \'SHIPPED\', \'DELIVERED\', \'CANCELLED\'))\n);',
      similarity: 100
    }
  ]
};
