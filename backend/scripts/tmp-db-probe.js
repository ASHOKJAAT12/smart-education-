require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

(async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
        const db = mongoose.connection.db;
        const courses = db.collection('courses');
        const total = await courses.countDocuments();
        const missing = await courses.countDocuments({ $or: [{ createdBy: { $exists: false } }, { createdBy: null }] });
        const teachers = await db.collection('users').countDocuments({ role: 'teacher' });
        const admins = await db.collection('users').countDocuments({ role: 'admin' });
        const indexes = await courses.indexes();
        console.log(JSON.stringify({ DB: 'OK', total, missingOwner: missing, teachers, admins, indexes: indexes.map(i => i.name) }, null, 2));
    } catch (err) {
        console.log('DB_FAIL:', err.message);
    } finally {
        await mongoose.disconnect().catch(() => { });
    }
})();
