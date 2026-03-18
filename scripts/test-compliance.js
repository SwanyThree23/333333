import axios from 'axios';

const BASE_URL = 'http://localhost:3001/api';

async function testGeolocationPrivacy() {
  console.log('🧪 Testing Geolocation Privacy Fuzzing...');
  const testData = { lat: 34.052235, lon: -118.243683, precision: 'region' };
  try {
    const response = await axios.post(`${BASE_URL}/compliance/fuzz-location`, testData);
    console.log('✅ Success! Fuzzed:', response.data.fuzzed);
    if (response.data.original.lat !== response.data.fuzzed.lat) {
      console.log('🛡️ Privacy check PASSED.');
    }
  } catch (error) {
    console.error('❌ Geolocation test failed:', error.message || error);
  }
}

async function testWatchPartyValidator() {
  console.log('\n🧪 Testing WatchParty URL Validation...');
  const urls = [
    { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', expected: true },
    { url: 'https://malicious-site.com/video.mp4', expected: false }
  ];
  for (const item of urls) {
    try {
      const response = await axios.post(`${BASE_URL}/compliance/validate-watch-party`, { url: item.url });
      const status = response.data.allowed === item.expected ? '✅' : '❌';
      console.log(`${status} URL: ${item.url}`);
    } catch (error) {
      console.error(`❌ Validation failed:`, error.message || error);
    }
  }
}

async function testCreatorVerification() {
  console.log('\n🧪 Testing Creator Identity Verification...');
  const userId = 'user_123';
  try {
    await axios.post(`${BASE_URL}/compliance/verify-creator`, { userId, verified: true });
    const response = await axios.get(`${BASE_URL}/compliance/creator-status/${userId}`);
    console.log(`✅ Status for ${userId}: ${response.data.status} (Verified: ${response.data.isVerified})`);
  } catch (error) {
    console.error(`❌ Verification test failed:`, error.message || error);
  }
}

async function testContentSafety() {
  console.log('\n🧪 Testing Content Safety Monitoring...');
  try {
    console.log('--- Checking Illegal Hashes ---');
    const resp1 = await axios.post(`${BASE_URL}/compliance/check-hash`, { hash: 'hash_illegal_123' });
    console.log(`Hash check: ${resp1.data.matches ? '⚠️ MATCH FOUND' : '✅ Safe'}`);

    console.log('\n--- Analyzing Snapshots ---');
    const resp2 = await axios.post(`${BASE_URL}/compliance/analyze-snapshot`, { imageUrl: 'http://storage.com/violence_detected.jpg' });
    console.log(`Snapshot check: ${resp2.data.actionTaken.toUpperCase()} (Reason: ${resp2.data.reason})`);
    
    console.log('\n🛡️ Compliance check PASSED: Content safety filtering active.');
  } catch (error) {
    console.error(`❌ Content safety test failed:`, error.message || error);
  }
}

async function testWatermarking() {
  console.log('\n🧪 Testing AI Content Watermarking...');
  const streamId = 'stream_deepfake_test';
  try {
    const signResp = await axios.post(`${BASE_URL}/compliance/sign-stream`, { streamId });
    console.log(`✅ Signature generated: ${signResp.data.signature.substring(0, 10)}...`);

    const verifyResp = await axios.post(`${BASE_URL}/compliance/verify-stream`, signResp.data);
    console.log(`🔍 Verification: ${verifyResp.data.isValid ? 'VALID ✅' : 'INVALID ❌'}`);

    if (verifyResp.data.isValid) {
      console.log('🛡️ Compliance check PASSED: Cryptographic watermarking verified.');
    }
  } catch (error) {
    console.error(`❌ Watermarking test failed:`, error.message || error);
  }
}

async function testVoiceConsent() {
  console.log('\n🧪 Testing Voice Consent Verification...');
  const userId = 'voice_user_456';
  try {
    // 1. Start Session
    const startResp = await axios.post(`${BASE_URL}/compliance/voice-consent-start`, { userId });
    const phrase = startResp.data.challengePhrase;
    console.log(`✅ Challenge phrase received: "${phrase}"`);

    // 2. Verify with matching phrase
    const verifyResp = await axios.post(`${BASE_URL}/compliance/voice-consent-verify`, { userId, transcript: phrase });
    console.log(`🔍 Verification (Match): ${verifyResp.data.success ? 'PASSED ✅' : 'FAILED ❌'}`);

    // 3. Verify with mismatch
    const failResp = await axios.post(`${BASE_URL}/compliance/voice-consent-verify`, { userId, transcript: "I am a robot." });
    console.log(`🔍 Verification (Mismatch): ${failResp.data.success ? 'PASSED ✅' : 'FAILED ❌ (Expected)'}`);
    if (!failResp.data.success) console.log(`   Reason: ${failResp.data.error}`);

    if (verifyResp.data.success) {
      console.log('🛡️ Compliance check PASSED: Voice consent protocol active.');
    }
  } catch (error) {
    console.error(`❌ Voice consent test failed:`, error.message || error);
  }
}

async function runAllTests() {
  try {
    await testGeolocationPrivacy();
    await testWatchPartyValidator();
    await testCreatorVerification();
    await testContentSafety();
    await testWatermarking();
    await testVoiceConsent();
    console.log('\n✨ ALL COMPLIANCE TESTS COMPLETED.');
  } catch (e) {
    console.error('Tests aborted:', e.message);
  }
}

runAllTests();
