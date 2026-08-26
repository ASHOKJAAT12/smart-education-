/**
 * Validates that all required environment variables are present on startup.
 * Throws an error immediately if any are missing so the server won't start
 * with an incomplete configuration.
 */
const validateEnv = () => {
    const required = [
        'MONGODB_URI',
        'JWT_ACCESS_SECRET',
        'JWT_REFRESH_SECRET',
        'CLIENT_URL',
    ];

    const missing = required.filter((key) => !process.env[key]);

    if (missing.length > 0) {
        console.error('❌ Missing required environment variables:');
        missing.forEach((key) => console.error(`   - ${key}`));
        throw new Error(`Missing environment variables: ${missing.join(', ')}`);
    }

    // Warn about weak secrets
    if (process.env.JWT_ACCESS_SECRET.length < 32) {
        console.warn('⚠️  JWT_ACCESS_SECRET should be at least 32 characters');
    }
    if (process.env.JWT_REFRESH_SECRET.length < 32) {
        console.warn('⚠️  JWT_REFRESH_SECRET should be at least 32 characters');
    }

    console.log('✅ Environment variables validated');
};

module.exports = { validateEnv };
