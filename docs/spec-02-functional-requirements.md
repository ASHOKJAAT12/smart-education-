# SmartLearn AI — Technical Specification
## Section 2: Functional Requirements

---

## 2.1 Student Features

### Authentication & Profile
- FR-S-01: Register with name, email, password (hashed).
- FR-S-02: Login with email + password; receive JWT access token.
- FR-S-03: Forgot password — request reset link via email.
- FR-S-04: Reset password using time-limited token.
- FR-S-05: View/edit profile (name, avatar, grade/class, bio).
- FR-S-06: Select subjects/courses to study.
- FR-S-07: Set learning goals (target mastery, exam date).
- FR-S-08: Set available daily study time (30 min – 4 hrs).

### Diagnostic Assessment
- FR-S-09: On first enrollment in a course, take a diagnostic assessment.
- FR-S-10: Assessment covers all topics in the course at mixed difficulty.
- FR-S-11: Results produce initial mastery scores per topic.

### Learning
- FR-S-12: View personalized study plan (daily tasks, topic order).
- FR-S-13: Browse learning resources per topic (videos, articles, PDFs).
- FR-S-14: Mark resources as complete.
- FR-S-15: Open AI tutor conversation for any topic.
- FR-S-16: Request AI-generated explanation for any topic/concept.
- FR-S-17: Request AI-generated summary for a topic.

### Quizzes & Practice
- FR-S-18: Take topic quizzes (teacher-created or AI-generated).
- FR-S-19: Receive immediate answer feedback after each question.
- FR-S-20: View quiz results (score, per-question breakdown).
- FR-S-21: View full quiz history with scores and dates.
- FR-S-22: Request AI-generated quiz for a specific topic.

### Progress & Recommendations
- FR-S-23: View topic-wise mastery dashboard (charts).
- FR-S-24: View weak topics list.
- FR-S-25: View personalized next-topic recommendation.
- FR-S-26: View overall progress (% topics mastered, total quizzes, time studied).
- FR-S-27: View AI-generated updated study plan on demand.
- FR-S-28: Receive notifications for due study tasks.

---

## 2.2 Teacher Features

### Course & Content Management
- FR-T-01: Create / edit / delete courses.
- FR-T-02: Create / edit / delete subjects within a course.
- FR-T-03: Create / edit / delete topics within a subject.
- FR-T-04: Upload learning resources (PDF, video URL, article URL) per topic.
- FR-T-05: Delete/unpublish resources.

### Question & Quiz Management
- FR-T-06: Create MCQ questions (question text, 4 options, correct answer, difficulty, topic, explanation).
- FR-T-07: Edit / delete questions.
- FR-T-08: Generate questions for a topic using AI (specify count, difficulty).
- FR-T-09: Review/edit AI-generated questions before saving.
- FR-T-10: Create a quiz (select topic + questions, set time limit, passing score).
- FR-T-11: Edit / delete quizzes.

### Analytics
- FR-T-12: View list of students enrolled in their courses.
- FR-T-13: View per-student mastery scores per topic.
- FR-T-14: View topic-level average performance (class-wide).
- FR-T-15: View quiz attempt history and score distribution.

---

## 2.3 Admin Features

### User Management
- FR-A-01: View all users (students, teachers, admins).
- FR-A-02: Create / deactivate / reactivate user accounts.
- FR-A-03: Assign or change user roles.
- FR-A-04: Reset user password (admin-forced).

### Content Management
- FR-A-05: View / delete any course, subject, topic, resource, question, or quiz.
- FR-A-06: Manage platform-wide announcements.
- FR-A-07: Manage system notification templates.

### Platform Analytics
- FR-A-08: View platform-wide statistics (total users, active users, quizzes taken, avg. mastery).
- FR-A-09: View per-course enrollment and performance metrics.
- FR-A-10: View top-performing and struggling students.

### System Settings
- FR-A-11: Manage mastery thresholds (configurable per-platform).
- FR-A-12: Manage AI quota / rate limits.
- FR-A-13: View system health and API usage logs.
