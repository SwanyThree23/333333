import 'dotenv/config';
import { getOpenAIService } from './services/openai';
import { performance } from 'perf_hooks';

async function testLatency() {
    console.log('🚀 Starting AI Director Latency Test...\n');

    const openai = getOpenAIService();

    const testCases = [
        {
            name: 'Scene Suggestion (JSON Parsing)',
            action: async () => {
                return await openai.suggestSceneChange(
                    'Main Scene',
                    ['How do I use the new SDK?', 'Can you show the documentation?', 'Does it support Python?'],
                    ['Main Scene', 'Screen Share', 'Interview', 'Outro']
                );
            }
        },
        {
            name: 'Chat Moderation',
            action: async () => {
                return await openai.moderateContent('This is a great stream, but you should fix the audio.');
            }
        },
        {
            name: 'Avatar Script Generation',
            action: async () => {
                return await openai.generateScript('The future of AI-powered live streaming', 'enthusiastic', 30);
            }
        }
    ];

    for (const test of testCases) {
        process.stdout.write(`Testing ${test.name.padEnd(30)} ... `);
        const start = performance.now();
        try {
            const result = await test.action();
            const end = performance.now();
            const duration = (end - start).toFixed(2);

            let status = '✅';
            if (parseFloat(duration) > 2000) status = '⚠️ (Slow)';
            if (parseFloat(duration) > 5000) status = '❌ (Timeout Risk)';

            console.log(`${duration}ms ${status}`);
            // console.log('Result Preview:', typeof result === 'string' ? result.substring(0, 50) + '...' : JSON.stringify(result).substring(0, 50) + '...');
        } catch (err) {
            console.log(`❌ FAILED: ${(err as any).message || err}`);
        }
    }

    console.log('\n🏁 Latency Test Complete');
}

testLatency();
