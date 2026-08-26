const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Assessment = require('./src/models/Assessment');
const Subject = require('./src/models/Subject');
const Topic = require('./src/models/Topic');
const User = require('./src/models/User');

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/smartlearn';

async function seedDiagnosticData() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('Connected.');

        // Find admin user to act as creator
        let admin = await User.findOne({ role: 'admin' });
        if (!admin) {
            console.log('No admin found, creating default admin...');
            admin = await User.create({
                name: 'System Admin',
                email: 'admin@smartlearn.ai',
                password: 'password123',
                role: 'admin',
                isEmailVerified: true
            });
        }

        // Find or create DSA subject
        let dsaSubject = await Subject.findOne({ name: 'Data Structures and Algorithms' });
        if (!dsaSubject) {
            console.log('Creating DSA Subject...');
            const course = new mongoose.Types.ObjectId(); // Assuming dummy course is fine for seed context
            dsaSubject = await Subject.create({
                name: 'Data Structures and Algorithms',
                description: 'Core computer science concepts.',
                courseId: course,
                createdBy: admin._id,
                isPublished: true
            });
        }

        // Find topics array
        const topicNames = ['Array', 'Linked List', 'Stack', 'Queue', 'Tree', 'Graph', 'Sorting', 'Searching'];
        const topics = [];

        for (const name of topicNames) {
            let topic = await Topic.findOne({ name, subjectId: dsaSubject._id });
            if (!topic) {
                topic = await Topic.create({
                    name,
                    description: `${name} fundamentals and problems.`,
                    subjectId: dsaSubject._id,
                    createdBy: admin._id,
                    isPublished: true,
                    difficulty: 'medium'
                });
            }
            topics.push(topic);
        }

        // Create the Assessment
        const existingAssessment = await Assessment.findOne({ title: 'Full DSA Diagnostic Assessment' });
        if (!existingAssessment) {
            console.log('Creating DSA Diagnostic Assessment...');
            await Assessment.create({
                title: 'Full DSA Diagnostic Assessment',
                description: 'A comprehensive diagnostic tool to evaluate your baseline knowledge across 8 major Data Structure and algorithm topics.',
                subjectId: dsaSubject._id,
                topicIds: topics.map(t => t._id),
                questionIds: [], // We let it pull dynamically from whatever questions exist for these topics
                durationMinutes: 30,
                totalQuestions: 20,
                isActive: true,
                createdBy: admin._id
            });
        } else {
            console.log('Assessment already exists.');
        }

        console.log('Diagnostic Assessment Seed completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Seeding error:', error);
        process.exit(1);
    }
}

seedDiagnosticData();
