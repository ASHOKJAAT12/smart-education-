const axios = require('axios');
const mongoose = require('mongoose');

async function testIt() {
    console.log('Testing...');
    // Register Teacher A
    let resA = await axios.post('http://localhost:5000/api/v1/auth/register', {
        name: 'Teacher A', email: 'ta@test.com', password: 'Password123', role: 'teacher'
    }).catch(e => e.response);
    if (!resA.data.token) {
        resA = await axios.post('http://localhost:5000/api/v1/auth/login', {
            email: 'ta@test.com', password: 'Password123'
        });
    }
    const tokenA = resA.data.token;

    // Register Teacher B
    let resB = await axios.post('http://localhost:5000/api/v1/auth/register', {
        name: 'Teacher B', email: 'tb@test.com', password: 'Password123', role: 'teacher'
    }).catch(e => e.response);
    if (!resB.data.token) {
        resB = await axios.post('http://localhost:5000/api/v1/auth/login', {
            email: 'tb@test.com', password: 'Password123'
        });
    }
    const tokenB = resB.data.token;

    // A creates course
    const courseRes = await axios.post('http://localhost:5000/api/v1/teacher/courses', {
        title: 'Course A', description: 'desc', category: 'Math', level: 'beginner'
    }, { headers: { Authorization: `Bearer ${tokenA}` } });
    console.log('Course ID:', courseRes.data.data._id);

    // B gets courses
    const getResB = await axios.get('http://localhost:5000/api/v1/teacher/courses', { headers: { Authorization: `Bearer ${tokenB}` } });
    console.log('Teacher B courses:', getResB.data.data.length);

    // Admin gets courses
    const getResAdmin = await axios.get('http://localhost:5000/api/v1/courses', { headers: { Authorization: `Bearer ${tokenB}` } });
    const hasAdminCourse = !!getResAdmin.data.data.find(c => c._id === courseRes.data.data._id);
    console.log('Teacher B sees course via /api/v1/courses:', hasAdminCourse);

    // Teacher dashboard
    const dashB = await axios.get('http://localhost:5000/api/v1/teacher/dashboard', { headers: { Authorization: `Bearer ${tokenB}` } });
    console.log('Teacher B dashboard metrics:', dashB.data.data.metrics);
}

testIt().catch(console.error);
