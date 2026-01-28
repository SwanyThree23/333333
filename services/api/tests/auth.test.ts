/**
 * Auth tests (Jest + Supertest)
 * Note: ensure dev dependencies `jest`, `ts-jest`, `supertest` are installed before running.
 */
import fetch from 'node-fetch';

const BASE = process.env.TEST_BASE || 'http://localhost:4000';

describe('Authentication', () => {
    test('User registration and login flow', async () => {
        const email = `test+${Date.now()}@example.com`;
        const username = `testuser${Date.now()}`;
        const password = 'Test123!';

        const reg = await fetch(`${BASE}/api/auth/register`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, username, password })
        });
        expect(reg.status).toBe(200);
        const body = await reg.json();
        expect(body).toHaveProperty('token');

        const login = await fetch(`${BASE}/api/auth/login`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        expect(login.status).toBe(200);
        const loginBody = await login.json();
        expect(loginBody).toHaveProperty('token');
    }, 20000);
});
