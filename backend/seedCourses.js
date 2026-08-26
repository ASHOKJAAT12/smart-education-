const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Course = require('./src/models/Course');
const Subject = require('./src/models/Subject');
const User = require('./src/models/User');

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/smartlearn';

async function seedData() {
    try {
        await mongoose.connect(MONGO_URI);
        const admin = await User.findOne({ role: 'admin' });

        // Update the DSA Subject created by the earlier script to map to a real Course
        const dsaSubject = await Subject.findOne({ name: 'Data Structures and Algorithms' });

        if (dsaSubject) {
            let course = await Course.findById(dsaSubject.courseId);
            if (!course) {
                console.log('Creating actual BSc Computer Science Course to map to the seeded ID...');
                course = await Course.create({
                    _id: dsaSubject.courseId, // Use the generated ID from the Subject
                    title: 'BSc Computer Science',
                    description: 'A complete undergraduate level tracking course.',
                    category: 'University Degree',
                    level: 'beginner',
                    isPublished: true,
                    createdBy: admin._id
                });
            } else {
                course.isPublished = true;
                await course.save();
            }

            // Generate some extra dummy ones so UI is populated
            await Course.create([
                {
                    title: 'BSc Cyber Security',
                    description: 'Learn modern defense',
                    category: 'University Degree',
                    level: 'intermediate',
                    isPublished: true,
                    createdBy: admin._id
                },
                {
                    title: 'BSc Data Science',
                    description: 'Machine learning path',
                    category: 'University Degree',
                    level: 'beginner',
                    isPublished: true,
                    createdBy: admin._id
                }
            ]);
            console.log('Successfully seeded missing courses!');
        } else {
            console.log('No subject found to map against.');
        }

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

seedData();
