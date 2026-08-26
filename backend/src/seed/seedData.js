/**
 * BCA Seed Script — Phase 3
 *
 * Creates a BCA course with subjects, topics, and sample questions.
 * Run from the backend/ directory:
 *   node src/seed/seedData.js
 *   node src/seed/seedData.js --clean   (drops all education data first)
 */

require('dotenv').config();
const mongoose = require('mongoose');

const Course = require('../models/Course');
const Subject = require('../models/Subject');
const Topic = require('../models/Topic');
const Question = require('../models/Question');
const User = require('../models/User');

const CLEAN = process.argv.includes('--clean');
const MONGO_URI = process.env.MONGODB_URI;

if (!MONGO_URI) {
    console.error('❌ MONGODB_URI not set in .env');
    process.exit(1);
}

// ─── Seed structure ───────────────────────────────────────────────────────────

const BCA_SUBJECTS = [
    {
        name: 'Data Structures & Algorithms',
        description: 'Fundamental data structures and algorithm design techniques',
        topics: [
            { name: 'Arrays', difficulty: 'easy', estimatedMinutes: 40 },
            { name: 'Linked Lists', difficulty: 'easy', estimatedMinutes: 45 },
            { name: 'Stacks', difficulty: 'easy', estimatedMinutes: 30 },
            { name: 'Queues', difficulty: 'easy', estimatedMinutes: 30 },
            { name: 'Trees', difficulty: 'medium', estimatedMinutes: 60 },
            { name: 'Graphs', difficulty: 'hard', estimatedMinutes: 90 },
        ],
    },
    {
        name: 'Database Management Systems',
        description: 'Relational databases, SQL, and transaction management',
        topics: [
            { name: 'Introduction to DBMS', difficulty: 'easy', estimatedMinutes: 30 },
            { name: 'SQL Fundamentals', difficulty: 'easy', estimatedMinutes: 60 },
            { name: 'Normalization', difficulty: 'medium', estimatedMinutes: 50 },
            { name: 'Transactions & ACID', difficulty: 'medium', estimatedMinutes: 45 },
        ],
    },
    {
        name: 'Operating Systems',
        description: 'Process management, memory, file systems, and concurrency',
        topics: [
            { name: 'Introduction to OS', difficulty: 'easy', estimatedMinutes: 30 },
            { name: 'Process Management', difficulty: 'medium', estimatedMinutes: 60 },
            { name: 'Memory Management', difficulty: 'hard', estimatedMinutes: 75 },
            { name: 'File Systems', difficulty: 'medium', estimatedMinutes: 45 },
        ],
    },
    {
        name: 'Computer Networks',
        description: 'Network models, TCP/IP, routing, and security basics',
        topics: [
            { name: 'OSI Model', difficulty: 'easy', estimatedMinutes: 40 },
            { name: 'TCP/IP Protocol Suite', difficulty: 'medium', estimatedMinutes: 60 },
            { name: 'Routing Algorithms', difficulty: 'hard', estimatedMinutes: 75 },
            { name: 'Network Security', difficulty: 'medium', estimatedMinutes: 50 },
        ],
    },
];

const getDSAQuestions = (subjectId, topicMap) => [
    {
        question: 'What is the time complexity of accessing an element in an array by index?',
        options: ['O(n)', 'O(log n)', 'O(1)', 'O(n²)'],
        correctAnswer: 2,
        explanation: 'Arrays provide O(1) random access due to contiguous memory layout.',
        difficulty: 'easy',
        subjectId,
        topicId: topicMap['Arrays'],
    },
    {
        question: 'Which data structure follows the LIFO principle?',
        options: ['Queue', 'Stack', 'Linked List', 'Tree'],
        correctAnswer: 1,
        explanation: 'A Stack follows LIFO — last element pushed is first popped.',
        difficulty: 'easy',
        subjectId,
        topicId: topicMap['Stacks'],
    },
    {
        question: 'Time complexity of inserting at the head of a singly linked list?',
        options: ['O(n)', 'O(log n)', 'O(1)', 'O(n log n)'],
        correctAnswer: 2,
        explanation: 'Inserting at the head is O(1) — just update the head pointer.',
        difficulty: 'easy',
        subjectId,
        topicId: topicMap['Linked Lists'],
    },
    {
        question: 'Which BST traversal visits nodes in ascending order?',
        options: ['Preorder', 'Postorder', 'Inorder', 'Level order'],
        correctAnswer: 2,
        explanation: 'Inorder (Left→Root→Right) on a BST produces sorted ascending output.',
        difficulty: 'medium',
        subjectId,
        topicId: topicMap['Trees'],
    },
    {
        question: "Which algorithm finds shortest paths in a weighted graph?",
        options: ['BFS', 'DFS', "Dijkstra's Algorithm", "Kruskal's Algorithm"],
        correctAnswer: 2,
        explanation: "Dijkstra's algorithm finds single-source shortest paths in weighted graphs.",
        difficulty: 'hard',
        subjectId,
        topicId: topicMap['Graphs'],
    },
];

const getDBMSQuestions = (subjectId, topicMap) => [
    {
        question: 'Which normal form eliminates partial dependencies?',
        options: ['1NF', '2NF', '3NF', 'BCNF'],
        correctAnswer: 1,
        explanation: '2NF requires every non-key attribute to depend on the whole primary key.',
        difficulty: 'medium',
        subjectId,
        topicId: topicMap['Normalization'],
    },
    {
        question: 'Which SQL clause filters grouped results?',
        options: ['WHERE', 'HAVING', 'ORDER BY', 'GROUP BY'],
        correctAnswer: 1,
        explanation: 'HAVING filters aggregated results; WHERE filters individual rows.',
        difficulty: 'easy',
        subjectId,
        topicId: topicMap['SQL Fundamentals'],
    },
    {
        question: 'Which ACID property ensures a transaction completes fully or not at all?',
        options: ['Consistency', 'Isolation', 'Durability', 'Atomicity'],
        correctAnswer: 3,
        explanation: 'Atomicity guarantees all-or-nothing execution of a transaction.',
        difficulty: 'medium',
        subjectId,
        topicId: topicMap['Transactions & ACID'],
    },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

async function seed() {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    if (CLEAN) {
        console.log('🗑  Cleaning education data...');
        await Promise.all([
            Course.deleteMany({}),
            Subject.deleteMany({}),
            Topic.deleteMany({}),
            Question.deleteMany({}),
        ]);
    }

    // Find or create seed admin
    let admin = await User.findOne({ role: 'admin' });
    if (!admin) {
        admin = await User.create({
            firstName: 'Seed',
            lastName: 'Admin',
            email: 'admin@smartlearn.dev',
            password: 'Admin@1234!',
            role: 'admin',
        });
        console.log('✅ Seed admin: admin@smartlearn.dev / Admin@1234!');
    }

    const existing = await Course.findOne({ title: 'Bachelor of Computer Applications (BCA)' });
    if (existing && !CLEAN) {
        console.log('ℹ  BCA course already seeded. Use --clean to re-seed.');
        await mongoose.disconnect();
        return;
    }

    const course = await Course.create({
        title: 'Bachelor of Computer Applications (BCA)',
        description: 'A comprehensive undergraduate programme covering CS fundamentals, programming, databases, and networks.',
        category: 'Computer Science',
        level: 'beginner',
        isPublished: true,
        createdBy: admin._id,
    });
    console.log(`✅ Course: ${course.title}`);

    for (let i = 0; i < BCA_SUBJECTS.length; i++) {
        const subData = BCA_SUBJECTS[i];
        const subject = await Subject.create({
            name: subData.name,
            description: subData.description,
            courseId: course._id,
            order: i,
            isPublished: true,
            createdBy: admin._id,
        });
        console.log(`  ✅ Subject: ${subject.name}`);

        const topicMap = {};
        for (let j = 0; j < subData.topics.length; j++) {
            const t = subData.topics[j];
            const topic = await Topic.create({
                name: t.name,
                description: `${t.name} — part of ${subData.name}`,
                subjectId: subject._id,
                order: j,
                difficulty: t.difficulty,
                estimatedMinutes: t.estimatedMinutes,
                isPublished: true,
                createdBy: admin._id,
            });
            topicMap[t.name] = topic._id;
            console.log(`    ✅ Topic: ${topic.name} (${topic.difficulty})`);
        }

        let questions = [];
        if (subData.name === 'Data Structures & Algorithms') questions = getDSAQuestions(subject._id, topicMap);
        if (subData.name === 'Database Management Systems') questions = getDBMSQuestions(subject._id, topicMap);

        if (questions.length) {
            const created = await Question.insertMany(questions.map((q) => ({ ...q, createdBy: admin._id, isPublished: true })));
            console.log(`    ✅ ${created.length} questions seeded`);
        }
    }

    console.log(`\n🎉 Seed complete! Course ID: ${course._id}`);
    await mongoose.disconnect();
}

seed().catch((err) => {
    console.error('❌ Seed failed:', err);
    mongoose.disconnect();
    process.exit(1);
});
