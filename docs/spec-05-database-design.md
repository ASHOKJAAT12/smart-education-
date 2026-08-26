# SmartLearn AI — Technical Specification
## Section 5: Database Design

All collections use MongoDB with Mongoose ODM. `_id` is ObjectId by default on every document.

---

## 5.1 User Collection

```js
{
  _id: ObjectId,
  name: String,           // required
  email: String,          // required, unique, indexed
  password: String,       // required, bcrypt hash
  role: String,           // enum: ['student','teacher','admin'], default:'student'
  avatar: String,         // Cloudinary URL, optional
  isActive: Boolean,      // default: true
  isEmailVerified: Boolean, // default: false
  emailVerificationToken: String,
  emailVerifiedAt: Date,
  passwordResetToken: String,   // hashed
  passwordResetExpires: Date,
  lastLoginAt: Date,
  createdAt: Date,
  updatedAt: Date
}
// Indexes: email (unique), role, isActive
```

---

## 5.2 Course Collection

```js
{
  _id: ObjectId,
  title: String,           // required
  description: String,
  thumbnail: String,       // Cloudinary URL
  createdBy: ObjectId,     // ref: User (teacher/admin)
  isPublished: Boolean,    // default: false
  tags: [String],
  createdAt: Date,
  updatedAt: Date
}
// Indexes: createdBy, isPublished
```

---

## 5.3 Subject Collection

```js
{
  _id: ObjectId,
  course: ObjectId,       // ref: Course, required
  title: String,          // required
  description: String,
  order: Number,          // display order
  createdBy: ObjectId,    // ref: User
  createdAt: Date,
  updatedAt: Date
}
// Indexes: course
```

---

## 5.4 Topic Collection

```js
{
  _id: ObjectId,
  subject: ObjectId,      // ref: Subject, required
  course: ObjectId,       // denormalized for fast queries
  title: String,          // required
  description: String,
  order: Number,
  difficulty: String,     // enum: ['beginner','intermediate','advanced']
  estimatedMinutes: Number,
  createdBy: ObjectId,    // ref: User
  createdAt: Date,
  updatedAt: Date
}
// Indexes: subject, course
```

---

## 5.5 LearningResource Collection

```js
{
  _id: ObjectId,
  topic: ObjectId,        // ref: Topic, required
  title: String,          // required
  type: String,           // enum: ['video','article','pdf','note']
  url: String,            // external URL or Cloudinary URL
  description: String,
  isPublished: Boolean,
  uploadedBy: ObjectId,   // ref: User
  createdAt: Date,
  updatedAt: Date
}
// Indexes: topic
```

---

## 5.6 Question Collection

```js
{
  _id: ObjectId,
  topic: ObjectId,        // ref: Topic, required
  course: ObjectId,       // denormalized
  text: String,           // required, the question body
  options: [{
    label: String,        // 'A','B','C','D'
    text: String          // required
  }],
  correctOption: String,  // 'A'|'B'|'C'|'D', required
  explanation: String,    // shown after answer
  difficulty: String,     // enum: ['easy','medium','hard']
  source: String,         // enum: ['teacher','ai']
  createdBy: ObjectId,    // ref: User
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
// Indexes: topic, difficulty, source
```

---

## 5.7 Quiz Collection

```js
{
  _id: ObjectId,
  title: String,          // required
  topic: ObjectId,        // ref: Topic, required
  course: ObjectId,       // denormalized
  questions: [ObjectId],  // ref: Question
  timeLimitMinutes: Number,
  passingScore: Number,   // percentage, default: 60
  createdBy: ObjectId,    // ref: User
  source: String,         // 'teacher' | 'ai'
  isPublished: Boolean,
  createdAt: Date,
  updatedAt: Date
}
// Indexes: topic, course, createdBy
```

---

## 5.8 QuizAttempt Collection

```js
{
  _id: ObjectId,
  quiz: ObjectId,         // ref: Quiz, required
  student: ObjectId,      // ref: User, required
  topic: ObjectId,        // ref: Topic, denormalized
  answers: [{
    question: ObjectId,
    selectedOption: String,
    isCorrect: Boolean,
    timeTakenSeconds: Number
  }],
  score: Number,          // percentage
  passed: Boolean,
  timeTakenSeconds: Number,
  completedAt: Date,
  createdAt: Date
}
// Indexes: student+quiz (compound), student+topic, completedAt
```

---

## 5.9 Assessment Collection

```js
{
  _id: ObjectId,
  course: ObjectId,       // ref: Course
  student: ObjectId,      // ref: User
  type: String,           // 'diagnostic' | 'progress'
  questions: [ObjectId],  // ref: Question
  status: String,         // 'pending' | 'in_progress' | 'completed'
  createdAt: Date
}
```

---

## 5.10 AssessmentResult Collection

```js
{
  _id: ObjectId,
  assessment: ObjectId,   // ref: Assessment
  student: ObjectId,      // ref: User
  course: ObjectId,
  topicScores: [{
    topic: ObjectId,
    score: Number,        // percentage
    correct: Number,
    total: Number
  }],
  overallScore: Number,
  completedAt: Date,
  createdAt: Date
}
// Indexes: student+course, student+assessment
```

---

## 5.11 Progress Collection (one doc per student per topic)

```js
{
  _id: ObjectId,
  student: ObjectId,      // ref: User, required
  topic: ObjectId,        // ref: Topic, required
  course: ObjectId,
  masteryScore: Number,   // 0–100, computed
  masteryLevel: String,   // 'mastered'|'good'|'needs_improvement'|'weak'
  quizzesAttempted: Number,
  averageScore: Number,
  lastAttemptAt: Date,
  resourcesCompleted: [ObjectId], // ref: LearningResource
  updatedAt: Date
}
// Indexes: student+topic (unique compound), student+course, masteryLevel
```

---

## 5.12 StudyPlan Collection

```js
{
  _id: ObjectId,
  student: ObjectId,      // ref: User, required
  course: ObjectId,
  generatedBy: String,    // 'ai' | 'system'
  dailyMinutes: Number,
  targetDate: Date,
  tasks: [{
    topic: ObjectId,
    day: Number,
    durationMinutes: Number,
    type: String,         // 'learn' | 'quiz' | 'revise'
    isCompleted: Boolean,
    completedAt: Date
  }],
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
// Indexes: student+course+isActive
```

---

## 5.13 Recommendation Collection

```js
{
  _id: ObjectId,
  student: ObjectId,       // ref: User, required
  course: ObjectId,
  recommendedTopic: ObjectId,  // ref: Topic
  reason: String,          // 'weak'|'next'|'revision'
  priority: Number,        // 1 = highest
  isActioned: Boolean,
  createdAt: Date
}
// Indexes: student+course+isActioned
```

---

## 5.14 AIConversation Collection

```js
{
  _id: ObjectId,
  student: ObjectId,       // ref: User
  topic: ObjectId,         // ref: Topic (context)
  messages: [{
    role: String,          // 'user' | 'assistant'
    content: String,
    createdAt: Date
  }],
  createdAt: Date,
  updatedAt: Date
}
// Indexes: student, student+topic
```

---

## 5.15 Notification Collection

```js
{
  _id: ObjectId,
  user: ObjectId,          // ref: User
  type: String,            // 'reminder'|'achievement'|'announcement'
  title: String,
  message: String,
  isRead: Boolean,         // default: false
  createdAt: Date
}
// Indexes: user+isRead, createdAt
```

---

## 5.16 Enrollment Collection

```js
{
  _id: ObjectId,
  student: ObjectId,       // ref: User
  course: ObjectId,        // ref: Course
  enrolledAt: Date,
  learningGoal: String,
  dailyStudyMinutes: Number,
  targetDate: Date,
  isActive: Boolean
}
// Indexes: student+course (unique compound)
```
