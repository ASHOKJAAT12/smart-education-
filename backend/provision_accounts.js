const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./src/models/User');

const provision = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB...');

        // 1. Upgrade the user's primary email to Admin status
        const adminResult = await User.findOneAndUpdate(
            { email: 'ajat39963@gmail.com' },
            { $set: { role: 'admin', onboardingCompleted: true } },
            { new: true }
        );

        if (adminResult) {
            console.log('✅ Successfully upgraded ajat39963@gmail.com to Admin!');
        } else {
            console.log('❌ Could not find ajat39963@gmail.com in the database. (Register it on the frontend first!)');
        }

        // 2. We can't have duplicate emails for different roles, so let's create a dedicated Teacher account!
        const teacherEmail = 'teacher_ajat@gmail.com';
        const existingTeacher = await User.findOne({ email: teacherEmail });

        if (!existingTeacher) {
            await User.create({
                name: 'Ashok (Teacher Profile)',
                email: teacherEmail,
                password: 'password123', // Automatically hashes via Mongoose pre-save hook
                role: 'teacher',
                onboardingCompleted: true
            });
            console.log(`✅ Created dedicated Teacher account: ${teacherEmail} (Password: password123)`);
        } else {
            console.log(`✅ Teacher account already exists: ${teacherEmail}`);
        }

        process.exit(0);
    } catch (err) {
        console.error('Error provisioning:', err);
        process.exit(1);
    }
};

provision();
