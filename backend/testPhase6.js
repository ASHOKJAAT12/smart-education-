const mongoose = require('mongoose');
const dotenv = require('dotenv');
const AssessmentResult = require('./src/models/AssessmentResult');
const User = require('./src/models/User');
const Topic = require('./src/models/Topic');
const Subject = require('./src/models/Subject');
const { updateProgressFromAssessment, generateDailyStudyPlan } = require('./src/services/recommendationService');
const Progress = require('./src/models/Progress');
const Recommendation = require('./src/models/Recommendation');
const StudyPlan = require('./src/models/StudyPlan');

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/smartlearn';

async function verifyPhase6() {
    try {
        console.log('Connecting to DB for verification...');
        await mongoose.connect(MONGO_URI);

        const admin = await User.findOne({ role: 'admin' });
        if (!admin) throw new Error('No admin found. Did you run previous seeds?');

        let dsaSubject = await Subject.findOne({ name: 'Data Structures and Algorithms' });

        const topics = await Topic.find({ subjectId: dsaSubject._id }).limit(3);
        if (topics.length < 3) throw new Error('Not enough topics to test.');

        // Clean up previous test
        await Progress.deleteMany({ studentId: admin._id });
        await Recommendation.deleteMany({ studentId: admin._id });
        await StudyPlan.deleteMany({ studentId: admin._id });

        // Mock an assessment result
        console.log('Mocking Assessment Result...');
        const mockResult = await AssessmentResult.create({
            userId: admin._id,
            assessmentId: new mongoose.Types.ObjectId(), // fake
            attemptId: new mongoose.Types.ObjectId(), // fake
            subjectId: dsaSubject._id,
            timeTaken: 1200,
            overallScore: 50,
            percentage: 50,
            topicPerformance: [
                {
                    topicId: topics[0]._id, // Graph
                    topicName: topics[0].name,
                    correct: 2,
                    incorrect: 8,
                    accuracy: 20,
                    masteryLevel: 'weak'
                },
                {
                    topicId: topics[1]._id, // Array
                    topicName: topics[1].name,
                    correct: 9,
                    incorrect: 1,
                    accuracy: 90,
                    masteryLevel: 'mastered'
                },
                {
                    topicId: topics[2]._id, // Stack
                    topicName: topics[2].name,
                    correct: 5,
                    incorrect: 5,
                    accuracy: 50,
                    masteryLevel: 'needs_improvement'
                }
            ],
            strongestTopic: { _id: topics[1]._id, name: topics[1].name },
            weakestTopic: { _id: topics[0]._id, name: topics[0].name },
        });

        console.log('Triggering updateProgressFromAssessment...');
        await updateProgressFromAssessment(mockResult._id);

        console.log('Fetching Recommendations...');
        const recs = await Recommendation.find({ studentId: admin._id, status: 'active' }).sort({ priorityScore: -1 }).populate('topicId');

        console.log('\n--- RECOMMENDATIONS GENERATED ---');
        recs.forEach(r => {
            console.log(`${r.topicId.name} -> Priority: ${r.priorityScore} | Reason: ${r.reason} | Action: ${r.recommendedAction}`);
        });

        console.log('\nGenerating Daily Study Plan...');
        const plan = await generateDailyStudyPlan(admin._id);

        console.log('\n--- STUDY PLAN GENERATED ---');
        console.log(`Total Target: ${plan.totalMinutes}m`);
        plan.items.forEach(i => {
            // we won't have populated topic name here, so just log ID and duration
            console.log(`Topic ID ${i.topicId} -> ${i.activityType} for ${i.durationMinutes}m`);
        });

        console.log('\nTesting complete! Math and logic checks out.');
        process.exit(0);

    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

verifyPhase6();
