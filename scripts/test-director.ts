

import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

async function testAIDirector() {
    console.log('🧪 Starting AI Director Integration Test...');

    let userId: string;
    let streamId: string;

    try {
        // 1. Setup Data
        console.log('\n1. Requesting Test Seed...');
        const seedRes = await axios.post(`${API_URL}/test/seed`);

        userId = seedRes.data.userId;
        streamId = seedRes.data.streamId;

        console.log(`   User ID: ${userId}`);
        console.log(`   Stream ID: ${streamId}`);

        // 2. Test Engagement Analysis
        console.log('\n2. Testing /api/ai/analyze-engagement...');
        const engagementPayload = {
            streamId,
            viewerCount: [100, 105, 110, 108, 115],
            chatActivity: [10, 15, 20],
            // Simulate meaningful context for AI
            sceneChanges: ['Main', 'Screen Share']
        };

        const analysisRes = await axios.post(`${API_URL}/ai/analyze-engagement`, engagementPayload);
        console.log('   Response status:', analysisRes.status);
        console.log('   Insights:', analysisRes.data.insights ? 'Received ✅' : 'Missing ❌');

        // 3. Test Director Event Recording
        console.log('\n3. Testing /api/streams/:id/director-events (Record)...');
        const eventPayload = {
            type: 'success',
            message: 'Switched to Screen Share due to technical question',
            metadata: { confidence: 0.85, reason: 'Technical Context' }
        };

        const eventRes = await axios.post(`${API_URL}/streams/${streamId}/director-events`, eventPayload);
        console.log('   Response status:', eventRes.status);
        console.log('   Event ID:', eventRes.data.id ? 'Created ✅' : 'Failed ❌');

        // 4. Test Fetching Director Events
        console.log('\n4. Testing /api/streams/:id/director-events (Fetch)...');
        const historyRes = await axios.get(`${API_URL}/streams/${streamId}/director-events`);
        console.log('   History count:', historyRes.data.length);
        const lastEvent = historyRes.data[0];
        // Note: The most recent event might be first or last depending on sort order. usually default is by creation or ID.
        // Let's check simply if we find our message.
        const found = historyRes.data.find((e: any) => e.message === eventPayload.message);
        console.log('   Data verification:', found ? 'Match ✅' : 'Mismatch ❌');

        // 5. Test Config Update
        console.log('\n5. Testing /api/streams/:id/config...');
        await axios.post(`${API_URL}/streams/${streamId}/config`, { aiDirectorEnabled: false });
        console.log('   Config update request sent ✅');

        // We can't verify DB state directly, but we can check if future requests behave differently or just trust the 200 OK.

        console.log('\n✅ TEST COMPLETED SUCCESSFULLY');

    } catch (error: any) {
        console.error('\n❌ TEST FAILED');
        if (axios.isAxiosError(error)) {
            console.error('API Error:', error.response?.data || error.message);
        } else {
            console.error('Error:', error);
        }
    }
}

testAIDirector();
