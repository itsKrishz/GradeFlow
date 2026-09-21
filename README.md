# GradeFlow – Intelligent Assignment Evaluation Platform

GradeFlow is an intelligent assignment evaluation platform built with **React**, **TypeScript**, **Tailwind CSS**, and **Recharts**.

## Design System Rules
- **Zero Gradients**: No CSS linear gradients or gradient classes anywhere.
- **Zero Glassmorphism**: Clean solid surfaces with restrained borders.
- **Academic Palette**: Restrained slate neutrals, indigo/blue primary, emerald green, amber orange, rose red, and violet purple.
- **Consistent Light & Dark Mode**: Persistent theme toggle in top navigation.

## Key Features
1. **Rubric Evaluation Workspace (3-Column Desktop)**:
   - **Left**: Searchable student submission roster with status and similarity indicators.
   - **Center**: Academic document previewer with zoom controls, page navigation, and annotation tools.
   - **Right**: Live rubric scoring (number inputs & sliders), instant total/percentage/grade calculation, similarity inspection with threshold warning, quick feedback templates, optional AI-assisted feedback generator, and sequential student navigation.
2. **Teacher Experience**:
   - Dashboard with 4 workload statistics cards, recent assignments table, and recent activity log.
   - Course management with enrollment code generation (e.g. `GF-DBMS-26`) and copy-to-clipboard.
   - Course details with Overview, Enrolled Students, and Assignments tabs.
   - Assignment creation with dynamic Rubric builder and live total marks calculator.
   - Analytics with Recharts Grade Distribution bar chart and Performance Trend line chart.
   - Reports with Grade Sheet preview and mock Excel/PDF exports.
   - Platform settings for similarity review threshold and grade boundaries.
3. **Student Experience**:
   - Dashboard with upcoming assignments and recent grades.
   - Drag-and-drop file submit with timestamp confirmations.
   - Evaluated rubric breakdown and instructor feedback view.
   - Multi-assignment performance trend chart.
4. **Admin Experience**:
   - Platform statistics (students, teachers, courses, assignments).
   - User management with activation/deactivation toggles and Add User modal.
   - System overview with infrastructure diagnostics.
