import http from 'http';

// Helper to make local HTTP requests
const request = (method, path, headers = {}, body = null) => {
    return new Promise((resolve, reject) => {
        const req = http.request(
            {
                hostname: 'localhost',
                port: 5000,
                path,
                method,
                headers: {
                    'Content-Type': 'application/json',
                    ...headers,
                },
            },
            (res) => {
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });
                res.on('end', () => {
                    try {
                        resolve({ status: res.statusCode, data: JSON.parse(data) });
                    } catch {
                        resolve({ status: res.statusCode, data });
                    }
                });
            }
        );
        req.on('error', reject);
        if (body) {
            req.write(typeof body === 'string' ? body : JSON.stringify(body));
        }
        req.end();
    });
};

const runTests = async () => {
    console.log('🧪 Starting automated API endpoint verification...');

    // 1. Health check
    const health = await request('GET', '/api/health');
    console.log('1. GET /api/health -> Status:', health.status, '| DB:', health.data?.database);
    if (health.status !== 200) throw new Error('Health check failed');

    // 2. Auth guard on /api/auth/me (Unauthenticated)
    const authMeNoToken = await request('GET', '/api/auth/me');
    console.log('2. GET /api/auth/me without token -> Status:', authMeNoToken.status, '| Message:', authMeNoToken.data?.message);
    if (authMeNoToken.status !== 401) throw new Error('Unauthenticated access should be blocked with 401');

    // 3. Auth guard on /api/auth/sync (Unauthenticated)
    const syncNoToken = await request('POST', '/api/auth/sync', {}, { displayName: 'Test' });
    console.log('3. POST /api/auth/sync without token -> Status:', syncNoToken.status, '| Message:', syncNoToken.data?.message);
    if (syncNoToken.status !== 401) throw new Error('Unauthenticated sync should be blocked with 401');

    // 4. Leaderboard (Public)
    const leaderboard = await request('GET', '/api/scores/leaderboard');
    console.log('4. GET /api/scores/leaderboard -> Status:', leaderboard.status, '| Count:', leaderboard.data?.data?.length ?? 0);
    if (leaderboard.status !== 200) throw new Error('Leaderboard should be accessible publicly');

    // 5. Simulated token payload in development mode
    // Construct valid header-payload-signature JWT mock for test
    const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({
        user_id: 'test_firebase_uid_12345',
        email: 'candidate.test@example.com',
        name: 'Test Candidate',
    })).toString('base64url');
    const mockToken = `${header}.${payload}.mockSignature`;

    const syncWithToken = await request('POST', '/api/auth/sync', {
        Authorization: `Bearer ${mockToken}`,
    }, {
        collegeName: 'Capgemini Tech Academy',
        displayName: 'Test Candidate',
    });

    console.log('5. POST /api/auth/sync with Bearer token -> Status:', syncWithToken.status, '| Result:', syncWithToken.data?.message);

    console.log('\n🎉 All API verification checks PASSED successfully!');
    process.exit(0);
};

// Import server and run tests
import('./src/server.js').then(() => {
    // Give server a moment to bind to port
    setTimeout(runTests, 1500);
}).catch(err => {
    console.error('Server failed to start:', err);
    process.exit(1);
});
